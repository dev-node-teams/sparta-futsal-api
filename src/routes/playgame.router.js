import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import {
    calculateTeamScore,
    determineWinner,
    saveGameResultAndUpdateRating,
} from '../utils/gameutils.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import StatusError from '../errors/status.error.js';
import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

const router = express.Router();

// 상대를 지정해서 하는 게임 플레이
router.post('/game/:opponent', authMiddleware, asyncHandler( async (req, res, next) => {
    // 상대 유저의 정보와 팀 데이터를 가져옵니다.
    try {
        const { opponent } = req.params; // 상대 정보
        const userId = req.userId; // 로그인한 유저 ID

        // 로그인한 유저의 선발 선수 정보 가져오기
        const aUserPlayers = await prisma.usersPlayers.findMany({
            where: {
                userId: userId,
                startingLine: true,
            },
            include: {
                players: true, // 선수 정보 포함
            },
        });

        // userId와 startingLine으로 상대 유저의 선발 선수 정보 가져오기
        const bUserPlayers = await prisma.usersPlayers.findMany({
            where: {
                userId: parseInt(opponent),
                startingLine: true,
            },
            include: {
                players: true,
            },
        });
        if (aUserPlayers.length === 0 || bUserPlayers.length === 0) {
            // 둘 중 하나라도 없으면 에러
            throw new StatusError('유저가 존재하지 않습니다', StatusCodes.NOT_FOUND);
        }

        const aUserTeamScore = calculateTeamScore(aUserPlayers);
        const bUserTeamScore = calculateTeamScore(bUserPlayers);

        const { aScore, bScore, result } = determineWinner(aUserTeamScore, bUserTeamScore);

        const winnerId = result.includes('A 플레이어 승리') ? userId : parseInt(opponent);

        // 경기 결과에 따른 유저 레이팅 증가, 감소
        await saveGameResultAndUpdateRating(userId, parseInt(opponent), aScore, bScore);

        //업데이트된 유저 레이팅을 찾아서 출력할때 사용
        const updatedUserRaiting = await prisma.users.findUnique({
            where: { id: userId },
            select: { rating: true },
        });

        const matchResultMessage =
            winnerId === userId
                ? { result, '경기 승리!': '나의 점수 +10' }
                : { result, '경기 패배!': '나의 점수 -10' };

        // 결과 출력
        res.json({ result, ...matchResultMessage, '나의 점수': updatedUserRaiting.rating });
    } catch (error) {
        if(error instanceof StatusError){ // 코드 안에서 터질때
            throw error;
        }
        else{
            console.log(error);
            throw new StatusError('오류 발생', StatusCodes.NOT_FOUND);
        }
    }
}));

// 점수 기반 자동 매치 메이킹 API
router.post('/matchmaking', authMiddleware,asyncHandler( async (req, res, next) => {
    try {
        const userId = req.userId; // 실제로는 로그인한 유저의 ID를 사용해야 함

        // 현재 유저의 점수 가져오기
        const currentUser = await prisma.users.findUnique({
            where: { id: userId },
            select: { rating: true },
        });

        if (!currentUser) {
            throw new StatusError('존재하지 않는 유저입니다', StatusCodes.NOT_FOUND);
        }

        const userRating = currentUser.rating;
        const ratingRange = 100; // ±100점 범위 설정 (필요시 조정 가능)

        // 현재 유저의 점수 ±100점 내의 유저들 조회 (자기 자신은 제외)
        const potentialOpponents = await prisma.users.findMany({ 
            where: {
                id: { not: userId }, // 본인 제외
                rating: {
                    gte: userRating - ratingRange, // 최소 점수
                    lte: userRating + ratingRange, // 최대 점수
                },
            },
            select: {
                id: true,
                nickname: true,
                rating: true,
            },
        });
        // 조회된 유저들 중에서 선발 선수가 3명 이상인 유저만 필터링합니다.
        const matchOpponents = [];
    
        for (const user of potentialOpponents) {
            const startingPlayersCount = await prisma.usersPlayers.count({
                where: {
                    userId: user.id,
                    startingLine: true,
                },
            });
        
            if (startingPlayersCount === 3) { // 선발등록되있는 선수가 3명인 유저만 검색
                matchOpponents.push(user); // matchOpponents에 push
            }
        }
        if (matchOpponents.length === 0) {
            throw new StatusError('매칭 가능한 유저가 없습니다.', StatusCodes.NOT_FOUND);
        }
        
        // 랜덤하게 상대방 선택
        const randomIndex = Math.floor(Math.random() * matchOpponents.length);
        const selectedOpponent = matchOpponents[randomIndex];

        // 경기 진행 (기존의 게임 API 재사용)
        const { result, winnerId, aScore, bScore } = await startGame(userId, selectedOpponent.id);

        await saveGameResultAndUpdateRating(userId, selectedOpponent.id, aScore, bScore);

        const updatedUserRaiting = await prisma.users.findUnique({
            where: { id: userId },
            select: { rating: true },
        });

        const matchResultMessage =
            winnerId === userId
                ? { result, '경기 승리!': '나의 점수 +10' }
                : { result, '경기 패배!': '나의 점수 -10' };

        res.json({
            result,
            상대아이디: selectedOpponent.id,
            상대닉네임: selectedOpponent.nickname,
            ...matchResultMessage,
            '나의 점수': updatedUserRaiting.rating,
        });
    } catch (error) { 
        if(error instanceof StatusError){ // 코드 안에서 터질때
            throw error;
        }
        else{
            console.error(error);
            throw new StatusError('오류 발생', StatusCodes.NOT_FOUND);
        }
    }
}));

// 기존의 경기 진행 로직을 재사용
async function startGame(userId, opponentId) {
    try {
        // 로그인한 유저와 상대방의 선발 선수 정보 가져오기
        const aUserPlayers = await prisma.usersPlayers.findMany({
            where: {
                userId: userId,
                startingLine: true,
            },
            include: { players: true },
        });

        const bUserPlayers = await prisma.usersPlayers.findMany({
            where: {
                userId: opponentId,
                startingLine: true,
            },
            include: { players: true },
        });

        if (aUserPlayers.length === 0 || bUserPlayers.length === 0) {
            throw new Error('선수가 존재하지 않습니다.');
        }

        // 팀 점수 계산
        const aUserTeamScore = calculateTeamScore(aUserPlayers);
        const bUserTeamScore = calculateTeamScore(bUserPlayers);

        // 경기 결과 도출
        const { aScore, bScore, result } = determineWinner(aUserTeamScore, bUserTeamScore);

        // 플레이어 레이팅 업데이트
        const winnerId = result.includes('A 플레이어 승리') ? userId : opponentId;

        return { result, winnerId, aScore, bScore };
    } catch (error) {
        throw new StatusError('오류 발생', StatusCodes.NOT_FOUND);
    }
}

export default router;
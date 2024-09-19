import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

// 경기플레이 
router.post('/game/:opponent', async (req, res) => {
    // 상대 유저의 정보와 팀 데이터를 가져옵니다.
    try {
        const { opponent } = req.params; // 상대 정보
        //const userId = req.user.id; // 로그인한 유저 ID
        const userId = 2; // TEST용 userID 지울 것 사용 후 파기

        // 로그인한 유저의 선발 선수 정보 가져오기
        const aUserPlayers = await prisma.usersPlayers.findMany({
            where: {
                userId: userId,
                startingLine: true,
            },
            include: {
                player: true // 선수 정보 포함
            }
        });

        // 상대 유저의 선발 선수 정보 가져오기
        const bUserPlayers = await prisma.usersPlayers.findMany({
            where: {
                userId: parseInt(opponent), // opponent는 문자열이므로 숫자로 변환
                startingLine: true,
            },
            include: {
                player: true
            }
        });
        if (aUserPlayers.length === 0 || bUserPlayers.length === 0) { // 둘 중 하나라도 없으면 에러
            return res.status(404).json({ error: '유저가 존재하지 않습니다' });
        }

        const aUserTeamScore = calculateTeamScore(aUserPlayers);
        const bUserTeamScore = calculateTeamScore(bUserPlayers);

        const { aScore, bScore, result } = determineWinner(aUserTeamScore, bUserTeamScore);

        // 경기 결과를 DB에 저장
        await saveGameResult(userId, parseInt(opponent), aScore, bScore);

        // 결과 출력
        res.json({ result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

function calculateTeamScore(team) { // 팀의 총 점수를 계산
    const weights = { 
        speed: 0.1,// 1을 넘지 않게 설정
        goalScoring: 0.25,
        shotPower: 0.15,
        defense: 0.3,
        stamina: 0.2
    };
    let totalScore = 0;

    for (const userPlayer of team) {
        // 계속 userPlayer에서 선수 스탯을 못불러와서 직접 접근시킴.
        const player = userPlayer.player; 

        // 숫자로 변환
        const speed = Number(player.speed);
        const finishing = Number(player.finishing);
        const shotPower = Number(player.shotPower);
        const defense = Number(player.defense);
        const stamina = Number(player.stamina);
        // 점수 계산
        totalScore += (
            (speed * weights.speed) +
            (finishing * weights.goalScoring) +
            (shotPower * weights.shotPower) +
            (defense * weights.defense) +
            (stamina * weights.stamina)
        );
    }
    return totalScore;
}

// 결과 출력
function determineWinner(scoreA, scoreB) {
    
    const maxScore = scoreA + scoreB;
    const randomValue = Math.random() * maxScore;

    let aScore, bScore;
    if (randomValue < scoreA) {
        aScore = Math.floor(Math.random() * 4) + 2; 
        bScore = Math.floor(Math.random() * Math.min(3, aScore)); 
        return { aScore,bScore, result : `A 플레이어 승리: A ${aScore} - ${bScore} B`};
    } 
    else {
        bScore = Math.floor(Math.random() * 4) + 2; 
        aScore = Math.floor(Math.random() * Math.min(3, bScore)); 
        return { aScore,bScore, result : `B 플레이어 승리: B ${aScore} - ${bScore} A`};
    } 
}

// 경기 결과를 game_results 테이블에 저장
async function saveGameResult(user1Id, user2Id, user1Point, user2Point) {
    try {
        await prisma.gameResults.create({
            data: {
                user1Id,
                user2Id,
                user1Point,
                user2Point,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export default router;
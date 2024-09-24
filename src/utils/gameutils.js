import { prisma } from '../utils/prisma/index.js';
import StatusError from '../errors/status.error.js';
import { StatusCodes } from 'http-status-codes';

export function calculateTeamScore(team) {
  // 팀의 총 점수를 계산
  const weights = {
    speed: 0.1, // 1을 넘지 않게 설정
    goalScoring: 0.25,
    shotPower: 0.15,
    defense: 0.3,
    stamina: 0.2,
  };
  let totalScore = 0;

  for (const userPlayer of team) {
    // 선수들의 정보를 가져옴
    const player = userPlayer.players;
    
    // 점수 계산
    totalScore +=
      player.speed * weights.speed +
      player.finishing * weights.goalScoring +
      player.shotPower * weights.shotPower +
      player.defense * weights.defense +
      player.stamina * weights.stamina;
  }
  return totalScore;
}

// 결과 출력
export function determineWinner(scoreA, scoreB) {
  const maxScore = scoreA + scoreB;
  const randomValue = Math.random() * maxScore;

  let aScore, bScore;
  if (randomValue < scoreA) {
    aScore = Math.floor(Math.random() * 4) + 2;
    bScore = Math.floor(Math.random() * Math.min(3, aScore));
    return { aScore, bScore, result: `A 플레이어 승리: A ${aScore} - ${bScore} B` };
  } else {
    bScore = Math.floor(Math.random() * 4) + 2;
    aScore = Math.floor(Math.random() * Math.min(3, bScore));
    return { aScore, bScore, result: `B 플레이어 승리: B ${aScore} - ${bScore} A` };
  }
}

// 경기 결과 저장 및 레이팅 점수 조절
export async function saveGameResultAndUpdateRating(user1Id, user2Id, user1Score, user2Score) {
  const user1Point = user1Score;
  const user2Point = user2Score;
  const ratingChange = 10;
  const winnerId = user1Point > user2Point ? user1Id : user2Id;
  const loserId = winnerId === user1Id ? user2Id : user1Id;

  try {
    // 트랜잭션으로 처리
    await prisma.$transaction([
      prisma.gameResults.create({
        data: {
          user1Id: user1Id,
          user2Id: user2Id,
          user1Point: user1Point,
          user2Point: user2Point,
        },
      }),
      prisma.users.update({
        where: { id: winnerId },
        data: { rating: { increment: ratingChange } }, // 승자는 10점 추가
      }),
      prisma.users.update({
        where: { id: loserId },
        data: { rating: { decrement: ratingChange } }, // 패자는 10점 감소
      }),
    ]);
  } catch (error) {
    throw new StatusError('경기 결과 저장 및 점수 업데이트 중 오류 발생', StatusCodes.BAD_GATEWAY);
  }
}

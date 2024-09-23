import { prisma } from '../utils/prisma/index.js';

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
    // 계속 userPlayer에서 선수 스탯을 못불러와서 직접 접근시킴.
    const player = userPlayer.players;

    // 숫자로 변환
    const speed = Number(player.speed);
    const finishing = Number(player.finishing);
    const shotPower = Number(player.shotPower);
    const defense = Number(player.defense);
    const stamina = Number(player.stamina);
    // 점수 계산
    totalScore +=
      speed * weights.speed +
      finishing * weights.goalScoring +
      shotPower * weights.shotPower +
      defense * weights.defense +
      stamina * weights.stamina;
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

// 경기 결과를 game_results 테이블에 저장
export async function saveGameResult(user1Id, user2Id, user1Point, user2Point) {
  try {
    console.log('@@@@@@@@====>>>>> ', user1Id, user2Id, user1Point, user2Point);

    await prisma.gameResults.create({
      data: {
        user1Id,
        user2Id,
        user1Point,
        user2Point,
      },
    });
  } catch (error) {
    throw new Error('점수 업데이트 중 오류 발생');
  }
}

// 경기 결과를 토대로 승자와 패자의 레이팅점수 조절
export async function updatePlayerRating(winnerId, loserId) {
  const ratingchange = 10;
  try {
    console.log('====>>>>> ', winnerId, loserId);

    await prisma.$transaction([
      prisma.users.update({
        where: { id: winnerId },
        data: { rating: { increment: ratingchange } }, // 승자는 10점 추가
      }),
      prisma.users.update({
        where: { id: loserId },
        data: { rating: { decrement: ratingchange } }, // 패자는 10점 감소
      }),
    ]);
  } catch (error) {
    throw new Error('점수 업데이트 중 오류 발생');
  }
}

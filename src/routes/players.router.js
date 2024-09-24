import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { Utils } from '../utils/utils.js';
import authCheck from '../middlewares/auth.middleware.js';
import { cardManager } from '../utils/Card/CardManager.js';
import { StatusCodes } from 'http-status-codes';
import StatusError from '../errors/status.error.js';

const router = express.Router();

/*---------------------------------------------
                선수 상세 조회
---------------------------------------------*/
router.get('/players/:player_id', async (req, res, next) => {
  const playerId = Number(req.params.player_id);

  try {
    const player = await prisma.players.findUnique({
      where: {
        playerId,
      },
      select: {
        playerName: true,
        speed: true,
        finishing: true,
        shotPower: true,
        defense: true,
        stamina: true,
      },
    });

    if (!player) {
      throw new StatusError('존재하지 않는 선수입니다.', StatusCodes.CONFLICT);
    }

    return res.status(200).json(player);
  } catch (error) {
    return next(error);
  }
});

/*---------------------------------------------
    [선수 뽑기]
    1. 유저 cash정보 DB로부터 확인
        1-1. 충분하지 않다면, 409반환
        1-2. 충분하다면, 
             무작위 선수 뽑기
             비용 차감 (트랜잭션으로 처리)
             인벤에 넣기 (트랜잭션으로 처리)
    2. 뽑은 선수 반환 or status(400) 반환
---------------------------------------------*/
router.post('/players/draw', authCheck, async (req, res, next) => {
  const { packName } = req.body;

  try {
    const cost = cardManager.getCost(packName);
    //1.유저 cash정보 DB로부터 확인: DB누적 접근: 1
    const user = await prisma.users.findUnique({
      //where: { id: 1 },
      where: { id: req.userId },
      select: {
        id: true,
        cash: true,
      },
    });
    if (!user) {
      throw new StatusError('해당 선수 조회에 실패하였습니다.', StatusCodes.CONFLICT);
    }

    //1-1. 충분하지 않다면, 400반환
    if (user.cash < cost) {
      throw new StatusError('cash가 부족합니다.', StatusCodes.CONFLICT);
    }

    //1-2 무작위 선수 뽑기
    const selectedPlayerID = cardManager.drawCard(packName);
    console.log('dd', selectedPlayerID);
    const selectedPlayer = await prisma.players.findUnique({
      where: { playerId: selectedPlayerID.playerId },
      select: {
        playerId: true,
        playerName: true,
        speed: true,
        finishing: true,
        shotPower: true,
        defense: true,
        stamina: true,
      },
    });
    console.log(selectedPlayer);

    const result = await prisma.$transaction(async (tx) => {
      //1-2. 충분하다면, 비용차감
      await tx.users.update({
        //DB 누적 접근: 3
        where: { id: user.id },
        data: { cash: user.cash - cost },
      });

      // 1-2 인벤에 선수 추가
      await tx.usersPlayers.create({
        // DB 누적 접근: 4
        data: {
          userId: user.id,
          playerId: selectedPlayer.playerId,
          level: 1,
        },
      });
      return res.status(200).json(selectedPlayer);
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

/*---------------------------------------------
    [선수 강화]

    동일한 OVR: 50%
    OVR+1: 67%
    OVR+2: 90%
    OVR+3~: 100%
    OVR-1: 37.3%
    OVR-2: 27.5%
    OVR-3: 20.8%
    OVR-4: 15.2%
    OVR-5: 11.3%
    OVR-6: 8.4%
    OVR-7: 6.2%
    OVR-6: 4.6%
    OVR-9~: 3.5%
---------------------------------------------*/
router.post('/players/upgrade', async (req, res, next) => {
  const { upgradePlayer, upgradeMaterials } = req.body;

  try {
    //강화할 선수를 재료들로 성공할 확률 구하기 - DB접근 2회
    let upgradePercent = await Utils.calcUpgradePercent(upgradePlayer, upgradeMaterials);
    if (upgradePercent == null) {
      throw new StatusError('해당 선수 조회에 실패하였습니다.', StatusCodes.CONFLICT);
    }

    const randomNum = Math.random();

    const userPlayerIds = upgradeMaterials.map((material) => material.userPlayerId);
    //성공 시
    if (randomNum <= upgradePercent) {
      const result = await prisma.$transaction(async (tx) => {
        // 1- 2 DB에 level 1추가
        await tx.usersPlayers.update({
          where: { userPlayerId: upgradePlayer.userPlayerId },
          data: { level: { increment: 1 } },
        });

        // 1-2 강화 재료 DB에서 제거
        await tx.usersPlayers.deleteMany({
          where: {
            userPlayerId: {
              in: userPlayerIds,
            },
          },
        });
      });
      const updatedPlayer = await prisma.usersPlayers.findUnique({
        where: { userPlayerId: upgradePlayer.userPlayerId },
        select: {
          playerId: true,
          level: true,
        },
      });
      return res.status(200).json({ result: '성공', updatedPlayer });
    } else {
      await prisma.usersPlayers.deleteMany({
        where: {
          userPlayerId: {
            in: userPlayerIds,
          },
        },
      });
      return res.status(200).json({ result: '실패' });
    }
  } catch (error) {
    console.log(error);
    return next(error);
  }
  //실패 시
});

export default router;

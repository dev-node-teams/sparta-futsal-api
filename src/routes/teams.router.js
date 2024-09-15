import express from 'express';
import joi from 'joi';
import asyncHandler from 'express-async-handler';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

/** 선발 등록 API */
router.post(
  '/teams/starting',
  asyncHandler(async (req, res, next) => {
    const joiSchema = joi.object({
      playerId: joi.number().required().messages({
        'number.base': '플레이어 아이디는 숫자타입이어야 합니다.',
        'any.required': '플레이어 아이디를 입력해주세요.',
      }),
    });

    const validation = await joiSchema.validateAsync(req.body);
    const { playerId } = validation;

    const MAX_STARTING_COUNT = 3;

    //@todo: test UserId 지울 것
    const userId = 1;

    // 대상 선수 조회
    const targetPlayer = await prisma.usersPlayers.findFirst({
      where: {
        playerId: playerId,
        userId: userId,
      },
    });

    if (!targetPlayer) {
      // 대상 선수가 없는 경우,
      throw new Error('해당 선수 조회에 실패하였습니다.');
    } else if (targetPlayer.startingLine) {
      // 이미 선발인 경우,
      throw new Error('이미 선발선수로 등록되어있습니다.');
    }

    const startingPlayers = await prisma.usersPlayers.findMany({
      select: { playerId: true },
      where: {
        userId: userId,
        startingLine: true,
      },
    });

    // 기존 선발선수의 수가 ${MAX_STARTING_COUNT}명 이상일 경우 // 3
    if (startingPlayers.length >= MAX_STARTING_COUNT) {
      throw new Error('선발선수는 최대 ${MAX_STARTING_COUNT}명까지만 등록 가능합니다.');
    }

    // 선발 여부 변경
    const updatePlayer = await prisma.usersPlayers.update({
      data: {
        startingLine: true,
      },
      where: {
        userPlayerId: targetPlayer.userPlayerId,
      },
      select: {
        user: {
          select: { nickname: true },
        },
        player: {
          select: { playerName: true },
        },
      },
    });

    return res.status(201).json({
      messages: `[${updatePlayer.user.nickname}]의 [${updatePlayer.player.playerName}] 선수를 선발선수로 등록하였습니다.`,
    });
  }),
);

export default router;

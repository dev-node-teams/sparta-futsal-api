import express from 'express';
import joi from 'joi';
import asyncHandler from 'express-async-handler';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

/** 선발 해제 API */
router.delete(
  '/teams/starting',
  asyncHandler(async (req, res, next) => {
    const joiSchema = joi.object({
      userPlayerId: joi.number().required().messages({
        'number.base': '플레이어 아이디는 숫자타입이어야 합니다.',
        'any.required': '플레이어 아이디를 입력해주세요.',
      }),
    });

    const validation = await joiSchema.validateAsync(req.body);
    const { userPlayerId } = validation;

    // @TODO: TEST코드 삭제예정
    const userId = 1;

    // 대상 선수 조회
    const targetPlayer = await prisma.usersPlayers.findFirst({
      where: {
        userPlayerId: userPlayerId,
        userId: userId,
      },
    });

    if (!targetPlayer) {
      // 대상 선수가 없는 경우,
      throw new Error('해당 선수 조회에 실패하였습니다.');
    } else if (!targetPlayer.startingLine) {
      // 이미 선발이 아닌 경우,
      throw new Error('해당 선수는 선발선수가 아닙니다.');
    }

    // 선발 여부 변경
    const updatePlayer = await prisma.usersPlayers.update({
      data: {
        startingLine: false,
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

    return res.status(200).json({
      messages: `[${updatePlayer.user.nickname}]의 [${updatePlayer.player.playerName}] 선수를 선발에서 해제하였습니다.`,
    });
  }),
);

export default router;

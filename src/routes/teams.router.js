import express from 'express';
import joi from 'joi';
import asyncHandler from 'express-async-handler';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import StatusError from '../errors/status.error.js';
import { OK, StatusCodes } from 'http-status-codes';

const router = express.Router();

/** 선발 등록 API */
router.post(
  '/teams/starting',
  authMiddleware,
  asyncHandler(async (req, res, next) => {
    const joiSchema = joi.object({
      userPlayerId: joi.number().required().messages({
        'number.base': '플레이어 아이디는 숫자타입이어야 합니다.',
        'any.required': '플레이어 아이디를 입력해주세요.',
      }),
    });

    const validation = await joiSchema.validateAsync(req.body);
    const { userPlayerId } = validation;

    const MAX_STARTING_COUNT = 3;
    const userId = req.userId;

    // 대상 선수 조회
    const targetPlayer = await prisma.usersPlayers.findFirst({
      where: {
        userPlayerId,
        userId,
      },
    });

    if (!targetPlayer) {
      // 대상 선수가 없는 경우,
      throw new StatusError('해당 선수 조회에 실패하였습니다.', StatusCodes.BAD_REQUEST);
    } else if (targetPlayer.startingLine) {
      // 이미 선발인 경우,
      throw new StatusError('이미 선발선수로 등록되어있습니다.', StatusCodes.CONFLICT);
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
      throw new StatusError(
        `선발선수는 최대 ${MAX_STARTING_COUNT}명까지만 등록 가능합니다.`,
        StatusCodes.CONFLICT,
      );
    }

    // 선발 목록에 같은 선수가 있는 경우,
    const samePlayer = await prisma.usersPlayers.findFirst({
      where: {
        userId: userId,
        startingLine: true,
        playerId: targetPlayer.playerId,
      },
    });

    if (samePlayer) {
      throw new StatusError(`선발목록에 동일한 선수가 포함되어있습니다.`, StatusCodes.CONFLICT);
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
        players: {
          select: { playerName: true },
        },
      },
    });

    return res.status(StatusCodes.CREATED).json({
      messages: `[${updatePlayer.user.nickname}]의 [${updatePlayer.players.playerName}] 선수를 선발선수로 등록하였습니다.`,
    });
  }),
);

/** 선발 해제 API */
router.delete(
  '/teams/starting',
  authMiddleware,
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
    const userId = req.userId;

    // 대상 선수 조회
    const targetPlayer = await prisma.usersPlayers.findFirst({
      where: {
        userPlayerId: userPlayerId,
        userId: userId,
      },
    });

    if (!targetPlayer) {
      // 대상 선수가 없는 경우,
      throw new StatusError(`해당 선수 조회에 실패하였습니다.`, StatusCodes.BAD_REQUEST);
    } else if (!targetPlayer.startingLine) {
      // 이미 선발이 아닌 경우,
      throw new StatusError(`해당 선수는 선발선수가 아닙니다.`, StatusCodes.CONFLICT);
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
        players: {
          select: { playerName: true },
        },
      },
    });

    return res.status(200).json({
      messages: `[${updatePlayer.user.nickname}]의 [${updatePlayer.players.playerName}] 선수를 선발에서 해제하였습니다.`,
    });
  }),
);

/** 나만의 선발 목록 조회  */
router.get(
  '/teams/starting',
  authMiddleware,
  asyncHandler(async (req, res, next) => {
    const userId = req.userId;

    const startingPlayers = await prisma.usersPlayers.findMany({
      select: {
        userPlayerId: true,
        players: {
          select: {
            playerId: true,
            playerName: true,
            speed: true,
            finishing: true,
            shotPower: true,
            defense: true,
            stamina: true,
          },
        },
      },
      where: {
        userId: userId,
        startingLine: true,
      },
    });

    return res.status(StatusCodes.OK).json({ data: startingPlayers });
  }),
);

/** 보유선수 목록 조회  */
router.get(
  '/teams/players',
  authMiddleware,
  asyncHandler(async (req, res, next) => {
    const userId = req.userId;

    const players = await prisma.usersPlayers.findMany({
      select: {
        userPlayerId: true,
        startingLine: true,
        players: {
          select: {
            playerId: true,
            playerName: true,
            speed: true,
            finishing: true,
            shotPower: true,
            defense: true,
            stamina: true,
          },
        },
      },
      where: {
        userId: userId,
      },
    });

    return res.status(StatusCodes.OK).json({ data: players });
  }),
);

export default router;

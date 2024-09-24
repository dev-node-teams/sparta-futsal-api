import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import joi from 'joi';
import dotenv from 'dotenv';
import StatusError from '../errors/status.error.js';
import { StatusCodes } from 'http-status-codes';

dotenv.config();

const UsersRouter = express.Router();

// 회원가입 API
UsersRouter.post('/users/sign-up', async (req, res, next) => {
  const userSchema = joi.object({
    email: joi.string().email().min(6).max(20).required().messages({
      'string.min': '이메일은 최소 6자 이상이어야 한다.',
      'string.max': '이메일은 최대 20자 이하여야 한다.',
      'string.email': '이메일 형식으로 작성',
      'any.required': '이메일은 반드시 작성해야 한다.',
    }),
    password: joi
      .string()
      .min(6)
      .max(20)
      .pattern(/^[!@#$%^&*a-zA-Z0-9]*$/)
      .required()
      .messages({
        'string.min': '비밀번호는 최소 6자 이상이어야 한다.',
        'string.max': '비밀번호는 최대 20자 이하여야 한다.',
        'string.pattern.base': '패스워드는 영문, 숫자, 특수문자 중 한 가지 이상 포함되어야 한다.',
        'any.required': '패스워드는 반드시 작성해야 한다.',
      }),
    nickname: joi
      .string()
      .min(2)
      .max(15)
      .pattern(/^[a-zA-Z0-9가-힣]*$/)
      .required()
      .messages({
        'string.min': '닉네임은 최소 2자 이상이어야 한다.',
        'string.max': '닉네임은 최대 15자 이하여야 한다.',
        'string.pattern.base': '닉네임은 한글, 영문, 숫자 중 한 가지 이상 포함되어야 한다.',
        'any.required': '닉네임은 반드시 작성해야 한다.',
      }),
  });

  try {
    const userVal = await userSchema.validateAsync(req.body);

    const { email, password, nickname } = userVal;

    const isExistEmail = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (isExistEmail) {
      throw new StatusError('이미 존재하는 이메일입니다.', StatusCodes.CONFLICT);
    }
    const isExistNick = await prisma.users.findUnique({
      where: {
        nickname,
      },
    });

    if (isExistNick) {
      throw new StatusError('이미 존재하는 닉네임입니다.', StatusCodes.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createUser = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
      },
    });

    return res.status(StatusCodes.CREATED).json({
      message: `이메일: ${createUser.email}, 닉네임: ${createUser.nickname} 회원가입 완료`,
    });
  } catch (error) {
    return next(error);
  }
});

// 로그인 API
UsersRouter.post('/users/sign-in', async (req, res, next) => {
  const userSchema = joi.object({
    email: joi.string().email().min(6).max(20).required().messages({
      'string.min': '이메일은 최소 6자 이상이어야 한다.',
      'string.max': '이메일은 최대 20자 이하여야 한다.',
      'any.required': '이메일은 반드시 작성해야 한다.',
    }),
    password: joi
      .string()
      .min(6)
      .max(20)
      .pattern(/^[!@#$%^&*a-zA-Z0-9]*$/)
      .required()
      .messages({
        'string.min': '비밀번호는 최소 6자 이상이어야 합니다.',
        'string.max': '비밀번호는 최대 20자까지 가능합니다.',
        'string.pattern.base': '패스워드는 영문, 숫자, 특수문자 중 한 가지 이상 포함되어야 한다.',
        'any.required': '패스워드는 반드시 작성해야 한다.',
      }),
  });

  try {
    const userVal = await userSchema.validateAsync(req.body);

    const { email, password } = userVal;

    const loginUser = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (!loginUser) {
      throw new StatusError('존재하지 않는 이메일입니다.', StatusCodes.UNAUTHORIZED);
    }

    const hashedPassword = loginUser.password;
    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      throw new StatusError('비밀번호가 일치하지 않습니다.', StatusCodes.UNAUTHORIZED);
    }

    const accessToken = jwt.sign(
      {
        id: loginUser.id,
      },
      process.env.ACCESS_SECRET_KEY,
      { expiresIn: '1h' },
    );

    const refreshToken = jwt.sign(
      {
        id: loginUser.id,
      },
      process.env.REFRESH_SECRET_KEY,
      { expiresIn: '7d' },
    );

    res.setHeader('Authorization', `Bearer ${accessToken}`);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(StatusCodes.OK).json({ message: '로그인 성공' });
  } catch (error) {
    return next(error);
  }
});

// Refresh Token으로 Access Token 새로 받아오기
UsersRouter.post('/users/refresh', async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new StatusError('리프레시 토큰이 존재하지 않습니다.', StatusCodes.NOT_FOUND);
  }

  try {
    const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);

    const newAccessToken = jwt.sign(
      {
        id: decodedRefresh.id,
      },
      process.env.ACCESS_SECRET_KEY,
      { expiresIn: '1h' },
    );

    res.setHeader('Authorization', `Bearer ${newAccessToken}`);

    return res.status(StatusCodes.CREATED).json({ message: 'Access Token 재발급' });
  } catch (error) {
    return next(error);
  }
});

// 캐시 충전
UsersRouter.post('/users/buy-cash', authMiddleware, async (req, res, next) => {
  const cashSchema = joi.object({
    buycash: joi.number().required().messages({
      'number.base': '충전해야 할 금액을 숫자형태로 적어주세요',
      'any.required': '충전할 금액을 적어주세요',
    }),
  });

  try {
    const cashVal = await cashSchema.validateAsync(req.body);
    const { buycash } = cashVal;

    const authId = req.userId;

    if (!authId) {
      throw new StatusError('인증되지 않은 유저입니다.', StatusCodes.UNAUTHORIZED);
    }

    const userCash = await prisma.users.findUnique({
      where: {
        id: authId,
      },
      select: {
        cash: true,
      },
    });

    if (!userCash) {
      throw new StatusError('찾을 수 없는 유저입니다.', StatusCodes.NOT_FOUND);
    }

    const updateCash = await prisma.users.update({
      where: {
        id: authId,
      },
      data: {
        cash: userCash.cash + buycash,
      },
    });

    return res
      .status(StatusCodes.OK)
      .json({ message: `${buycash}만큼 충전해 현재 잔액 ${updateCash.cash}이다.` });
  } catch (error) {
    throw next(error);
  }
});

export default UsersRouter;

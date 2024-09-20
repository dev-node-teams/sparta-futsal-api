import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import joi from 'joi';
import dotenv from 'dotenv';

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
        'string.pattern.base': '패스워드는 영문, 숫자, 특수문자로 이루어져야 한다.',
        'any.required': '패스워드는 반드시 작성해야 한다.',
      }),
    nickname: joi
      .string()
      .min(6)
      .max(20)
      .pattern(/^[a-zA-Z0-9]*$/)
      .required()
      .messages({
        'string.min': '닉네임은 최소 6자 이상이어야 한다.',
        'string.max': '닉네임은 최대 20자 이하여야 한다.',
        'string.pattern.base': '닉네임은 영문, 숫자로 이루어져야 한다.',
        'any.required': '닉네임은 반드시 작성해야 한다.',
      }),
  });

  try {
    const userVal = await userSchema.validateAsync(req.body);

    const { email, password, nickname } = userVal;

    // users 테이블에 있는 email인지 확인, email이 unique 속성이래서 findUnique
    const isExistEmail = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (isExistEmail) {
      return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
    }
    // users 테이블에 있는 nickname인지 확인, nickname이 unique 속성이래서 findUnique
    const isExistNick = await prisma.users.findUnique({
      where: {
        nickname,
      },
    });

    if (isExistNick) {
      return res.status(400).json({ message: '이미 존재하는 닉네임입니다.' });
    }

    // password 해싱, users 테이블에 email, 해싱된 password, nickname 추가
    const hashedPassword = await bcrypt.hash(password, 10);

    const createUser = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
      },
    });

    return res.status(201).json({
      message: `이메일: ${createUser.email}, 닉네임: ${createUser.nickname} 회원가입 완료`,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
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
        'string.pattern.base': '패스워드는 영문, 숫자, 특수문자로 이루어져야 한다.',
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
      return res.status(404).json({ message: '존재하지 않는 이메일' });
    }

    const hashedPassword = loginUser.password;
    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      return res.status(400).json({ message: '비밀번호가 일치x' });
    }

    const token = jwt.sign(
      {
        id: loginUser.id,
      },
      'secret-key',
      { expiresIn: '1h' },
    );

    res.setHeader('Authorization', `Bearer ${token}`);

    return res.status(200).json({ message: '로그인 성공' });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
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

    // 인증을 통해 얻은 email 확인 후 cash 수정해야 할 user 확인
    const authId = req.userId;

    const userCash = await prisma.users.findUnique({
      // SELECT cash FROM users
      // WHERE email = authEmail
      where: {
        id: authId,
      },
      select: {
        cash: true,
      },
    });

    if (!userCash) {
      return res.status(404).json('존재하지 않는 유저');
    }

    const updateCash = await prisma.users.update({
      // UPDATE users
      // SET cash = userCash.cash + buycash
      // WHERE email = authEmail
      where: {
        id: authId,
      },
      data: {
        cash: userCash.cash + buycash,
      },
    });

    return res
      .status(200)
      .json({ message: `${buycash}만큼 충전해 현재 잔액 ${updateCash.cash}이다.` });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
});

export default UsersRouter;

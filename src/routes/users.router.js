import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import joi from 'joi';

const UsersRouter = express.Router();


// 회원가입 API
UsersRouter.post('/users/sign-up', async (req, res, next) => {
  const { email, password, nickname } = req.body;

  const userVal = joi.object({
    email: joi
      .string()
      .pattern(/^[a-zA-Z0-9]{6,20}$/)
      .required()
      .message({
        'string.pattern.base': '이메일은 6~20자의 영문, 숫자로 이루어져야 한다.',
        'string.empty': '이메일은 반드시 작성해야 한다.',
      }),
    password: joi
      .string()
      .pattern(/^[!@#$%^&*a-zA-Z0-9]{6,20}$/)
      .required()
      .message({
        'string.pattern.base': '패스워드는 6~20자의 영문, 숫자, 특수문자로 이루어져야 한다.',
        'string.empty': '패스워드는 반드시 작성해야 한다.',
      }),
    nickname: joi
      .string()
      .pattern(/^[a-zA-Z0-9]{3,30}$/)
      .required()
      .message({
        'string.pattern.base': '닉네임은 3~30자의 영문, 숫자로 이루어져야 한다.',
        'string.empty': '닉네임은 반드시 작성해야 한다.',
      }),
  });

  const error = userVal.validate(req.body);
  if (error) {
    return res.status(400).json({ message: '유효하지 않은 값' });
  }

  try {
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
  const { email, password } = req.body;

  const userVal = joi.object({
    email: joi
      .string()
      .pattern(/^[a-zA-Z0-9]{6,20}$/)
      .required()
      .message({
        'string.pattern.base': '이메일은 6~20자의 영문, 숫자로 이루어져야 한다.',
        'string.empty': '이메일은 반드시 작성해야 한다.',
      }),
    password: joi
      .string()
      .pattern(/^[!@#$%^&*a-zA-Z0-9]{6,20}$/)
      .required()
      .message({
        'string.pattern.base': '패스워드는 6~20자의 영문, 숫자, 특수문자로 이루어져야 한다.',
        'string.empty': '패스워드는 반드시 작성해야 한다.',
      }),
  });

  const error = userVal.validate(req.body);
  if (error) {
    return res.status(400).json({ message: '유효하지 않은 값' });
  }

  try {
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
        email: loginUser.email,
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



export default UsersRouter;

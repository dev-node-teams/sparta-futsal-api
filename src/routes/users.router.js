import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';

const UsersRouter = express.Router();

// 회원가입 API
UsersRouter.post('/users/sign-up', async (req, res, next) => {
  const { email, password, nickname } = req.body;

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

export default UsersRouter;

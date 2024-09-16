import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';

const UsersRouter = express.Router();

// 로그인 API
UsersRouter.post('/users/sign-in', async (req, res, next) => {
  const { email, password } = req.body;

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

    res.cookie('authorization', `Bearer ${token}`);

    return res.status(200).json({ message: '로그인 성공' });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
});

export default UsersRouter;

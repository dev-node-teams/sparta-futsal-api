import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const UsersRouter = express.Router();

// 캐시 충전
UsersRouter.post('/users/buy-cash', authMiddleware, async (req, res, next) => {
  const { buycash } = req.body;

  try {
    // 충전할 캐시를 안적거나, 숫자 아닌 다른 것 넣은 경우
    if (!buycash || typeof buycash !== 'number') {
      return res.status(400).json('충전할 금액을 제대로 설정하세요');
    }

    // 인증을 통해 얻은 email 확인 후 cash 수정해야 할 user 확인
    const authEmail = req.email;

    const userCash = await prisma.users.findUnique({
      // SELECT cash FROM users
      // WHERE email = authEmail
      where: {
        email: authEmail,
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
        email: authEmail,
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

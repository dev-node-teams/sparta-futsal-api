import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';

export default async (req, res, next) => {
  const { authorization } = req.cookies;

  try {
    if (!authorization) {
      throw new Error('토큰 X');
    }

    const [tokenType, token] = req.cookies.authorization.split(' ');

    if (tokenType !== 'Bearer' || !token) {
      throw new Error('토큰이 맞지 않음');
    }

    const decodedToken = jwt.verify(token, 'secret-key');
    const decodedEmail = decodedToken.email;

    const userEmail = await prisma.users.findUnique({
      where: {
        email: decodedEmail,
      },
    });

    if (!userEmail) {
      res.clearCookie('authorization');
      throw new Error('토큰의 사용자가 존재 X');
    }

    req.email = decodedEmail;

    next();
  } catch (error) {
    res.clearCookie('authorization');
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';

export default async (req, res, next) => {
  const authorization = req.headers.authorization;

  try {
    if (!authorization) {
      throw new Error('토큰 X');
    }

    const [tokenType, token] = authorization.split(' ');

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
      throw new Error('토큰의 사용자가 존재 X');
    }

    req.email = decodedEmail;

    next();
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

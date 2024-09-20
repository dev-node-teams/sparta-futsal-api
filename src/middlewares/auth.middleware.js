import jwt from 'jsonwebtoken';

export default async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    throw new Error('토큰 X');
  }

  try {
    const [tokenType, tokenValue] = token.split(' ');

    if (tokenType !== 'Bearer' || !tokenValue) {
      throw new Error('토큰이 맞지 않음');
    }

    const decodedToken = jwt.verify(tokenValue, 'secret-key');

    req.userId = decodedToken.id;

    next();
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

import express from 'express';
import dotenv from 'dotenv';
import teamsRouter from './routes/teams.router.js';
import usersRouter from './routes/users.router.js';
import playerRouter from './routes/players.router.js';
import cookieParser from 'cookie-parser';
import playgameRouter from './routes/playgame.router.js';
import errorMiddleware from './middlewares/error.middleware.js';

// .env => process.env
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

app.use('/api', [usersRouter, teamsRouter, playerRouter, playgameRouter]);

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});

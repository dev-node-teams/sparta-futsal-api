import express from 'express';
import dotenv from 'dotenv';
import teamsRouter from './routes/teams.router.js';
import cookieParser from 'cookie-parser';
import playgameRouter from './routes/playgame.router.js'

// .env => process.env
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/api', [teamsRouter, playgameRouter]);

app.use(cookieParser());

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});

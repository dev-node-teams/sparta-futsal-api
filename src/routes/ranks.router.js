import express from 'express';
import joi from 'joi';
import asyncHandler from 'express-async-handler';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import StatusError from '../errors/status.error.js';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

/** 전체 랭킹 조회  */
router.get(
  '/ranks',
  asyncHandler(async (req, res, next) => {
    const result = {};

    const qRes = await prisma.$queryRaw`
    select
            dense_rank() over (order by  u.rating desc) as ranking,
            u.id , u.nickname, u.rating,
            max(if(s.game_result='승리', s.result_cnt, 0)) as win_cnt,
            max(if(s.game_result='무승부', s.result_cnt, 0)) as draw_cnt,
            max(if(s.game_result='패배', s.result_cnt, 0)) as lose_cnt
      from (
        select 
           user1_id as play_user_id, 
           (
           	case
                when user1_point > user2_point then '승리'
                when user1_point < user2_point then '패배'
                ELSE '무승부'
                    end
                  ) as game_result
                  , count(*) as result_cnt
              from game_results grl 
          group by play_user_id, game_result
          ) s
      right outer join users u 
                    on s.play_user_id = u.id 
              group by s.play_user_id, u.nickname, u.rating
              order by u.rating desc
    `;

    result.data = JSON.parse(
      JSON.stringify(
        qRes,
        (key, value) => (typeof value === 'bigint' ? +value.toString() : value), // return everything else unchanged
      ),
    );

    return res.status(StatusCodes.OK).json({ data: result.data });
  }),
);

export default router;

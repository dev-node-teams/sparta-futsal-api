import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { Utils } from '../utils/utils.js';
import authCheck from '../middlewares/auth.middleware.js';
const router = express.Router();

/*---------------------------------------------
                선수 상세 조회
---------------------------------------------*/
router.get('/players/:player_id', async(req, res) => {
    const playerId = Number(req.params.player_id);
    
    const player = await prisma.players.findUnique({
        where: {
            playerId,
        },
        select: {
            playerName: true,
            speed: true,
            finishing: true,
            shotPower: true,
            defense: true,
            stamina: true
        },
      });

      if(!player){
        return res.status(409).send("유효하지 않은 선수입니다.")
      }
    return res.status(200).json(player);
});

/*---------------------------------------------
    [선수 뽑기]
    1. 유저 cash정보 DB로부터 확인
        1-1. 충분하지 않다면, 409반환
        1-2. 충분하다면, 
             무작위 선수 뽑기
             비용 차감 (트랜잭션으로 처리)
             인벤에 넣기 (트랜잭션으로 처리)
    2. 뽑은 선수 반환 or status(400) 반환

---------------------------------------------*/
router.post('/players/draw', authCheck, async(req, res) => {
    const cost = 100;

    try {
        //1.유저 cash정보 DB로부터 확인: DB누적 접근: 1
        const user = await tx.users.findUnique({ 
            
            where: { id: req.userId },
            select: {
                id: true,
                cash: true
            }
        });
        if(!user){
            return res.status(409).json({
                message: "유효하지 않은 유저입니다.", 
            })
        }


        //1-1. 충분하지 않다면, 400반환
        if(user.cash < cost){
            return res.status(400).send("cash가 부족합니다.")
        }

        //1-2 무작위 선수 뽑기
        const players = await prisma.players.findMany(); //DB 누적 접근: 2
        const selectedPlayer = Utils.drawPlayer(players); 

        const result = await prisma.$transaction(async (tx) =>{
            //1-2. 충분하다면, 비용차감
            await tx.users.update({
                where: {id: user.id},
                data: { cash: user.cash-cost }
            });
    
            // 1-2 인벤에 선수 추가
            await prisma.usersPlayers.create({ //DB 누적 접근: 3
                data: {
                    userId: user.id,
                    playerId: selectedPlayer.playerId,
                    level: 1,
                },
            });
            return res.status(200).json(selectedPlayer);
        })
    } catch (err) {
        console.log(err);
        return res.status(400).json({
            message: "트랜잭션 실패",
            throw: err.message
        }); 
    }
});

export default router;
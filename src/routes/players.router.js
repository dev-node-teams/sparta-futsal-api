import express from 'express';
import { prisma } from '../utils/prisma/index.js';

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

export default router;
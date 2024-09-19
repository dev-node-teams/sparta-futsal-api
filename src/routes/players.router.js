import express from 'express';
import PlayerManager from '../Player/PlayerManager.js';

const router = express.Router();

/*---------------------------------------------
                선수 상세 조회
---------------------------------------------*/
router.get('/:player_id', async(req, res) => {
    const player_id = Number(req.params.player_id);

    //PlayerManager.Print();
    let tmp = PlayerManager.getPlayerOrNull(player_id);
    console.log(tmp);
    if(tmp != null)
        return res.status(201).json(tmp);
    
    
    return res.status(409).send("유효하지 않은 선수입니다.");
});

export default router;
import { PrismaClient } from '@prisma/client';
import { Player } from './types.js';

class PlayerManager{
    static players = new Map();
    

    static async Init(){
        //prisma클라이언트 생성
        const prisma = new PrismaClient({
            log: ['query', 'warn', 'error'],
            errorFormat: 'pretty',
        });

        try {
            const players = await prisma.players.findMany();
    
            if(players) {
                players.forEach(player => {
                    PlayerManager.players.set(player.player_id, new Player(player.player_name, player.speed, player.finishing, player.shotPower, player.defense, player.stamina));    
                });
            }
        } catch(err){
            console.log(err);
        }
    }

    static Print(){
        console.log("------------------------------------------")
        PlayerManager.players.forEach((player) => {
            console.log(player);
        });
    }

    static getPlayerOrNull(player_id){
        return PlayerManager.players.get(player_id) ? PlayerManager.players.get(player_id) : null;
    }
}

export default PlayerManager;
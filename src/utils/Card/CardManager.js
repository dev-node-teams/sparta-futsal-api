import { CardPack } from "./CardPack.js";
import { prisma } from "../prisma/index.js";

class CardManager{
    //생성자
    constructor(){
        this.cardPacks = new Map();

        this.init();
    }

    async init(){
        const players = await prisma.players.findMany(); //DB 누적 접근: 2
        const legendPlayers = await prisma.players.findMany({
        where: { rarity: 10 },
        select: {
            playerId: true,
            rarity: true
        }
        });

        this.addCardPack("모든 선수 팩", players, 100);
        this.addCardPack("전설 팩", legendPlayers, 500);
    }
    

    addCardPack(packName, cardPack, cost){
        let pack = new CardPack(cardPack, cost)
        this.cardPacks[packName] = pack;
    }

    drawCard(packName){
        return this.cardPacks[packName].drawPlayer()
    }
    getCost(packName){
        return this.cardPacks[packName].getCost();
    }
};

export const cardManager = new CardManager();

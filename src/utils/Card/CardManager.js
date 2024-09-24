import { CardPack } from "./CardPack.js";
import { prisma } from "../prisma/index.js";

class CardManager{
    //생성자
    constructor(){
        this.cardPacks = new Map();

        this.init();
    }

    async init(){
        const cardPackPlayers = await prisma.cardpack.findMany({
            include: {
                cardpack_players: {
                    select: {
                        playerId: true,
                        rarity: true
                    },
                }
            }
        });

        cardPackPlayers.forEach((cardPack) => {
            const packName = cardPack.packName;  // 카드팩 이름
            const players = cardPack.cardpack_players;  // 카드팩에 포함된 플레이어들
            const cost = 1000;  // 예를 들어 고정된 가격을 사용하거나 cardPack에서 cost를 추출할 수 있음
        
            // addCardPack에 packName, players, cost를 전달
            this.addCardPack(packName, players, cost);
        });
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

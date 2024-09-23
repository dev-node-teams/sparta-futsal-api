import { CardPack } from "./CardPack.js";
class CardManager{
    //생성자
    constructor(){
        this.cardPacks = new Map();
    }

    addCardPack(packName, cardPack, cost){
        let pack = new CardPack(cardPack)
        this.cardPacks[packName] = {pack, cost};
    }

    drawCard(packName){
        return this.cardPacks[packName].pack.drawPlayer()
    }
    getCost(packName){
        return this.cardPacks[packName].cost;
    }
};

export const cardManager = new CardManager();

export class CardPack{
    constructor(cardPool, cost){
        this.cardPool = cardPool;
        this.cost = cost;
    }
    drawPlayer() {
        //2. 가중치 총합 구하기
        let totalWeight = 0;
        for(let i = 0; i < this.cardPool.length; i += 1){
            totalWeight += this.cardPool[i].rarity;
        }

        //3. [0, 가중치 총합)의 난수 구하기
        const randomNum = Math.random() * totalWeight;
    
        //가중치 누적합
        let weightSum = 0;
    
        //4. 가중치 누적합 계산 및 선수 반환
        for (const player of this.cardPool) {
            weightSum += player.rarity;
            if (randomNum < weightSum) {
                return player;
            }
        }

        return null
    }
    getCost(){
        return this.cost;
    }
};

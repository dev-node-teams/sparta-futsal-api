export class Utils{
/*---------------------------------------------
    [무작위 선수 뽑기]

    1. 가중치가 담긴 player배열 넘겨받기
    2. 가중치 총합 구하기
    3. [0, 가중치 총합)의 난수 구하기
    4. 가중치 누적합 계산 및 선수 반환
---------------------------------------------*/
    static drawPlayer(players) {
        //2. 가중치 총합 구하기
        let totalWeight = 0;
        for(let i = 0; i < players.length; i += 1){
            totalWeight += players[i].weight;
        }

        //3. [0, 가중치 총합)의 난수 구하기
        const randomNum = Math.random() * totalWeight;
    
        //가중치 누적합
        let weightSum = 0;
    
        //4. 가중치 누적합 계산 및 선수 반환
        for (const player of players) {
            weightSum += player.weight;
            if (randomNum < weightSum) {
                return player;
            }
        }

        return null
    }
}
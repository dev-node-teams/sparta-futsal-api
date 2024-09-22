export class Utils{
/*---------------------------------------------
    [개요]
    1. drawPlayer(players): 무작위 선수 뽑기
    2. getAdjustLevelOVR(OVR, level): OVR에 level보정치를 더한 값을 반환
    3. getUpgradePercent(upgradeOVR, materialOVR): 강화할 선수의 OVR과 재료의 OVR를 비교하여 성공할 확률 반환
    4. clamp(val, min, max): val값이 최소 min, 최대 max사이의 값을 갖게 보장

/*---------------------------------------------
    [무작위 선수 뽑기]

    1. 가중치가 담긴 player배열 넘겨받기
    2. 가중치 총합 구하기
    3. [0, 가중치 총합)의 난수 구하기
    4. 가중치 누적합 계산 및 선수 반환

    TODO: 
        1. 가중치 추가하기(등급을 추가하기)
---------------------------------------------*/
    static drawPlayer(players) {
        //2. 가중치 총합 구하기
        let totalWeight = 0;
        for(let i = 0; i < players.length; i += 1){
            totalWeight += players[i].rarity;
        }

        //3. [0, 가중치 총합)의 난수 구하기
        const randomNum = Math.random() * totalWeight;
    
        //가중치 누적합
        let weightSum = 0;
    
        //4. 가중치 누적합 계산 및 선수 반환
        for (const player of players) {
            weightSum += player.rarity;
            if (randomNum < weightSum) {
                return player;
            }
        }

        return null
    }
/*---------------------------------------------
    [레벨 별 능력치 부여]
---------------------------------------------*/
    static getAdjustLevelOVR(OVR, level){
        console.log(OVR+" : "+level);
        switch(level){
            case 0: return OVR;
            case 1: return OVR+3;
            case 2: return OVR+4;
            case 3: return OVR+5;
            case 4: return OVR+6;
            case 5: return OVR+8;
            case 6: return OVR+10;
            case 7: return OVR+12;
            case 8: return OVR+15;
            case 9: return OVR+18;
            case 10: return OVR+22;
            default:
                console.log("sl");
                return null;
        }
    }
/*---------------------------------------------
    [강화 성공 확률]
---------------------------------------------*/
    static getUpgradePercent(upgradeOVR, materialOVR){
        if(upgradeOVR == materialOVR)
            return 0.5;
        else if(upgradeOVR == materialOVR+1)
            return 0.67;
        else if(upgradeOVR == materialOVR+2)
            return 0.9;
        else if(upgradeOVR <= materialOVR+3)
            return 1;
        else if(upgradeOVR == materialOVR-1)
            return 0.373;
        else if(upgradeOVR == materialOVR-2)
            return 0.275;
        else if(upgradeOVR == materialOVR-3)
            return 0.208;
        else if(upgradeOVR == materialOVR-4)
            return 0.152;
        else if(upgradeOVR == materialOVR-5)
            return 0.113;
        else if(upgradeOVR == materialOVR-6)
            return 0.084;
        else if(upgradeOVR == materialOVR-7)
            return 0.062;
        else if(upgradeOVR == materialOVR-8)
            return 0.046;
        else
            return 0.035
    }

/*---------------------------------------------
    [clamp]
---------------------------------------------*/
    static clamp(val, min, max){
        return Math.min(Math.max(val, min), max);
    }
}
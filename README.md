# 풋살 온라인 프로젝트

## 풋살해조(1조)
**팀원 소개**
---
| 전봉준 | 조정현 | 노승현 | 이상현 | 유성민 |  
| :---------: | :-------------------------: | :---------------: | :-----------: |  :---------------: | 
| INTP | INTP | ISFJ | ISTP | INTP |  
| <p><img src="https://avatars.githubusercontent.com/u/95843762?v=4" width="350px" height="150px"/></p> | <p><img src="https://avatars.githubusercontent.com/u/47106579?v=4" width="400px" height="150px"/></p> | <p><img src="https://avatars.githubusercontent.com/u/64311828?v=4" width="400px" height="150px"/></p> | <p><img src="https://avatars.githubusercontent.com/u/149569986?v=4" width="200px" height="130px"/></p> | <p><img src="https://avatars.githubusercontent.com/u/48234706?v=4" width="350px" height="150px"/></p> | 
|  [@devbong92](https://github.com/devbong92) | [@im-cjh](https://github.com/im-cjh) | [@NSHkw](https://github.com/NSHkw) | [@LeeSanghyun1212](https://github.com/LeeSanghyun1212) | [@endlesssleep](https://github.com/endlesssleep) | 
| [Blog Link](https://velog.io/@vamuzz) | [Notion Link](https://www.notion.so/cannons/97fee3418a554ce38ca0046be9b1ee8c?v=fb0be7ffa18046bcb0ef78123e17c872) | [Blog Link](https://velog.io/@lmyno) | [Blog Link](https://velog.io/@tlfqjcuku) | [Blog Link](https://esleep.tistory.com/) |

## 시연영상 LINK
[![시연영상_YOUTUBE](https://github.com/user-attachments/assets/653e6357-f970-49ab-8226-28b77bd1e30f)](https://www.youtube.com/watch?v=hhB_ayn0KYE) 


## ERD
<img width="428" alt="image" src="https://github.com/user-attachments/assets/e41bde0d-710d-46d0-a182-900ef958735c">

## API 명세서 
![image](https://github.com/user-attachments/assets/474e7d20-595d-4c49-aa46-0f02750566fd)

## 프로젝트 구조 
```
📁 ROOT
├── README.md
├── package-lock.json
├── package.json
├── 📁 prisma
│   └── schema.prisma
└── 📁 src
    ├── app.js
    ├── 📁 errors
    │   └── status.error.js
    ├── 📁 middlewares
    │   ├── auth.middleware.js
    │   └── error.middleware.js
    ├── 📁 routes
    │   ├── players.router.js
    │   ├── playgame.router.js
    │   ├── ranks.router.js
    │   ├── teams.router.js
    │   └── users.router.js
    └── 📁 utils
        ├── 📁 Card
        │   ├── CardManager.js
        │   └── CardPack.js
        ├── gameutils.js
        ├── 📁 prisma
        │   └── index.js
        └── utils.js
```

# 강화

- 다른 보유 선수들을 사용해서 강화
- 모든 능력치(속력, 골결, 슛 파워, 수비, 스테미나) 증가
- 레벨 별 능력치 부여 표

| 강화 등급 | 카드 색 구분 | 강화 카드 적용 효과 | 강화 효과 상승폭 |
| --------- | ------------ | ------------------- | ---------------- |
|  +0       |  회색        |  없음               |  -               |
|  +1       |  회색        | 모든 능력치 +3      | +3               |
|  +2       |  동색        |  모든 능력치 +4     | +1               |
|  +3       |  동색        | 모든 능력치 +5      | +1               |
|  +4       |  동색        | 모든 능력치 +6      | +1               |
|  +5       |  은색        |  모든 능력치 +8     | +2               |
|  +6       |  은색        |  모든 능력치 +10    | +2               |
|  +7       |  은색        | 모든 능력치 +12     | +2               |
|  +8       |  금색        |  모든 능력치 +15    | +3               |
|  +9       |  금색        |  모든 능력치 +18    | +3               |
|  +10      |  금색        |  모든 능력치 +22    | +4               |

## 강화 성공 확률표

| OVR 상대 수치 | 성공 확률 |
| ------------- | --------- |
| 동일한 OVR    | 50%       |
| OVR+1         | 67%       |
| OVR+2         | 90%       |
| OVR+3 이상    | 100%      |
| OVR-1         | 37.3%     |
| OVR-2         | 27.5%     |
| OVR-3         | 20.8%     |
| OVR-4         | 15.2%     |
| OVR-5         | 11.3%     |
| OVR-6         | 8.4%      |
| OVR-7         | 6.2%      |
| OVR-8         | 4.6%      |
| OVR-9 이하:   | 3.5%      |

## 로직

1. 강화할 선수의 성공 확률 계산
   1-1. OVR 계산
   강화할 선수와 강화 재료들의 레벨에 따른 OVR(Overall Rating) 구하기
   1-2. OVR 차이 확인
   강화할 선수와 재료의 OVR 차이에 해당하는 값을 표에서 찾기
   1-3. 누적합 계산
   OVR 차이에 따른 누적합 계산
2. 성공 확률 검사
   2-1. 성공 시
   난수의 값이 성공 확률보다 크거나 같으면 성공으로 간주
   DB에서 강화할 선수의 레벨 1 증가 (트랜잭션 처리)
   강화 재료를 DB에서 제거 (트랜잭션 처리)
   '강화된 선수' 정보를 전송
   2-2. 실패 시
   난수의 값이 성공 확률보다 작으면 실패로 간주
   강화 재료를 DB에서 제거
   "실패" 메시지 전송

-----

## 소감
![image](https://github.com/user-attachments/assets/12bd2f1f-2f53-47e9-aab8-c593a21e03af)




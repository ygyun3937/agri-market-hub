# Agri-Market Hub

농업 종사자를 위한 실시간 농업 정보 대시보드. 날씨·시세·뉴스·병해충 정보를 한 화면에서 제공합니다.

## 주요 기능

### 대시보드
- 패널 드래그 리사이즈 — 열 너비·하단 패널 높이 자유 조절, localStorage에 레이아웃 저장
- 재난 문자 실시간 수신 (SignalR WebSocket)
- 뉴스 티커 — 병해충·작황 최신 5건 자동 스크롤

### 날씨 패널
- 기상청 단기예보 API — 현재 기온·습도·바람·강수량
- 5일 예보 + 강수확률 시각화 바
- 16개 지역 선택 (localStorage 저장)

### 농산물 가격 패널 (KAMIS)
- 4월 제철 품목 실시간 시세
- 관심 품목 추가/삭제 (위시리스트)
- 전일 대비 등락률 표시

### 뉴스 패널
- 네이버 뉴스 API — 작황·가격·물류·정책·병해충 탭별 분류
- 헤드라인 탭 — 병해충·작황 최신 6건 자동 합산

### 지도 패널
- Leaflet + OpenStreetMap 기반
- 레이어 토글: 도매시장 / 산지 / 기상특보 / 병해충

### 캘린더 & 일정
- 월별 캘린더 (농업 행사 등록·조회)
- 일정 목록 — D-day 뱃지, 빠른 추가 폼

### 유가 패널
- 오피넷 API — 전국 평균 휘발유·경유 가격

### 알림
- 재난 문자 배너 (SignalR 실시간)
- Web Push 알림 (VAPID)

### 인증
- JWT 기반 로그인/회원가입
- Google Calendar 연동 (OAuth2)

---

## 기술 스택

### Frontend
| 분류 | 기술 |
|------|------|
| 프레임워크 | React 19 + Vite 8 |
| 라우팅 | React Router v7 |
| HTTP | Axios |
| 실시간 | @microsoft/signalr |
| 지도 | Leaflet + react-leaflet |
| 스타일 | Inline CSS (GitHub Dark 테마) |

### Backend
| 분류 | 기술 |
|------|------|
| 런타임 | .NET 10 (ASP.NET Core) |
| ORM | Entity Framework Core + Npgsql |
| 캐시 | StackExchange.Redis |
| 실시간 | ASP.NET Core SignalR |
| 인증 | JWT Bearer + BCrypt |
| 외부 연동 | Google Calendar API v3, WebPush (VAPID) |
| 테스트 | xUnit + Moq + FluentAssertions |

### Crawler
| 분류 | 기술 |
|------|------|
| 언어 | Python 3.11 |
| DB | psycopg2-binary |
| 스케줄링 | schedule |
| 수집 대상 | 기상청 단기예보, KAMIS 농산물 가격, 오피넷 유가, 네이버 뉴스, 병해충 API |
| 테스트 | pytest + responses |

### 인프라
| 분류 | 기술 |
|------|------|
| DB | PostgreSQL 15 |
| 캐시 | Redis 7 |
| 컨테이너 | Docker Compose |
| 프록시 | Caddy (서버 기존 설치) |
| CI/CD | GitHub Actions — 빌드·테스트 후 SSH/rsync 배포 |

---

## 프로젝트 구성도

### 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph Client["브라우저"]
        React["React SPA\n(Vite)"]
    end

    subgraph Server["원격 서버 (Docker Compose)"]
        Caddy["Caddy\n(Reverse Proxy)"]
        API["ASP.NET Core\napi:5031"]
        Crawler["Python Crawler\n(cron scheduler)"]
        DB["PostgreSQL 15"]
        Redis["Redis 7"]
    end

    subgraph ExternalAPIs["외부 API"]
        Weather["기상청 단기예보"]
        KAMIS["KAMIS 농산물가격"]
        Opinet["오피넷 유가"]
        Naver["네이버 뉴스"]
        Pest["병해충 API"]
    end

    React -- "HTTPS /api/*" --> Caddy
    React -- "WebSocket SignalR" --> Caddy
    Caddy -- "HTTP" --> API
    API --> DB
    API --> Redis
    Crawler --> DB
    Crawler --> Weather
    Crawler --> KAMIS
    Crawler --> Opinet
    Crawler --> Naver
    Crawler --> Pest
    Caddy -- "Static Files" --> React
```

### 데이터 흐름

```mermaid
sequenceDiagram
    participant C as 브라우저
    participant Caddy
    participant API as ASP.NET Core
    participant DB as PostgreSQL
    participant Redis
    participant Crawler as Python Crawler

    Note over Crawler,DB: cron 스케줄 (주기적 수집)
    Crawler->>DB: 날씨·가격·뉴스·유가 저장

    C->>Caddy: GET /api/weather/{region}
    Caddy->>API: 프록시
    API->>Redis: 캐시 조회
    alt 캐시 히트
        Redis-->>API: 캐시 데이터
    else 캐시 미스
        API->>DB: SELECT
        DB-->>API: 결과
        API->>Redis: 캐시 저장
    end
    API-->>C: JSON 응답

    Note over C,API: 재난 알림 실시간 수신
    C-->>API: WebSocket 연결 (SignalR)
    API-->>C: 재난 문자 Push
```

### CI/CD 파이프라인

```mermaid
flowchart LR
    Push["git push\nmain"] --> CI

    subgraph CI["GitHub Actions CI"]
        direction TB
        FE["Frontend\nnpm ci → build"] 
        BE["Backend\ndotnet build"]
        CW["Crawler\npip install → pytest"]
    end

    CI --> Deploy

    subgraph Deploy["GitHub Actions Deploy"]
        direction TB
        SSH["SSH 키 설정"]
        Upload["rsync\nbackend/publish\ncrawler\nfrontend/dist"]
        Restart["docker compose up -d"]
        SSH --> Upload --> Restart
    end

    Deploy --> Prod["원격 서버\n(Docker Compose)"]
```

---

## 환경 변수

`.env` 파일에 아래 값을 설정합니다.

```env
DB_PASS=
JWT_SECRET=
WEATHER_KEY=          # 기상청 API 키
KAMIS_KEY=            # KAMIS API 키
NAVER_CLIENT_ID=      # 네이버 개발자센터
NAVER_CLIENT_SECRET=
PEST_KEY=             # 병해충 API 키
OPINET_KEY=           # 오피넷 API 키
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
CORS_ORIGINS=https://your-domain.com
```

---

## 실행

```bash
# 서비스 전체 시작
docker compose up -d

# 프론트엔드 개발 서버
cd frontend && npm install && npm run dev
```

---

## CI/CD

`main` 브랜치 푸시 시 GitHub Actions가 자동 실행됩니다.

1. **CI** — 프론트엔드 빌드·린트, 백엔드 dotnet build, 크롤러 pytest
2. **Deploy** — SSH + rsync로 빌드 결과물을 서버에 전송 후 `docker compose up -d`

필요한 GitHub Secrets: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `DEPLOY_PATH`, `STATIC_PATH`

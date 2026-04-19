# Agri-Market Hub

농업 종사자를 위한 실시간 농업 정보 대시보드. 날씨·시세·뉴스·병해충·경매 실거래 정보를 한 화면에서 제공합니다.

## 주요 기능

### 대시보드
- 패널 드래그 리사이즈 — 열 너비·하단 패널 높이 자유 조절, localStorage에 레이아웃 저장
- 재난 문자 실시간 수신 (SignalR WebSocket)
- 뉴스 티커 — 병해충·작황 최신 5건 자동 스크롤

### 경매분석 탭 (신규)

3개 서브 페이지로 구성. 공통 레이아웃: `전국 농수산물 경매 현황 제목 → 뉴스 티커 → 탭 → 휴장일 안내`

#### 대시보드 (`/analysis`)
- KPI 카드 — 총 거래 품목 수·총 거래량·평균 가격·최고 거래량 품목
- 급등/급락 TOP — 7일 대비 등락률 상위 품목 그리드
- 트리맵/테이블 뷰 전환 — D3 계층형 트리맵(카테고리별 색상, 거래량 면적), 정렬 가능 테이블
- 가격 범위 바 — 최저~평균~최고 시각화
- 30일 추이 차트 — Recharts ComposedChart (가격 꺾은선 + 거래량 막대)
- 휴장일 안내 배너 — 주말·공휴일·데이터 없는 날 자동 표시

#### 품목별 가격 (`/analysis/products`)
- D3 트리맵 — 전체 품목 카테고리별 시각화, ResizeObserver 반응형
- 카테고리 탭 필터 — 전체·채소류·과일류·특용작물·화훼류·수산물·축산물
- 정렬 가능 테이블 — 품목명·평균가·거래량 기준 정렬
- 상세 패널 — 품목 클릭 시 30일 추이 차트 + 품종별·원산지별 CSS 바 차트

#### 시장별 현황 (`/analysis/markets`)
- 좌측 품목 필터 패널 — **전체 / 제철 / ★ 관심 품목** 탭
  - 제철: 월별 품목 매핑 (12개월 × 품목 목록)
  - 관심 품목: ★ 즐겨찾기 토글, localStorage 영속
- Leaflet 지도 — 품목 선택 시 시장별 가격 마커 표시 (가격 수준에 따라 녹색→주황→빨강)
- 시장별 가격 비교 테이블 — 평균가·거래량 정렬
- 30일 추이 차트
- **드래그 리사이즈** — 좌측 패널 너비(150~380px), 지도 높이(150~420px) localStorage 영속

### 날씨 패널
- 기상청 단기예보 API — 현재 기온·습도·바람·강수량
- 5일 예보 + 강수확률 시각화 바
- 94개 시·군 즐겨찾기 — 검색으로 추가·삭제, localStorage 저장

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
- Google OAuth 2.0 로그인 (auth-code flow, popup)
- Google Calendar 자동 연동 (로그인 시 refresh token 저장)

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
| 차트 | Recharts, D3 (d3-hierarchy, d3-selection) |
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
| 수집 대상 | 기상청 단기예보, KAMIS 농산물 가격, 오피넷 유가, 네이버 뉴스, 병해충 API, 공공데이터포털 경매 실거래 |
| 테스트 | pytest + responses |

### 인프라
| 분류 | 기술 |
|------|------|
| DB | PostgreSQL 15 |
| 캐시 | Redis 7 |
| 컨테이너 | Docker Compose |
| 프록시 | Caddy (서버 기존 설치) |
| CI/CD | GitHub Actions — 빌드·lint·배포 (SSH/rsync) |

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
        Auction["공공데이터포털\n경매 실거래\n(katRealTime2)"]
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
    Crawler --> Auction
    Caddy -- "Static Files" --> React
```

### 경매분석 페이지 구조

```mermaid
graph TD
    A["경매분석 탭\n/analysis"] --> B["대시보드\n/analysis"]
    A --> C["품목별 가격\n/analysis/products"]
    A --> D["시장별 현황\n/analysis/markets"]

    B --> B1["KPI 카드\n총 품목·거래량·평균가"]
    B --> B2["급등/급락 TOP\n7일 대비 등락률"]
    B --> B3["트리맵 뷰\nD3 카테고리별"]
    B --> B4["테이블 뷰\n정렬 가능"]
    B --> B5["30일 추이 차트\nRecharts"]

    C --> C1["D3 트리맵\n전체 품목"]
    C --> C2["카테고리 탭 필터"]
    C --> C3["상세 패널\n추이·품종·원산지"]

    D --> D1["품목 필터\n전체/제철/관심"]
    D --> D2["Leaflet 지도\n시장별 가격 마커"]
    D --> D3["시장별 비교 테이블"]
    D --> D4["30일 추이 차트"]
```

### 경매 데이터 수집 흐름

```mermaid
sequenceDiagram
    participant Cron as Cron (07:00)
    participant Crawler as Python Crawler
    participant PD as 공공데이터포털<br/>katRealTime2
    participant DB as PostgreSQL

    Cron->>Crawler: run_auction()
    loop 페이지네이션 (1000건/page)
        Crawler->>PD: GET /trades2?page=N
        PD-->>Crawler: 경매 실거래 목록
        Crawler->>DB: UPSERT auction_raw
    end
    Crawler->>DB: aggregate_daily_auction()<br/>(avg/min/max/volume 집계)

    Note over DB: auction_raw → daily_auction 집계 완료
```

### API 엔드포인트 (분석)

```mermaid
graph LR
    subgraph AnalysisController["GET /api/analysis/*"]
        D["daily?date=\n일별 전품목 집계\n(7일 대비 변동률 포함)"]
        T["trend?itemCode=&days=\n품목 30일 추이"]
        M["markets?itemCode=&date=\n품목별 시장 비교"]
        V["variety?itemCode=&date=\n품종 분류"]
        O["origin?itemCode=&date=\n원산지 분류"]
        ML["market-list\n전국 도매시장 목록"]
        MP["market-products?marketCode=&date=\n시장별 품목 목록"]
    end
```

### 데이터 흐름

```mermaid
sequenceDiagram
    participant C as 브라우저
    participant Caddy
    participant API as ASP.NET Core
    participant DB as PostgreSQL
    participant Redis

    Note over C: 경매분석 대시보드 진입
    C->>Caddy: GET /api/analysis/daily?date=2026-04-18
    Caddy->>API: 프록시
    API->>DB: SELECT daily_auction + 7일전 JOIN
    DB-->>API: 품목별 집계 + 변동률
    API-->>C: JSON (DailyAuctionDto[])

    Note over C: 품목 선택 → 추이 조회
    C->>Caddy: GET /api/analysis/trend?itemCode=111&days=30
    Caddy->>API: 프록시
    API->>DB: SELECT daily_auction WHERE item_code=111
    DB-->>API: 30일 가격 이력
    API-->>C: JSON (TrendDto[])
```

### CI/CD 파이프라인

```mermaid
flowchart LR
    Push["git push\nmain"] --> CI

    subgraph CI["GitHub Actions"]
        direction TB
        FE["Frontend\nnpm ci → lint → build"]
        BE["Backend\ndotnet publish"]
        CW["Crawler\npip install"]
    end

    CI --> Deploy

    subgraph Deploy["Deploy"]
        direction TB
        SSH["SSH 키 설정"]
        Upload["rsync\nbackend/publish\ncrawler\nfrontend/dist"]
        Env[".env 생성"]
        Restart["docker compose up -d\n+ DB 마이그레이션"]
        SSH --> Upload --> Env --> Restart
    end

    Deploy --> Prod["원격 서버\n(Docker Compose)"]
```

---

## DB 스키마 (경매 관련)

```mermaid
erDiagram
    markets {
        varchar code PK
        varchar name
        varchar region
    }
    auction_raw {
        serial id PK
        varchar market_code
        varchar market_name
        varchar item_code
        varchar item_name
        varchar category
        varchar variety
        varchar origin
        varchar grade
        numeric price
        numeric volume
        varchar unit
        date date
    }
    daily_auction {
        serial id PK
        varchar item_code
        varchar item_name
        varchar category
        date date
        numeric avg_price
        numeric min_price
        numeric max_price
        numeric volume
    }

    markets ||--o{ auction_raw : "market_code"
    auction_raw }o--|| daily_auction : "item_code + date 집계"
```

---

## 환경 변수

`.env.example`을 참고하여 `.env` 파일을 작성합니다.

| 변수 | 설명 |
|------|------|
| `DB_PASS` | PostgreSQL 비밀번호 |
| `JWT_SECRET` | JWT 서명 키 (32자 이상) |
| `WEATHER_KEY` | 기상청 API 키 (data.go.kr) |
| `KAMIS_KEY` | KAMIS 농산물가격 API 키 |
| `NAVER_CLIENT_ID` | 네이버 검색 API Client ID |
| `NAVER_CLIENT_SECRET` | 네이버 검색 API Secret |
| `VAPID_PUBLIC_KEY` | Web Push 공개 키 |
| `VAPID_PRIVATE_KEY` | Web Push 비밀 키 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `PEST_KEY` | 농촌진흥청 병해충 API 키 |
| `OPINET_KEY` | 오피넷 유가 API 키 |
| `PUBLIC_DATA_API_KEY` | 공공데이터포털 경매 실거래 API 키 |
| `CORS_ORIGINS` | 허용 도메인 (기본값: https://agri.dooyg.store) |

프론트엔드 빌드에는 `frontend/.env`도 필요합니다.

```env
VITE_GOOGLE_CLIENT_ID=...
```

---

## 실행

```bash
# 서비스 전체 시작
docker compose up -d

# 프론트엔드 개발 서버
cd frontend && npm install && npm run dev

# 경매 크롤러 수동 실행 (서버에서)
docker compose exec crawler python -c "from crawlers.auction import run_auction; run_auction()"
```

---

## CI/CD

`main` 브랜치 푸시 시 GitHub Actions가 자동 실행됩니다.

1. **빌드** — 프론트엔드 `npm run lint && npm run build`, 백엔드 `dotnet publish`, 크롤러 `pip install`
2. **배포** — SSH + rsync로 결과물 전송 → 서버에 `.env` 자동 생성 → `docker compose up -d` → DB 마이그레이션

### 필요한 GitHub Secrets

| Secret | 설명 |
|--------|------|
| `SSH_HOST` | 서버 IP 또는 도메인 |
| `SSH_USER` | SSH 접속 사용자명 |
| `SSH_PRIVATE_KEY` | SSH 비밀 키 |
| `DEPLOY_PATH` | 서버의 배포 디렉토리 경로 |
| `STATIC_PATH` | Caddy가 서빙하는 프론트엔드 정적 파일 경로 |
| `GOOGLE_CLIENT_ID` | 프론트엔드 빌드 시 주입 |
| `ENV_FILE` | `.env` 파일 내용 전체 (멀티라인) |

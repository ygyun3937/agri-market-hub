# Regional Market Prices Implementation Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 품목 선택 시 전국 주요 8개 도매시장별 가격을 수평 막대차트로 디테일 패널에 표시한다.

**Architecture:** 크롤러가 고정된 서울(1101) 대신 8개 시장 코드를 루프로 수집. DB에 market_code 저장. 백엔드 신규 엔드포인트 2개. 프론트 디테일 패널에 시장별 막대차트 열 추가.

**Tech Stack:** Python (크롤러), PostgreSQL, C# ASP.NET Core, React + Recharts

---

## 대상 시장 (8개)

| 코드 | 시장명 |
|------|--------|
| 1101 | 서울 가락 |
| 1102 | 서울 강서 |
| 2100 | 부산 엄궁 |
| 2200 | 대구 북부 |
| 2300 | 광주 각화 |
| 2400 | 대전 오정 |
| 3212 | 구리 |
| 3211 | 인천 삼산 |

---

## DB 변경

### auction_prices (농산물)
- `market_code` 컬럼 이미 존재 — 변경 없음
- UNIQUE 제약: `(item_code, market_code, grade, date)` — 확인 후 필요 시 조정

### livestock_prices (축산물)
```sql
ALTER TABLE livestock_prices
  ADD COLUMN IF NOT EXISTS market_code VARCHAR(10) NOT NULL DEFAULT '1101';

-- 기존 UNIQUE 제약 교체
ALTER TABLE livestock_prices DROP CONSTRAINT IF EXISTS livestock_prices_item_code_origin_date_key;
ALTER TABLE livestock_prices
  ADD CONSTRAINT livestock_prices_item_code_origin_market_date_key
  UNIQUE (item_code, origin, market_code, date);
```

---

## 크롤러 변경

### crawler/crawlers/kamis.py
- `MARKET_CODES = ["1101", "1102", "2100", "2200", "2300", "2400", "3212", "3211"]`
- `p_countrycode` 고정값 제거, 외부에서 주입
- 외부 루프: 각 market_code에 대해 fetch → upsert 호출 시 market_code 전달
- 실패한 시장은 경고 로그 후 skip (나머지 시장 계속 수집)

### crawler/crawlers/livestock.py
- 동일하게 `MARKET_CODES` 루프 추가
- `upsert_livestock_price()` 호출 시 `market_code` 인자 추가

### crawler/db.py
- `upsert_livestock_price(item_code, item_name, category, price, unit, date_str, origin, market_code)` 시그니처 변경
- INSERT ON CONFLICT 조건에 `market_code` 포함

---

## 백엔드 변경

### 시장명 딕셔너리 (공통)
```csharp
private static readonly Dictionary<string, string> MarketNames = new()
{
    ["1101"] = "서울 가락",
    ["1102"] = "서울 강서",
    ["2100"] = "부산 엄궁",
    ["2200"] = "대구 북부",
    ["2300"] = "광주 각화",
    ["2400"] = "대전 오정",
    ["3212"] = "구리",
    ["3211"] = "인천 삼산",
};
```

### AnalysisController — 신규 엔드포인트
```
GET /api/analysis/market-prices?itemCode=X&date=YYYY-MM-DD
```
- `auction_prices`에서 해당 날짜(없으면 최근 7일 이내 최신) 시장별 avg_price 조회
- 응답: `List<MarketPriceDto>` — `{ MarketCode, MarketName, Price, Unit, Grade }`

### LivestockController — 신규 엔드포인트
```
GET /api/livestock/market-prices?itemCode=X&date=YYYY-MM-DD&origin=국내산
```
- `livestock_prices`에서 시장별 price 조회
- 응답: `List<MarketPriceDto>` — `{ MarketCode, MarketName, Price, Unit }`

### DTO
```csharp
public record MarketPriceDto(string MarketCode, string MarketName, double Price, string Unit);
```

---

## 프론트엔드 변경

### MarketPriceChart 컴포넌트
```jsx
// 수평 막대차트, 가격 내림차순 정렬
// x축: 가격, y축: 시장명
// 데이터 없으면 "시장별 데이터 없음" 표시
function MarketPriceChart({ data, unit }) { ... }
```

### ProductsAnalysisPage.jsx — 농산물 DetailPanel
- 기존 3열(추이 / 품종별 / 산지별) → 4열(추이 / 품종별 / 산지별 / **시장별**)
- `selectedItem` 변경 시 `/api/analysis/market-prices?itemCode=X&date=Y` 호출
- `Promise.allSettled`로 기존 3개 fetch와 병렬

### ProductsAnalysisPage.jsx + AnalysisPage.jsx — 축산 LivestockDetailPanel
- 두 파일 모두 동일하게 수정
- 기존 2열(추이 / 원산지별) → 3열(추이 / 원산지별 / **시장별**)
- `selectedItem` + `selectedOrigin` 변경 시 `/api/livestock/market-prices?itemCode=X&date=Y&origin=O` 호출

### Mock 데이터 (API 실패 fallback)
```js
const MOCK_MARKET_PRICES = [
  { marketCode: '1101', marketName: '서울 가락', price: 0, unit: '' },
  // ... 8개
]
```
실제 데이터가 오면 mock 무시, API 실패 시 빈 배열로 "데이터 없음" 표시.

---

## 범위 외 (이번 구현에서 제외)
- 지역 필터로 메인 페이지 가격 변경
- 시장별 트렌드 (30일 추이)
- 모바일 레이아웃 최적화 (4열 → 스크롤)

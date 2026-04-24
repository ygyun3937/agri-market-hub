# Regional Market Prices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 품목 선택 시 전국 주요 8개 도매시장별 가격을 수평 막대차트로 디테일 패널에 표시한다.

**Architecture:** 크롤러가 KAMIS API를 8개 시장 코드로 루프하여 수집 → DB market_code 컬럼 → 백엔드 신규 endpoint 2개 → 프론트 MarketPriceChart 컴포넌트.

**Tech Stack:** Python (requests/psycopg2), PostgreSQL, C# ASP.NET Core (EF Core SqlQueryRaw), React + Recharts (inline styles, B2 Slate Dark theme)

---

## 대상 시장 (8개)

| KAMIS p_countrycode | 시장명 |
|---------------------|--------|
| 1101 | 서울 가락 |
| 1102 | 서울 강서 |
| 2100 | 부산 엄궁 |
| 2200 | 대구 북부 |
| 2300 | 광주 각화 |
| 2400 | 대전 오정 |
| 3212 | 구리 |
| 3211 | 인천 삼산 |

---

## File Map

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `.github/workflows/deploy.yml` | Modify | livestock_prices market_code 마이그레이션 SQL 추가 |
| `crawler/db.py` | Modify | `upsert_livestock_price` market_code 파라미터 추가 |
| `crawler/crawlers/kamis.py` | Modify | MARKETS dict, `run_prices` 8개 시장 루프 |
| `crawler/crawlers/livestock.py` | Modify | MARKETS dict, `_fetch_category` market_code 파라미터, `run_livestock` 루프 |
| `backend/AgriHub.Api/Controllers/KamisMarkets.cs` | Create | KamisMarkets.Names dict, MarketPriceDto record |
| `backend/AgriHub.Api/Controllers/AnalysisController.cs` | Modify | `/api/analysis/market-prices` endpoint 추가 |
| `backend/AgriHub.Api/Controllers/LivestockController.cs` | Modify | `/api/livestock/market-prices` endpoint 추가 |
| `frontend/src/pages/ProductsAnalysisPage.jsx` | Modify | MarketPriceChart 컴포넌트, DetailPanel/LivestockDetailPanel 시장별 열 추가, 상태+fetch 추가 |
| `frontend/src/pages/AnalysisPage.jsx` | Modify | LivestockSection에 시장별 가격 상태+fetch+UI 추가 |

---

## Task 1: DB 마이그레이션 — livestock_prices market_code

**Files:**
- Modify: `.github/workflows/deploy.yml:107`

- [ ] **Step 1: deploy.yml에 마이그레이션 SQL 3줄 추가**

현재 line 107 (`...ADD CONSTRAINT livestock_prices_item_code_origin_date_key...`) 바로 뒤에 추가:

```yaml
            docker compose exec -T db psql -U agrihub -d agrihub -c \"ALTER TABLE livestock_prices ADD COLUMN IF NOT EXISTS market_code VARCHAR(10) NOT NULL DEFAULT '1101'\"
            docker compose exec -T db psql -U agrihub -d agrihub -c \"DO \\\$\\\$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'livestock_prices_item_code_origin_date_key') THEN ALTER TABLE livestock_prices DROP CONSTRAINT livestock_prices_item_code_origin_date_key; END IF; END \\\$\\\$\"
            docker compose exec -T db psql -U agrihub -d agrihub -c \"ALTER TABLE livestock_prices ADD CONSTRAINT livestock_prices_item_code_origin_market_date_key UNIQUE (item_code, origin, market_code, date)\" || true
```

- [ ] **Step 2: 커밋**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add market_code column migration for livestock_prices"
```

---

## Task 2: crawler/db.py — upsert_livestock_price market_code 파라미터

**Files:**
- Modify: `crawler/db.py:138-146`

- [ ] **Step 1: 함수 시그니처와 SQL 수정**

```python
def upsert_livestock_price(item_code, item_name, category, price, unit, date_str, origin="국내산", market_code="1101"):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO livestock_prices (item_code, item_name, category, price, unit, date, origin, market_code)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (item_code, origin, market_code, date)
               DO UPDATE SET price=EXCLUDED.price, item_name=EXCLUDED.item_name""",
            (item_code, item_name, category, price, unit, date_str, origin, market_code),
        )
```

- [ ] **Step 2: 커밋**

```bash
git add crawler/db.py
git commit -m "feat: add market_code param to upsert_livestock_price"
```

---

## Task 3: kamis.py — 8개 시장 루프

**Files:**
- Modify: `crawler/crawlers/kamis.py`

- [ ] **Step 1: 전체 파일을 아래로 교체**

```python
# crawler/crawlers/kamis.py
import os
import ssl
import logging
import requests
from requests.adapters import HTTPAdapter
import urllib3
from datetime import date
import db

urllib3.disable_warnings()

log = logging.getLogger(__name__)

API_KEY = os.getenv("KAMIS_KEY", "")
BASE_URL = "https://www.kamis.or.kr/service/price/xml.do"

MARKETS = {
    "1101": "서울 가락",
    "1102": "서울 강서",
    "2100": "부산 엄궁",
    "2200": "대구 북부",
    "2300": "광주 각화",
    "2400": "대전 오정",
    "3212": "구리",
    "3211": "인천 삼산",
}

# Map our internal code → (KAMIS productno, display name, unit)
ITEM_MAP = {
    "111": ("34",  "배추/월동",   "10kg"),
    "112": ("70",  "무/월동",    "20kg"),
    "211": ("117", "양파",       "15kg"),
    "214": ("74",  "당근/무세척", "20kg"),
    "215": ("24",  "감자/수미",   "20kg"),
    "311": ("198", "사과/후지",   "10kg"),
    "312": ("204", "배/신고",    "15kg"),
    "411": ("1",   "쌀",        "20kg"),
}


class _LegacySSL(HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        ctx = ssl.create_default_context()
        ctx.set_ciphers("DEFAULT:@SECLEVEL=1")
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        kwargs["ssl_context"] = ctx
        return super().init_poolmanager(*args, **kwargs)


_session = requests.Session()
_session.mount("https://", _LegacySSL())


def run_prices():
    today = date.today().strftime("%Y-%m-%d")

    for market_code, market_name in MARKETS.items():
        params = {
            "action": "dailySalesList",
            "p_cert_key": API_KEY,
            "p_cert_id": "1",
            "p_returntype": "json",
            "p_itemcategorycode": "100",
            "p_itemcode": "",
            "p_kindcode": "00",
            "p_productrankcode": "",
            "p_countrycode": market_code,
            "p_startday": today,
            "p_endday": today,
            "p_convert_kg_yn": "N",
        }
        try:
            resp = _session.get(BASE_URL, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            all_items = data.get("price") or []
        except Exception as e:
            log.warning(f"Agri market={market_name}({market_code}) fetch failed: {e}")
            continue

        if not all_items:
            log.info(f"Agri market={market_name}: no data for {today}")
            continue

        by_productno = {str(it.get("productno", "")): it for it in all_items}

        for item_code, (productno, display_name, unit) in ITEM_MAP.items():
            row = by_productno.get(productno)
            if not row:
                continue
            try:
                price_str = row.get("dpr1", "0").replace(",", "")
                price = float(price_str) if price_str else 0
                if price <= 0:
                    continue
                db.upsert_auction_price(
                    item_code=item_code,
                    market_code=market_code,
                    price=price,
                    volume=None,
                    grade=display_name,
                    date=today,
                )
                log.info(f"Agri: {display_name} [{market_name}] = {price:,.0f}원/{unit}")
            except (ValueError, KeyError):
                continue
```

- [ ] **Step 2: 커밋**

```bash
git add crawler/crawlers/kamis.py
git commit -m "feat: collect agri prices from 8 KAMIS wholesale markets"
```

---

## Task 4: livestock.py — 8개 시장 루프

**Files:**
- Modify: `crawler/crawlers/livestock.py`

- [ ] **Step 1: 전체 파일을 아래로 교체**

```python
# crawler/crawlers/livestock.py
import os
import ssl
import requests
from requests.adapters import HTTPAdapter
import urllib3
from datetime import date
import logging
import db

urllib3.disable_warnings()
log = logging.getLogger(__name__)

API_KEY = os.getenv("KAMIS_KEY", "")
BASE_URL = "https://www.kamis.or.kr/service/price/xml.do"

MARKETS = {
    "1101": "서울 가락",
    "1102": "서울 강서",
    "2100": "부산 엄궁",
    "2200": "대구 북부",
    "2300": "광주 각화",
    "2400": "대전 오정",
    "3212": "구리",
    "3211": "인천 삼산",
}

LIVESTOCK_TARGETS = [
    # 소 - 축종별 경매가
    ("한우(거세)",  "C001", "한우 거세",  "두", "소"),
    ("한우(암소)",  "C002", "한우 암소",  "두", "소"),
    ("육우(거세)",  "C003", "육우 거세",  "두", "소"),
    ("젖소",        "C004", "젖소",       "두", "소"),
    ("한우(송아지)", "C005", "한우 송아지", "두", "소"),
    # 돼지 - 부위별 (원산지별 수집)
    ("돼지(삼겹살)", "L011", "돼지 삼겹살", "100g", "돼지"),
    ("돼지(목심)",   "L012", "돼지 목심",   "100g", "돼지"),
    ("돼지(앞다리)", "L013", "돼지 앞다리", "100g", "돼지"),
    # 닭·계란
    ("닭(육계)",  "L021", "닭(육계)",  "1kg",  "닭·계란"),
    ("계란(특란)", "L031", "계란 특란", "30개", "닭·계란"),
    ("계란(대란)", "L032", "계란 대란", "30개", "닭·계란"),
]


class _LegacySSL(HTTPAdapter):
    def init_poolmanager(self, *a, **kw):
        ctx = ssl.create_default_context()
        ctx.set_ciphers("DEFAULT:@SECLEVEL=1")
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        kw["ssl_context"] = ctx
        return super().init_poolmanager(*a, **kw)


_session = requests.Session()
_session.mount("https://", _LegacySSL())


def _fetch_category(cat_code, today, market_code="1101"):
    params = {
        "action": "dailySalesList",
        "p_cert_key": API_KEY,
        "p_cert_id": "1",
        "p_returntype": "json",
        "p_itemcategorycode": cat_code,
        "p_itemcode": "",
        "p_kindcode": "00",
        "p_productrankcode": "",
        "p_countrycode": market_code,
        "p_startday": today,
        "p_endday": today,
        "p_convert_kg_yn": "N",
    }
    resp = _session.get(BASE_URL, params=params, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    return data.get("price") or []


def run_livestock():
    today = date.today().strftime("%Y-%m-%d")

    for market_code, market_name in MARKETS.items():
        all_items = []
        for cat in ["300", "500", "600"]:
            try:
                items = _fetch_category(cat, today, market_code)
                if items:
                    log.info(f"Livestock market={market_name} cat={cat} returned {len(items)} items")
                    all_items = items
                    break
            except Exception as e:
                log.warning(f"Livestock market={market_name} cat={cat} failed: {e}")

        if not all_items:
            log.warning(f"Livestock market={market_name}: no data for {today}")
            continue

        matched = 0
        for search, code, name, unit, cat in LIVESTOCK_TARGETS:
            seen_origins = set()
            for it in all_items:
                item_name = it.get("item_name", "")
                if search not in item_name:
                    continue
                raw_kind = (it.get("kind_name", "") or "").strip()
                origin = "수입산" if "수입" in raw_kind else "국내산"
                if origin in seen_origins:
                    continue
                seen_origins.add(origin)
                try:
                    price_str = str(it.get("dpr1", "0")).replace(",", "").strip()
                    price = float(price_str) if price_str else 0
                    if price <= 0:
                        continue
                    db.upsert_livestock_price(
                        item_code=code,
                        item_name=name,
                        category=cat,
                        price=price,
                        unit=unit,
                        date_str=today,
                        origin=origin,
                        market_code=market_code,
                    )
                    matched += 1
                    log.info(f"Livestock: {name} ({origin}) [{market_name}] = {price:,.0f}원/{unit}")
                except (ValueError, KeyError) as e:
                    log.warning(f"Livestock parse error {name} ({origin}) [{market_name}]: {e}")

        log.info(f"Livestock market={market_name}: {matched} prices saved for {today}")
```

- [ ] **Step 2: 커밋**

```bash
git add crawler/crawlers/livestock.py
git commit -m "feat: collect livestock prices from 8 KAMIS wholesale markets"
```

---

## Task 5: Backend — KamisMarkets 공유 파일 + AnalysisController market-prices

**Files:**
- Create: `backend/AgriHub.Api/Controllers/KamisMarkets.cs`
- Modify: `backend/AgriHub.Api/Controllers/AnalysisController.cs`

- [ ] **Step 1: KamisMarkets.cs 생성**

```csharp
// backend/AgriHub.Api/Controllers/KamisMarkets.cs
namespace AgriHub.Api.Controllers;

public record MarketPriceDto(string MarketCode, string MarketName, decimal Price, string? Unit);

internal static class KamisMarkets
{
    public static readonly Dictionary<string, string> Names = new()
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
}
```

- [ ] **Step 2: AnalysisController.cs 끝(line 249 `}` 바로 앞)에 endpoint 추가**

현재 `AnalysisController.cs` 마지막 `}` (line 249) 직전에 아래 코드를 삽입:

```csharp
    // GET /api/analysis/market-prices?itemCode=XXX&date=YYYY-MM-DD
    [HttpGet("market-prices")]
    public async Task<ActionResult<List<MarketPriceDto>>> GetMarketPrices(
        [FromQuery] string itemCode,
        [FromQuery] DateOnly? date)
    {
        if (string.IsNullOrWhiteSpace(itemCode))
            return BadRequest("itemCode is required.");

        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
        var from = targetDate.AddDays(-7);

        var rows = await db.Database
            .SqlQueryRaw<_AuctionMarketRow>(
                """
                SELECT DISTINCT ON (market_code)
                       market_code AS "MarketCode",
                       price       AS "Price"
                FROM   auction_prices
                WHERE  item_code = {0}
                  AND  date BETWEEN {1} AND {2}
                  AND  price > 0
                ORDER  BY market_code, date DESC
                """,
                itemCode, from, targetDate)
            .ToListAsync();

        var result = rows
            .Select(r => new MarketPriceDto(
                r.MarketCode,
                KamisMarkets.Names.GetValueOrDefault(r.MarketCode, r.MarketCode),
                r.Price,
                null))
            .OrderByDescending(r => r.Price)
            .ToList();

        return Ok(result);
    }

    private record _AuctionMarketRow(string MarketCode, decimal Price);
```

- [ ] **Step 3: 빌드 확인**

```bash
cd backend/AgriHub.Api && dotnet build 2>&1 | tail -5
```

Expected: `Build succeeded.`

- [ ] **Step 4: 커밋**

```bash
git add backend/AgriHub.Api/Controllers/KamisMarkets.cs backend/AgriHub.Api/Controllers/AnalysisController.cs
git commit -m "feat: add /api/analysis/market-prices endpoint"
```

---

## Task 6: Backend — LivestockController market-prices

**Files:**
- Modify: `backend/AgriHub.Api/Controllers/LivestockController.cs`

- [ ] **Step 1: LivestockController.cs 끝(line 127 `}` 바로 앞)에 endpoint 추가**

현재 `LivestockController.cs` 마지막 `}` (line 127) 직전에 삽입:

```csharp
    // GET /api/livestock/market-prices?itemCode=XXX&date=YYYY-MM-DD&origin=국내산
    [HttpGet("market-prices")]
    public async Task<ActionResult<List<MarketPriceDto>>> GetMarketPrices(
        [FromQuery] string itemCode,
        [FromQuery] DateOnly? date,
        [FromQuery] string origin = "국내산")
    {
        if (string.IsNullOrWhiteSpace(itemCode))
            return BadRequest("itemCode is required.");

        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.AddHours(9).AddDays(-1));
        var from = targetDate.AddDays(-7);

        var rows = await db.Database
            .SqlQueryRaw<_LivestockMarketRow>(
                """
                SELECT DISTINCT ON (market_code)
                       market_code AS "MarketCode",
                       price       AS "Price",
                       unit        AS "Unit"
                FROM   livestock_prices
                WHERE  item_code = {0}
                  AND  origin    = {3}
                  AND  date BETWEEN {1} AND {2}
                  AND  price > 0
                ORDER  BY market_code, date DESC
                """,
                itemCode, from, targetDate, origin)
            .ToListAsync();

        var result = rows
            .Select(r => new MarketPriceDto(
                r.MarketCode,
                KamisMarkets.Names.GetValueOrDefault(r.MarketCode, r.MarketCode),
                r.Price,
                r.Unit))
            .OrderByDescending(r => r.Price)
            .ToList();

        return Ok(result);
    }

    private record _LivestockMarketRow(string MarketCode, decimal Price, string? Unit);
```

- [ ] **Step 2: 빌드 확인**

```bash
cd backend/AgriHub.Api && dotnet build 2>&1 | tail -5
```

Expected: `Build succeeded.`

- [ ] **Step 3: 커밋**

```bash
git add backend/AgriHub.Api/Controllers/LivestockController.cs
git commit -m "feat: add /api/livestock/market-prices endpoint"
```

---

## Task 7: Frontend ProductsAnalysisPage — MarketPriceChart + 농산물 DetailPanel + 축산 LivestockDetailPanel

**Files:**
- Modify: `frontend/src/pages/ProductsAnalysisPage.jsx`

### 7-A: MarketPriceChart 컴포넌트 추가

- [ ] **Step 1: `OriginPriceChart` 함수 끝(line 625 `}`) 바로 뒤에 삽입**

```jsx
// ─── Market price bar chart ───────────────────────────────────────────────────
function MarketPriceChart({ data, unit }) {
  if (!data || data.length === 0)
    return <div style={{ fontSize: 12, color: DIM, padding: '12px 0' }}>시장별 데이터 없음</div>
  const max = Math.max(...data.map(d => Number(d.price) || 0))
  return (
    <div>
      {[...data].sort((a, b) => Number(b.price) - Number(a.price)).map(d => (
        <div key={d.marketCode} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: TEXT, fontWeight: 600 }}>{d.marketName}</span>
            <span style={{ color: ACCENT, fontWeight: 700 }}>
              {Number(d.price).toLocaleString()}원
              {(d.unit || unit) && <span style={{ color: DIM, fontWeight: 400, fontSize: 11 }}>/{d.unit || unit}</span>}
            </span>
          </div>
          <div style={{ height: 8, background: '#2d4255', borderRadius: 4 }}>
            <div style={{
              height: 8, borderRadius: 4, transition: 'width 0.3s ease',
              background: ACCENT,
              width: max > 0 ? `${(Number(d.price) / max * 100).toFixed(1)}%` : '0%',
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 7-B: 농산물 DetailPanel에 시장별 열 추가

- [ ] **Step 2: `DetailPanel` 시그니처 수정 (line 487)**

```jsx
function DetailPanel({ item, trendData, varietyData, originData, marketData, detailLoading, onClose }) {
```

- [ ] **Step 3: DetailPanel 내 3열 grid 끝에 4번째 열 추가**

산지별 분포 `</div>` (line 591) 바로 뒤에 삽입:

```jsx
          {/* 시장별 가격 */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: DIM, marginBottom: 8 }}>시장별 가격</div>
            <MarketPriceChart data={marketData} unit={item.unit} />
          </div>
```

### 7-C: LivestockDetailPanel에 시장별 열 추가

- [ ] **Step 4: `LivestockDetailPanel` 시그니처 수정 (line 628)**

```jsx
function LivestockDetailPanel({ item, trendData, originData, marketData, detailLoading, onClose }) {
```

- [ ] **Step 5: LivestockDetailPanel 내 원산지별 가격 `</div>` (line 705) 바로 뒤에 삽입**

```jsx
          {/* 시장별 가격 */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: DIM, marginBottom: 8 }}>시장별 가격</div>
            <MarketPriceChart data={marketData} unit={item.unit} />
          </div>
```

### 7-D: LivestockSection 상태 + fetch 추가

- [ ] **Step 6: `LivestockSection` 상태 선언부 (line 713~720)에 marketData 추가**

```jsx
  const [marketData, setMarketData] = useState([])
```

기존 `const [detailLoading, setDetailLoading] = useState(false)` 뒤에 추가.

- [ ] **Step 7: LivestockSection selectedItem useEffect (line 734~757) 수정**

`Promise.allSettled([` 배열에 3번째 fetch 추가:

```jsx
  useEffect(() => {
    if (!selectedItem) {
      setTrendData([])
      setOriginData([])
      setMarketData([])
      return
    }
    const { itemCode, origin = '국내산' } = selectedItem
    setDetailLoading(true)
    Promise.allSettled([
      client.get(`/livestock/trend?itemCode=${itemCode}&days=30&origin=${encodeURIComponent(origin)}`),
      client.get(`/livestock/origin?itemCode=${itemCode}`),
      client.get(`/livestock/market-prices?itemCode=${itemCode}&origin=${encodeURIComponent(origin)}`),
    ]).then(([trend, orig, market]) => {
      const tRows = trend.status === 'fulfilled'
        ? (trend.value.data || []).map(d => ({ ...d, avgPrice: d.price, volume: 0 }))
        : []
      setTrendData(tRows.length ? tRows : MOCK_LIVESTOCK_TREND(itemCode, origin))
      setOriginData(
        orig.status === 'fulfilled' && orig.value.data?.length
          ? orig.value.data
          : MOCK_LIVESTOCK_ORIGIN(itemCode)
      )
      setMarketData(
        market.status === 'fulfilled' && market.value.data?.length
          ? market.value.data : []
      )
    }).finally(() => setDetailLoading(false))
  }, [selectedItem])
```

- [ ] **Step 8: `LivestockDetailPanel` 호출부 (line 788)에 marketData prop 추가**

```jsx
            <LivestockDetailPanel
              item={selectedItem}
              trendData={trendData}
              originData={originData}
              marketData={marketData}
              detailLoading={detailLoading}
              onClose={() => setSelectedItem(null)}
            />
```

### 7-E: 농산물 상태 + fetch 추가

- [ ] **Step 9: `ProductsAnalysisPage` 상태 선언부 (line 882)에 marketData 추가**

```jsx
  const [marketData, setMarketData]     = useState([])
```

기존 `const [detailLoading, setDetailLoading] = useState(false)` 뒤에 추가.

- [ ] **Step 10: selectedItem useEffect reset (line 900~903)에 setMarketData([]) 추가**

```jsx
      setTrendData([])
      setVarietyData([])
      setOriginData([])
      setMarketData([])
```

- [ ] **Step 11: Promise.allSettled (line 906~924)에 4번째 fetch + setMarketData 추가**

```jsx
    Promise.allSettled([
      client.get(`/analysis/trend?itemCode=${selectedItem.itemCode}&days=30`),
      client.get(`/analysis/variety?itemCode=${selectedItem.itemCode}&date=${selectedDate}`),
      client.get(`/analysis/origin?itemCode=${selectedItem.itemCode}&date=${selectedDate}`),
      client.get(`/analysis/market-prices?itemCode=${selectedItem.itemCode}&date=${selectedDate}`),
    ])
      .then(([trend, variety, origin, market]) => {
        setTrendData(
          trend.status === 'fulfilled' && trend.value.data?.length
            ? trend.value.data : MOCK_TREND(selectedItem.itemCode)
        )
        setVarietyData(
          variety.status === 'fulfilled' && variety.value.data?.length
            ? variety.value.data : MOCK_VARIETY(selectedItem.itemCode)
        )
        setOriginData(
          origin.status === 'fulfilled' && origin.value.data?.length
            ? origin.value.data : MOCK_ORIGIN(selectedItem.itemCode)
        )
        setMarketData(
          market.status === 'fulfilled' && market.value.data?.length
            ? market.value.data : []
        )
      })
      .finally(() => setDetailLoading(false))
```

- [ ] **Step 12: selectItem (line 928~930)에 unit 포함**

```jsx
  const selectItem = useCallback((item) => {
    setSelectedItem({ itemCode: item.itemCode, itemName: item.itemName, unit: item.unit })
  }, [])
```

- [ ] **Step 13: `DetailPanel` 호출부 (line 989~996)에 marketData prop 추가**

```jsx
              <DetailPanel
                item={selectedItem}
                trendData={trendData}
                varietyData={varietyData}
                originData={originData}
                marketData={marketData}
                detailLoading={detailLoading}
                onClose={() => setSelectedItem(null)}
              />
```

- [ ] **Step 14: 빌드 확인**

```bash
cd frontend && npm run build 2>&1 | tail -10
```

Expected: `✓ built in ...`

- [ ] **Step 15: 커밋**

```bash
git add frontend/src/pages/ProductsAnalysisPage.jsx
git commit -m "feat: add market price chart to detail panels in ProductsAnalysisPage"
```

---

## Task 8: Frontend AnalysisPage — LivestockSection 시장별 가격

**Files:**
- Modify: `frontend/src/pages/AnalysisPage.jsx`

- [ ] **Step 1: `LivestockSection` 상태 선언부 (line 846~851)에 marketData 추가**

```jsx
  const [marketData, setMarketData] = useState([])
```

`const [trendLoading, setTrendLoading] = useState(false)` 뒤에 추가.

- [ ] **Step 2: selectedItem useEffect reset (line 866~869)에 setMarketData([]) 추가**

```jsx
      setTrendData([])
      setOriginData([])
      setMarketData([])
```

- [ ] **Step 3: Promise.allSettled (line 874~887)에 3번째 fetch + setMarketData 추가**

```jsx
    Promise.allSettled([
      client.get(`/livestock/trend?itemCode=${itemCode}&days=30&origin=${encodeURIComponent(origin)}`),
      client.get(`/livestock/origin?itemCode=${itemCode}&date=${selectedDate}`),
      client.get(`/livestock/market-prices?itemCode=${itemCode}&origin=${encodeURIComponent(origin)}`),
    ]).then(([trend, orig, market]) => {
      const tRows = trend.status === 'fulfilled'
        ? (trend.value.data || []).map(d => ({ ...d, avgPrice: d.price, volume: 0 }))
        : []
      setTrendData(tRows.length ? tRows : MOCK_LIVESTOCK_TREND(itemCode, origin))
      setOriginData(
        orig.status === 'fulfilled' && orig.value.data?.length
          ? orig.value.data
          : MOCK_LIVESTOCK_ORIGIN(itemCode)
      )
      setMarketData(
        market.status === 'fulfilled' && market.value.data?.length
          ? market.value.data : []
      )
    }).finally(() => setTrendLoading(false))
```

- [ ] **Step 4: originData 블록(line 931~956) 끝의 `</div>` 바로 뒤에 시장별 가격 UI 추가**

`originData.length > 1` 블록 닫는 `)}` 바로 뒤에 삽입:

```jsx
              {marketData.length > 0 && (
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '12px 16px', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: DIM, marginBottom: 12 }}>시장별 가격 비교</div>
                  {[...marketData].sort((a, b) => Number(b.price) - Number(a.price)).map(d => {
                    const max = Math.max(...marketData.map(x => Number(x.price) || 0))
                    return (
                      <div key={d.marketCode} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: TEXT, fontWeight: 600 }}>{d.marketName}</span>
                          <span style={{ color: ACCENT, fontWeight: 700 }}>
                            {Number(d.price).toLocaleString()}원
                            {d.unit && <span style={{ color: DIM, fontWeight: 400, fontSize: 11 }}>/{d.unit}</span>}
                          </span>
                        </div>
                        <div style={{ height: 8, background: '#2d4255', borderRadius: 4 }}>
                          <div style={{
                            height: 8, borderRadius: 4, transition: 'width 0.3s ease',
                            background: ACCENT,
                            width: max > 0 ? `${(Number(d.price) / max * 100).toFixed(1)}%` : '0%',
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
```

- [ ] **Step 5: 빌드 확인**

```bash
cd frontend && npm run build 2>&1 | tail -10
```

Expected: `✓ built in ...`

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/pages/AnalysisPage.jsx
git commit -m "feat: add market price comparison to AnalysisPage livestock section"
```

---

## Task 9: 배포

- [ ] **Step 1: git push**

```bash
git push
```

Expected: GitHub Actions workflow 트리거 → 서버에서 DB 마이그레이션 + 배포 실행.

- [ ] **Step 2: 배포 확인**

GitHub Actions 탭에서 workflow 성공 확인.

- [ ] **Step 3: 동작 확인**

1. 사이트 접속 → 품목별 가격 탭
2. 농산물 품목 클릭 → 디테일 패널에 "시장별 가격" 열 표시 확인 (크롤러가 실제 데이터 수집 전이면 "시장별 데이터 없음" 표시 — 정상)
3. 축산물 품목 클릭 → "시장별 가격" 열 표시 확인
4. 시장현황 탭 → 축산물 선택 → "시장별 가격 비교" 블록 확인

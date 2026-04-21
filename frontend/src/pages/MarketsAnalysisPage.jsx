// src/pages/MarketsAnalysisPage.jsx
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Header from '../components/Header/Header'
import NewsTicker from '../components/NewsTicker/NewsTicker'
import AnalysisNav from '../components/Analysis/AnalysisNav'
import client from '../api/client'
import { MOCK_DAILY, MOCK_MARKETS, MOCK_TREND } from '../data/analysisMock'


delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG      = '#1c2a36'
const SURFACE = '#253748'
const BORDER  = '#354d65'
const TEXT    = '#ddeaf5'
const DIM     = '#87b8d4'
const ACCENT  = '#82cfff'
const GREEN   = '#56e890'
const RED     = '#f85149'

// ─── Resize handles ──────────────────────────────────────────────────────────
function ColHandle({ onDelta }) {
  const dragging = useRef(false)
  const lastX = useRef(0)
  const [active, setActive] = useState(false)
  const onMouseDown = (e) => {
    e.preventDefault()
    dragging.current = true; lastX.current = e.clientX; setActive(true)
    const move = (e) => { if (!dragging.current) return; onDelta(e.clientX - lastX.current); lastX.current = e.clientX }
    const up = () => { dragging.current = false; setActive(false); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }
  return (
    <div onMouseDown={onMouseDown}
      onMouseEnter={e => e.currentTarget.style.background = '#6ab8ff'}
      onMouseLeave={e => { if (!dragging.current) e.currentTarget.style.background = '#2d4255' }}
      style={{ width: 4, flexShrink: 0, cursor: 'col-resize', zIndex: 10,
        background: active ? '#6ab8ff' : '#2d4255', transition: 'background 0.15s' }} />
  )
}

function RowHandle({ onDelta }) {
  const dragging = useRef(false)
  const lastY = useRef(0)
  const [active, setActive] = useState(false)
  const onMouseDown = (e) => {
    e.preventDefault()
    dragging.current = true; lastY.current = e.clientY; setActive(true)
    const move = (e) => { if (!dragging.current) return; onDelta(e.clientY - lastY.current); lastY.current = e.clientY }
    const up = () => { dragging.current = false; setActive(false); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }
  return (
    <div onMouseDown={onMouseDown}
      onMouseEnter={e => e.currentTarget.style.background = '#6ab8ff'}
      onMouseLeave={e => { if (!dragging.current) e.currentTarget.style.background = '#2d4255' }}
      style={{ height: 4, flexShrink: 0, cursor: 'row-resize', zIndex: 10,
        background: active ? '#6ab8ff' : '#2d4255', transition: 'background 0.15s' }} />
  )
}

// ─── 제철 품목 (월별 item name 목록) ────────────────────────────────────────
const SEASONAL_BY_MONTH = {
  1:  ['시금치', '무', '배추', '당근', '사과', '배', '딸기'],
  2:  ['시금치', '무', '배추', '당근', '딸기'],
  3:  ['봄배추', '시금치', '딸기'],
  4:  ['봄배추', '시금치', '오이', '파프리카', '딸기', '장미'],
  5:  ['봄배추', '양파', '오이', '딸기', '참외'],
  6:  ['양파', '감자', '수박', '참외', '오이'],
  7:  ['감자', '수박', '참외', '복숭아'],
  8:  ['수박', '감자', '복숭아', '포도'],
  9:  ['배', '사과', '포도', '고등어', '고구마'],
  10: ['사과', '배', '쌀', '고등어', '콩'],
  11: ['사과', '배', '배추', '무', '쌀', '콩', '고등어'],
  12: ['배추', '무', '사과', '배', '딸기'],
}
function isSeasonalItem(itemName, month) {
  const list = SEASONAL_BY_MONTH[month] || []
  return list.some(s => itemName.includes(s) || s.includes(itemName.slice(0, 2)))
}

// ─── Market coordinates ───────────────────────────────────────────────────────
const MARKET_COORDS = {
  '110001': { lat: 37.4932, lng: 127.1222, name: '서울가락' },
  '110002': { lat: 37.5644, lng: 126.8348, name: '서울강서' },
  '210001': { lat: 35.1491, lng: 128.9625, name: '부산엄궁' },
  '210002': { lat: 35.1872, lng: 129.1261, name: '부산반여' },
  '220001': { lat: 37.5060, lng: 126.7228, name: '인천삼산' },
  '220002': { lat: 37.4497, lng: 126.7054, name: '인천구월' },
  '230001': { lat: 35.9010, lng: 128.5869, name: '대구북부' },
  '240001': { lat: 35.1696, lng: 126.9090, name: '광주각화' },
  '250001': { lat: 36.3601, lng: 127.3553, name: '대전오정' },
  '260001': { lat: 35.5582, lng: 129.3114, name: '울산' },
  '310001': { lat: 37.2634, lng: 127.0284, name: '수원' },
  '310002': { lat: 37.3942, lng: 126.9568, name: '안양' },
  '310003': { lat: 37.5006, lng: 126.7763, name: '부천' },
  '310004': { lat: 37.5957, lng: 127.1467, name: '구리' },
  '310005': { lat: 37.3219, lng: 126.8309, name: '안산' },
  '320001': { lat: 37.8725, lng: 127.7259, name: '춘천' },
  '330001': { lat: 36.6372, lng: 127.4897, name: '청주' },
  '340001': { lat: 36.8151, lng: 127.1138, name: '천안' },
  '350001': { lat: 35.8243, lng: 127.1481, name: '전주' },
  '360001': { lat: 34.8118, lng: 126.3922, name: '목포' },
  '370001': { lat: 36.0191, lng: 129.3435, name: '포항' },
  '380001': { lat: 35.2285, lng: 128.5820, name: '창원마산' },
  '390001': { lat: 33.4890, lng: 126.4983, name: '제주' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function fmtDate(dateStr) {
  return dateStr ? dateStr.slice(5).replace('-', '/') : ''
}

// ─── Market Map ───────────────────────────────────────────────────────────────
function MapResizer({ mapH }) {
  const map = useMap()
  useEffect(() => { map.invalidateSize() }, [mapH, map])
  return null
}

function MarketMap({ marketPrices, selectedMarket, onSelect, mapH }) {
  const priceMap = {}
  marketPrices.forEach(m => { priceMap[m.marketCode] = Number(m.avgPrice) })
  const prices = Object.values(priceMap)
  const minP = Math.min(...prices)
  const maxP = Math.max(...prices)

  const markers = Object.entries(MARKET_COORDS).map(([code, coord]) => ({
    code, ...coord,
    price: priceMap[code],
  })).filter(m => m.price != null)

  function priceColor(price) {
    if (prices.length < 2) return ACCENT
    const ratio = (price - minP) / (maxP - minP + 1)
    if (ratio > 0.66) return '#f85149'
    if (ratio > 0.33) return '#f0a202'
    return '#56e890'
  }

  return (
    <div style={{ height: '100%', borderRadius: 8, overflow: 'hidden',
      border: '1px solid #354d65' }}>
      <MapContainer center={[36.5, 127.8]} zoom={7}
        style={{ height: '100%', width: '100%' }} zoomControl={true}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        <MapResizer mapH={mapH} />
        {markers.map(m => {
          const icon = L.divIcon({
            className: '',
            html: `<div style="
              background:${priceColor(m.price)};
              color:#fff;font-size:10px;font-weight:700;
              padding:3px 6px;border-radius:10px;white-space:nowrap;
              box-shadow:0 1px 4px rgba(0,0,0,.5);
              border:2px solid ${selectedMarket?.marketCode === m.code ? '#fff' : 'transparent'}
            ">${m.price.toLocaleString()}</div>`,
            iconAnchor: [0, 0],
          })
          return (
            <Marker key={m.code} position={[m.lat, m.lng]} icon={icon}
              eventHandlers={{ click: () => onSelect(m.code) }}>
              <Popup>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 12 }}>{m.price.toLocaleString()}원</div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

// ─── Left Panel: Product list with filter ────────────────────────────────────
const FILTERS = [
  { key: 'all',       label: '전체' },
  { key: 'seasonal',  label: '제철' },
  { key: 'watchlist', label: '★ 관심' },
]

function LeftPanel({ products, selectedProduct, onSelect, watchlist, onToggleWatch }) {
  const [filter, setFilter] = useState('all')
  const month = new Date().getMonth() + 1

  const filtered = products.filter(p => {
    if (filter === 'seasonal')  return isSeasonalItem(p.itemName, month)
    if (filter === 'watchlist') return watchlist.has(p.itemCode)
    return true
  })

  return (
    <div style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${BORDER}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Filter tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            flex: 1, padding: '8px 4px', fontSize: 11, cursor: 'pointer',
            background: 'none', border: 'none',
            borderBottom: filter === f.key ? `2px solid ${GREEN}` : '2px solid transparent',
            color: filter === f.key ? GREEN : DIM,
            fontWeight: filter === f.key ? 700 : 400,
          }}>
            {f.key === 'watchlist'
              ? `★ 관심${watchlist.size > 0 ? `(${watchlist.size})` : ''}`
              : f.label}
          </button>
        ))}
      </div>

      {/* Product list */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: DIM, fontSize: 12 }}>
            {filter === 'watchlist' ? '★를 눌러 추가' : '데이터 없음'}
          </div>
        ) : filtered.map(p => {
          const isActive  = selectedProduct?.itemCode === p.itemCode
          const isWatched = watchlist.has(p.itemCode)
          const chg = Number(p.change7d)
          return (
            <div key={p.itemCode}
              onClick={() => onSelect(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 10px', cursor: 'pointer',
                background: isActive ? '#2d4255' : 'transparent',
                borderBottom: '1px solid #2d4255',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#223040' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              {/* Star */}
              <span onClick={e => { e.stopPropagation(); onToggleWatch(p.itemCode) }}
                style={{ fontSize: 13, color: isWatched ? '#f0a202' : BORDER,
                  cursor: 'pointer', flexShrink: 0 }}>★</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 400,
                  color: isActive ? ACCENT : TEXT, whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.itemName}
                </div>
                <div style={{ fontSize: 10, color: DIM }}>{p.category}</div>
              </div>
              {/* Change badge */}
              {p.change7d != null && (
                <span style={{ fontSize: 10, fontWeight: 700, flexShrink: 0,
                  color: chg > 0 ? RED : chg < 0 ? ACCENT : DIM }}>
                  {chg > 0 ? `+${chg}%` : `${chg}%`}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Trend Tooltip ────────────────────────────────────────────────────────────
function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#253748', border: '1px solid #354d65',
      borderRadius: 6, color: TEXT, fontSize: 12, padding: '8px 12px' }}>
      <div style={{ color: DIM, marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {p.value.toLocaleString()}{p.dataKey === 'avgPrice' ? '원' : '박스'}
        </div>
      ))}
    </div>
  )
}

// ─── Right Panel ──────────────────────────────────────────────────────────────
function RightPanel({ selectedProduct, selectedDate, marketPrices, trendData, loadingMarkets, loadingTrend, selectedMarketCode, onSelectMarket }) {
  if (!selectedProduct) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: DIM, fontSize: 14 }}>
        ← 품목을 선택하세요
      </div>
    )
  }

  const chartData = trendData.map(r => ({
    date: fmtDate(r.date),
    avgPrice: Number(r.avgPrice),
    volume: Number(r.volume),
  }))

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, minWidth: 0 }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{selectedProduct.itemName}</span>
        <span style={{ fontSize: 12, color: DIM, marginLeft: 8 }}>{selectedProduct.category}</span>
        <span style={{ fontSize: 13, color: DIM, marginLeft: 12 }}>기준일: {selectedDate}</span>
      </div>

      {/* Trend chart */}
      {chartData.length > 0 && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`,
          borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 10 }}>
            {selectedProduct.itemName} 30일 가격 추이
          </div>
          {loadingTrend ? (
            <div style={{ padding: 24, textAlign: 'center', color: DIM, fontSize: 13 }}>불러오는 중...</div>
          ) : (
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 4, right: 40, bottom: 4, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d4255" />
                  <XAxis dataKey="date" tick={{ fill: DIM, fontSize: 10 }}
                    axisLine={{ stroke: BORDER }} tickLine={false} />
                  <YAxis yAxisId="price" orientation="left"
                    tick={{ fill: DIM, fontSize: 10 }} axisLine={{ stroke: BORDER }} tickLine={false}
                    tickFormatter={v => v.toLocaleString()} />
                  <YAxis yAxisId="vol" orientation="right"
                    tick={{ fill: DIM, fontSize: 10 }} axisLine={{ stroke: BORDER }} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={<TrendTooltip />} />
                  <Bar yAxisId="vol" dataKey="volume" name="거래량"
                    fill="#354d65" opacity={0.5} radius={[2,2,0,0]} />
                  <Line yAxisId="price" type="monotone" dataKey="avgPrice" name="평균가"
                    stroke={ACCENT} strokeWidth={2} dot={false}
                    activeDot={{ r: 4, fill: ACCENT }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Market comparison table */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8,
        overflow: 'hidden' }}>
        {loadingMarkets ? (
          <div style={{ padding: 32, textAlign: 'center', color: DIM, fontSize: 13 }}>불러오는 중...</div>
        ) : marketPrices.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: DIM, fontSize: 13 }}>데이터 없음</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
                {['시장명', '평균가', '거래량'].map((h, i) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: i === 0 ? 'left' : 'right',
                    color: DIM, fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {marketPrices.map((row, i) => {
                const isActive = selectedMarketCode === row.marketCode
                return (
                  <tr key={`${row.marketCode}-${i}`}
                    onClick={() => onSelectMarket(row.marketCode)}
                    style={{ borderBottom: '1px solid #2d4255', cursor: 'pointer',
                      background: isActive ? '#2d4255' : 'transparent' }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#223040' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '8px 12px', fontWeight: 700,
                      color: isActive ? ACCENT : TEXT }}>{row.marketName}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: TEXT }}>
                      <div style={{ fontWeight: 600 }}>{Number(row.avgPrice).toLocaleString()}원</div>
                      {row.unit && <div style={{ fontSize: 10, color: DIM }}>{row.unit}</div>}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: DIM }}>
                      {Number(row.volume).toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Page Toolbar ─────────────────────────────────────────────────────────────
function HolidayBanner({ selectedDate, hasData }) {
  const d = new Date(selectedDate)
  const day = d.getDay()
  const isWeekend = day === 0 || day === 6
  if (!isWeekend && hasData) return null
  const msg = isWeekend
    ? `${day === 6 ? '토요일' : '일요일'}은 공영도매시장 휴장일입니다.`
    : '해당 날짜의 경매 데이터가 없습니다. 공휴일 또는 휴장일일 수 있습니다.'
  return (
    <div style={{
      background: '#d2992222', border: '1px solid #d29922',
      borderRadius: 6, padding: '8px 14px', margin: '12px 16px 0',
      fontSize: 13, color: '#d29922', display: 'flex', alignItems: 'center', gap: 8,
    }}>
      ⚠️ {msg} 가장 가까운 거래일을 선택해주세요.
    </div>
  )
}

function PageToolbar({ selectedDate, setSelectedDate }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', background: SURFACE,
      borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT }}>전국 농수산물 경매 현황</h1>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: DIM }}>
        기준일:
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <input type="date" value={selectedDate} max={getToday()}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 5,
              color: TEXT, fontSize: 13, padding: '4px 28px 4px 8px', outline: 'none', cursor: 'pointer' }} />
          <span style={{ position: 'absolute', right: 6, pointerEvents: 'none', fontSize: 14 }}>📅</span>
        </div>
      </label>
    </div>
  )
}

// ─── Mock market prices for a product ────────────────────────────────────────
function mockMarketPrices(itemCode) {
  const base = MOCK_DAILY.find(d => d.itemCode === itemCode)?.avgPrice || 10000
  const units = { '111': '10kg', '112': '20kg', '211': '20kg', '214': '20kg', '215': '20kg', '311': '10kg', '312': '15kg', '313': '2kg', '314': '10kg', '411': '20kg', '421': '10kg', '511': '100본', '612': '10kg', '711': '10kg', '216': '4kg', '217': '10kg', '315': '10kg', '218': '5kg' }
  const unit = units[itemCode] || '10kg'
  return MOCK_MARKETS.slice(0, 10).map(m => ({
    marketCode: m.code,
    marketName: m.name,
    avgPrice: Math.round(base * (0.85 + Math.random() * 0.3)),
    volume: Math.round(100 + Math.random() * 900),
    unit,
  }))
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarketsAnalysisPage() {
  const [selectedDate, setSelectedDate]       = useState(getToday)
  const [products, setProducts]               = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [marketPrices, setMarketPrices]       = useState([])
  const [trendData, setTrendData]             = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingMarkets, setLoadingMarkets]   = useState(false)
  const [loadingTrend, setLoadingTrend]       = useState(false)
  const [selectedMarketCode, setSelectedMarketCode] = useState(null)
  const [watchlist, setWatchlist]             = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('market_watchlist') || '[]')) }
    catch { return new Set() }
  })
  const [leftW, setLeftW] = useState(() => {
    try { return Number(localStorage.getItem('markets_leftW') || 200) } catch { return 200 }
  })
  const [mapH, setMapH] = useState(() => {
    try { return Number(localStorage.getItem('markets_mapH') || 240) } catch { return 240 }
  })
  const [mobileFilter, setMobileFilter] = useState('all')

  // Fetch product list
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingProducts(true)
    client.get(`/analysis/daily?date=${selectedDate}`)
      .then(r => setProducts(r.data?.length ? r.data : MOCK_DAILY))
      .catch(() => setProducts(MOCK_DAILY))
      .finally(() => setLoadingProducts(false))
  }, [selectedDate])

  // Fetch market prices when product changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selectedProduct) { setMarketPrices([]); return }
    setLoadingMarkets(true)
    setSelectedMarketCode(null)
    client.get(`/analysis/markets?itemCode=${selectedProduct.itemCode}&date=${selectedDate}`)
      .then(r => setMarketPrices(r.data?.length ? r.data : mockMarketPrices(selectedProduct.itemCode)))
      .catch(() => setMarketPrices(mockMarketPrices(selectedProduct.itemCode)))
      .finally(() => setLoadingMarkets(false))
  }, [selectedProduct, selectedDate])

  // Fetch trend when product changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selectedProduct) { setTrendData([]); return }
    setLoadingTrend(true)
    client.get(`/analysis/trend?itemCode=${selectedProduct.itemCode}&days=30`)
      .then(r => setTrendData(r.data?.length ? r.data : MOCK_TREND(selectedProduct.itemCode)))
      .catch(() => setTrendData(MOCK_TREND(selectedProduct.itemCode)))
      .finally(() => setLoadingTrend(false))
  }, [selectedProduct])

  const toggleWatch = useCallback((itemCode) => {
    setWatchlist(prev => {
      const next = new Set(prev)
      next.has(itemCode) ? next.delete(itemCode) : next.add(itemCode)
      localStorage.setItem('market_watchlist', JSON.stringify([...next]))
      return next
    })
  }, [])

  const isMobile = window.innerWidth <= 768

  if (isMobile) {
    const month = new Date().getMonth() + 1

    const mobileFiltered = products.filter(p => {
      if (mobileFilter === 'seasonal')  return isSeasonalItem(p.itemName, month)
      if (mobileFilter === 'watchlist') return watchlist.has(p.itemCode)
      return true
    })

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh',
        background: BG, overflow: 'hidden', color: TEXT }}>
        <Header />
        <NewsTicker />
        <PageToolbar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        <AnalysisNav />
        <HolidayBanner selectedDate={selectedDate} hasData={products.length > 0} />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Section 1: Filter tabs + product chip list */}
          <div style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
            {/* Filter tabs row */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}` }}>
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setMobileFilter(f.key)} style={{
                  flex: 1, padding: '8px 4px', fontSize: 12, cursor: 'pointer',
                  background: 'none', border: 'none',
                  borderBottom: mobileFilter === f.key ? `2px solid ${GREEN}` : '2px solid transparent',
                  color: mobileFilter === f.key ? GREEN : DIM,
                  fontWeight: mobileFilter === f.key ? 700 : 400,
                }}>
                  {f.key === 'watchlist'
                    ? `★ 관심${watchlist.size > 0 ? `(${watchlist.size})` : ''}`
                    : f.label}
                </button>
              ))}
            </div>
            {/* Horizontal scrollable chip list */}
            <div style={{ display: 'flex', overflowX: 'auto', gap: 8, padding: '10px 12px',
              scrollbarWidth: 'none' }}>
              {loadingProducts ? (
                <span style={{ fontSize: 12, color: DIM, padding: '6px 0' }}>불러오는 중...</span>
              ) : mobileFiltered.length === 0 ? (
                <span style={{ fontSize: 12, color: DIM, padding: '6px 0' }}>
                  {mobileFilter === 'watchlist' ? '★를 눌러 추가' : '데이터 없음'}
                </span>
              ) : mobileFiltered.map(p => {
                const isActive = selectedProduct?.itemCode === p.itemCode
                return (
                  <button key={p.itemCode} onClick={() => setSelectedProduct(p)}
                    style={{
                      flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                      fontSize: 13, fontWeight: isActive ? 700 : 400, cursor: 'pointer',
                      border: `1px solid ${isActive ? ACCENT : BORDER}`,
                      background: isActive ? '#2d4255' : 'transparent',
                      color: isActive ? ACCENT : TEXT,
                      whiteSpace: 'nowrap',
                    }}>
                    {p.itemName}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 2: Map — 200px tall */}
          <div style={{ height: 200, margin: '12px 12px 0' }}>
            <MarketMap
              marketPrices={marketPrices}
              selectedMarket={selectedMarketCode ? { marketCode: selectedMarketCode } : null}
              onSelect={setSelectedMarketCode}
              mapH={200}
            />
          </div>

          {/* Section 3: RightPanel — full width */}
          <div style={{ marginTop: 12 }}>
            <RightPanel
              selectedProduct={selectedProduct}
              selectedDate={selectedDate}
              marketPrices={marketPrices}
              trendData={trendData}
              loadingMarkets={loadingMarkets}
              loadingTrend={loadingTrend}
              selectedMarketCode={selectedMarketCode}
              onSelectMarket={setSelectedMarketCode}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh',
      background: BG, overflow: 'hidden', color: TEXT }}>
      <Header />
      <NewsTicker />
      <PageToolbar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      <AnalysisNav />
      <HolidayBanner selectedDate={selectedDate} hasData={products.length > 0} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left: product filter + list */}
        <div style={{ width: leftW, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <LeftPanel
            products={loadingProducts ? [] : products}
            selectedProduct={selectedProduct}
            onSelect={setSelectedProduct}
            watchlist={watchlist}
            onToggleWatch={toggleWatch}
          />
        </div>

        <ColHandle onDelta={d => setLeftW(w => {
          const next = Math.max(150, Math.min(380, w + d))
          localStorage.setItem('markets_leftW', next)
          return next
        })} />

        {/* Center+Right: map + market table + trend */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Map */}
          <div style={{ height: mapH, flexShrink: 0, margin: '12px 12px 0' }}>
            <MarketMap
              marketPrices={marketPrices}
              selectedMarket={selectedMarketCode ? { marketCode: selectedMarketCode } : null}
              onSelect={setSelectedMarketCode}
              mapH={mapH}
            />
          </div>

          <RowHandle onDelta={d => setMapH(h => {
            const next = Math.max(150, Math.min(420, h + d))
            localStorage.setItem('markets_mapH', next)
            return next
          })} />

          {/* Right content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <RightPanel
              selectedProduct={selectedProduct}
              selectedDate={selectedDate}
              marketPrices={marketPrices}
              trendData={trendData}
              loadingMarkets={loadingMarkets}
              loadingTrend={loadingTrend}
              selectedMarketCode={selectedMarketCode}
              onSelectMarket={setSelectedMarketCode}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// src/pages/MarketsAnalysisPage.jsx
import { useEffect, useState, useCallback } from 'react'
import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Header from '../components/Header/Header'
import AnalysisNav from '../components/Analysis/AnalysisNav'
import client from '../api/client'
import { MOCK_MARKETS, MOCK_MARKET_PRODUCTS, MOCK_TREND } from '../data/analysisMock'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG      = '#0d1117'
const SURFACE = '#161b22'
const BORDER  = '#30363d'
const TEXT    = '#c9d1d9'
const DIM     = '#8b949e'
const ACCENT  = '#58a6ff'
const GREEN   = '#3fb950'

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
function getYesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function fmtDate(dateStr) {
  return dateStr ? dateStr.slice(5).replace('-', '/') : ''
}

function groupByRegion(markets) {
  const map = {}
  markets.forEach(m => {
    const region = m.name.slice(0, 2)
    if (!map[region]) map[region] = []
    map[region].push(m)
  })
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, 'ko'))
}

// ─── Market Map ───────────────────────────────────────────────────────────────
function MarketMap({ markets, selectedMarket, onSelect }) {
  const marketsWithCoords = markets
    .filter(m => MARKET_COORDS[m.code])
    .map(m => ({ ...m, ...MARKET_COORDS[m.code] }))

  if (marketsWithCoords.length === 0) return null

  return (
    <div style={{ height: 260, borderRadius: 8, overflow: 'hidden',
      border: '1px solid #30363d', marginBottom: 12 }}>
      <MapContainer
        center={[36.5, 127.8]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        {marketsWithCoords.map(m => (
          <Marker
            key={m.code}
            position={[m.lat, m.lng]}
            eventHandlers={{ click: () => onSelect({ code: m.code, name: m.name }) }}
          >
            <Popup>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: '#666' }}>클릭하여 선택</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

// ─── Trend Tooltip ────────────────────────────────────────────────────────────
function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#161b22', border: '1px solid #30363d',
      borderRadius: 6, color: TEXT, fontSize: 12, padding: '8px 12px',
    }}>
      <div style={{ color: DIM, marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          {p.dataKey === 'avgPrice' ? '원' : '박스'}
        </div>
      ))}
    </div>
  )
}

// ─── Trend Panel ──────────────────────────────────────────────────────────────
function TrendPanel({ market, product, trendData, loadingTrend, onClose }) {
  const chartData = trendData.map(row => ({
    date: fmtDate(row.date),
    avgPrice: Number(row.avgPrice),
    volume: Number(row.volume),
  }))

  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 8, padding: '12px 16px', marginTop: 12,
      animation: 'slideIn 0.2s ease-out',
    }}>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>
          {market.name} · {product.itemName} 30일 추이
        </span>
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto', background: 'none', border: `1px solid ${BORDER}`,
            color: DIM, fontSize: 13, width: 24, height: 24,
            borderRadius: 4, cursor: 'pointer', lineHeight: 1,
          }}
        >×</button>
      </div>

      {loadingTrend ? (
        <div style={{ padding: 40, textAlign: 'center', color: DIM, fontSize: 13 }}>불러오는 중...</div>
      ) : chartData.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: DIM, fontSize: 13 }}>데이터 없음</div>
      ) : (
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 40, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis
                dataKey="date"
                tick={{ fill: DIM, fontSize: 10 }}
                axisLine={{ stroke: BORDER }}
                tickLine={false}
              />
              <YAxis
                yAxisId="price"
                orientation="left"
                tick={{ fill: DIM, fontSize: 10 }}
                axisLine={{ stroke: BORDER }}
                tickLine={false}
                tickFormatter={v => v.toLocaleString()}
              />
              <YAxis
                yAxisId="vol"
                orientation="right"
                tick={{ fill: DIM, fontSize: 10 }}
                axisLine={{ stroke: BORDER }}
                tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <Tooltip content={<TrendTooltip />} />
              <Bar
                yAxisId="vol"
                dataKey="volume"
                name="거래량"
                fill="#30363d"
                opacity={0.5}
                radius={[2, 2, 0, 0]}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="avgPrice"
                name="평균가"
                stroke={ACCENT}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: ACCENT }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ─── Product Table ────────────────────────────────────────────────────────────
function ProductTable({ products, selectedProduct, onSelect }) {
  const sorted = [...products].sort((a, b) => Number(b.volume) - Number(a.volume))

  if (sorted.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: DIM, fontSize: 14 }}>
        데이터 없음
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
            {['품목명', '평균가(원)', '최저가', '최고가', '거래량'].map((h, i) => (
              <th key={h} style={{
                padding: '8px 12px',
                textAlign: i === 0 ? 'left' : 'right',
                color: DIM, fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const isSelected = selectedProduct?.itemCode === row.itemCode
            return (
              <tr
                key={`${row.itemCode}-${i}`}
                onClick={() => onSelect(row)}
                style={{
                  borderBottom: '1px solid #21262d',
                  cursor: 'pointer',
                  background: isSelected ? '#21262d' : 'transparent',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#1c2128' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                <td style={{ padding: '8px 12px' }}>
                  <div style={{ fontWeight: 700, color: isSelected ? ACCENT : TEXT }}>{row.itemName}</div>
                  <div style={{ fontSize: 11, color: DIM }}>{row.category}</div>
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: TEXT }}>
                  {Number(row.avgPrice).toLocaleString()}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: DIM }}>
                  {Number(row.minPrice).toLocaleString()}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: DIM }}>
                  {Number(row.maxPrice).toLocaleString()}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: DIM }}>
                  {Number(row.volume).toLocaleString()}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Right Panel ──────────────────────────────────────────────────────────────
function RightPanel({ selectedMarket, selectedDate, products, selectedProduct, trendData, loadingProducts, loadingTrend, onSelectProduct, onCloseTrend }) {
  if (!selectedMarket) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: DIM, fontSize: 14,
      }}>
        ← 왼쪽에서 시장을 선택하세요
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, minWidth: 0 }}>
      {/* Market header */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{selectedMarket.name}</span>
        <span style={{ fontSize: 13, color: DIM, marginLeft: 10 }}>기준일: {selectedDate}</span>
      </div>

      {/* Products */}
      <div style={{
        background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 8, overflow: 'hidden',
      }}>
        {loadingProducts ? (
          <div style={{ padding: 40, textAlign: 'center', color: DIM, fontSize: 13 }}>불러오는 중...</div>
        ) : (
          <ProductTable
            products={products}
            selectedProduct={selectedProduct}
            onSelect={onSelectProduct}
          />
        )}
      </div>

      {/* Trend panel */}
      {selectedProduct && (
        <TrendPanel
          market={selectedMarket}
          product={selectedProduct}
          trendData={trendData}
          loadingTrend={loadingTrend}
          onClose={onCloseTrend}
        />
      )}
    </div>
  )
}

// ─── Left Panel ───────────────────────────────────────────────────────────────
function LeftPanel({ markets, selectedMarket, onSelectMarket }) {
  const grouped = groupByRegion(markets)

  return (
    <div style={{
      width: 260,
      flexShrink: 0,
      borderRight: `1px solid ${BORDER}`,
      overflowY: 'auto',
      padding: 12,
    }}>
      {grouped.length === 0 ? (
        <div style={{ color: DIM, fontSize: 13, padding: 16, textAlign: 'center' }}>불러오는 중...</div>
      ) : (
        grouped.map(([region, items]) => (
          <div key={region}>
            <div style={{
              fontSize: 11, color: GREEN, fontWeight: 700,
              marginBottom: 4, marginTop: 10,
            }}>
              {region}
            </div>
            <div>
              {items.map(m => {
                const isActive = selectedMarket?.code === m.code
                return (
                  <span
                    key={m.code}
                    onClick={() => onSelectMarket(m)}
                    style={{
                      display: 'inline-block',
                      margin: 2,
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      cursor: 'pointer',
                      background: isActive ? GREEN : SURFACE,
                      border: isActive ? 'none' : `1px solid ${BORDER}`,
                      color: isActive ? '#fff' : TEXT,
                    }}
                  >
                    {m.name}
                  </span>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ─── Page Toolbar ─────────────────────────────────────────────────────────────
function PageToolbar({ selectedDate, setSelectedDate }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px', background: SURFACE,
      borderBottom: `1px solid ${BORDER}`, flexShrink: 0, flexWrap: 'wrap', gap: 8,
    }}>
      <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>
        시장별 현황
      </h1>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: DIM }}>
        기준일:
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <input type="date" value={selectedDate} max={getYesterday()}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 5,
              color: '#c9d1d9', fontSize: 13, padding: '4px 28px 4px 8px', outline: 'none', cursor: 'pointer' }} />
          <span style={{ position: 'absolute', right: 6, pointerEvents: 'none', fontSize: 14 }}>📅</span>
        </div>
      </label>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarketsAnalysisPage() {
  const [selectedDate, setSelectedDate]     = useState(getYesterday)
  const [markets, setMarkets]               = useState([])
  const [selectedMarket, setSelectedMarket] = useState(null)
  const [products, setProducts]             = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [trendData, setTrendData]           = useState([])
  const [loadingMarkets, setLoadingMarkets] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingTrend, setLoadingTrend]     = useState(false)

  // Fetch markets on mount
  useEffect(() => {
    setLoadingMarkets(true)
    client.get('/analysis/market-list')
      .then(r => setMarkets(r.data?.length ? r.data : MOCK_MARKETS))
      .catch(() => setMarkets(MOCK_MARKETS))
      .finally(() => setLoadingMarkets(false))
  }, [])

  // Fetch products when market or date changes
  useEffect(() => {
    if (!selectedMarket) {
      setProducts([])
      return
    }
    setLoadingProducts(true)
    setSelectedProduct(null)
    setTrendData([])
    client.get(`/analysis/market-products?marketCode=${selectedMarket.code}&date=${selectedDate}`)
      .then(r => setProducts(r.data?.length ? r.data : MOCK_MARKET_PRODUCTS(selectedMarket.code)))
      .catch(() => setProducts(MOCK_MARKET_PRODUCTS(selectedMarket.code)))
      .finally(() => setLoadingProducts(false))
  }, [selectedMarket, selectedDate])

  // Fetch trend when product selected
  useEffect(() => {
    if (!selectedProduct) {
      setTrendData([])
      return
    }
    setLoadingTrend(true)
    client.get(`/analysis/trend?itemCode=${selectedProduct.itemCode}&days=30`)
      .then(r => setTrendData(r.data?.length ? r.data : MOCK_TREND(selectedProduct.itemCode)))
      .catch(() => setTrendData(MOCK_TREND(selectedProduct.itemCode)))
      .finally(() => setLoadingTrend(false))
  }, [selectedProduct])

  const selectMarket = useCallback((market) => {
    setSelectedMarket(market)
  }, [])

  const selectProduct = useCallback((product) => {
    setSelectedProduct({ itemCode: product.itemCode, itemName: product.itemName })
  }, [])

  const closeTrend = useCallback(() => {
    setSelectedProduct(null)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: BG, overflow: 'hidden', color: TEXT }}>
      <Header />
      <AnalysisNav />
      <PageToolbar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

      {/* Map + Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
          <MarketMap
            markets={markets}
            selectedMarket={selectedMarket}
            onSelect={setSelectedMarket}
          />
        </div>
        {/* Body: left + right */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <LeftPanel
          markets={loadingMarkets ? [] : markets}
          selectedMarket={selectedMarket}
          onSelectMarket={selectMarket}
        />
        <RightPanel
          selectedMarket={selectedMarket}
          selectedDate={selectedDate}
          products={products}
          selectedProduct={selectedProduct}
          trendData={trendData}
          loadingProducts={loadingProducts}
          loadingTrend={loadingTrend}
          onSelectProduct={selectProduct}
          onCloseTrend={closeTrend}
        />
        </div>
      </div>
    </div>
  )
}

// src/pages/ProductsAnalysisPage.jsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy'
import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import Header from '../components/Header/Header'
import NewsTicker from '../components/NewsTicker/NewsTicker'
import AnalysisNav from '../components/Analysis/AnalysisNav'
import client from '../api/client'
import { MOCK_DAILY, MOCK_TREND, MOCK_VARIETY, MOCK_ORIGIN } from '../data/analysisMock'

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG      = '#1c2a36'
const SURFACE = '#253748'
const BORDER  = '#354d65'
const TEXT    = '#ddeaf5'
const DIM     = '#87b8d4'
const ACCENT  = '#82cfff'
const GREEN   = '#56e890'
const RED     = '#f85149'
const BLUE    = '#82cfff'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function fmtDate(dateStr) {
  return dateStr ? dateStr.slice(5).replace('-', '/') : ''
}

function getChangeColor(change) {
  if (change == null) return '#354d65'
  if (change >= 5)   return '#b91c1c'
  if (change >= 2)   return '#ef4444'
  if (change >= 0.5) return '#fca5a5'
  if (change > -0.5) return '#4a6278'
  if (change > -2)   return '#a8d4ff'
  if (change > -5)   return '#5ba3f5'
  return '#1a69c4'
}

// ─── D3 Treemap ───────────────────────────────────────────────────────────────
function TreemapView({ data, onSelect }) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)

  const renderTreemap = useCallback(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    if (width === 0 || height === 0) return

    const svg = svgRef.current
    while (svg.firstChild) svg.removeChild(svg.firstChild)
    svg.setAttribute('width', width)
    svg.setAttribute('height', height)

    const categories = {}
    data.forEach(d => {
      if (!categories[d.category]) categories[d.category] = []
      categories[d.category].push(d)
    })

    const root = hierarchy({
      name: 'root',
      children: Object.entries(categories).map(([cat, items]) => ({
        name: cat,
        children: items.map(item => ({
          name: item.itemName,
          value: Number(item.volume) || 1,
          itemCode: item.itemCode,
          avgPrice: Number(item.avgPrice),
          change7d: item.change7d != null ? Number(item.change7d) : null,
          category: item.category,
        })),
      })),
    }).sum(d => d.value)

    const tm = treemap()
      .tile(treemapSquarify)
      .size([width, height])
      .paddingOuter(3)
      .paddingTop(18)
      .paddingInner(2)

    tm(root)

    root.children.forEach(catNode => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('x', catNode.x0)
      rect.setAttribute('y', catNode.y0)
      rect.setAttribute('width', catNode.x1 - catNode.x0)
      rect.setAttribute('height', catNode.y1 - catNode.y0)
      rect.setAttribute('fill', '#243444')
      rect.setAttribute('rx', '4')
      g.appendChild(rect)

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', catNode.x0 + 6)
      text.setAttribute('y', catNode.y0 + 13)
      text.setAttribute('fill', GREEN)
      text.setAttribute('font-size', '11')
      text.setAttribute('font-weight', '600')
      text.textContent = catNode.data.name
      g.appendChild(text)

      svg.appendChild(g)

      catNode.leaves().forEach(leaf => {
        const w = leaf.x1 - leaf.x0
        const h = leaf.y1 - leaf.y0
        if (w < 2 || h < 2) return

        const lg = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        lg.style.cursor = 'pointer'
        lg.addEventListener('click', () => onSelect({
          itemCode: leaf.data.itemCode,
          itemName: leaf.data.name,
        }))

        const lr = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        lr.setAttribute('x', leaf.x0)
        lr.setAttribute('y', leaf.y0)
        lr.setAttribute('width', w)
        lr.setAttribute('height', h)
        lr.setAttribute('fill', getChangeColor(leaf.data.change7d))
        lr.setAttribute('rx', '2')
        lg.appendChild(lr)

        if (w > 40 && h > 24) {
          const lt = document.createElementNS('http://www.w3.org/2000/svg', 'text')
          lt.setAttribute('x', leaf.x0 + w / 2)
          lt.setAttribute('y', leaf.y0 + h / 2 - (h > 40 ? 8 : 0))
          lt.setAttribute('text-anchor', 'middle')
          lt.setAttribute('dominant-baseline', 'middle')
          lt.setAttribute('fill', '#eef5fb')
          lt.setAttribute('font-size', Math.min(12, w / 6))
          lt.setAttribute('font-weight', '600')
          lt.textContent = leaf.data.name
          lg.appendChild(lt)

          if (h > 40) {
            const pt = document.createElementNS('http://www.w3.org/2000/svg', 'text')
            pt.setAttribute('x', leaf.x0 + w / 2)
            pt.setAttribute('y', leaf.y0 + h / 2 + 10)
            pt.setAttribute('text-anchor', 'middle')
            pt.setAttribute('dominant-baseline', 'middle')
            pt.setAttribute('fill', DIM)
            pt.setAttribute('font-size', Math.min(10, w / 7))
            pt.textContent = `${leaf.data.avgPrice.toLocaleString()}원`
            lg.appendChild(pt)

            if (leaf.data.change7d != null && h > 55) {
              const ct = document.createElementNS('http://www.w3.org/2000/svg', 'text')
              ct.setAttribute('x', leaf.x0 + w / 2)
              ct.setAttribute('y', leaf.y0 + h / 2 + 23)
              ct.setAttribute('text-anchor', 'middle')
              ct.setAttribute('dominant-baseline', 'middle')
              ct.setAttribute('fill', '#eef5fb')
              ct.setAttribute('font-size', Math.min(9, w / 8))
              const ch = leaf.data.change7d
              ct.textContent = `${ch > 0 ? '▲' : '▼'} ${Math.abs(ch).toFixed(1)}%`
              lg.appendChild(ct)
            }
          }
        }

        svg.appendChild(lg)
      })
    })
  }, [data, onSelect])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(() => renderTreemap())
    observer.observe(containerRef.current)
    renderTreemap()
    return () => observer.disconnect()
  }, [renderTreemap])

  if (data.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: DIM, fontSize: 14 }}>
        데이터 없음
      </div>
    )
  }

  const legendItems = [
    { label: '급등 ↑5%+', color: '#b91c1c' },
    { label: '상승',      color: '#ef4444' },
    { label: '소폭상승',  color: '#fca5a5' },
    { label: '보합',      color: '#4a6278' },
    { label: '소폭하락',  color: '#a8d4ff' },
    { label: '하락',      color: '#5ba3f5' },
    { label: '급락 ↓5%+', color: '#1a69c4' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div ref={containerRef} style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <svg ref={svgRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '8px 0', flexShrink: 0 }}>
        {legendItems.map(({ label, color }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: TEXT }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Category-tab table ───────────────────────────────────────────────────────
function SortIcon({ dir }) {
  if (!dir) return <span style={{ color: DIM, fontSize: 10 }}> ↕</span>
  return <span style={{ fontSize: 10 }}>{dir === 'asc' ? ' ↑' : ' ↓'}</span>
}

function ProductTable({ data, onSelect }) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0
    let av = a[sortKey], bv = b[sortKey]
    if (sortKey === 'itemName') {
      av = av || ''
      bv = bv || ''
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    }
    av = Number(av) || 0
    bv = Number(bv) || 0
    return sortDir === 'asc' ? av - bv : bv - av
  })

  if (sorted.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: DIM, fontSize: 14 }}>
        데이터 없음
      </div>
    )
  }

  // ── Mobile card layout ──────────────────────────────────────────────────────
  if (window.innerWidth <= 768) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
        {sorted.map((row, i) => {
          const change = row.change7d != null ? Number(row.change7d) : null
          const up = change != null && change > 0
          const down = change != null && change < 0
          return (
            <div
              key={`${row.itemCode}-${i}`}
              onClick={() => onSelect(row)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: '10px 14px',
                cursor: 'pointer',
              }}
            >
              {/* Left: 품목명 + category */}
              <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                <div style={{
                  fontWeight: 700,
                  color: TEXT,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {row.itemName}
                </div>
                <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>
                  {row.category}
                </div>
              </div>
              {/* Right: price + change badge */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, color: TEXT, fontSize: 14 }}>
                  {Number(row.avgPrice).toLocaleString()}원
                  {row.unit && <span style={{ fontSize: 10, color: DIM, marginLeft: 3 }}>/{row.unit}</span>}
                </div>
                <div style={{ marginTop: 4 }}>
                  {change == null
                    ? <span style={{ color: DIM, fontSize: 12 }}>-</span>
                    : <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: up ? RED : down ? BLUE : DIM,
                        background: up ? '#f8514920' : down ? '#82cfff20' : 'transparent',
                        padding: '2px 6px', borderRadius: 4,
                      }}>
                        {up ? '▲' : down ? '▼' : '–'} {Math.abs(change).toFixed(1)}%
                      </span>
                  }
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const thStyle = (key) => ({
    padding: '8px 12px',
    textAlign: key === 'itemName' ? 'left' : 'right',
    color: sortKey === key ? ACCENT : DIM,
    fontWeight: 600,
    fontSize: 12,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
  })

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
            <th style={thStyle('itemName')} onClick={() => handleSort('itemName')}>
              품목명<SortIcon dir={sortKey === 'itemName' ? sortDir : null} />
            </th>
            <th style={thStyle('avgPrice')} onClick={() => handleSort('avgPrice')}>
              현재가(원)<SortIcon dir={sortKey === 'avgPrice' ? sortDir : null} />
            </th>
            <th style={thStyle('change7d')} onClick={() => handleSort('change7d')}>
              등락(7일)<SortIcon dir={sortKey === 'change7d' ? sortDir : null} />
            </th>
            <th style={{ ...thStyle('volume'), cursor: 'pointer' }} onClick={() => handleSort('volume')}>
              거래량<SortIcon dir={sortKey === 'volume' ? sortDir : null} />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const change = row.change7d != null ? Number(row.change7d) : null
            const up = change != null && change > 0
            const down = change != null && change < 0
            return (
              <tr
                key={`${row.itemCode}-${i}`}
                onClick={() => onSelect(row)}
                style={{ borderBottom: `1px solid #2d4255`, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2d4255' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <td style={{ padding: '8px 12px' }}>
                  <div style={{ fontWeight: 700, color: TEXT }}>{row.itemName}</div>
                  <div style={{ fontSize: 11, color: DIM }}>{row.category}</div>
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: TEXT }}>
                  <div>{Number(row.avgPrice).toLocaleString()}원</div>
                  {row.unit && <div style={{ fontSize: 10, color: DIM, marginTop: 1 }}>/{row.unit}</div>}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                  {change == null
                    ? <span style={{ color: DIM, fontSize: 12 }}>-</span>
                    : <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: up ? RED : down ? BLUE : DIM,
                        background: up ? '#f8514920' : down ? '#82cfff20' : 'transparent',
                        padding: '2px 6px', borderRadius: 4,
                      }}>
                        {up ? '▲' : down ? '▼' : '–'} {Math.abs(change).toFixed(1)}%
                      </span>
                  }
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: DIM }}>
                  {Number(row.volume).toLocaleString()}박스
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Simple horizontal bar chart (CSS/div) ────────────────────────────────────
function SimpleBarChart({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ fontSize: 12, color: DIM, padding: '12px 0' }}>데이터 없음</div>
  }
  const max = Math.max(...data.map(d => Number(d.volume) || 0))
  return (
    <div>
      {data.map(d => (
        <div key={d.label} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: DIM }}>
            <span>{d.label}</span>
            <span>{Number(d.volume).toLocaleString()}박스</span>
          </div>
          <div style={{ height: 6, background: '#2d4255', borderRadius: 3, marginTop: 2 }}>
            <div style={{
              height: 6, borderRadius: 3, background: ACCENT,
              width: max > 0 ? `${(Number(d.volume) / max * 100).toFixed(1)}%` : '0%',
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Trend chart tooltip ──────────────────────────────────────────────────────
function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#253748', border: `1px solid #354d65`,
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

// ─── Product detail panel ─────────────────────────────────────────────────────
function DetailPanel({ item, trendData, varietyData, originData, detailLoading, onClose }) {
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
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{item.itemName} 상세</span>
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto', background: 'none', border: `1px solid ${BORDER}`,
            color: DIM, fontSize: 13, width: 24, height: 24,
            borderRadius: 4, cursor: 'pointer', lineHeight: 1,
          }}
        >×</button>
      </div>

      {detailLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: DIM, fontSize: 13 }}>불러오는 중...</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
        }}>
          {/* 30일 가격 추이 */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: DIM, marginBottom: 8 }}>30일 가격 추이</div>
            {chartData.length === 0
              ? <div style={{ fontSize: 12, color: DIM }}>데이터 없음</div>
              : (
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d4255" />
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
                        fill="#354d65"
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
              )
            }
          </div>

          {/* 품종별 분포 */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: DIM, marginBottom: 8 }}>품종별 분포</div>
            <SimpleBarChart data={varietyData} />
          </div>

          {/* 산지별 분포 */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: DIM, marginBottom: 8 }}>산지별 분포</div>
            <SimpleBarChart data={originData} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page toolbar ─────────────────────────────────────────────────────────────
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
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', background: SURFACE,
      borderBottom: `1px solid ${BORDER}`, flexShrink: 0, flexWrap: 'wrap', gap: 8,
    }}>
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT }}>
        전국 농수산물 경매 현황
      </h1>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: DIM }}>
        기준일:
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <input
            type="date"
            value={selectedDate}
            max={getToday()}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              background: BG, border: `1px solid ${BORDER}`, borderRadius: 5,
              color: TEXT, fontSize: 13, padding: '4px 28px 4px 8px', outline: 'none', cursor: 'pointer',
            }}
          />
          <span style={{ position: 'absolute', right: 6, pointerEvents: 'none', fontSize: 14 }}>📅</span>
        </div>
      </label>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductsAnalysisPage() {
  const [selectedDate, setSelectedDate] = useState(getToday)
  const [dailyData, setDailyData]       = useState([])
  const [viewMode, setViewMode]         = useState('treemap')
  const [activeCategory, setActiveCategory] = useState('전체')
  const [selectedItem, setSelectedItem] = useState(null)
  const [trendData, setTrendData]       = useState([])
  const [varietyData, setVarietyData]   = useState([])
  const [originData, setOriginData]     = useState([])
  const [loading, setLoading]           = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  // Fetch daily data on date change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    client.get(`/analysis/daily?date=${selectedDate}`)
      .then(r => setDailyData(r.data?.length ? r.data : MOCK_DAILY))
      .catch(() => setDailyData(MOCK_DAILY))
      .finally(() => setLoading(false))
  }, [selectedDate])

  // Fetch detail data when selected item changes
  useEffect(() => {
    if (!selectedItem) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTrendData([])
      setVarietyData([])
      setOriginData([])
      return
    }
    setDetailLoading(true)
    Promise.allSettled([
      client.get(`/analysis/trend?itemCode=${selectedItem.itemCode}&days=30`),
      client.get(`/analysis/variety?itemCode=${selectedItem.itemCode}&date=${selectedDate}`),
      client.get(`/analysis/origin?itemCode=${selectedItem.itemCode}&date=${selectedDate}`),
    ])
      .then(([trend, variety, origin]) => {
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
      })
      .finally(() => setDetailLoading(false))
  }, [selectedItem, selectedDate])

  const selectItem = useCallback((item) => {
    setSelectedItem({ itemCode: item.itemCode, itemName: item.itemName })
  }, [])

  // Derive categories
  const categories = ['전체', ...Array.from(new Set(dailyData.map(d => d.category))).filter(Boolean)]

  const filteredData = activeCategory === '전체'
    ? dailyData
    : dailyData.filter(d => d.category === activeCategory)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: BG, overflow: 'hidden', color: TEXT }}>
      <Header />
      <NewsTicker />
      <PageToolbar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
      <AnalysisNav />
      <HolidayBanner selectedDate={selectedDate} hasData={dailyData.length > 0} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: DIM, fontSize: 14 }}>
            불러오는 중...
          </div>
        ) : (
          <>
            {/* Treemap (only when viewMode === 'treemap') */}
            {viewMode === 'treemap' && (
              <div style={{
                background: SURFACE, border: `1px solid ${BORDER}`,
                borderRadius: 8, overflow: 'hidden', marginBottom: 12,
                height: 374, display: 'flex', flexDirection: 'column', padding: '8px',
              }}>
                <TreemapView data={dailyData} onSelect={selectItem} />
              </div>
            )}

            {/* Detail panel — between treemap and table */}
            {selectedItem && (
              <DetailPanel
                item={selectedItem}
                trendData={trendData}
                varietyData={varietyData}
                originData={originData}
                detailLoading={detailLoading}
                onClose={() => setSelectedItem(null)}
              />
            )}

            {/* Category tabs + table */}
            <div style={{
              background: SURFACE, border: `1px solid ${BORDER}`,
              borderRadius: 8, overflow: 'hidden', marginBottom: 0,
            }}>
              {/* View toggle + Category tabs */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                borderBottom: `1px solid ${BORDER}`, flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', marginRight: 4 }}>
                  {['treemap', 'table'].map(mode => (
                    <button key={mode} onClick={() => setViewMode(mode)} style={{
                      padding: '4px 14px', border: 'none', cursor: 'pointer', fontSize: 12,
                      background: viewMode === mode ? ACCENT : 'transparent',
                      color: viewMode === mode ? '#fff' : DIM,
                      fontWeight: viewMode === mode ? 600 : 400,
                      transition: 'all 0.15s',
                    }}>
                      {mode === 'treemap' ? '트리맵' : '테이블'}
                    </button>
                  ))}
                </div>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '4px 12px', borderRadius: 16, fontSize: 12,
                      border: `1px solid ${activeCategory === cat ? '#1e9070' : BORDER}`,
                      background: activeCategory === cat ? '#1e9070' : SURFACE,
                      color: activeCategory === cat ? '#fff' : DIM,
                      cursor: 'pointer', fontWeight: activeCategory === cat ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <ProductTable data={filteredData} onSelect={selectItem} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

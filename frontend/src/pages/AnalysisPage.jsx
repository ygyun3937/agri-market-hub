// src/pages/AnalysisPage.jsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy'
import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import Header from '../components/Header/Header'
import AnalysisNav from '../components/Analysis/AnalysisNav'
import client from '../api/client'
import { MOCK_DAILY, MOCK_TREND } from '../data/analysisMock'

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG      = '#0d1117'
const SURFACE = '#161b22'
const BORDER  = '#30363d'
const TEXT    = '#c9d1d9'
const DIM     = '#8b949e'
const ACCENT  = '#58a6ff'
const GREEN   = '#3fb950'
const RED     = '#f85149'
const BLUE    = '#58a6ff'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getYesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function fmtDate(dateStr) {
  return dateStr ? dateStr.slice(5).replace('-', '/') : ''
}

function getChangeColor(change) {
  if (change == null) return '#30363d'
  if (change >= 5)    return '#b91c1c'
  if (change >= 2)    return '#ef4444'
  if (change >= 0.5)  return '#fca5a5'
  if (change > -0.5)  return '#4b5563'
  if (change > -2)    return '#93c5fd'
  if (change > -5)    return '#3b82f6'
  return '#1d4ed8'
}

// ─── KPI Row ──────────────────────────────────────────────────────────────────
function StatCard({ label, value }) {
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: 11, color: DIM, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: TEXT }}>{value}</div>
    </div>
  )
}

function KpiRow({ data, selectedDate }) {
  const totalVolume = data.reduce((s, r) => s + Number(r.volume || 0), 0)
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
      <StatCard label="전국 도매시장" value={`${data.length}개`} />
      <StatCard label="모니터링 품목" value={`${data.length}개`} />
      <StatCard label="총 거래량" value={`${totalVolume.toLocaleString()}박스`} />
      <StatCard label="기준일" value={selectedDate} />
    </div>
  )
}

// ─── Change Badge ─────────────────────────────────────────────────────────────
function ChangeBadge({ change }) {
  if (change == null) return <span style={{ color: DIM, fontSize: 12 }}>-</span>
  const up = change > 0
  const zero = change === 0
  return (
    <span style={{
      fontSize: 12, fontWeight: 600,
      color: zero ? DIM : up ? RED : BLUE,
      background: zero ? 'transparent' : up ? '#f8514920' : '#58a6ff20',
      padding: '2px 6px', borderRadius: 4,
    }}>
      {up ? '▲' : zero ? '–' : '▼'} {Math.abs(change).toFixed(1)}%
    </span>
  )
}

// ─── Top Movers ───────────────────────────────────────────────────────────────
function MoversCard({ title, items, color, onSelect }) {
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 8, padding: '12px 16px', marginBottom: 12,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 10 }}>{title}</div>
      {items.length === 0
        ? <div style={{ fontSize: 12, color: DIM }}>7일 데이터 수집 중...</div>
        : items.map(item => (
          <div
            key={item.itemCode}
            onClick={() => onSelect(item)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 0', borderBottom: `1px solid ${BORDER}`,
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#21262d' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ fontSize: 13, color: TEXT }}>{item.itemName}</span>
            <ChangeBadge change={item.change7d} />
          </div>
        ))
      }
    </div>
  )
}

function TopMovers({ data, onSelect }) {
  const withChange = data.filter(d => d.change7d != null)
  const risers  = [...withChange].filter(d => d.change7d > 0)
    .sort((a, b) => b.change7d - a.change7d).slice(0, 4)
  const fallers = [...withChange].filter(d => d.change7d < 0)
    .sort((a, b) => a.change7d - b.change7d).slice(0, 4)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
      <MoversCard
        title="🔴 급등 TOP (7일 대비)"
        items={risers}
        color={RED}
        onSelect={onSelect}
      />
      <MoversCard
        title="🔵 급락 TOP (7일 대비)"
        items={fallers}
        color={BLUE}
        onSelect={onSelect}
      />
    </div>
  )
}

// ─── Price Range Bar ──────────────────────────────────────────────────────────
function PriceRangeBar({ min, avg, max }) {
  const range = max - min
  const pct = range > 0 ? Math.round(((avg - min) / range) * 100) : 50
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 140 }}>
      <span style={{ fontSize: 10, color: DIM, width: 40, textAlign: 'right' }}>
        {Number(min).toLocaleString()}
      </span>
      <div style={{ position: 'relative', flex: 1, height: 6, background: '#21262d', borderRadius: 3 }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: 6,
          background: '#2ea043', borderRadius: 3, width: `${pct}%`,
        }} />
        <div style={{
          position: 'absolute', top: '50%',
          transform: 'translateY(-50%) translateX(-50%)',
          left: `${pct}%`, width: 10, height: 10,
          background: GREEN, borderRadius: '50%',
          border: '2px solid #0d1117',
        }} />
      </div>
      <span style={{ fontSize: 10, color: DIM, width: 40 }}>
        {Number(max).toLocaleString()}
      </span>
    </div>
  )
}

// ─── Table View ───────────────────────────────────────────────────────────────
function TableView({ rows, onSelect }) {
  if (rows.length === 0) {
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
            {['품목명', '전국 평균가', '7일 대비', '거래량', '가격 범위(최저~최고)'].map(h => (
              <th key={h} style={{
                padding: '8px 12px', textAlign: h === '품목명' ? 'left' : 'right',
                color: DIM, fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={`${row.itemCode}-${i}`}
              onClick={() => onSelect(row)}
              style={{ borderBottom: `1px solid #21262d`, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#21262d' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <td style={{ padding: '8px 12px' }}>
                <div style={{ fontWeight: 700, color: TEXT }}>{row.itemName}</div>
                <div style={{ fontSize: 11, color: DIM }}>{row.category}</div>
              </td>
              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: TEXT }}>
                {Number(row.avgPrice).toLocaleString()}원
              </td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                <ChangeBadge change={row.change7d != null ? Number(row.change7d) : null} />
              </td>
              <td style={{ padding: '8px 12px', textAlign: 'right', color: DIM }}>
                {Number(row.volume).toLocaleString()}박스
              </td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                <PriceRangeBar
                  min={Number(row.minPrice)}
                  avg={Number(row.avgPrice)}
                  max={Number(row.maxPrice)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── D3 Treemap View ──────────────────────────────────────────────────────────
function TreemapView({ data, onSelect }) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)

  const renderTreemap = useCallback(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    if (width === 0 || height === 0) return

    const svg = svgRef.current
    // Clear previous content
    while (svg.firstChild) svg.removeChild(svg.firstChild)
    svg.setAttribute('width', width)
    svg.setAttribute('height', height)

    // Group by category
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

    // Draw category groups
    root.children.forEach(catNode => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('x', catNode.x0)
      rect.setAttribute('y', catNode.y0)
      rect.setAttribute('width', catNode.x1 - catNode.x0)
      rect.setAttribute('height', catNode.y1 - catNode.y0)
      rect.setAttribute('fill', '#1f2937')
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

      // Draw leaf cells
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
          lt.setAttribute('fill', '#e6edf3')
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
              ct.setAttribute('fill', '#e6edf3')
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
    { label: '보합',      color: '#4b5563' },
    { label: '소폭하락',  color: '#93c5fd' },
    { label: '하락',      color: '#3b82f6' },
    { label: '급락 ↓5%+', color: '#1d4ed8' },
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

// ─── Main Section (toggle + tabs + table/treemap) ─────────────────────────────
const CATEGORY_TOP = '🔥 거래량 TOP'
const CATEGORY_ALL = '전체'

function MainSection({ data, viewMode, setViewMode, activeCategory, setActiveCategory, onSelect }) {
  const categories = [CATEGORY_TOP, CATEGORY_ALL, ...Array.from(new Set(data.map(d => d.category))).filter(Boolean)]

  let rows = data
  if (activeCategory === CATEGORY_TOP) {
    rows = [...data].sort((a, b) => Number(b.volume) - Number(a.volume)).slice(0, 10)
  } else if (activeCategory !== CATEGORY_ALL) {
    rows = data.filter(d => d.category === activeCategory)
  }

  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 8, overflow: 'hidden', marginBottom: 12,
      display: 'flex', flexDirection: 'column',
      minHeight: viewMode === 'treemap' ? 420 : 0,
    }}>
      {/* Toggle + category bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px', borderBottom: `1px solid ${BORDER}`,
        flexWrap: 'wrap', flexShrink: 0,
      }}>
        {/* View toggle */}
        <div style={{ display: 'flex', border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', marginRight: 8 }}>
          {['table', 'treemap'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '4px 14px', border: 'none', cursor: 'pointer', fontSize: 12,
                background: viewMode === mode ? ACCENT : 'transparent',
                color: viewMode === mode ? '#fff' : DIM,
                fontWeight: viewMode === mode ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {mode === 'table' ? '테이블' : '트리맵'}
            </button>
          ))}
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '4px 12px', borderRadius: 16, fontSize: 12,
                border: `1px solid ${activeCategory === cat ? '#238636' : BORDER}`,
                background: activeCategory === cat ? '#238636' : SURFACE,
                color: activeCategory === cat ? '#fff' : DIM,
                cursor: 'pointer', fontWeight: activeCategory === cat ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: viewMode === 'treemap' ? 'hidden' : 'visible', minHeight: viewMode === 'treemap' ? 380 : 0 }}>
        {viewMode === 'table'
          ? <TableView rows={rows} onSelect={onSelect} />
          : <div style={{ height: 400, padding: '0 0 0 0' }}>
              <TreemapView data={rows} onSelect={onSelect} />
            </div>
        }
      </div>
    </div>
  )
}

// ─── Trend Panel ──────────────────────────────────────────────────────────────
function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#161b22', border: `1px solid #30363d`,
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

function TrendPanel({ item, data, trendLoading, onClose }) {
  const chartData = data.map(row => ({
    date: fmtDate(row.date),
    avgPrice: Number(row.avgPrice),
    volume: Number(row.volume),
  }))

  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 8, padding: '12px 16px', marginBottom: 12,
      animation: 'slideIn 0.2s ease-out',
    }}>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }`}</style>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{item.itemName}</span>
        <span style={{ fontSize: 12, color: DIM }}>30일 가격 추이</span>
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto', background: 'none', border: `1px solid ${BORDER}`,
            color: DIM, fontSize: 13, width: 24, height: 24,
            borderRadius: 4, cursor: 'pointer', lineHeight: 1,
          }}
        >×</button>
      </div>

      {trendLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: DIM, fontSize: 13 }}>불러오는 중...</div>
      ) : chartData.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: DIM, fontSize: 13 }}>데이터 없음</div>
      ) : (
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 40, bottom: 8, left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis
                dataKey="date"
                tick={{ fill: DIM, fontSize: 11 }}
                axisLine={{ stroke: BORDER }}
                tickLine={false}
              />
              <YAxis
                yAxisId="price"
                orientation="left"
                tick={{ fill: DIM, fontSize: 11 }}
                axisLine={{ stroke: BORDER }}
                tickLine={false}
                tickFormatter={v => v.toLocaleString()}
              />
              <YAxis
                yAxisId="vol"
                orientation="right"
                tick={{ fill: DIM, fontSize: 11 }}
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
                opacity={0.6}
                radius={[2, 2, 0, 0]}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="avgPrice"
                name="평균가"
                stroke={BLUE}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: BLUE }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ─── Page Header ──────────────────────────────────────────────────────────────
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
      borderRadius: 6, padding: '8px 14px', marginBottom: 12,
      fontSize: 13, color: '#d29922', display: 'flex', alignItems: 'center', gap: 8,
    }}>
      ⚠️ {msg} 가장 가까운 거래일을 선택해주세요.
    </div>
  )
}

function PageHeader({ selectedDate, setSelectedDate }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', background: SURFACE,
      borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
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
            max={getYesterday()}
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
export default function AnalysisPage() {
  const [selectedDate, setSelectedDate]       = useState(getYesterday)
  const [dailyData, setDailyData]             = useState([])
  const [trendData, setTrendData]             = useState([])
  const [selectedItem, setSelectedItem]       = useState(null)
  const [viewMode, setViewMode]               = useState('table')
  const [activeCategory, setActiveCategory]   = useState(CATEGORY_ALL)
  const [loading, setLoading]                 = useState(false)
  const [trendLoading, setTrendLoading]       = useState(false)

  // Fetch daily on date change
  useEffect(() => {
    setLoading(true)
    client.get(`/analysis/daily?date=${selectedDate}`)
      .then(r => setDailyData(r.data?.length ? r.data : MOCK_DAILY))
      .catch(() => setDailyData(MOCK_DAILY))
      .finally(() => setLoading(false))
  }, [selectedDate])

  // Fetch trend when item selected
  useEffect(() => {
    if (!selectedItem) {
      setTrendData([])
      return
    }
    setTrendLoading(true)
    client.get(`/analysis/trend?itemCode=${selectedItem.itemCode}&days=30`)
      .then(r => setTrendData(r.data?.length ? r.data : MOCK_TREND(selectedItem.itemCode)))
      .catch(() => setTrendData(MOCK_TREND(selectedItem.itemCode)))
      .finally(() => setTrendLoading(false))
  }, [selectedItem])

  const selectItem = useCallback((item) => {
    setSelectedItem({ itemCode: item.itemCode, itemName: item.itemName })
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: BG, overflow: 'hidden', color: TEXT }}>
      <Header />
      <PageHeader selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      <AnalysisNav />

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: DIM, fontSize: 14 }}>
            불러오는 중...
          </div>
        ) : (
          <>
            <HolidayBanner selectedDate={selectedDate} hasData={dailyData.length > 0} />
            <KpiRow data={dailyData} selectedDate={selectedDate} />
            <TopMovers data={dailyData} onSelect={selectItem} />
            <MainSection
              data={dailyData}
              viewMode={viewMode}
              setViewMode={setViewMode}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              onSelect={selectItem}
            />
            {selectedItem && (
              <TrendPanel
                item={selectedItem}
                data={trendData}
                trendLoading={trendLoading}
                onClose={() => setSelectedItem(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

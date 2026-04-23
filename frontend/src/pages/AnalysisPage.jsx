// src/pages/AnalysisPage.jsx
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
import { MOCK_DAILY, MOCK_TREND } from '../data/analysisMock'

const MOCK_LIVESTOCK = [
  { itemCode: 'L001', itemName: '한우 등심(거세)',  category: '소',    price: 8900, unit: '100g', change7d: 1.2 },
  { itemCode: 'L002', itemName: '한우 설도(거세)',  category: '소',    price: 5200, unit: '100g', change7d: -0.8 },
  { itemCode: 'L003', itemName: '한우 앞다리(거세)', category: '소',   price: 4800, unit: '100g', change7d: 0.3 },
  { itemCode: 'L004', itemName: '육우 등심',        category: '소',    price: 5900, unit: '100g', change7d: -1.5 },
  { itemCode: 'L011', itemName: '돼지 삼겹살',      category: '돼지',  price: 2450, unit: '100g', change7d: 2.1 },
  { itemCode: 'L012', itemName: '돼지 목심',        category: '돼지',  price: 2100, unit: '100g', change7d: -0.5 },
  { itemCode: 'L013', itemName: '돼지 앞다리',      category: '돼지',  price: 1680, unit: '100g', change7d: 0.0 },
  { itemCode: 'L021', itemName: '닭(육계)',          category: '닭·계란', price: 4200, unit: '1kg',  change7d: 3.2 },
  { itemCode: 'L031', itemName: '계란 특란',         category: '닭·계란', price: 1420, unit: '30개', change7d: -1.2 },
  { itemCode: 'L032', itemName: '계란 대란',         category: '닭·계란', price: 1280, unit: '30개', change7d: -0.8 },
]

const LIVESTOCK_BASE_PRICE = {
  'L001': 8900, 'L002': 5200, 'L003': 4800, 'L004': 5900,
  'L011': 2450, 'L012': 2100, 'L013': 1680,
  'L021': 4200, 'L031': 1420, 'L032': 1280,
}
function MOCK_LIVESTOCK_TREND(itemCode) {
  const base = LIVESTOCK_BASE_PRICE[itemCode] || 5000
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 29 + i)
    const price = Math.round(base + (Math.random() - 0.5) * base * 0.08)
    return { itemCode, date: d.toISOString().slice(0, 10), avgPrice: price, price, volume: 0 }
  })
}

const LIVESTOCK_SUB_TABS = ['소', '돼지', '닭·계란']
const LIVESTOCK_ICONS = { '소': '🐄', '돼지': '🐷', '닭·계란': '🐔' }

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
  if (change >= 5)    return '#b91c1c'
  if (change >= 2)    return '#ef4444'
  if (change >= 0.5)  return '#fca5a5'
  if (change > -0.5)  return '#4a6278'
  if (change > -2)    return '#a8d4ff'
  if (change > -5)    return '#5ba3f5'
  return '#1a69c4'
}

// ─── KPI Row ──────────────────────────────────────────────────────────────────
function StatCard({ label, value }) {
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: 12, color: DIM, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: TEXT }}>{value}</div>
    </div>
  )
}

function KpiRow({ data, selectedDate }) {
  const totalVolume = data.reduce((s, r) => s + Number(r.volume || 0), 0)
  const isMobile = window.innerWidth <= 768
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
      <StatCard label="전국 도매시장" value={`${data.length}개`} />
      <StatCard label="모니터링 품목" value={`${data.length}개`} />
      <StatCard label="총 거래량" value={`${totalVolume.toLocaleString()}박스`} />
      <StatCard label="기준일" value={selectedDate} />
    </div>
  )
}

// ─── Change Badge ─────────────────────────────────────────────────────────────
function ChangeBadge({ change }) {
  if (change == null) return <span style={{ color: DIM, fontSize: 13 }}>-</span>
  const up = change > 0
  const zero = change === 0
  return (
    <span style={{
      fontSize: 13, fontWeight: 600,
      color: zero ? DIM : up ? RED : BLUE,
      background: zero ? 'transparent' : up ? '#f8514920' : '#82cfff20',
      padding: '2px 6px', borderRadius: 4,
    }}>
      {up ? '▲' : zero ? '–' : '▼'} {Math.abs(change).toFixed(1)}%
    </span>
  )
}

// ─── Price Heatmap ────────────────────────────────────────────────────────────
function PriceHeatmap({ data, onSelect }) {
  if (data.length === 0) return null
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: DIM, marginBottom: 8 }}>📊 품목별 가격 현황</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 6 }}>
        {data.map(item => (
          <div
            key={item.itemCode}
            onClick={() => onSelect(item)}
            style={{
              background: getChangeColor(item.change7d),
              borderRadius: 6,
              padding: '8px 10px',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#eef5fb' }}>{item.itemName}</div>
            <div style={{ fontSize: 11, color: '#eef5fb', opacity: 0.85, marginTop: 2 }}>
              {Number(item.avgPrice).toLocaleString()}원
            </div>
            {item.change7d != null && (
              <div style={{ fontSize: 11, color: '#eef5fb', marginTop: 3 }}>
                {item.change7d > 0 ? '▲' : '▼'} {Math.abs(item.change7d).toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Top Movers ───────────────────────────────────────────────────────────────
function MoversCard({ title, items, onSelect }) {
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 8, padding: '12px 16px', marginBottom: 12,
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 10 }}>{title}</div>
      {items.length === 0
        ? <div style={{ fontSize: 13, color: DIM }}>7일 데이터 수집 중...</div>
        : items.map(item => (
          <div
            key={item.itemCode}
            onClick={() => onSelect(item)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 0', borderBottom: `1px solid ${BORDER}`,
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2d4255' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ fontSize: 14, color: TEXT }}>{item.itemName}</span>
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

  const isMobile = window.innerWidth <= 768
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 12 }}>
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
      <div style={{ position: 'relative', flex: 1, height: 6, background: '#2d4255', borderRadius: 3 }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: 6,
          background: '#22a882', borderRadius: 3, width: `${pct}%`,
        }} />
        <div style={{
          position: 'absolute', top: '50%',
          transform: 'translateY(-50%) translateX(-50%)',
          left: `${pct}%`, width: 10, height: 10,
          background: GREEN, borderRadius: '50%',
          border: '2px solid #1c2a36',
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
  const isMobile = window.innerWidth <= 768

  if (rows.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: DIM, fontSize: 15 }}>
        데이터 없음
      </div>
    )
  }

  if (isMobile) {
    return (
      <div>
        {rows.map((row, i) => (
          <div
            key={`${row.itemCode}-${i}`}
            onClick={() => onSelect(row)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderBottom: `1px solid ${BORDER}`,
              cursor: 'pointer',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: TEXT, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {row.itemName}
              </div>
              <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>
                {row.category} · {Number(row.volume).toLocaleString()}박스
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, color: TEXT, fontSize: 14 }}>
                {Number(row.avgPrice).toLocaleString()}원
                {row.unit && <span style={{ fontSize: 10, color: DIM, marginLeft: 3 }}>/{row.unit}</span>}
              </div>
              <div style={{ marginTop: 2 }}>
                <ChangeBadge change={row.change7d != null ? Number(row.change7d) : null} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
            {['품목명', '전국 평균가', '7일 대비', '거래량', '가격 범위(최저~최고)'].map(h => (
              <th key={h} style={{
                padding: '8px 12px', textAlign: h === '품목명' ? 'left' : 'right',
                color: DIM, fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={`${row.itemCode}-${i}`}
              onClick={() => onSelect(row)}
              style={{ borderBottom: `1px solid #2d4255`, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2d4255' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <td style={{ padding: '8px 12px' }}>
                <div style={{ fontWeight: 700, color: TEXT }}>{row.itemName}</div>
                <div style={{ fontSize: 12, color: DIM }}>{row.category}</div>
              </td>
              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: TEXT }}>
                <div>{Number(row.avgPrice).toLocaleString()}원</div>
                {row.unit && <div style={{ fontSize: 10, color: DIM, marginTop: 1 }}>/{row.unit}</div>}
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
      <div style={{ padding: 40, textAlign: 'center', color: DIM, fontSize: 15 }}>
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
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: TEXT }}>
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
                padding: '4px 14px', border: 'none', cursor: 'pointer', fontSize: 13,
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
                padding: '4px 12px', borderRadius: 16, fontSize: 13,
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
      background: '#253748', border: `1px solid #354d65`,
      borderRadius: 6, color: TEXT, fontSize: 13, padding: '8px 12px',
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
        <span style={{ fontSize: 13, color: DIM }}>30일 가격 추이</span>
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto', background: 'none', border: `1px solid ${BORDER}`,
            color: DIM, fontSize: 14, width: 24, height: 24,
            borderRadius: 4, cursor: 'pointer', lineHeight: 1,
          }}
        >×</button>
      </div>

      {trendLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: DIM, fontSize: 14 }}>불러오는 중...</div>
      ) : chartData.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: DIM, fontSize: 14 }}>데이터 없음</div>
      ) : (
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 40, bottom: 8, left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d4255" />
              <XAxis
                dataKey="date"
                tick={{ fill: DIM, fontSize: 12 }}
                axisLine={{ stroke: BORDER }}
                tickLine={false}
              />
              <YAxis
                yAxisId="price"
                orientation="left"
                tick={{ fill: DIM, fontSize: 12 }}
                axisLine={{ stroke: BORDER }}
                tickLine={false}
                tickFormatter={v => v.toLocaleString()}
              />
              <YAxis
                yAxisId="vol"
                orientation="right"
                tick={{ fill: DIM, fontSize: 12 }}
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
      borderRadius: 6, padding: '8px 14px', margin: '12px 16px 0',
      fontSize: 14, color: '#d29922', display: 'flex', alignItems: 'center', gap: 8,
    }}>
      ⚠️ {msg} 가장 가까운 거래일을 선택해주세요.
    </div>
  )
}

function PageHeader({ selectedDate, setSelectedDate }) {
  const isMobile = window.innerWidth <= 768
  return (
    <div style={{
      display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between', gap: isMobile ? 6 : 0,
      padding: isMobile ? '8px 12px' : '12px 16px', background: SURFACE,
      borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
    }}>
      {!isMobile && (
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT }}>
          전국 농수산물 경매 현황
        </h1>
      )}
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: DIM }}>
        {isMobile ? '📅 기준일:' : '기준일:'}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <input
            type="date"
            value={selectedDate}
            max={getToday()}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              background: BG, border: `1px solid ${BORDER}`, borderRadius: 5,
              color: TEXT, fontSize: 14, padding: '4px 28px 4px 8px', outline: 'none', cursor: 'pointer',
            }}
          />
          <span style={{ position: 'absolute', right: 6, pointerEvents: 'none', fontSize: 15 }}>📅</span>
        </div>
      </label>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
// ─── Livestock KPI Row ────────────────────────────────────────────────────────
function LivestockKpiRow({ data, selectedDate }) {
  const withChange = data.filter(d => d.change7d != null)
  const risers = withChange.filter(d => d.change7d > 0).length
  const fallers = withChange.filter(d => d.change7d < 0).length
  const isMobile = window.innerWidth <= 768
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
      <StatCard label="모니터링 품목" value={`${data.length}개`} />
      <StatCard label="가격 상승" value={`${risers}개`} />
      <StatCard label="가격 하락" value={`${fallers}개`} />
      <StatCard label="기준일" value={selectedDate} />
    </div>
  )
}

// ─── Livestock Table ──────────────────────────────────────────────────────────
function LivestockTable({ rows, onSelect }) {
  const isMobile = window.innerWidth <= 768
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 10px' }}>
        {rows.map(item => (
          <div key={item.itemCode} onClick={() => onSelect(item)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#1c2a36', border: '1px solid #354d65', borderRadius: 6, padding: '8px 10px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{item.itemName}</div>
              <div style={{ fontSize: 11, color: DIM }}>/{item.unit}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>₩{Number(item.price).toLocaleString()}</div>
              <ChangeBadge change={item.change7d} />
            </div>
          </div>
        ))}
      </div>
    )
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: BG }}>
          {['품목', '가격', '단위', '7일比'].map((h, i) => (
            <th key={h} style={{ padding: '8px 12px', fontSize: 11, color: DIM,
              borderBottom: `1px solid ${BORDER}`,
              textAlign: i === 0 ? 'left' : i === 2 ? 'center' : 'right' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(item => (
          <tr key={item.itemCode} onClick={() => onSelect(item)}
            style={{ borderBottom: `1px solid #2d4255`, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2d4255' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            <td style={{ padding: '9px 12px', fontSize: 13, color: TEXT }}>{item.itemName}</td>
            <td style={{ padding: '9px 12px', fontSize: 14, fontWeight: 700, color: TEXT, textAlign: 'right' }}>
              ₩{Number(item.price).toLocaleString()}
            </td>
            <td style={{ padding: '9px 12px', fontSize: 11, color: DIM, textAlign: 'center' }}>/{item.unit}</td>
            <td style={{ padding: '9px 12px', textAlign: 'right' }}><ChangeBadge change={item.change7d} /></td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: DIM }}>데이터 없음</td></tr>
        )}
      </tbody>
    </table>
  )
}

// ─── Livestock Section ────────────────────────────────────────────────────────
function LivestockSection({ selectedDate }) {
  const [subTab, setSubTab] = useState('소')
  const [data, setData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [trendLoading, setTrendLoading] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setSelectedItem(null)
    setTrendData([])
    client.get(`/livestock/daily?date=${selectedDate}`)
      .then(r => setData(r.data?.length ? r.data : MOCK_LIVESTOCK))
      .catch(() => setData(MOCK_LIVESTOCK))
      .finally(() => setLoading(false))
  }, [selectedDate])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selectedItem) { setTrendData([]); return }
    setTrendLoading(true)
    client.get(`/livestock/trend?itemCode=${selectedItem.itemCode}&days=30`)
      .then(r => {
        const rows = (r.data || []).map(d => ({ ...d, avgPrice: d.price, volume: 0 }))
        setTrendData(rows.length ? rows : MOCK_LIVESTOCK_TREND(selectedItem.itemCode))
      })
      .catch(() => setTrendData(MOCK_LIVESTOCK_TREND(selectedItem.itemCode)))
      .finally(() => setTrendLoading(false))
  }, [selectedItem])

  const selectItem = useCallback((item) => {
    setSelectedItem({ itemCode: item.itemCode, itemName: item.itemName })
  }, [])

  const filtered = data.filter(d => d.category === subTab)
  // 농산물 컴포넌트 재사용 위해 avgPrice 필드 정규화
  const normalized = filtered.map(d => ({ ...d, avgPrice: d.price, minPrice: d.price, maxPrice: d.price, volume: 0 }))

  return (
    <div>
      {/* 축종 서브탭 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {LIVESTOCK_SUB_TABS.map(tab => (
          <button key={tab} onClick={() => { setSubTab(tab); setSelectedItem(null) }} style={{
            padding: '6px 18px', borderRadius: 20,
            border: `1px solid ${subTab === tab ? '#6ab8ff' : BORDER}`,
            background: subTab === tab ? '#1a7fd4' : SURFACE,
            color: subTab === tab ? '#fff' : DIM,
            fontWeight: subTab === tab ? 700 : 400,
            cursor: 'pointer', fontSize: 13,
          }}>
            {LIVESTOCK_ICONS[tab]} {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: DIM, fontSize: 15 }}>불러오는 중...</div>
      ) : (
        <>
          <LivestockKpiRow data={normalized} selectedDate={selectedDate} />
          <TopMovers data={normalized} onSelect={selectItem} />
          <PriceHeatmap data={normalized} onSelect={selectItem} />
          {selectedItem && (
            <TrendPanel
              item={selectedItem}
              data={trendData}
              trendLoading={trendLoading}
              onClose={() => setSelectedItem(null)}
            />
          )}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, fontSize: 13, color: ACCENT, fontWeight: 600 }}>
              {LIVESTOCK_ICONS[subTab]} {subTab} 전체 품목
            </div>
            <LivestockTable rows={filtered} onSelect={selectItem} />
          </div>
          <div style={{ fontSize: 11, color: DIM, marginBottom: 8 }}>
            📌 KAMIS 도매 기준가 · 품목 클릭 시 30일 추이 확인
          </div>
        </>
      )}
    </div>
  )
}

export default function AnalysisPage() {
  const [mainTab, setMainTab]                 = useState('농산물')
  const [selectedDate, setSelectedDate]       = useState(getToday)
  const [dailyData, setDailyData]             = useState([])
  const [trendData, setTrendData]             = useState([])
  const [selectedItem, setSelectedItem]       = useState(null)
  const [viewMode, setViewMode]               = useState('table')
  const [activeCategory, setActiveCategory]   = useState(CATEGORY_ALL)
  const [loading, setLoading]                 = useState(false)
  const [trendLoading, setTrendLoading]       = useState(false)

  // Fetch daily on date change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    client.get(`/analysis/daily?date=${selectedDate}`)
      .then(r => setDailyData(r.data?.length ? r.data : MOCK_DAILY))
      .catch(() => setDailyData(MOCK_DAILY))
      .finally(() => setLoading(false))
  }, [selectedDate])

  // Fetch trend when item selected
  useEffect(() => {
    if (!selectedItem) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <NewsTicker />
      <PageHeader selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      <AnalysisNav />

      {/* 농산물 / 축산물 탭 */}
      <div style={{ display: 'flex', gap: 0, padding: '0 16px', borderBottom: `1px solid ${BORDER}`, background: BG, flexShrink: 0 }}>
        {[['🌾 농산물 경매', '농산물'], ['🐄 축산물 경매', '축산물']].map(([label, tab]) => (
          <button key={tab} onClick={() => setMainTab(tab)} style={{
            padding: '8px 20px', fontSize: 13, background: 'none', cursor: 'pointer',
            color: mainTab === tab ? ACCENT : DIM,
            border: 'none',
            borderBottom: `2px solid ${mainTab === tab ? ACCENT : 'transparent'}`,
            fontWeight: mainTab === tab ? 700 : 400,
          }}>{label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px' }}>
        {mainTab === '축산물' ? (
          <LivestockSection selectedDate={selectedDate} />
        ) : (
          <>
            <HolidayBanner selectedDate={selectedDate} hasData={dailyData.length > 0} />
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: DIM, fontSize: 15 }}>
                불러오는 중...
              </div>
            ) : (
              <>
                <KpiRow data={dailyData} selectedDate={selectedDate} />
                <TopMovers data={dailyData} onSelect={selectItem} />
                <PriceHeatmap data={dailyData} onSelect={selectItem} />
                {selectedItem && (
                  <TrendPanel
                    item={selectedItem}
                    data={trendData}
                    trendLoading={trendLoading}
                    onClose={() => setSelectedItem(null)}
                  />
                )}
                <MainSection
                  data={dailyData}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  onSelect={selectItem}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

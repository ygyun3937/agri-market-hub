// src/components/PricePanel/PricePanel.jsx
import { useEffect, useState } from 'react'
import client from '../../api/client'

const SEASONAL = ['111', '112', '411']
const ITEM_NAMES = { '111': '봄배추', '112': '무', '211': '양파', '214': '당근', '215': '감자', '411': '쌀' }
const ITEM_ICONS = { '111': '🥬', '112': '🌿', '211': '🧅', '214': '🥕', '215': '🥔', '411': '🌾' }

function PriceRow({ price }) {
  const isUp = (price.changePercent ?? 0) >= 0
  const isSeasonal = SEASONAL.includes(price.itemCode)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 7px', background: '#0d1117',
      border: '1px solid #30363d', borderRadius: 5,
      borderLeft: `2px solid ${isSeasonal ? '#d2992266' : '#58a6ff66'}`
    }}>
      <span style={{ fontSize: 13 }}>{ITEM_ICONS[price.itemCode] || '🌿'}</span>
      <span style={{ fontSize: 10, color: '#c9d1d9', flex: 1 }}>
        {ITEM_NAMES[price.itemCode] || price.itemCode}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700 }}>
        ₩{price.price?.toLocaleString()}
      </span>
      {price.changePercent != null && (
        <span style={{ fontSize: 10, fontWeight: 700, color: isUp ? '#f85149' : '#3fb950' }}>
          {isUp ? '▲' : '▼'}{Math.abs(price.changePercent)}%
        </span>
      )}
    </div>
  )
}

export default function PricePanel() {
  const [prices, setPrices] = useState([])

  useEffect(() => {
    client.get('/prices?market=100110').then(r => setPrices(r.data)).catch(() => {})
  }, [])

  const seasonal = prices.filter(p => SEASONAL.includes(p.itemCode))
  const watchlist = prices.filter(p => !SEASONAL.includes(p.itemCode))

  return (
    <div style={{ padding: '0 0 8px' }}>
      <div style={{ padding: '6px 12px 4px', fontSize: 9, color: '#d29922',
        textTransform: 'uppercase', letterSpacing: 0.8,
        display: 'flex', justifyContent: 'space-between',
        borderBottom: '1px solid #21262d' }}>
        <span>🌿 4월 제철</span>
        <span style={{ color: '#8b949e' }}>KAMIS</span>
      </div>
      <div style={{ padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {seasonal.map(p => <PriceRow key={p.itemCode} price={p} />)}
        {seasonal.length === 0 && (
          <div style={{ fontSize: 11, color: '#8b949e', padding: 8 }}>데이터 없음</div>
        )}
      </div>
      <div style={{ height: 1, background: '#21262d', margin: '3px 0' }} />
      <div style={{ padding: '4px 12px 4px', fontSize: 9, color: '#58a6ff',
        textTransform: 'uppercase', letterSpacing: 0.8,
        display: 'flex', justifyContent: 'space-between' }}>
        <span>⭐ 내 관심 품목</span>
        <span style={{ fontSize: 9, color: '#58a6ff', cursor: 'pointer' }}>+ 추가</span>
      </div>
      <div style={{ padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {watchlist.map(p => <PriceRow key={p.itemCode} price={p} />)}
        {watchlist.length === 0 && (
          <div style={{ fontSize: 11, color: '#8b949e', padding: 8 }}>설정한 품목 없음</div>
        )}
        <button style={{
          margin: '4px 0 0', padding: 4, background: '#21262d',
          border: '1px dashed #30363d', borderRadius: 5,
          fontSize: 10, color: '#8b949e', cursor: 'pointer'
        }}>＋ 품목 추가</button>
      </div>
    </div>
  )
}

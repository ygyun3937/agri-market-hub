// src/components/PricePanel/PricePanel.jsx
import { useEffect, useState } from 'react'
import client from '../../api/client'

const SEASONAL = ['111', '112', '411']
const ITEM_NAMES = { '111': '봄배추', '112': '무', '211': '양파', '214': '당근', '215': '감자', '311': '사과', '312': '배', '411': '쌀' }
const ITEM_ICONS = { '111': '🥬', '112': '🌿', '211': '🧅', '214': '🥕', '215': '🥔', '311': '🍎', '312': '🍐', '411': '🌾' }
const UNIT_MAP = {
  '111': '10kg', '112': '20kg', '211': '20kg', '214': '20kg', '215': '20kg',
  '311': '10kg', '312': '15kg', '313': '2kg',  '314': '개',   '315': '4.5kg',
  '411': '10kg', '421': '30kg', '511': '단',   '612': '10kg', '711': '1kg',
  '213': '10kg', '216': '10kg', '217': '10kg', '218': '10kg', '219': '4kg',
  '221': '개',   '222': '100개','223': '5kg',  '224': '2kg',  '225': '10kg',
  '226': '4kg',  '412': '30kg', '413': '30kg',
}

const EXTRA_ITEMS = [
  { code: '213', name: '마늘', icon: '🧄' },
  { code: '216', name: '고구마', icon: '🍠' },
  { code: '217', name: '고추', icon: '🌶️' },
  { code: '218', name: '파', icon: '🌱' },
  { code: '219', name: '시금치', icon: '🥬' },
  { code: '221', name: '수박', icon: '🍉' },
  { code: '222', name: '오이', icon: '🥒' },
  { code: '223', name: '토마토', icon: '🍅' },
  { code: '224', name: '딸기', icon: '🍓' },
  { code: '225', name: '호박', icon: '🎃' },
  { code: '226', name: '상추', icon: '🥗' },
  { code: '313', name: '포도', icon: '🍇' },
  { code: '314', name: '복숭아', icon: '🍑' },
  { code: '315', name: '감', icon: '🍊' },
  { code: '412', name: '보리', icon: '🌾' },
  { code: '413', name: '콩', icon: '🫘' },
]

const ALL_ITEMS = [
  ...Object.entries(ITEM_NAMES).map(([code, name]) => ({ code, name, icon: ITEM_ICONS[code] || '🌿' })),
  ...EXTRA_ITEMS,
]

function PriceRow({ price, onRemove }) {
  const isUp = (price.changePercent ?? 0) >= 0
  const isSeasonal = SEASONAL.includes(price.itemCode)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 7px', background: '#1c2a36',
      border: '1px solid #354d65', borderRadius: 5,
      borderLeft: `2px solid ${isSeasonal ? '#d2992266' : '#82cfff66'}`
    }}>
      <span style={{ fontSize: 15 }}>{ITEM_ICONS[price.itemCode] || '🌿'}</span>
      <span style={{ fontSize: 12, color: '#ddeaf5', flex: 1 }}>
        {price.itemName || ITEM_NAMES[price.itemCode] || price.itemCode}
      </span>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: price.price ? '#eef5fb' : '#87b8d4' }}>
          {price.price ? `₩${price.price.toLocaleString()}` : '가격 없음'}
        </div>
        {(price.unit || UNIT_MAP[price.itemCode]) && (
          <div style={{ fontSize: 10, color: '#87b8d4' }}>
            /{price.unit || UNIT_MAP[price.itemCode]}
          </div>
        )}
      </div>
      {price.changePercent != null && (
        <span style={{ fontSize: 12, fontWeight: 700, color: isUp ? '#f85149' : '#56e890' }}>
          {isUp ? '▲' : '▼'}{Math.abs(price.changePercent)}%
        </span>
      )}
      {onRemove && (
        <button onClick={() => onRemove(price.itemCode)} style={{
          background: 'none', border: 'none', color: '#87b8d4',
          cursor: 'pointer', fontSize: 13, padding: '0 2px', lineHeight: 1
        }}>✕</button>
      )}
    </div>
  )
}

function AddItemModal({ onAdd, onClose, existing }) {
  const [query, setQuery] = useState('')
  const trimmed = query.trim()
  const suggestions = trimmed
    ? ALL_ITEMS.filter(it => !existing.includes(it.code) && it.name.includes(trimmed))
    : []
  const canAddCustom = trimmed.length > 0 && !ALL_ITEMS.some(it => it.name === trimmed)

  const handleCustomAdd = () => {
    const code = 'custom_' + trimmed
    onAdd({ code, name: trimmed, icon: '🌿' })
  }

  return (
    <div style={{
      position: 'fixed', zIndex: 1000,
      bottom: 240, right: 230,
      background: '#253748', border: '1px solid #354d65', borderRadius: 8,
      padding: '10px 12px', boxShadow: '0 4px 20px #0008', minWidth: 200
    }}>
      <div style={{ fontSize: 12, color: '#87b8d4', marginBottom: 8 }}>품목명 입력</div>
      <input
        autoFocus
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            if (suggestions.length > 0) onAdd(suggestions[0])
            else if (canAddCustom) handleCustomAdd()
          }
          if (e.key === 'Escape') onClose()
        }}
        placeholder="예: 방울토마토, 청양고추..."
        style={{
          width: '100%', boxSizing: 'border-box',
          background: '#1c2a36', border: '1px solid #354d65', borderRadius: 5,
          color: '#eef5fb', fontSize: 13, padding: '6px 8px', marginBottom: 6, outline: 'none'
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto' }}>
        {suggestions.map(it => (
          <button key={it.code} onClick={() => onAdd(it)} style={{
            background: '#2d4255', border: '1px solid #354d65', borderRadius: 5,
            color: '#ddeaf5', fontSize: 13, padding: '6px 10px',
            textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center'
          }}>
            <span>{it.icon || '🌿'}</span> {it.name}
          </button>
        ))}
        {canAddCustom && (
          <button onClick={handleCustomAdd} style={{
            background: '#1c2a36', border: '1px dashed #354d65', borderRadius: 5,
            color: '#82cfff', fontSize: 13, padding: '6px 10px',
            textAlign: 'left', cursor: 'pointer'
          }}>
            🌿 "{trimmed}" 직접 추가
          </button>
        )}
        {trimmed && suggestions.length === 0 && !canAddCustom && (
          <div style={{ fontSize: 12, color: '#87b8d4', padding: 4 }}>이미 추가된 품목입니다</div>
        )}
      </div>
      <button onClick={onClose} style={{
        marginTop: 8, width: '100%', padding: 4, background: 'none',
        border: '1px solid #354d65', borderRadius: 4, color: '#87b8d4',
        fontSize: 12, cursor: 'pointer'
      }}>닫기 (Esc)</button>
    </div>
  )
}

export default function PricePanel() {
  const [prices, setPrices] = useState([])
  const [watchItems, setWatchItems] = useState([])
  const [showModal, setShowModal] = useState(false)

  const syncWatchlist = () =>
    client.get('/user/watchlist').then(r => setWatchItems(r.data)).catch(() => {})

  useEffect(() => {
    client.get('/prices?market=100110').then(r => setPrices(r.data)).catch(() => {})
    syncWatchlist()
  }, [])

  const priceMap = Object.fromEntries(prices.map(p => [p.itemCode, p]))
  const seasonal = SEASONAL.map(code => priceMap[code]).filter(Boolean)
  const watchCodes = watchItems.map(w => w.itemCode)
  const watchlist = watchItems.map(w => ({
    ...(priceMap[w.itemCode] ?? { itemCode: w.itemCode, price: null, changePercent: null }),
    itemName: ITEM_NAMES[w.itemCode] || w.itemName,
  }))

  const handleAdd = async (item) => {
    try {
      await client.post('/user/watchlist', { itemCode: item.code, itemName: item.name, marketCode: '100110' })
      setWatchItems(prev => [...prev, { itemCode: item.code, itemName: item.name }])
    } catch (err) {
      if (err.response?.status === 409) syncWatchlist()
    }
    setShowModal(false)
  }

  const handleRemove = async (itemCode) => {
    await client.delete(`/user/watchlist/${itemCode}`).catch(() => {})
    setWatchItems(prev => prev.filter(w => w.itemCode !== itemCode))
  }

  return (
    <div style={{ padding: '0 0 8px', position: 'relative' }}>
      <div style={{ padding: '6px 12px 4px', fontSize: 12, color: '#d29922',
        textTransform: 'uppercase', letterSpacing: 0.8,
        display: 'flex', justifyContent: 'space-between',
        borderBottom: '1px solid #2d4255' }}>
        <span>🌿 4월 제철</span>
        <span style={{ color: '#87b8d4' }}>KAMIS</span>
      </div>
      <div style={{ padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {seasonal.map(p => <PriceRow key={p.itemCode} price={p} />)}
        {seasonal.length === 0 && <div style={{ fontSize: 13, color: '#87b8d4', padding: 8 }}>데이터 없음</div>}
      </div>

      <div style={{ height: 1, background: '#2d4255', margin: '3px 0' }} />

      <div style={{ padding: '4px 12px 4px', fontSize: 12, color: '#82cfff',
        textTransform: 'uppercase', letterSpacing: 0.8,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>⭐ 내 관심 품목</span>
        <span
          onClick={() => setShowModal(v => !v)}
          style={{ fontSize: 12, color: '#82cfff', cursor: 'pointer' }}>+ 추가</span>
      </div>
      <div style={{ padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {watchlist.map(p => <PriceRow key={p.itemCode} price={p} onRemove={handleRemove} />)}
        {watchlist.length === 0 && <div style={{ fontSize: 13, color: '#87b8d4', padding: 8 }}>설정한 품목 없음</div>}
      </div>

      {showModal && (
        <AddItemModal
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
          existing={watchCodes}
        />
      )}
    </div>
  )
}

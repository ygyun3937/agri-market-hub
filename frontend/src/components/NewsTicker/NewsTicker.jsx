// src/components/NewsTicker/NewsTicker.jsx
import { useEffect, useState } from 'react'
import client from '../../api/client'

export default function NewsTicker() {
  const [items, setItems] = useState([])

  useEffect(() => {
    client.get('/news?tab=all').then(res => setItems(res.data.slice(0, 5))).catch(() => {})
  }, [])

  if (items.length === 0) return null
  const text = items.map(n => n.title).join('  ·  ')

  return (
    <div style={{
      background: '#0d1117', borderBottom: '1px solid #21262d',
      padding: '5px 16px', fontSize: 14, color: '#8b949e',
      display: 'flex', alignItems: 'center', gap: 8,
      overflow: 'hidden', flexShrink: 0
    }}>
      <span style={{ color: '#3fb950', fontWeight: 700, flexShrink: 0 }}>● LIVE</span>
      <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
        <span style={{ display: 'inline-block', animation: 'ticker 80s linear infinite' }}>
          {text}
        </span>
      </div>
      <style>{`@keyframes ticker { 0% { transform: translateX(100%) } 100% { transform: translateX(-100%) } }`}</style>
    </div>
  )
}

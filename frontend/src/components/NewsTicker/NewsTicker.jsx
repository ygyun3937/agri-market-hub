// src/components/NewsTicker/NewsTicker.jsx
import { useEffect, useState } from 'react'
import client from '../../api/client'

export default function NewsTicker() {
  const [items, setItems] = useState([])

  useEffect(() => {
    Promise.all([client.get('/news?tab=pest'), client.get('/news?tab=crop')])
      .then(([pest, crop]) => {
        const combined = [...pest.data, ...crop.data]
          .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
          .slice(0, 5)
        setItems(combined)
      }).catch(() => {})
  }, [])

  if (items.length === 0) return null
  const text = items.map(n => n.title).join('  ·  ')

  return (
    <div style={{
      background: '#0f2318', borderBottom: '1px solid #1e3a28',
      padding: '5px 16px', fontSize: 14, color: '#7ee8a2',
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

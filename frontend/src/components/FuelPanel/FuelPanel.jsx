// src/components/FuelPanel/FuelPanel.jsx
import { useEffect, useState } from 'react'
import client from '../../api/client'

const LABELS = { gasoline: '휘발유', diesel: '경유' }

export default function FuelPanel() {
  const [fuels, setFuels] = useState([])

  useEffect(() => {
    client.get('/fuel').then(r => setFuels(r.data)).catch(() => {})
  }, [])

  return (
    <div style={{ padding: '8px 4px', marginTop: 'auto' }}>
      <div style={{ fontSize: 9, color: '#8b949e', textTransform: 'uppercase',
        letterSpacing: 0.8, marginBottom: 6 }}>⛽ 유가</div>
      {fuels.map(f => (
        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between',
          fontSize: 11, color: '#c9d1d9', marginBottom: 3 }}>
          <span>{LABELS[f.type] || f.type}</span>
          <span style={{ fontWeight: 700 }}>₩{f.price?.toLocaleString()}</span>
        </div>
      ))}
      {fuels.length === 0 && (
        <div style={{ fontSize: 11, color: '#8b949e' }}>데이터 없음</div>
      )}
    </div>
  )
}

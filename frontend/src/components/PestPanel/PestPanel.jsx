// src/components/PestPanel/PestPanel.jsx
import { useEffect, useState } from 'react'
import client from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

const SEVERITY_COLOR = {
  '경보': '#f85149',
  '심각': '#f85149',
  '주의': '#d29922',
  '경계': '#d29922',
  '관찰': '#3fb950',
  '낮음': '#3fb950',
}

function severityColor(s) {
  if (!s) return '#8b949e'
  for (const [key, val] of Object.entries(SEVERITY_COLOR)) {
    if (s.includes(key)) return val
  }
  return '#8b949e'
}

export default function PestPanel() {
  const [pests, setPests] = useState([])
  const [watchNames, setWatchNames] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    client.get('/alerts/pest').then(r => setPests(r.data || [])).catch(() => {})
    if (user) {
      client.get('/user/watchlist').then(r => {
        setWatchNames((r.data || []).map(w => w.itemName?.toLowerCase()))
      }).catch(() => {})
    }
  }, [user])

  const filtered = watchNames.length > 0
    ? pests.filter(p => watchNames.some(n => p.itemName?.toLowerCase().includes(n) || n.includes(p.itemName?.toLowerCase() || '')))
    : pests.slice(0, 5)

  if (filtered.length === 0 && pests.length === 0) return null

  return (
    <div style={{ padding: '10px 6px', marginTop: 8, borderTop: '1px solid #21262d' }}>
      <div style={{ fontSize: 12, color: '#8b949e', textTransform: 'uppercase',
        letterSpacing: 0.8, marginBottom: 8 }}>
        🐛 {user && watchNames.length > 0 ? '관심작물 병해충' : '병해충 정보'}
      </div>
      {filtered.length === 0 ? (
        <div style={{ fontSize: 11, color: '#8b949e' }}>해당 작물 병해충 없음</div>
      ) : (
        filtered.slice(0, 5).map(p => (
          <div key={p.id} style={{
            marginBottom: 8, padding: '6px 8px', borderRadius: 5,
            background: '#161b22', border: `1px solid ${severityColor(p.severity)}33`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#c9d1d9' }}>{p.itemName}</span>
              <span style={{ fontSize: 10, color: severityColor(p.severity), fontWeight: 700 }}>{p.severity}</span>
            </div>
            {p.region && (
              <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 2 }}>📍 {p.region}</div>
            )}
            {p.description && (
              <div style={{ fontSize: 11, color: '#adbac7', lineHeight: 1.4,
                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' }}>
                {p.description}
              </div>
            )}
            <div style={{ fontSize: 10, color: '#6e7681', marginTop: 3 }}>
              {new Date(p.reportedAt).toLocaleDateString('ko')}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

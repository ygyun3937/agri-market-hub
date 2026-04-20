// src/components/PestPanel/PestPanel.jsx
import { useEffect, useState } from 'react'
import client from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

export default function PestPanel() {
  const [pests, setPests] = useState([])
  const [watchNames, setWatchNames] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    client.get('/alerts/pest').then(r => setPests(r.data || [])).catch(() => setPests([])).finally(() => setLoading(false))
    if (user) {
      client.get('/user/watchlist').then(r => {
        setWatchNames((r.data || []).map(w => w.itemName?.toLowerCase()))
      }).catch(() => {})
    }
  }, [user])

  const filtered = watchNames.length > 0
    ? pests.filter(p => watchNames.some(n =>
        p.itemName?.toLowerCase().includes(n) || n.includes(p.itemName?.toLowerCase() || '')))
    : pests.slice(0, 5)

  return (
    <div style={{ padding: '10px 6px', marginTop: 8, borderTop: '1px solid #2d4255' }}>
      <div style={{ fontSize: 12, color: '#87b8d4', textTransform: 'uppercase',
        letterSpacing: 0.8, marginBottom: 8 }}>
        🐛 {user && watchNames.length > 0 ? '관심작물 병해충' : '병해충 정보'}
      </div>

      {loading ? (
        <div style={{ fontSize: 11, color: '#87b8d4' }}>로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ fontSize: 11, color: '#87b8d4' }}>
          {pests.length === 0 ? '병해충 데이터 없음' : '해당 작물 병해충 없음'}
        </div>
      ) : (
        filtered.slice(0, 5).map(p => (
          <div key={p.id} style={{
            marginBottom: 7, padding: '6px 8px', borderRadius: 5,
            background: '#253748', border: '1px solid #354d65'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#ddeaf5' }}>{p.itemName || '작물명 없음'}</span>
              {p.severity && (
                <span style={{ fontSize: 10, color: '#d29922', background: '#d2992222',
                  borderRadius: 3, padding: '1px 5px' }}>{p.severity}</span>
              )}
            </div>
            {p.region && (
              <div style={{ fontSize: 10, color: '#87b8d4' }}>📍 {p.region}</div>
            )}
            {p.description && (
              <div style={{ fontSize: 11, color: '#aacde0', marginTop: 2, lineHeight: 1.4,
                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' }}>
                {p.description}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

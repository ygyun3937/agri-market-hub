// src/components/NewsPanel/NewsPanel.jsx
import { useEffect, useState } from 'react'
import client from '../../api/client'

const TABS = [
  { key: 'headline', label: '🔥 헤드라인' },
  { key: 'all', label: '전체' },
  { key: 'crop', label: '작황·가격' },
  { key: 'logistics', label: '물류·운송' },
  { key: 'policy', label: '정책' },
  { key: 'pest', label: '병해충' },
]

export default function NewsPanel() {
  const [tab, setTab] = useState('headline')
  const [news, setNews] = useState([])

  useEffect(() => {
    const fetch = () => {
      if (tab === 'headline') {
        Promise.all([client.get('/news?tab=pest'), client.get('/news?tab=crop')])
          .then(([pest, crop]) => {
            setNews([...pest.data, ...crop.data]
              .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
              .slice(0, 6))
          }).catch(() => {})
      } else {
        client.get(`/news?tab=${tab}`).then(r => setNews(r.data)).catch(() => {})
      }
    }
    fetch()
    const timer = setInterval(fetch, 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [tab])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: tab === t.key ? '#238636' : '#21262d',
            border: '1px solid ' + (tab === t.key ? '#2ea043' : '#30363d'),
            color: tab === t.key ? '#fff' : '#8b949e',
            fontSize: 12, padding: '3px 8px', borderRadius: 4, cursor: 'pointer'
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', flex: 1, alignItems: 'stretch' }}>
        {news.slice(0, 6).map(n => (
          <a key={n.id} href={n.url} target="_blank" rel="noreferrer"
            style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              flexShrink: 0, width: 220,
              background: '#161b22', border: '1px solid #30363d', borderRadius: 8,
              padding: '8px 10px', textDecoration: 'none'
            }}>
            <div style={{ fontSize: 14, color: '#e6edf3', lineHeight: 1.5,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', flex: 1 }}>
              {n.title}
            </div>
            <div style={{ fontSize: 12, color: '#8b949e', marginTop: 8, flexShrink: 0 }}>
              {(() => { try { return new URL(n.source || n.url).hostname.replace('www.', '') } catch { return '' } })()} · {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString('ko') : ''}
            </div>
          </a>
        ))}
        {news.length === 0 && (
          <div style={{ fontSize: 12, color: '#8b949e', padding: 8 }}>뉴스 없음</div>
        )}
      </div>
    </div>
  )
}

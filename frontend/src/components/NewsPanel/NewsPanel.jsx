// src/components/NewsPanel/NewsPanel.jsx
import { useEffect, useState } from 'react'
import client from '../../api/client'

const TABS = [
  { key: 'all', label: '전체' },
  { key: 'crop', label: '작황·가격' },
  { key: 'logistics', label: '물류·운송' },
  { key: 'policy', label: '정책' },
  { key: 'pest', label: '병해충' },
]

export default function NewsPanel() {
  const [tab, setTab] = useState('all')
  const [news, setNews] = useState([])

  useEffect(() => {
    client.get(`/news?tab=${tab}`).then(r => setNews(r.data)).catch(() => {})
  }, [tab])

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', height: '100%', alignItems: 'flex-start' }}>
      {news.slice(0, 6).map(n => (
        <a key={n.id} href={n.url} target="_blank" rel="noreferrer"
          style={{
            display: 'block', flexShrink: 0, width: 200,
            background: '#161b22', border: '1px solid #30363d', borderRadius: 8,
            padding: '10px', textDecoration: 'none'
          }}>
          <div style={{ fontSize: 12, color: '#e6edf3', lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {n.title}
          </div>
          <div style={{ fontSize: 10, color: '#8b949e', marginTop: 6 }}>
            {n.source} · {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString('ko') : ''}
          </div>
        </a>
      ))}
      {news.length === 0 && (
        <div style={{ fontSize: 12, color: '#8b949e', padding: 8 }}>뉴스 없음</div>
      )}
    </div>
  )
}

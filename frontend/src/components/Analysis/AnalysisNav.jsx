// src/components/Analysis/AnalysisNav.jsx
import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  { path: '/analysis', label: '대시보드' },
  { path: '/analysis/products', label: '품목별 가격' },
  { path: '/analysis/markets', label: '시장별 현황' },
]

export default function AnalysisNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <div style={{
      display: 'flex', gap: 0, borderBottom: '1px solid #354d65',
      background: '#253748', padding: '0 16px', flexShrink: 0,
    }}>
      {TABS.map(({ path, label }) => {
        const active = pathname === path
        return (
          <button key={path} onClick={() => navigate(path)} style={{
            background: 'none', border: 'none', borderBottom: active ? '2px solid #56e890' : '2px solid transparent',
            color: active ? '#eef5fb' : '#87b8d4', fontSize: 13, fontWeight: active ? 600 : 400,
            padding: '10px 16px', cursor: 'pointer', marginBottom: -1,
          }}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

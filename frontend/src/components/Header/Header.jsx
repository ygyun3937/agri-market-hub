// src/components/Header/Header.jsx
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Header({ alertCount = 0, hasDisasterAlert = false }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header style={{
      background: '#161b22', borderBottom: '1px solid #30363d',
      padding: '0 16px', height: 44, display: 'flex',
      alignItems: 'center', gap: 12, flexShrink: 0
    }}>
      <span style={{ color: '#3fb950', fontWeight: 700, fontSize: 17, letterSpacing: 1 }}>
        AGRIHUB
      </span>
      {hasDisasterAlert && (
        <span style={{
          background: '#da3633', color: '#fff', fontSize: 12,
          padding: '2px 8px', borderRadius: 4, fontWeight: 600
        }}>
          🚨태풍특보
        </span>
      )}
      <nav style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
        <button style={{ background: 'none', border: 'none', color: '#e6edf3',
          fontSize: 14, cursor: 'pointer' }}>대시보드</button>
        <button style={{ background: 'none', border: 'none', color: '#8b949e',
          fontSize: 14, cursor: 'pointer' }}>분석</button>
      </nav>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14, color: '#8b949e' }}>
          🔔{alertCount > 0 && <span style={{ color: '#f85149', fontWeight: 700 }}>{alertCount}</span>}
        </span>
        <span style={{ fontSize: 14, color: '#c9d1d9' }}>{user?.name || ''}</span>
        <button onClick={handleLogout}
          style={{ background: 'none', border: '1px solid #30363d', color: '#8b949e',
            fontSize: 13, padding: '3px 10px', borderRadius: 5, cursor: 'pointer' }}>
          로그아웃
        </button>
      </div>
    </header>
  )
}

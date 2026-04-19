// src/components/Header/Header.jsx
import { useAuth } from '../../hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Header({ alertCount = 0, hasDisasterAlert = false }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
      <svg width="22" height="22" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <rect width="32" height="32" rx="5" fill="#0d1117"/>
        <path d="M4 9 L4 4 L9 4" fill="none" stroke="#3fb950" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23 4 L28 4 L28 9" fill="none" stroke="#3fb950" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 23 L4 28 L9 28" fill="none" stroke="#58a6ff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23 28 L28 28 L28 23" fill="none" stroke="#58a6ff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="7" y1="17" x2="25" y2="17" stroke="#21262d" strokeWidth="0.8"/>
        <line x1="16" y1="17" x2="16" y2="9" stroke="#3fb950" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M16 15 C14.2 13.2 10.5 13.8 10 11 C13.2 10.4 16.2 13 16 15Z" fill="#3fb950"/>
        <path d="M16 12.5 C17.8 10.8 21.5 11.2 22 8.5 C18.8 7.8 15.8 10.5 16 12.5Z" fill="#3fb950" opacity="0.72"/>
        <path d="M7 21.5 Q9.5 19.2 12 21.5 Q14.5 23.8 17 21.5 Q19.5 19.2 22 21.5 Q23.5 22.8 25 21.5"
              fill="none" stroke="#58a6ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: 0.3, color: '#e6edf3' }}>
        농수산 통합관제센터
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
        <button onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
            color: location.pathname === '/' ? '#e6edf3' : '#8b949e' }}>대시보드</button>
        <button onClick={() => navigate('/analysis')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
            color: location.pathname === '/analysis' ? '#e6edf3' : '#8b949e' }}>경매분석</button>
      </nav>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14, color: '#8b949e' }}>
          🔔{alertCount > 0 && <span style={{ color: '#f85149', fontWeight: 700 }}>{alertCount}</span>}
        </span>
        {user ? (
          <>
            <span style={{ fontSize: 14, color: '#c9d1d9' }}>{user.name}</span>
            <button onClick={handleLogout}
              style={{ background: 'none', border: '1px solid #30363d', color: '#8b949e',
                fontSize: 13, padding: '3px 10px', borderRadius: 5, cursor: 'pointer' }}>
              로그아웃
            </button>
          </>
        ) : (
          <button onClick={() => navigate('/login')}
            style={{ background: '#238636', border: 'none', color: '#fff',
              fontSize: 13, padding: '3px 12px', borderRadius: 5, cursor: 'pointer', fontWeight: 600 }}>
            로그인
          </button>
        )}
      </div>
    </header>
  )
}

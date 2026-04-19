// src/pages/Login.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const [error] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('error') ? '로그인에 실패했습니다. 다시 시도해주세요.' : ''
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const name = params.get('name')
    if (token) {
      setSession(token, decodeURIComponent(name || ''))
      navigate('/', { replace: true })
    }
  }, [navigate, setSession])

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: 12,
        padding: '40px 36px', width: 340, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 24
      }}>
        {/* 로고 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <svg width="44" height="44" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
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
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3' }}>농수산 통합관제센터</div>
            <div style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>로그인하여 대시보드를 이용하세요</div>
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 13, color: '#f85149', background: '#2d1117',
            border: '1px solid #f8514933', borderRadius: 6, padding: '8px 12px',
            width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button
          onClick={() => { window.location.href = '/api/auth/google/redirect' }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', padding: '11px 16px',
            background: '#ffffff', border: 'none', borderRadius: 8,
            color: '#1a1a1a', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            transition: 'opacity 0.15s'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Google로 로그인
        </button>

        <div style={{ fontSize: 11, color: '#6e7681', textAlign: 'center', lineHeight: 1.6 }}>
          로그인 시 Google 캘린더 연동이 함께 설정됩니다
        </div>
      </div>
    </div>
  )
}

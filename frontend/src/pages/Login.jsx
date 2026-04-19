// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../hooks/useAuth'
import client from '../api/client'

export default function Login() {
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCredential = async ({ credential }) => {
    setLoading(true)
    setError('')
    try {
      const res = await client.post('/auth/google', { idToken: credential })
      setSession(res.data.token, res.data.name)
      navigate('/')
    } catch {
      setError('로그인에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

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

        {loading ? (
          <div style={{
            width: '100%', padding: '11px 16px', background: '#21262d', borderRadius: 8,
            color: '#8b949e', fontSize: 14, fontWeight: 600, textAlign: 'center'
          }}>로그인 중...</div>
        ) : (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleCredential}
              onError={() => setError('Google 로그인이 취소되었습니다.')}
              theme="filled_black"
              size="large"
              text="signin_with"
              width="268"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: 10,
        padding: '32px', width: 360, display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <h1 style={{ color: '#e6edf3', fontSize: 20, margin: 0 }}>AGRIHUB 로그인</h1>
        {error && <p style={{ color: '#f85149', fontSize: 13, margin: 0 }}>{error}</p>}
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="이메일" required
          style={{ padding: '8px 12px', background: '#0d1117', border: '1px solid #30363d',
            borderRadius: 6, color: '#e6edf3', fontSize: 14 }}
        />
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="비밀번호" required
          style={{ padding: '8px 12px', background: '#0d1117', border: '1px solid #30363d',
            borderRadius: 6, color: '#e6edf3', fontSize: 14 }}
        />
        <button type="submit" style={{
          padding: '10px', background: '#238636', border: 'none', borderRadius: 6,
          color: '#fff', fontSize: 14, cursor: 'pointer'
        }}>
          로그인
        </button>
      </form>
    </div>
  )
}

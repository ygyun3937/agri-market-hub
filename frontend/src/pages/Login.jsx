// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import client from '../api/client'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (mode === 'login') {
        await login(email, password)
        navigate('/')
      } else {
        await client.post('/auth/register', { email, password, name })
        await login(email, password)
        navigate('/')
      }
    } catch {
      setError(mode === 'login' ? '이메일 또는 비밀번호가 올바르지 않습니다.' : '회원가입에 실패했습니다.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: 10,
        padding: '32px', width: 360, display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <h1 style={{ color: '#e6edf3', fontSize: 20, margin: 0 }}>
          {mode === 'login' ? 'AGRIHUB 로그인' : 'AGRIHUB 회원가입'}
        </h1>
        {error && <p style={{ color: '#f85149', fontSize: 13, margin: 0 }}>{error}</p>}
        {mode === 'register' && (
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="이름" required
            style={{ padding: '8px 12px', background: '#0d1117', border: '1px solid #30363d',
              borderRadius: 6, color: '#e6edf3', fontSize: 14 }}
          />
        )}
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
          {mode === 'login' ? '로그인' : '회원가입'}
        </button>
        <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          style={{ background: 'none', border: 'none', color: '#58a6ff', fontSize: 13, cursor: 'pointer' }}>
          {mode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
        </button>
      </form>
    </div>
  )
}

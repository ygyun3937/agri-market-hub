// src/hooks/useAuth.js
import { useState } from 'react'
import client from '../api/client'

export function useAuth() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    const name = localStorage.getItem('userName')
    return token ? { token, name } : null
  })

  async function login(email, password) {
    const res = await client.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('userName', res.data.name)
    setUser({ token: res.data.token, name: res.data.name })
    return res.data
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    setUser(null)
  }

  return { user, login, logout }
}

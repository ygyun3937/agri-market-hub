// src/components/CalendarPanel/ScheduleList.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

function gcalLink(s) {
  const d = s.date.replace(/-/g, '')
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(s.title)}&dates=${d}/${d}&details=${encodeURIComponent(s.memo || '')}`
}

function daysLeft(dateStr) {
  const diff = Math.ceil((new Date(dateStr) - new Date(new Date().toDateString())) / 86400000)
  if (diff === 0) return { label: '오늘', color: '#56e890' }
  if (diff === 1) return { label: '내일', color: '#d29922' }
  if (diff > 0) return { label: `D-${diff}`, color: '#82cfff' }
  return { label: `D+${Math.abs(diff)}`, color: '#87b8d4' }
}

export default function ScheduleList({ schedules = [], refreshSchedules, setSchedules }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({ date: today, title: '' })
  const [saving, setSaving] = useState(false)
  const [gcalConnected, setGcalConnected] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      client.get('/user/gcal-connected').then(r => setGcalConnected(r.data.connected)).catch(() => setGcalConnected(false))
    }
  }, [user])

  const handleAdd = async () => {
    if (!form.title.trim() || !form.date) return
    setSaving(true)
    try {
      await client.post('/schedules', { title: form.title, type: 'shipping', date: form.date, memo: '' })
      refreshSchedules()
      setForm({ date: today, title: '' })
    } catch { /* noop */ }
    setSaving(false)
  }

  const upcoming = [...schedules]
    .filter(s => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const past = [...schedules]
    .filter(s => s.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)

  const handleDelete = async (id) => {
    await client.delete(`/schedules/${id}`).catch(() => {})
    setSchedules(prev => prev.filter(s => s.id !== id))
  }

  const Row = ({ s, dim }) => {
    const dl = daysLeft(s.date)
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px', marginBottom: 4, borderRadius: 6,
        background: dim ? 'transparent' : '#253748',
        border: `1px solid ${dim ? 'transparent' : '#354d65'}`,
        opacity: dim ? 0.45 : 1,
      }}>
        <div style={{
          minWidth: 36, textAlign: 'center', fontSize: 11, fontWeight: 700,
          color: dl.color, flexShrink: 0,
        }}>{dl.label}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: '#ffffff', fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.title}
          </div>
          <div style={{ fontSize: 12, color: '#aacde0', marginTop: 2 }}>
            {new Date(s.date).toLocaleDateString('ko', { month: 'long', day: 'numeric', weekday: 'short' })}
          </div>
        </div>
        <a href={gcalLink(s)} target="_blank" rel="noreferrer"
          title="Google Calendar에 추가"
          style={{ fontSize: 12, color: '#8dd8ff', textDecoration: 'none', flexShrink: 0, fontWeight: 500 }}>GCal</a>
        <button onClick={() => handleDelete(s.id)} style={{
          background: 'none', border: 'none', color: '#6a8fa8',
          cursor: 'pointer', fontSize: 14, padding: '0 2px', flexShrink: 0, lineHeight: 1
        }}>✕</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#87b8d4', textTransform: 'uppercase',
          letterSpacing: 0.8, fontWeight: 600 }}>
          📋 출하 일정
        </div>
        {user && gcalConnected === false && (
          <button onClick={() => { window.location.href = `/api/auth/google/calendar-connect?token=${localStorage.getItem('token')}` }}
            style={{ fontSize: 10, color: '#f85149', background: 'none', border: '1px solid #f8514933',
              borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}>
            캘린더 재연동 필요
          </button>
        )}
        {user && gcalConnected === true && (
          <span style={{ fontSize: 10, color: '#56e890' }}>● GCal 연동됨</span>
        )}
      </div>

      {user ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            style={{ width: '100%', boxSizing: 'border-box', background: '#1c2a36',
              border: '1px solid #354d65', borderRadius: 4, color: '#ddeaf5',
              fontSize: 11, padding: '3px 6px', outline: 'none' }} />
          <div style={{ display: 'flex', gap: 4 }}>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="일정 제목..."
              style={{ flex: 1, background: '#1c2a36', border: '1px solid #354d65', borderRadius: 4,
                color: '#eef5fb', fontSize: 11, padding: '3px 6px', outline: 'none', minWidth: 0 }} />
            <button onClick={handleAdd} disabled={saving}
              style={{ background: '#1e9070', border: 'none', borderRadius: 4,
                color: '#fff', fontSize: 11, padding: '3px 10px', cursor: 'pointer', flexShrink: 0 }}>+</button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 10, padding: '10px', background: '#253748',
          border: '1px solid #354d65', borderRadius: 6, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#87b8d4', marginBottom: 6 }}>
            일정 관리 및 Google Calendar 연동은<br />로그인이 필요합니다
          </div>
          <button onClick={() => navigate('/login')} style={{
            background: '#1e9070', border: 'none', borderRadius: 4,
            color: '#fff', fontSize: 12, padding: '5px 16px', cursor: 'pointer', fontWeight: 600
          }}>Google로 로그인</button>
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 && user && (
        <div style={{ fontSize: 13, color: '#87b8d4', padding: '12px 0', textAlign: 'center' }}>
          등록된 일정이 없습니다
        </div>
      )}

      {upcoming.map(s => <Row key={s.id} s={s} dim={false} />)}

      {past.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: '#87b8d4', margin: '10px 0 6px',
            textTransform: 'uppercase', letterSpacing: 0.5 }}>지난 일정</div>
          {past.map(s => <Row key={s.id} s={s} dim={true} />)}
        </>
      )}
    </div>
  )
}

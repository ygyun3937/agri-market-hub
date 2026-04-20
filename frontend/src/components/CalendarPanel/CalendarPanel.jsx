// src/components/CalendarPanel/CalendarPanel.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

function gcalLink(s) {
  const d = s.date.replace(/-/g, '')
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(s.title)}&dates=${d}/${d}&details=${encodeURIComponent(s.memo || '')}`
}

export default function CalendarPanel({ schedules = [], setSchedules }) {
  const [now] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [form, setForm] = useState({ title: '', memo: '' })
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const schedulesByDay = {}
  schedules.forEach(s => {
    const d = new Date(s.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!schedulesByDay[day]) schedulesByDay[day] = []
      schedulesByDay[day].push(s)
    }
  })

  const cells = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )

  const dateStr = (day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const handleSave = async () => {
    if (!form.title.trim() || !selectedDay) return
    setSaving(true)
    try {
      const res = await client.post('/schedules', {
        title: form.title, type: 'shipping',
        date: dateStr(selectedDay), memo: form.memo,
      })
      setSchedules(prev => [...prev, res.data])
      setForm({ title: '', memo: '' })
      setSelectedDay(null)
    } catch { /* noop */ }
    setSaving(false)
  }

  return (
    <div style={{ padding: '10px 14px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 14, color: '#ddeaf5', fontWeight: 600 }}>
          📅 {year}.{String(month + 1).padStart(2, '0')}
        </span>
        <span style={{ fontSize: 11, color: '#87b8d4' }}>날짜 클릭 → 추가</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
          <div key={d} style={{ fontSize: 11, color: '#87b8d4', textAlign: 'center', padding: '2px 0' }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          const isToday = day === today
          const isSelected = day === selectedDay
          const daySchedules = day && schedulesByDay[day]
          return (
            <div key={i} onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
              style={{
                fontSize: 13, textAlign: 'center', padding: '3px 1px',
                borderRadius: 4, cursor: day ? 'pointer' : 'default', minHeight: 30,
                color: isToday ? '#1c2a36' : isSelected ? '#fff' : day ? '#ddeaf5' : 'transparent',
                background: isToday ? '#56e890' : isSelected ? '#1a7fd4' : 'transparent',
                border: isSelected && !isToday ? '1px solid #6ab8ff' : '1px solid transparent',
              }}>
              {day || ''}
              {daySchedules && daySchedules.map((s, si) => (
                <div key={si} style={{
                  fontSize: 9, color: isToday ? '#1c2a36' : '#82cfff',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  lineHeight: 1.2, textAlign: 'left', paddingLeft: 1,
                }}>{s.title}</div>
              ))}
            </div>
          )
        })}
      </div>

      {selectedDay && (
        <div style={{ marginTop: 8, background: '#253748', border: '1px solid #354d65', borderRadius: 6, padding: '8px 10px' }}>
          <div style={{ fontSize: 12, color: '#87b8d4', marginBottom: 6 }}>{dateStr(selectedDay)} 일정</div>
          {(schedulesByDay[selectedDay] || []).map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#ddeaf5', flex: 1 }}>{s.title}</span>
              <a href={gcalLink(s)} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: '#82cfff', textDecoration: 'none' }}>GCal</a>
            </div>
          ))}
          {user ? (
            <>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="일정 제목..."
                style={{
                  width: '100%', boxSizing: 'border-box', background: '#1c2a36',
                  border: '1px solid #354d65', borderRadius: 4, color: '#eef5fb',
                  fontSize: 12, padding: '4px 6px', marginBottom: 4, outline: 'none'
                }} />
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={handleSave} disabled={saving} style={{
                  flex: 1, background: '#1e9070', border: 'none', borderRadius: 4,
                  color: '#fff', fontSize: 12, padding: '4px 0', cursor: 'pointer'
                }}>추가</button>
                <button onClick={() => setSelectedDay(null)} style={{
                  background: '#2d4255', border: '1px solid #354d65', borderRadius: 4,
                  color: '#87b8d4', fontSize: 12, padding: '4px 8px', cursor: 'pointer'
                }}>닫기</button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '6px 0' }}>
              <div style={{ fontSize: 12, color: '#87b8d4', marginBottom: 6 }}>일정 추가는 로그인이 필요합니다</div>
              <button onClick={() => navigate('/login')} style={{
                background: '#1e9070', border: 'none', borderRadius: 4,
                color: '#fff', fontSize: 12, padding: '5px 16px', cursor: 'pointer', fontWeight: 600
              }}>로그인하기</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

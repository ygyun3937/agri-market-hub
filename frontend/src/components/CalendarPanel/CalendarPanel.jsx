// src/components/CalendarPanel/CalendarPanel.jsx
import { useEffect, useState } from 'react'
import client from '../../api/client'

export default function CalendarPanel() {
  const [schedules, setSchedules] = useState([])
  const [now] = useState(() => new Date())
  const year = now.getFullYear()
  const month = now.getMonth()

  useEffect(() => {
    client.get('/schedules').then(r => setSchedules(r.data)).catch(() => {})
  }, [])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = now.getDate()

  const scheduledDays = new Set(
    schedules
      .filter(s => {
        const d = new Date(s.date)
        return d.getFullYear() === year && d.getMonth() === month
      })
      .map(s => new Date(s.date).getDate())
  )

  const cells = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )

  return (
    <div style={{ padding: '8px 10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: '#c9d1d9', fontWeight: 600 }}>
          📅 {year}.{String(month + 1).padStart(2, '0')} 출하 일정
        </span>
        <span style={{ fontSize: 10, color: '#58a6ff', cursor: 'pointer' }}>🔗 Google</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
          <div key={d} style={{ fontSize: 9, color: '#8b949e', textAlign: 'center', padding: '2px 0' }}>{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} style={{
            fontSize: 10, textAlign: 'center', padding: '3px 0',
            borderRadius: 3, position: 'relative',
            color: day === today ? '#0d1117' : day ? '#c9d1d9' : 'transparent',
            background: day === today ? '#3fb950' : 'transparent',
          }}>
            {day || ''}
            {day && scheduledDays.has(day) && day !== today && (
              <div style={{
                position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)',
                width: 4, height: 4, borderRadius: '50%', background: '#58a6ff'
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

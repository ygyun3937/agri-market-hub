// src/components/CalendarPanel/CalendarPanel.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

const HOLIDAYS = {
  2025: {
    '01-01': '신정', '01-28': '설연휴', '01-29': '설날', '01-30': '설연휴',
    '03-01': '삼일절', '05-05': '어린이날', '06-06': '현충일',
    '08-15': '광복절', '10-03': '개천절', '10-05': '추석연휴',
    '10-06': '추석', '10-07': '추석연휴', '10-09': '한글날', '12-25': '성탄절',
  },
  2026: {
    '01-01': '신정', '02-16': '설연휴', '02-17': '설날', '02-18': '설연휴',
    '03-01': '삼일절', '05-05': '어린이날', '06-06': '현충일',
    '08-15': '광복절', '09-24': '추석연휴', '09-25': '추석', '09-26': '추석연휴',
    '10-03': '개천절', '10-09': '한글날', '12-25': '성탄절',
  },
  2027: {
    '01-01': '신정', '02-06': '설연휴', '02-07': '설날', '02-08': '설연휴',
    '03-01': '삼일절', '05-05': '어린이날', '06-06': '현충일',
    '08-15': '광복절', '10-03': '개천절', '10-09': '한글날',
    '10-14': '추석연휴', '10-15': '추석', '10-16': '추석연휴', '12-25': '성탄절',
  },
}

function getDayInfo(year, month, day) {
  const mmdd = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const holidayName = (HOLIDAYS[year] || {})[mmdd]
  const dow = new Date(year, month, day).getDay()
  return { holidayName, isSun: dow === 0, isSat: dow === 6, isHoliday: !!holidayName }
}

function gcalLink(s) {
  const d = s.date.replace(/-/g, '')
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(s.title)}&dates=${d}/${d}&details=${encodeURIComponent(s.memo || '')}`
}

export default function CalendarPanel({ schedules = [], refreshSchedules }) {
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
      await client.post('/schedules', {
        title: form.title, type: 'shipping',
        date: dateStr(selectedDay), memo: form.memo,
      })
      refreshSchedules()
      setForm({ title: '', memo: '' })
      setSelectedDay(null)
    } catch { /* noop */ }
    setSaving(false)
  }

  const refDay = selectedDay || today
  const refInfo = getDayInfo(year, month, refDay)
  const bankOpen = !refInfo.isSun && !refInfo.isSat && !refInfo.isHoliday
  const auctionOpen = !refInfo.isSun && !refInfo.isHoliday

  return (
    <div style={{ padding: '10px 14px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 14, color: '#ddeaf5', fontWeight: 600 }}>
          📅 {year}.{String(month + 1).padStart(2, '0')}
        </span>
        <span style={{ fontSize: 11, color: '#87b8d4' }}>날짜 클릭 → 추가</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
          <div key={d} style={{
            fontSize: 11, textAlign: 'center', padding: '2px 0',
            color: i === 0 ? '#f85149' : i === 6 ? '#82cfff' : '#87b8d4',
          }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const { holidayName, isSun, isSat, isHoliday } = getDayInfo(year, month, day)
          const isToday = day === today
          const isSelected = day === selectedDay
          const daySchedules = schedulesByDay[day]

          const textColor = isToday ? '#1c2a36'
            : isSelected ? '#fff'
            : (isSun || isHoliday) ? '#f85149'
            : isSat ? '#82cfff'
            : '#ddeaf5'

          return (
            <div key={i} onClick={() => setSelectedDay(day === selectedDay ? null : day)}
              style={{
                fontSize: 12, textAlign: 'center', padding: '2px 1px',
                borderRadius: 4, cursor: 'pointer', minHeight: 32,
                color: textColor,
                background: isToday ? '#56e890' : isSelected ? '#1a7fd4' : 'transparent',
                border: isSelected && !isToday ? '1px solid #6ab8ff' : '1px solid transparent',
              }}>
              {day}
              {holidayName && (
                <div style={{
                  fontSize: 8, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden',
                  textOverflow: 'ellipsis', color: isToday ? '#1c2a3699' : '#f85149bb',
                }}>{holidayName}</div>
              )}
              {daySchedules?.map((s, si) => (
                <div key={si} style={{
                  fontSize: 8, color: isToday ? '#1c2a36' : '#82cfff',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  lineHeight: 1.1, textAlign: 'left', paddingLeft: 1,
                }}>{s.title}</div>
              ))}
            </div>
          )
        })}
      </div>

      {/* 은행/경매장 영업 상태 */}
      <div style={{
        marginTop: 8, padding: '5px 8px', borderTop: '1px solid #2d4255',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 10, color: '#6a8fa8' }}>
          {selectedDay ? `${month + 1}/${selectedDay}` : '오늘'}
          {refInfo.holidayName
            ? ` · ${refInfo.holidayName}`
            : refInfo.isSun ? ' · 일요일'
            : refInfo.isSat ? ' · 토요일'
            : ''}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 10, color: '#87b8d4' }}>
            은행{' '}
            <span style={{
              color: bankOpen ? '#56e890' : '#f85149', fontWeight: 600,
              background: bankOpen ? '#56e89022' : '#f8514922',
              padding: '1px 5px', borderRadius: 3,
            }}>{bankOpen ? '영업' : '휴무'}</span>
          </span>
          <span style={{ fontSize: 10, color: '#87b8d4' }}>
            경매장{' '}
            <span style={{
              color: auctionOpen ? '#56e890' : '#f85149', fontWeight: 600,
              background: auctionOpen ? '#56e89022' : '#f8514922',
              padding: '1px 5px', borderRadius: 3,
            }}>{auctionOpen ? '개장' : '휴장'}</span>
          </span>
        </div>
      </div>

      {selectedDay && (
        <div style={{ marginTop: 4, background: '#253748', border: '1px solid #354d65', borderRadius: 6, padding: '8px 10px' }}>
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

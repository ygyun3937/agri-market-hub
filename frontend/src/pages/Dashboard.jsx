// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import client from '../api/client'
import Header from '../components/Header/Header'
import AlertBanner from '../components/AlertBanner/AlertBanner'
import NewsTicker from '../components/NewsTicker/NewsTicker'
import NewsPanel from '../components/NewsPanel/NewsPanel'
import MapPanel from '../components/MapPanel/MapPanel'
import PricePanel from '../components/PricePanel/PricePanel'
import WeatherPanel from '../components/WeatherPanel/WeatherPanel'
import CalendarPanel from '../components/CalendarPanel/CalendarPanel'
import ScheduleList from '../components/CalendarPanel/ScheduleList'
import FuelPanel from '../components/FuelPanel/FuelPanel'
import { useSignalR } from '../hooks/useSignalR'

const LAYER_LABELS = ['도매시장', '산지', '기상특보', '병해충']

export default function Dashboard() {
  const [disasterAlerts, setDisasterAlerts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [layers, setLayers] = useState({ '도매시장': true, '산지': true, '기상특보': true, '병해충': true })
  const [schedules, setSchedules] = useState([])

  useEffect(() => {
    client.get('/alerts/disaster').then(r => setDisasterAlerts(r.data)).catch(() => {})
    client.get('/notifications').then(r => setNotifications(r.data)).catch(() => {})
    client.get('/schedules').then(r => setSchedules(r.data)).catch(() => {})
  }, [])

  const unreadCount = notifications.filter(n => !n.isRead).length

  useSignalR(
    () => {},
    alert => setDisasterAlerts(prev => [alert, ...prev])
  )

  const toggleLayer = (label) =>
    setLayers(prev => ({ ...prev, [label]: !prev[label] }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh',
      background: '#0d1117', color: '#e6edf3', overflow: 'hidden' }}>
      <Header alertCount={unreadCount} hasDisasterAlert={disasterAlerts.length > 0} />
      <AlertBanner alerts={disasterAlerts} />
      <NewsTicker />

      <div style={{ padding: '8px 12px', borderBottom: '1px solid #21262d',
        flexShrink: 0, overflow: 'hidden', height: 115 }}>
        <NewsPanel />
      </div>

      <div style={{ flex: 1, display: 'grid', overflow: 'hidden',
        gridTemplateColumns: '220px 1fr 270px 280px',
        gridTemplateRows: '1fr auto' }}>

        {/* 레이어 패널 - 양 행 span */}
        <div style={{ gridColumn: 1, gridRow: '1 / 3', borderRight: '1px solid #21262d',
          padding: 10, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
          <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.8 }}>레이어</div>
          {LAYER_LABELS.map(l => (
            <label key={l} style={{ fontSize: 14, color: layers[l] ? '#c9d1d9' : '#555',
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={layers[l]} onChange={() => toggleLayer(l)} />
              {l}
            </label>
          ))}
          <FuelPanel />
        </div>

        {/* 지도 - 양 행 span */}
        <div style={{ gridColumn: 2, gridRow: '1 / 3', borderRight: '1px solid #21262d', overflow: 'hidden' }}>
          <MapPanel layers={layers} />
        </div>

        {/* 가격 패널 */}
        <div style={{ gridColumn: 3, gridRow: 1, borderRight: '1px solid #21262d', overflow: 'auto', minHeight: 0 }}>
          <PricePanel />
        </div>

        {/* 날씨 패널 */}
        <div style={{ gridColumn: 4, gridRow: 1, overflow: 'auto', minHeight: 0 }}>
          <WeatherPanel />
        </div>

        {/* 캘린더 패널 */}
        <div style={{ gridColumn: 3, gridRow: 2, borderRight: '1px solid #21262d', borderTop: '1px solid #21262d' }}>
          <CalendarPanel schedules={schedules} setSchedules={setSchedules} />
        </div>

        {/* 일정 목록 패널 */}
        <div style={{ gridColumn: 4, gridRow: 2, borderTop: '1px solid #21262d', overflow: 'auto' }}>
          <ScheduleList schedules={schedules} setSchedules={setSchedules} />
        </div>
      </div>
    </div>
  )
}

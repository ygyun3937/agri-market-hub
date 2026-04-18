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
import FuelPanel from '../components/FuelPanel/FuelPanel'
import { useSignalR } from '../hooks/useSignalR'

export default function Dashboard() {
  const [disasterAlerts, setDisasterAlerts] = useState([])
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    client.get('/alerts/disaster').then(r => setDisasterAlerts(r.data)).catch(() => {})
    client.get('/notifications').then(r => setNotifications(r.data)).catch(() => {})
  }, [])

  const unreadCount = notifications.filter(n => !n.isRead).length

  useSignalR(
    () => {},
    alert => setDisasterAlerts(prev => [alert, ...prev])
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh',
      background: '#0d1117', color: '#e6edf3', overflow: 'hidden' }}>
      <Header alertCount={unreadCount} hasDisasterAlert={disasterAlerts.length > 0} />
      <AlertBanner alerts={disasterAlerts} />
      <NewsTicker />

      <div style={{ padding: '8px 12px', borderBottom: '1px solid #21262d',
        flexShrink: 0, overflow: 'hidden', height: 110 }}>
        <NewsPanel />
      </div>

      <div style={{ flex: 1, display: 'grid', overflow: 'hidden',
        gridTemplateColumns: '180px 1fr 300px 220px' }}>

        <div style={{ borderRight: '1px solid #21262d', padding: 10,
          display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
          <div style={{ fontSize: 9, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.8 }}>레이어</div>
          {['도매시장', '산지', '기상특보', '병해충'].map(l => (
            <label key={l} style={{ fontSize: 12, color: '#c9d1d9',
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked={l !== '병해충'} />
              {l}
            </label>
          ))}
          <FuelPanel />
        </div>

        <div style={{ borderRight: '1px solid #21262d', overflow: 'hidden' }}>
          <MapPanel />
        </div>

        <div style={{ borderRight: '1px solid #21262d', display: 'flex',
          flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto' }}><PricePanel /></div>
          <div style={{ borderTop: '1px solid #21262d' }}><CalendarPanel /></div>
        </div>

        <div style={{ overflow: 'auto' }}><WeatherPanel /></div>
      </div>
    </div>
  )
}

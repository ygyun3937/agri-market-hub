// src/pages/Dashboard.jsx
import { useEffect, useRef, useState } from 'react'
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

const DEFAULT_LAYOUT = { col1: 220, col3: 270, col4: 280, bottomH: 310 }

function loadLayout() {
  try { return { ...DEFAULT_LAYOUT, ...JSON.parse(localStorage.getItem('dashboard_layout') || '{}') } }
  catch { return DEFAULT_LAYOUT }
}

function ColHandle({ onDelta }) {
  const dragging = useRef(false)
  const lastX = useRef(0)
  const [active, setActive] = useState(false)

  const onMouseDown = (e) => {
    e.preventDefault()
    dragging.current = true
    lastX.current = e.clientX
    setActive(true)
    const move = (e) => {
      if (!dragging.current) return
      onDelta(e.clientX - lastX.current)
      lastX.current = e.clientX
    }
    const up = () => {
      dragging.current = false
      setActive(false)
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  return (
    <div onMouseDown={onMouseDown} style={{
      width: 4, flexShrink: 0, cursor: 'col-resize', zIndex: 10,
      background: active ? '#388bfd' : '#21262d',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#388bfd'}
    onMouseLeave={e => { if (!dragging.current) e.currentTarget.style.background = '#21262d' }}
    />
  )
}

function RowHandle({ onDelta }) {
  const dragging = useRef(false)
  const lastY = useRef(0)
  const [active, setActive] = useState(false)

  const onMouseDown = (e) => {
    e.preventDefault()
    dragging.current = true
    lastY.current = e.clientY
    setActive(true)
    const move = (e) => {
      if (!dragging.current) return
      onDelta(e.clientY - lastY.current)
      lastY.current = e.clientY
    }
    const up = () => {
      dragging.current = false
      setActive(false)
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  return (
    <div onMouseDown={onMouseDown} style={{
      height: 4, flexShrink: 0, cursor: 'row-resize', zIndex: 10,
      background: active ? '#388bfd' : '#21262d',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#388bfd'}
    onMouseLeave={e => { if (!dragging.current) e.currentTarget.style.background = '#21262d' }}
    />
  )
}

export default function Dashboard() {
  const [disasterAlerts, setDisasterAlerts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [layers, setLayers] = useState({ '도매시장': true, '산지': true, '기상특보': true, '병해충': true })
  const [schedules, setSchedules] = useState([])
  const [layout, setLayout] = useState(loadLayout)

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

  const updateLayout = (patch) =>
    setLayout(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem('dashboard_layout', JSON.stringify(next))
      return next
    })

  const B = 200  // min bottomH
  const C = 120  // min col width

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

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Col 1: 레이어 */}
        <div style={{ width: layout.col1, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 8,
          padding: 10, overflow: 'auto' }}>
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

        <ColHandle onDelta={dx => updateLayout({ col1: Math.max(C, layout.col1 + dx) })} />

        {/* Col 2: 지도 */}
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 200 }}>
          <MapPanel layers={layers} />
        </div>

        <ColHandle onDelta={dx => updateLayout({ col3: Math.max(C, layout.col3 - dx) })} />

        {/* Col 3: 가격 + 캘린더 */}
        <div style={{ width: layout.col3, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}><PricePanel /></div>
          <RowHandle onDelta={dy => updateLayout({ bottomH: Math.max(B, layout.bottomH - dy) })} />
          <div style={{ height: layout.bottomH, flexShrink: 0, overflow: 'auto' }}>
            <CalendarPanel schedules={schedules} setSchedules={setSchedules} />
          </div>
        </div>

        <ColHandle onDelta={dx => updateLayout({ col4: Math.max(C, layout.col4 - dx) })} />

        {/* Col 4: 날씨 + 일정 */}
        <div style={{ width: layout.col4, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}><WeatherPanel /></div>
          <RowHandle onDelta={dy => updateLayout({ bottomH: Math.max(B, layout.bottomH - dy) })} />
          <div style={{ height: layout.bottomH, flexShrink: 0, overflow: 'auto' }}>
            <ScheduleList schedules={schedules} setSchedules={setSchedules} />
          </div>
        </div>

      </div>
    </div>
  )
}

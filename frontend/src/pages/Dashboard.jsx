// src/pages/Dashboard.jsx
import { useCallback, useEffect, useRef, useState } from 'react'
import client from '../api/client'
import Header from '../components/Header/Header'
import AlertBanner from '../components/AlertBanner/AlertBanner'
import NewsTicker from '../components/NewsTicker/NewsTicker'
import NewsPanel from '../components/NewsPanel/NewsPanel'
import MapPanel from '../components/MapPanel/MapPanel'
import WeatherPanel from '../components/WeatherPanel/WeatherPanel'
import CalendarPanel from '../components/CalendarPanel/CalendarPanel'
import ScheduleList from '../components/CalendarPanel/ScheduleList'
import FuelPanel from '../components/FuelPanel/FuelPanel'
import PestPanel from '../components/PestPanel/PestPanel'
import { useSignalR } from '../hooks/useSignalR'
import { usePush } from '../hooks/usePush'

const LAYER_LABELS = ['도매시장', '기상특보', '병해충', '특산물']

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
      background: active ? '#6ab8ff' : '#2d4255',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#6ab8ff'}
    onMouseLeave={e => { if (!dragging.current) e.currentTarget.style.background = '#2d4255' }}
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
      background: active ? '#6ab8ff' : '#2d4255',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#6ab8ff'}
    onMouseLeave={e => { if (!dragging.current) e.currentTarget.style.background = '#2d4255' }}
    />
  )
}

const MOBILE_TABS = [
  { key: 'map',      icon: '🗺️', label: '지도' },
  { key: 'weather',  icon: '⛅',  label: '날씨' },
  { key: 'schedule', icon: '📋', label: '일정' },
  { key: 'info',     icon: '📊', label: '정보' },
]

export default function Dashboard() {
  const [disasterAlerts, setDisasterAlerts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [layers, setLayers] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('map_layers') || '{}')
      return {
        '도매시장': saved['도매시장'] ?? true,
        '기상특보': saved['기상특보'] ?? true,
        '병해충': saved['병해충'] ?? true,
        '특산물': saved['특산물'] ?? false,
      }
    } catch { return { '도매시장': true, '기상특보': true, '병해충': true, '특산물': false } }
  })
  const [schedules, setSchedules] = useState([])
  const [layout, setLayout] = useState(loadLayout)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  const [mobileTab, setMobileTab] = useState('map')

  const isLoggedIn = !!localStorage.getItem('token')
  const { subscribe: subscribePush } = usePush()

  const fetchSchedules = useCallback(() => {
    Promise.all([
      client.get('/schedules').catch(() => ({ data: [] })),
      client.get('/schedules/gcal-events').catch(() => ({ data: [] })),
    ]).then(([siteRes, gcalRes]) => {
      const siteSchedules = siteRes.data || []
      const gcalEvents = (gcalRes.data || []).filter(
        g => !siteSchedules.some(s => s.gcalEventId === g.gcalEventId)
      )
      setSchedules([...siteSchedules, ...gcalEvents])
    })
  }, [])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    client.get('/alerts/disaster').then(r => setDisasterAlerts(r.data)).catch(() => {})
    if (isLoggedIn) {
      client.get('/notifications').then(r => setNotifications(r.data)).catch(() => {})
      fetchSchedules()
      subscribePush().catch(() => {})
    }
  }, [fetchSchedules])

  const unreadCount = notifications.filter(n => !n.isRead).length

  useSignalR(
    () => {},
    alert => setDisasterAlerts(prev => [alert, ...prev])
  )

  const toggleLayer = (label) =>
    setLayers(prev => {
      const next = { ...prev, [label]: !prev[label] }
      localStorage.setItem('map_layers', JSON.stringify(next))
      return next
    })

  const updateLayout = (key, delta, min = 0) =>
    setLayout(prev => {
      const next = { ...prev, [key]: Math.max(min, prev[key] + delta) }
      localStorage.setItem('dashboard_layout', JSON.stringify(next))
      window.dispatchEvent(new Event('resize'))
      return next
    })

  const B = 200  // min bottomH
  const C = 120  // min col width

  if (isMobile) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh',
      background: '#1c2a36', color: '#eef5fb', overflow: 'hidden' }}>
      <Header alertCount={unreadCount} hasDisasterAlert={disasterAlerts.length > 0} />
      <AlertBanner alerts={disasterAlerts} />
      <NewsTicker />
      <div style={{ flexShrink: 0, borderBottom: '1px solid #2d4255', height: 128, overflow: 'hidden', padding: '6px 10px' }}>
        <NewsPanel />
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
        {mobileTab === 'map' && (
          <>
            <MapPanel layers={layers} />
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 1000 }}>
              {LAYER_LABELS.map(l => (
                <label key={l} style={{ background: '#253748ee', border: '1px solid #354d65', borderRadius: 8,
                  padding: '6px 12px', fontSize: 13, color: layers[l] ? '#ddeaf5' : '#667',
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minHeight: 36 }}>
                  <input type="checkbox" checked={layers[l]} onChange={() => toggleLayer(l)}
                    style={{ margin: 0, width: 18, height: 18 }} />
                  {l}
                </label>
              ))}
            </div>
          </>
        )}
        {mobileTab === 'weather' && <div style={{ overflow: 'auto', height: '100%' }}><WeatherPanel /></div>}
        {mobileTab === 'schedule' && (
          <div style={{ overflow: 'auto', height: '100%' }}>
            <CalendarPanel schedules={schedules} refreshSchedules={fetchSchedules} />
            <ScheduleList schedules={schedules} refreshSchedules={fetchSchedules} />
          </div>
        )}
        {mobileTab === 'info' && (
          <div style={{ overflow: 'auto', height: '100%', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FuelPanel />
            <PestPanel />
          </div>
        )}
      </div>
      <div style={{ background: '#162330', borderTop: '1px solid #2d4255', display: 'flex', flexShrink: 0 }}>
        {MOBILE_TABS.map(t => (
          <button key={t.key} onClick={() => setMobileTab(t.key)} style={{
            flex: 1, padding: '10px 0 12px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3, background: mobileTab === t.key ? '#1a2e3a' : 'none',
            border: 'none', cursor: 'pointer',
            borderTop: mobileTab === t.key ? '2px solid #82cfff' : '2px solid transparent',
          }}>
            <span style={{ fontSize: 24 }}>{t.icon}</span>
            <span style={{ fontSize: 12, fontWeight: mobileTab === t.key ? 700 : 400, color: mobileTab === t.key ? '#82cfff' : '#87b8d4' }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh',
      background: '#1c2a36', color: '#eef5fb', overflow: 'hidden' }}>
      <Header alertCount={unreadCount} hasDisasterAlert={disasterAlerts.length > 0} />
      <AlertBanner alerts={disasterAlerts} />
      <NewsTicker />

      <div style={{ padding: '8px 12px', borderBottom: '1px solid #2d4255',
        flexShrink: 0, overflow: 'hidden', height: 115 }}>
        <NewsPanel />
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Col 1: 레이어 */}
        <div style={{ width: layout.col1, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 8,
          padding: 10, overflow: 'auto' }}>
          <div style={{ fontSize: 11, color: '#87b8d4', textTransform: 'uppercase', letterSpacing: 0.8 }}>레이어</div>
          {LAYER_LABELS.map(l => (
            <label key={l} style={{ fontSize: 14, color: layers[l] ? '#ddeaf5' : '#555',
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={layers[l]} onChange={() => toggleLayer(l)} />
              {l}
            </label>
          ))}
          <FuelPanel />
          <PestPanel />
        </div>

        <ColHandle onDelta={dx => updateLayout('col1', dx, C)} />

        {/* Col 2: 지도 */}
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 200 }}>
          <MapPanel layers={layers} />
        </div>

        <ColHandle onDelta={dx => updateLayout('col3', -dx, C)} />

        {/* Col 3: 캘린더 */}
        <div style={{ width: layout.col3, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <CalendarPanel schedules={schedules} refreshSchedules={fetchSchedules} />
          </div>
        </div>

        <ColHandle onDelta={dx => updateLayout('col4', -dx, C)} />

        {/* Col 4: 날씨 + 일정 */}
        <div style={{ width: layout.col4, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}><WeatherPanel /></div>
          <RowHandle onDelta={dy => updateLayout('bottomH', -dy, B)} />
          <div style={{ height: layout.bottomH, flexShrink: 0, overflow: 'auto' }}>
            <ScheduleList schedules={schedules} refreshSchedules={fetchSchedules} />
          </div>
        </div>

      </div>
    </div>
  )
}

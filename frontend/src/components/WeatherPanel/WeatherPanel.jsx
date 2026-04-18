// src/components/WeatherPanel/WeatherPanel.jsx
import { useEffect, useState } from 'react'
import client from '../../api/client'

const REGIONS = [
  { code: '11B10101', name: '서울' },
  { code: '11B20201', name: '인천' },
  { code: '11B20601', name: '수원' },
  { code: '11D10301', name: '춘천' },
  { code: '11C10301', name: '청주' },
  { code: '11C20401', name: '대전' },
  { code: '11C20404', name: '세종' },
  { code: '11F10201', name: '전주' },
  { code: '11F20401', name: '광주' },
  { code: '11F20501', name: '목포' },
  { code: '11H10201', name: '안동' },
  { code: '11H10701', name: '대구' },
  { code: '11H20101', name: '울산' },
  { code: '11H20201', name: '부산' },
  { code: '11H20301', name: '창원' },
  { code: '11G00201', name: '제주' },
]
const ICON = { sunny: '☀️', cloudy: '⛅', rainy: '🌧️', snowy: '❄️' }

function RainBar({ prob = 0 }) {
  const color = prob >= 60 ? '#58a6ff' : prob >= 30 ? '#79c0ff' : '#30363d'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 52 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#21262d', overflow: 'hidden' }}>
        <div style={{ width: `${prob}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 10, color: '#8b949e', width: 24, textAlign: 'right' }}>{prob}%</span>
    </div>
  )
}

export default function WeatherPanel() {
  const [region, setRegion] = useState(
    () => localStorage.getItem('weather_region') || '11B10101'
  )
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])

  const regionName = REGIONS.find(r => r.code === region)?.name || '서울'

  useEffect(() => {
    setWeather(null)
    setForecast([])
    client.get(`/weather/${region}`).then(r => setWeather(r.data)).catch(() => {})
    client.get(`/weather/${region}/forecast`).then(r => setForecast(r.data)).catch(() => {})
  }, [region])

  const handleRegionChange = (e) => {
    localStorage.setItem('weather_region', e.target.value)
    setRegion(e.target.value)
  }

  return (
    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase',
          letterSpacing: 0.8, fontWeight: 600 }}>
          ⛅ 날씨 · {regionName}
        </div>
        <select value={region} onChange={handleRegionChange} style={{
          background: '#21262d', border: '1px solid #30363d', borderRadius: 4,
          color: '#c9d1d9', fontSize: 11, padding: '2px 4px', cursor: 'pointer', outline: 'none'
        }}>
          {REGIONS.map(r => (
            <option key={r.code} value={r.code}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* 현재 날씨 */}
      {weather ? (
        <div style={{ background: '#161b22', border: '1px solid #30363d',
          borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 42, fontWeight: 700, color: '#e6edf3', lineHeight: 1 }}>
              {weather.temp ?? '--'}°
            </span>
            <span style={{ fontSize: 28, lineHeight: 1, paddingBottom: 2 }}>
              {weather.rain > 0 ? '🌧️' : weather.humidity > 70 ? '⛅' : '☀️'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13 }}>💧</span>
              <div>
                <div style={{ fontSize: 10, color: '#8b949e' }}>습도</div>
                <div style={{ fontSize: 13, color: '#c9d1d9', fontWeight: 600 }}>{weather.humidity ?? '--'}%</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13 }}>💨</span>
              <div>
                <div style={{ fontSize: 10, color: '#8b949e' }}>바람</div>
                <div style={{ fontSize: 13, color: '#c9d1d9', fontWeight: 600 }}>{weather.wind ?? '--'}m/s</div>
              </div>
            </div>
            {weather.rain > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: 13 }}>🌧️</span>
                <div>
                  <div style={{ fontSize: 10, color: '#8b949e' }}>강수량</div>
                  <div style={{ fontSize: 13, color: '#58a6ff', fontWeight: 600 }}>{weather.rain}mm</div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#8b949e', textAlign: 'center', padding: 20 }}>데이터 없음</div>
      )}

      {/* 5일 예보 */}
      <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase',
        letterSpacing: 0.8, marginBottom: 6, fontWeight: 600 }}>
        5일 예보
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {forecast.map(f => {
          const d = new Date(f.date)
          const weekday = d.toLocaleDateString('ko', { weekday: 'short' })
          const date = d.toLocaleDateString('ko', { month: 'numeric', day: 'numeric' })
          const isToday = new Date().toDateString() === d.toDateString()
          return (
            <div key={f.date} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 8px', borderRadius: 6,
              background: isToday ? '#1f2937' : 'transparent',
              border: `1px solid ${isToday ? '#374151' : 'transparent'}`,
            }}>
              <div style={{ width: 34, flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: isToday ? '#58a6ff' : '#c9d1d9', fontWeight: isToday ? 700 : 400 }}>{weekday}</div>
                <div style={{ fontSize: 10, color: '#8b949e' }}>{date}</div>
              </div>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{ICON[f.icon] || '☀️'}</span>
              <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: '#f85149', fontWeight: 600 }}>{f.high ?? '--'}°</span>
                <span style={{ fontSize: 10, color: '#8b949e' }}>/</span>
                <span style={{ fontSize: 12, color: '#79c0ff' }}>{f.low ?? '--'}°</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <RainBar prob={f.rainProb ?? 0} />
              </div>
            </div>
          )
        })}
        {forecast.length === 0 && (
          <div style={{ fontSize: 12, color: '#8b949e', padding: '8px 0' }}>예보 없음</div>
        )}
      </div>
    </div>
  )
}

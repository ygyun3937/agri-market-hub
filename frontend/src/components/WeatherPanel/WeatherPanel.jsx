// src/components/WeatherPanel/WeatherPanel.jsx
import { useEffect, useState } from 'react'
import client from '../../api/client'

const REGION = '11B10101'
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
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])

  useEffect(() => {
    client.get(`/weather/${REGION}`).then(r => setWeather(r.data)).catch(() => {})
    client.get(`/weather/${REGION}/forecast`).then(r => setForecast(r.data)).catch(() => {})
  }, [])

  return (
    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* 헤더 */}
      <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase',
        letterSpacing: 0.8, marginBottom: 10, fontWeight: 600 }}>
        ⛅ 날씨 · 서울
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

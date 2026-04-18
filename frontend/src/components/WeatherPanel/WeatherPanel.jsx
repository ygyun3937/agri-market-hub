// src/components/WeatherPanel/WeatherPanel.jsx
import { useEffect, useState } from 'react'
import client from '../../api/client'

const REGION = '11B10101'
const WEATHER_ICONS = { sunny: '☀️', cloudy: '⛅', rainy: '🌧️', snowy: '❄️' }

export default function WeatherPanel() {
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])

  useEffect(() => {
    client.get(`/weather/${REGION}`).then(r => setWeather(r.data)).catch(() => {})
    client.get(`/weather/${REGION}/forecast`).then(r => setForecast(r.data)).catch(() => {})
  }, [])

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        날씨 · 서울
      </div>
      {weather ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 31, fontWeight: 700, color: '#e6edf3' }}>
            {weather.temp ?? '--'}°C
          </div>
          <div style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>
            습도 {weather.humidity ?? '--'}% · 바람 {weather.wind ?? '--'}m/s
          </div>
          {weather.rain > 0 && (
            <div style={{ fontSize: 12, color: '#58a6ff' }}>강수 {weather.rain}mm</div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#8b949e', textAlign: 'center' }}>데이터 없음</div>
      )}

      <div style={{ height: 1, background: '#21262d' }} />
      <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        5일 예보
      </div>
      {forecast.map(f => (
        <div key={f.date} style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c9d1d9'
        }}>
          <span style={{ width: 42, flexShrink: 0, color: '#8b949e', fontSize: 10 }}>
            {new Date(f.date).toLocaleDateString('ko', { weekday: 'short', month: 'numeric', day: 'numeric' })}
          </span>
          <span>{WEATHER_ICONS[f.icon] || '☀️'}</span>
          <span style={{ color: '#f85149' }}>{f.high ?? '--'}°</span>
          <span style={{ color: '#8b949e' }}>/</span>
          <span style={{ color: '#58a6ff' }}>{f.low ?? '--'}°</span>
          <span style={{ marginLeft: 'auto', color: '#8b949e', fontSize: 10 }}>{f.rainProb ?? 0}%</span>
        </div>
      ))}
      {forecast.length === 0 && (
        <div style={{ fontSize: 12, color: '#8b949e' }}>예보 없음</div>
      )}
    </div>
  )
}

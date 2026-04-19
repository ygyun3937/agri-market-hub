// src/components/WeatherPanel/WeatherPanel.jsx
import { useEffect, useState } from 'react'
import client from '../../api/client'

const ALL_REGIONS = [
  { code: '11B10101', name: '서울' },
  { code: '11B20201', name: '인천' },
  { code: '11B20601', name: '수원' },
  { code: '11B20701', name: '고양' },
  { code: '11B20401', name: '성남' },
  { code: '11B20501', name: '용인' },
  { code: '11B20301', name: '의정부' },
  { code: '11D10301', name: '춘천' },
  { code: '11D10401', name: '원주' },
  { code: '11D20401', name: '속초' },
  { code: '11D20501', name: '강릉' },
  { code: '11D20601', name: '동해' },
  { code: '11C10101', name: '천안' },
  { code: '11C10201', name: '서산' },
  { code: '11C10301', name: '청주' },
  { code: '11C20401', name: '대전' },
  { code: '11C20404', name: '세종' },
  { code: '11F10101', name: '군산' },
  { code: '11F10201', name: '전주' },
  { code: '11F10301', name: '익산' },
  { code: '11F20101', name: '나주' },
  { code: '11F20201', name: '순천' },
  { code: '11F20301', name: '여수' },
  { code: '11F20401', name: '광주' },
  { code: '11F20501', name: '목포' },
  { code: '11F20601', name: '해남' },
  { code: '11H10201', name: '안동' },
  { code: '11H10501', name: '포항' },
  { code: '11H10601', name: '경주' },
  { code: '11H10701', name: '대구' },
  { code: '11H20101', name: '울산' },
  { code: '11H20201', name: '부산' },
  { code: '11H20301', name: '창원' },
  { code: '11H20401', name: '진주' },
  { code: '11H20601', name: '김해' },
  { code: '11G00201', name: '제주' },
  { code: '11G00401', name: '서귀포' },
]

const DEFAULT_FAVORITES = ['11B10101']
const LS_KEY = 'weather_favorites'
const LS_SEL = 'weather_region'

function loadFavorites() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
    return Array.isArray(v) && v.length > 0 ? v : DEFAULT_FAVORITES
  } catch { return DEFAULT_FAVORITES }
}

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

function AddRegionModal({ favorites, onAdd, onClose }) {
  const [query, setQuery] = useState('')
  const available = ALL_REGIONS.filter(r =>
    !favorites.includes(r.code) && (!query.trim() || r.name.includes(query.trim()))
  )
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)'
    }} onClick={onClose}>
      <div style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: 10,
        padding: '14px 16px', width: 220, boxShadow: '0 8px 32px #000a'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 8 }}>지역 추가</div>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Escape' && onClose()}
          placeholder="지역명 검색..."
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#0d1117', border: '1px solid #30363d', borderRadius: 5,
            color: '#e6edf3', fontSize: 13, padding: '6px 8px', marginBottom: 8, outline: 'none'
          }}
        />
        <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {available.map(r => (
            <button key={r.code} onClick={() => onAdd(r.code)} style={{
              background: '#21262d', border: '1px solid #30363d', borderRadius: 5,
              color: '#c9d1d9', fontSize: 13, padding: '6px 10px',
              textAlign: 'left', cursor: 'pointer'
            }}>{r.name}</button>
          ))}
          {available.length === 0 && (
            <div style={{ fontSize: 12, color: '#8b949e', padding: 4 }}>추가할 지역 없음</div>
          )}
        </div>
        <button onClick={onClose} style={{
          marginTop: 10, width: '100%', padding: 4, background: 'none',
          border: '1px solid #30363d', borderRadius: 4, color: '#8b949e',
          fontSize: 12, cursor: 'pointer'
        }}>닫기 (Esc)</button>
      </div>
    </div>
  )
}

export default function WeatherPanel() {
  const [favorites, setFavorites] = useState(loadFavorites)
  const [region, setRegion] = useState(
    () => {
      const sel = localStorage.getItem(LS_SEL)
      const favs = loadFavorites()
      return favs.includes(sel) ? sel : favs[0]
    }
  )
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [showModal, setShowModal] = useState(false)

  const regionName = ALL_REGIONS.find(r => r.code === region)?.name || ''

  useEffect(() => {
    client.get(`/weather/${region}`).then(r => setWeather(r.data)).catch(() => setWeather(null))
    client.get(`/weather/${region}/forecast`).then(r => setForecast(r.data)).catch(() => setForecast([]))
  }, [region])

  const selectRegion = (code) => {
    setRegion(code)
    localStorage.setItem(LS_SEL, code)
  }

  const addFavorite = (code) => {
    const next = [...favorites, code]
    setFavorites(next)
    localStorage.setItem(LS_KEY, JSON.stringify(next))
    selectRegion(code)
    setShowModal(false)
  }

  const removeFavorite = (code) => {
    if (favorites.length <= 1) return
    const next = favorites.filter(c => c !== code)
    setFavorites(next)
    localStorage.setItem(LS_KEY, JSON.stringify(next))
    if (region === code) selectRegion(next[0])
  }

  return (
    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* 헤더 */}
      <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase',
        letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>
        ⛅ 날씨 · {regionName}
      </div>

      {/* 즐겨찾기 탭 */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
        {favorites.map(code => {
          const name = ALL_REGIONS.find(r => r.code === code)?.name || code
          const active = code === region
          return (
            <div key={code} style={{
              display: 'flex', alignItems: 'center', gap: 3,
              background: active ? '#1f6feb' : '#21262d',
              border: `1px solid ${active ? '#388bfd' : '#30363d'}`,
              borderRadius: 12, padding: '2px 8px 2px 10px',
              cursor: 'pointer', fontSize: 12,
              color: active ? '#fff' : '#c9d1d9',
            }}>
              <span onClick={() => selectRegion(code)}>{name}</span>
              {favorites.length > 1 && (
                <span onClick={() => removeFavorite(code)} style={{
                  fontSize: 10, color: active ? '#ffffffaa' : '#8b949e',
                  marginLeft: 2, lineHeight: 1, cursor: 'pointer'
                }}>×</span>
              )}
            </div>
          )
        })}
        <button onClick={() => setShowModal(true)} style={{
          background: 'none', border: '1px dashed #30363d', borderRadius: 12,
          color: '#58a6ff', fontSize: 12, padding: '2px 10px', cursor: 'pointer'
        }}>+ 추가</button>
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

      {showModal && (
        <AddRegionModal
          favorites={favorites}
          onAdd={addFavorite}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

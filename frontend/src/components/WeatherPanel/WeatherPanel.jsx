// src/components/WeatherPanel/WeatherPanel.jsx
import { useEffect, useState } from 'react'
import client from '../../api/client'

const ALL_REGIONS = [
  // 서울·인천·경기
  { code: '11B10101', name: '서울' },
  { code: '11B20201', name: '인천' },
  { code: '11B20601', name: '수원' },
  { code: '11B20701', name: '고양' },
  { code: '11B20401', name: '성남' },
  { code: '11B20501', name: '용인' },
  { code: '11B20301', name: '의정부' },
  { code: '11B20801', name: '부천' },
  { code: '11B20901', name: '안산' },
  { code: '11B21001', name: '안양' },
  { code: '11B21101', name: '광명' },
  { code: '11B21201', name: '평택' },
  { code: '11B21301', name: '화성' },
  { code: '11B21401', name: '파주' },
  { code: '11B21501', name: '남양주' },
  { code: '11B21601', name: '이천' },
  { code: '11B21701', name: '여주' },
  { code: '11B21801', name: '시흥' },
  { code: '11B21901', name: '포천' },
  { code: '11B22001', name: '김포' },
  { code: '11B22101', name: '양주' },
  // 강원
  { code: '11D10301', name: '춘천' },
  { code: '11D10401', name: '원주' },
  { code: '11D20401', name: '속초' },
  { code: '11D20501', name: '강릉' },
  { code: '11D20601', name: '동해' },
  { code: '11D20701', name: '태백' },
  { code: '11D20801', name: '삼척' },
  { code: '11D10501', name: '영월' },
  { code: '11D10601', name: '평창' },
  { code: '11D10701', name: '홍천' },
  { code: '11D10801', name: '철원' },
  { code: '11D20901', name: '양양' },
  // 충청남북도·대전·세종
  { code: '11C10101', name: '천안' },
  { code: '11C10201', name: '서산' },
  { code: '11C10301', name: '청주' },
  { code: '11C20401', name: '대전' },
  { code: '11C20404', name: '세종' },
  { code: '11C10401', name: '충주' },
  { code: '11C10501', name: '제천' },
  { code: '11C10601', name: '음성' },
  { code: '11C10701', name: '진천' },
  { code: '11C20501', name: '공주' },
  { code: '11C20601', name: '아산' },
  { code: '11C20701', name: '보령' },
  { code: '11C20801', name: '논산' },
  { code: '11C20901', name: '당진' },
  { code: '11C21001', name: '홍성' },
  // 전라남북도·광주
  { code: '11F10101', name: '군산' },
  { code: '11F10201', name: '전주' },
  { code: '11F10301', name: '익산' },
  { code: '11F20101', name: '나주' },
  { code: '11F20201', name: '순천' },
  { code: '11F20301', name: '여수' },
  { code: '11F20401', name: '광주' },
  { code: '11F20501', name: '목포' },
  { code: '11F20601', name: '해남' },
  { code: '11F10401', name: '남원' },
  { code: '11F10501', name: '정읍' },
  { code: '11F10601', name: '김제' },
  { code: '11F10701', name: '고창' },
  { code: '11F20701', name: '담양' },
  { code: '11F20801', name: '구례' },
  { code: '11F20901', name: '고흥' },
  { code: '11F21001', name: '화순' },
  { code: '11F21101', name: '영암' },
  { code: '11F21201', name: '완도' },
  { code: '11F21301', name: '진도' },
  { code: '11F21401', name: '강진' },
  // 경상남북도·대구·울산·부산
  { code: '11H10201', name: '안동' },
  { code: '11H10501', name: '포항' },
  { code: '11H10601', name: '경주' },
  { code: '11H10701', name: '대구' },
  { code: '11H20101', name: '울산' },
  { code: '11H20201', name: '부산' },
  { code: '11H20301', name: '창원' },
  { code: '11H20401', name: '진주' },
  { code: '11H20601', name: '김해' },
  { code: '11H10801', name: '구미' },
  { code: '11H10901', name: '영주' },
  { code: '11H11001', name: '상주' },
  { code: '11H11101', name: '경산' },
  { code: '11H11201', name: '김천' },
  { code: '11H11301', name: '문경' },
  { code: '11H11401', name: '영천' },
  { code: '11H11501', name: '울진' },
  { code: '11H20701', name: '거제' },
  { code: '11H20801', name: '양산' },
  { code: '11H20901', name: '통영' },
  { code: '11H21001', name: '사천' },
  { code: '11H21101', name: '밀양' },
  { code: '11H21201', name: '거창' },
  // 제주
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
  const color = prob >= 60 ? '#82cfff' : prob >= 30 ? '#8dd8ff' : '#354d65'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 52 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#2d4255', overflow: 'hidden' }}>
        <div style={{ width: `${prob}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 10, color: '#87b8d4', width: 24, textAlign: 'right' }}>{prob}%</span>
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
        background: '#253748', border: '1px solid #354d65', borderRadius: 10,
        padding: '14px 16px', width: 220, boxShadow: '0 8px 32px #000a'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 12, color: '#87b8d4', marginBottom: 8 }}>지역 추가</div>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Escape' && onClose()}
          placeholder="지역명 검색..."
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#1c2a36', border: '1px solid #354d65', borderRadius: 5,
            color: '#eef5fb', fontSize: 13, padding: '6px 8px', marginBottom: 8, outline: 'none'
          }}
        />
        <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {available.map(r => (
            <button key={r.code} onClick={() => onAdd(r.code)} style={{
              background: '#2d4255', border: '1px solid #354d65', borderRadius: 5,
              color: '#ddeaf5', fontSize: 13, padding: '6px 10px',
              textAlign: 'left', cursor: 'pointer'
            }}>{r.name}</button>
          ))}
          {available.length === 0 && (
            <div style={{ fontSize: 12, color: '#87b8d4', padding: 4 }}>추가할 지역 없음</div>
          )}
        </div>
        <button onClick={onClose} style={{
          marginTop: 10, width: '100%', padding: 4, background: 'none',
          border: '1px solid #354d65', borderRadius: 4, color: '#87b8d4',
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
      <div style={{ fontSize: 11, color: '#87b8d4', textTransform: 'uppercase',
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
              background: active ? '#1a7fd4' : '#2d4255',
              border: `1px solid ${active ? '#6ab8ff' : '#354d65'}`,
              borderRadius: 12, padding: '2px 8px 2px 10px',
              cursor: 'pointer', fontSize: 12,
              color: active ? '#fff' : '#ddeaf5',
            }}>
              <span onClick={() => selectRegion(code)}>{name}</span>
              {favorites.length > 1 && (
                <span onClick={() => removeFavorite(code)} style={{
                  fontSize: 10, color: active ? '#ffffffaa' : '#87b8d4',
                  marginLeft: 2, lineHeight: 1, cursor: 'pointer'
                }}>×</span>
              )}
            </div>
          )
        })}
        <button onClick={() => setShowModal(true)} style={{
          background: 'none', border: '1px dashed #354d65', borderRadius: 12,
          color: '#82cfff', fontSize: 12, padding: '2px 10px', cursor: 'pointer'
        }}>+ 추가</button>
      </div>

      {/* 현재 날씨 */}
      {weather ? (
        <div style={{ background: '#253748', border: '1px solid #354d65',
          borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 42, fontWeight: 700, color: '#eef5fb', lineHeight: 1 }}>
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
                <div style={{ fontSize: 10, color: '#87b8d4' }}>습도</div>
                <div style={{ fontSize: 13, color: '#ddeaf5', fontWeight: 600 }}>{weather.humidity ?? '--'}%</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13 }}>💨</span>
              <div>
                <div style={{ fontSize: 10, color: '#87b8d4' }}>바람</div>
                <div style={{ fontSize: 13, color: '#ddeaf5', fontWeight: 600 }}>{weather.wind ?? '--'}m/s</div>
              </div>
            </div>
            {weather.rain > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: 13 }}>🌧️</span>
                <div>
                  <div style={{ fontSize: 10, color: '#87b8d4' }}>강수량</div>
                  <div style={{ fontSize: 13, color: '#82cfff', fontWeight: 600 }}>{weather.rain}mm</div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#87b8d4', textAlign: 'center', padding: 20 }}>데이터 없음</div>
      )}

      {/* 5일 예보 */}
      <div style={{ fontSize: 11, color: '#87b8d4', textTransform: 'uppercase',
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
              background: isToday ? '#243444' : 'transparent',
              border: `1px solid ${isToday ? '#3a5063' : 'transparent'}`,
            }}>
              <div style={{ width: 34, flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: isToday ? '#82cfff' : '#ddeaf5', fontWeight: isToday ? 700 : 400 }}>{weekday}</div>
                <div style={{ fontSize: 10, color: '#87b8d4' }}>{date}</div>
              </div>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{ICON[f.icon] || '☀️'}</span>
              <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: '#f85149', fontWeight: 600 }}>{f.high ?? '--'}°</span>
                <span style={{ fontSize: 10, color: '#87b8d4' }}>/</span>
                <span style={{ fontSize: 12, color: '#8dd8ff' }}>{f.low ?? '--'}°</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <RainBar prob={f.rainProb ?? 0} />
              </div>
            </div>
          )
        })}
        {forecast.length === 0 && (
          <div style={{ fontSize: 12, color: '#87b8d4', padding: '8px 0' }}>예보 없음</div>
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

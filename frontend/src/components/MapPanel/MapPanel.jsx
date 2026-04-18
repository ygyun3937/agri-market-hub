// src/components/MapPanel/MapPanel.jsx
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'

function MapResizer() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import client from '../../api/client'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const ITEM_NAMES = { '111': '봄배추', '112': '무', '211': '양파', '214': '당근', '215': '감자', '311': '사과', '312': '배', '411': '쌀' }

const MARKETS = [
  { name: '가락시장', code: '100110', lat: 37.493, lng: 127.113, type: '도매시장' },
  { name: '강서시장', code: '100120', lat: 37.572, lng: 126.823, type: '도매시장' },
  { name: '부산엄궁시장', code: '500110', lat: 35.148, lng: 128.956, type: '도매시장' },
  { name: '광주각화시장', code: '600110', lat: 35.180, lng: 126.884, type: '도매시장' },
]

const ORIGINS = [
  { name: '나주 배 산지', lat: 35.016, lng: 126.711, type: '산지' },
  { name: '해남 배추 산지', lat: 34.573, lng: 126.599, type: '산지' },
  { name: '제주 당근 산지', lat: 33.499, lng: 126.531, type: '산지' },
  { name: '강원 감자 산지', lat: 37.341, lng: 128.377, type: '산지' },
]

function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 4px #0006"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

const ICONS = {
  '도매시장': makeIcon('#58a6ff'),
  '산지': makeIcon('#3fb950'),
  '기상특보': makeIcon('#f85149'),
  '병해충': makeIcon('#d29922'),
}

const REGION_COORDS = {
  '경기': [37.4, 127.2], '전남': [34.8, 126.9], '충남': [36.5, 126.8],
  '경북': [36.4, 128.7], '전북': [35.8, 127.1], '강원': [37.5, 128.5],
  '충북': [36.8, 127.9], '경남': [35.4, 128.3], '서울': [37.56, 127.0],
  '부산': [35.18, 129.07], '대구': [35.87, 128.6], '인천': [37.46, 126.7],
  '광주': [35.15, 126.85], '대전': [36.35, 127.38], '울산': [35.54, 129.31],
}

export default function MapPanel({ layers = { '도매시장': true, '산지': true, '기상특보': true, '병해충': true } }) {
  const [pricesByMarket, setPricesByMarket] = useState({})
  const [pestAlerts, setPestAlerts] = useState([])
  const [disasterAlerts, setDisasterAlerts] = useState([])

  useEffect(() => {
    Promise.all(
      MARKETS.map(m =>
        client.get(`/prices?market=${m.code}`)
          .then(r => ({ code: m.code, prices: r.data }))
          .catch(() => ({ code: m.code, prices: [] }))
      )
    ).then(results => {
      const map = {}
      results.forEach(({ code, prices }) => { map[code] = prices })
      setPricesByMarket(map)
    })
    client.get('/alerts/pest').then(r => {
      setPestAlerts(r.data.map(a => {
        const coords = REGION_COORDS[a.region?.substring(0, 2)]
        return coords
          ? { ...a, offset: [coords[0] + (Math.random() * 0.3 - 0.15), coords[1] + (Math.random() * 0.3 - 0.15)] }
          : { ...a, offset: null }
      }))
    }).catch(() => {})
    client.get('/alerts/disaster').then(r => setDisasterAlerts(r.data)).catch(() => {})
  }, [])

  return (
    <MapContainer center={[36.5, 127.5]} zoom={7} style={{ width: '100%', height: '100%' }} zoomControl={true}>
      <MapResizer />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />

      {layers['도매시장'] && MARKETS.map(m => {
        const prices = pricesByMarket[m.code] || []
        return (
          <Marker key={m.name} position={[m.lat, m.lng]} icon={ICONS['도매시장']}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>{m.name}</div>
                {prices.length === 0
                  ? <div style={{ color: '#888', fontSize: 12 }}>가격 데이터 없음</div>
                  : prices.slice(0, 6).map(p => (
                    <div key={p.itemCode} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, marginBottom: 3 }}>
                      <span>{ITEM_NAMES[p.itemCode] || p.itemCode}</span>
                      <span style={{ fontWeight: 600 }}>₩{p.price?.toLocaleString()}</span>
                    </div>
                  ))}
                {prices[0] && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>기준: {prices[0].date}</div>}
              </div>
            </Popup>
          </Marker>
        )
      })}

      {layers['산지'] && ORIGINS.map(o => (
        <Marker key={o.name} position={[o.lat, o.lng]} icon={ICONS['산지']}>
          <Popup><div style={{ fontSize: 13 }}>{o.name}</div></Popup>
        </Marker>
      ))}

      {layers['기상특보'] && disasterAlerts.map(a => {
        const coords = REGION_COORDS[a.region?.substring(0, 2)]
        if (!coords) return null
        return (
          <Marker key={a.id} position={coords} icon={ICONS['기상특보']}>
            <Popup>
              <div style={{ minWidth: 140 }}>
                <div style={{ fontWeight: 700, color: '#f85149', marginBottom: 4 }}>⚠️ {a.type}</div>
                <div style={{ fontSize: 12 }}>{a.region}</div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{a.message}</div>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {layers['병해충'] && pestAlerts.map(a => {
        if (!a.offset) return null
        return (
          <Marker key={a.id} position={a.offset} icon={ICONS['병해충']}>
            <Popup>
              <div style={{ minWidth: 140 }}>
                <div style={{ fontWeight: 700, color: '#d29922', marginBottom: 4 }}>🐛 {a.severity}</div>
                <div style={{ fontSize: 12 }}>{a.region} / {a.itemName}</div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{a.description}</div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

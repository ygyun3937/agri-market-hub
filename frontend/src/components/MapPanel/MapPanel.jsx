// src/components/MapPanel/MapPanel.jsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix leaflet default marker icon (webpack/vite asset resolution issue)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const MARKETS = [
  { name: '가락시장', lat: 37.493, lng: 127.113 },
  { name: '강서시장', lat: 37.572, lng: 126.823 },
  { name: '부산엄궁시장', lat: 35.148, lng: 128.956 },
  { name: '광주각화시장', lat: 35.180, lng: 126.884 },
]

export default function MapPanel() {
  return (
    <MapContainer
      center={[36.5, 127.5]}
      zoom={7}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      {MARKETS.map(m => (
        <Marker key={m.name} position={[m.lat, m.lng]}>
          <Popup>{m.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

// src/components/MapPanel/MapPanel.jsx
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import client from '../../api/client'

function MapResizer() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const ITEM_NAMES = { '111': '봄배추', '112': '무', '211': '양파', '214': '당근', '215': '감자', '311': '사과', '312': '배', '411': '쌀' }

const MARKETS = [
  { name: '가락시장',     code: '100110', lat: 37.493, lng: 127.113 },
  { name: '강서시장',     code: '100120', lat: 37.572, lng: 126.823 },
  { name: '부산엄궁시장', code: '500110', lat: 35.148, lng: 128.956 },
  { name: '광주각화시장', code: '600110', lat: 35.180, lng: 126.884 },
]

const REGION_COORDS = {
  '경기': [37.4, 127.2], '전남': [34.8, 126.9], '충남': [36.5, 126.8],
  '경북': [36.4, 128.7], '전북': [35.8, 127.1], '강원': [37.5, 128.5],
  '충북': [36.8, 127.9], '경남': [35.4, 128.3], '서울': [37.56, 127.0],
  '부산': [35.18, 129.07], '대구': [35.87, 128.6], '인천': [37.46, 126.7],
  '광주': [35.15, 126.85], '대전': [36.35, 127.38], '울산': [35.54, 129.31],
}

const SEV_INTENSITY = { '경보': 1.0, '주의': 0.6, '예보': 0.3, '예비주의': 0.2 }
const SEV_FILL_OPACITY = { '경보': 0.85, '주의': 0.65, '예보': 0.42, '예비주의': 0.28 }
const SEV_COLOR_MAP = { '경보': '#f85149', '주의': '#d29922', '예보': '#87b8d4', '예비주의': '#6a8fa8' }

// 병해충 종류별 고유 색상
const PEST_COLORS = [
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
  '#c77dff', '#ff9f43', '#00d2d3', '#ff6348',
]

const SEASONAL = {
  1:  [{ itemName: '잿빛곰팡이병', severity: '주의', region: '전국' }, { itemName: '흰가루병', severity: '주의', region: '전국' }],
  2:  [{ itemName: '총채벌레', severity: '주의', region: '전국' }, { itemName: '잿빛곰팡이병', severity: '주의', region: '전국' }],
  3:  [{ itemName: '진딧물', severity: '경보', region: '전국' }, { itemName: '배추좀나방', severity: '주의', region: '남부' }, { itemName: '흰가루병', severity: '주의', region: '전국' }],
  4:  [{ itemName: '진딧물', severity: '경보', region: '전국' }, { itemName: '배추좀나방', severity: '경보', region: '전국' }, { itemName: '총채벌레', severity: '주의', region: '전국' }, { itemName: '잿빛곰팡이병', severity: '주의', region: '전국' }, { itemName: '벼 줄무늬잎마름병', severity: '예비주의', region: '남부' }],
  5:  [{ itemName: '복숭아순나방', severity: '경보', region: '전국' }, { itemName: '진딧물', severity: '주의', region: '전국' }, { itemName: '역병', severity: '주의', region: '전국' }],
  6:  [{ itemName: '벼멸구', severity: '주의', region: '남부' }, { itemName: '고추 탄저병', severity: '경보', region: '전국' }, { itemName: '복숭아순나방', severity: '주의', region: '전국' }],
  7:  [{ itemName: '벼멸구', severity: '경보', region: '남부' }, { itemName: '흰등멸구', severity: '주의', region: '남부' }, { itemName: '고추 역병·탄저병', severity: '경보', region: '전국' }],
  8:  [{ itemName: '벼멸구', severity: '경보', region: '전국' }, { itemName: '배추 무름병', severity: '주의', region: '전국' }, { itemName: '사과 겹무늬썩음병', severity: '주의', region: '전국' }],
  9:  [{ itemName: '벼 이삭도열병', severity: '경보', region: '전국' }, { itemName: '배추 진딧물', severity: '주의', region: '전국' }, { itemName: '노린재', severity: '주의', region: '전국' }],
  10: [{ itemName: '노린재', severity: '주의', region: '전국' }, { itemName: '배추 무름병', severity: '주의', region: '전국' }],
  11: [{ itemName: '흰가루병', severity: '주의', region: '전국' }, { itemName: '잿빛곰팡이병', severity: '주의', region: '전국' }],
  12: [{ itemName: '잿빛곰팡이병', severity: '주의', region: '전국' }, { itemName: '흰가루병', severity: '주의', region: '전국' }],
}

const SOUTH_REGIONS = ['전남', '전북', '경남', '경북', '부산', '광주', '대구', '울산']
const GEO_ORDER = ['서울', '인천', '경기', '강원', '충북', '충남', '대전', '전북', '전남', '광주', '경북', '대구', '울산', '경남', '부산']

function expandRegion(region) {
  if (region === '전국') return Object.keys(REGION_COORDS)
  if (region === '남부') return SOUTH_REGIONS.filter(r => REGION_COORDS[r])
  return [region]
}

const REGION_ALIAS = {
  '전라남': '전남', '전라북': '전북',
  '경상남': '경남', '경상북': '경북',
  '충청남': '충남', '충청북': '충북',
  '강원도': '강원', '제주도': '제주',
}

function resolveRegionCoords(region) {
  if (!region) return null
  const two = region.substring(0, 2)
  if (REGION_COORDS[two]) return REGION_COORDS[two]
  const three = region.substring(0, 3)
  const mapped = REGION_ALIAS[three]
  return mapped ? REGION_COORDS[mapped] : null
}

// 시도 이름 → 단축 키 (GeoJSON feature.properties.name 대응)
const PROVINCE_TO_REGION = {
  '서울특별시': '서울', '인천광역시': '인천', '경기도': '경기',
  '강원도': '강원', '강원특별자치도': '강원',
  '충청북도': '충북', '충청남도': '충남', '대전광역시': '대전',
  '세종특별자치시': '대전',
  '전라북도': '전북', '전북특별자치도': '전북', '전라남도': '전남',
  '광주광역시': '광주', '경상북도': '경북', '경상남도': '경남',
  '대구광역시': '대구', '울산광역시': '울산', '부산광역시': '부산',
  '제주특별자치도': '제주',
}

// GeoJSON 캐시 (페이지 생명주기 동안 한 번만 fetch)
let _koreaGeo = null
async function getKoreaGeo() {
  if (_koreaGeo) return _koreaGeo
  const r = await fetch(
    'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json/skorea_provinces_geo.json'
  )
  _koreaGeo = await r.json()
  return _koreaGeo
}

function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 4px #0006"></div>`,
    iconSize: [12, 12], iconAnchor: [6, 6],
  })
}

const MARKET_ICON = makeIcon('#82cfff')
const DISASTER_ICON = makeIcon('#f85149')

// 병해충 콜로플레스: 시도별 단색 채우기
function PestChoropleth({ source, colorMap }) {
  const map = useMap()

  useEffect(() => {
    if (!source.length) return

    const byName = {}
    source.forEach(a => {
      byName[a.itemName] = byName[a.itemName] || []
      byName[a.itemName].push(a)
    })

    const entries = Object.entries(byName)
    const n = entries.length

    // 시도 단축키 → { color, fillOpacity, name, sev }
    const regionStyle = {}
    entries.forEach(([name, items], pestIdx) => {
      const color = colorMap[name] || '#82cfff'
      const sev = items[0]?.severity
      const fillOpacity = SEV_FILL_OPACITY[sev] ?? 0.5

      const regions = items.some(a => a.region === '전국')
        ? GEO_ORDER.slice(
            Math.floor(pestIdx * GEO_ORDER.length / n),
            Math.floor((pestIdx + 1) * GEO_ORDER.length / n)
          )
        : expandRegion(items[0]?.region || '전국')

      regions.forEach(r => { regionStyle[r] = { color, fillOpacity, name, sev } })
    })

    let cancelled = false
    let geoLayer = null

    getKoreaGeo()
      .then(geojson => {
        if (cancelled) return
        geoLayer = L.geoJSON(geojson, {
          style: feature => {
            const r = PROVINCE_TO_REGION[feature.properties.name]
            const s = r ? regionStyle[r] : null
            return {
              fillColor: s?.color ?? '#1c2a36',
              fillOpacity: s ? s.fillOpacity : 0.05,
              color: '#2d4255',
              weight: 0.8,
              opacity: 0.8,
            }
          },
          onEachFeature: (feature, layer) => {
            const r = PROVINCE_TO_REGION[feature.properties.name]
            const s = r ? regionStyle[r] : null
            if (s) {
              const sevColor = SEV_COLOR_MAP[s.sev] || '#87b8d4'
              layer.bindTooltip(
                `<div style="background:#162330;border:1px solid #2d4255;color:#ddeaf5;padding:5px 9px;border-radius:5px;font-size:12px;line-height:1.6;pointer-events:none">
                  <b style="color:#eef5fb">${r}</b><br>
                  <span style="color:#87b8d4">${s.name}</span><br>
                  <span style="color:${sevColor};font-weight:600">${s.sev}</span>
                </div>`,
                { sticky: true, opacity: 1, className: 'pest-tip' }
              )
            }
          },
        }).addTo(map)
      })
      .catch(() => {})

    return () => {
      cancelled = true
      if (geoLayer) map.removeLayer(geoLayer)
    }
  }, [source, colorMap, map])

  return null
}

// 범례 (지도 위 오버레이)
function PestLegend({ colorMap, source }) {
  const entries = Object.entries(colorMap)
  if (!entries.length) return null

  const byName = {}
  source.forEach(a => { byName[a.itemName] = a })

  return (
    <div style={{
      position: 'absolute', bottom: 28, left: 10, zIndex: 1000,
      background: '#111e2acc', border: '1px solid #2d4255', borderRadius: 7,
      padding: '8px 12px', backdropFilter: 'blur(6px)',
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: 10, color: '#87b8d4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        🐛 병해충 발생 ({new Date().getMonth() + 1}월 예보)
      </div>
      {entries.map(([name, color]) => {
        const sev = byName[name]?.severity
        const sevColor = SEV_COLOR_MAP[sev] || '#87b8d4'
        return (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <div style={{
              width: 14, height: 14, borderRadius: 3, flexShrink: 0,
              background: color + 'aa', border: `1.5px solid ${color}`,
            }} />
            <span style={{ fontSize: 11, color: '#ddeaf5' }}>{name}</span>
            <span style={{ fontSize: 10, color: sevColor, marginLeft: 2 }}>{sev}</span>
          </div>
        )
      })}
      <div style={{ marginTop: 6, paddingTop: 5, borderTop: '1px solid #2d4255', display: 'flex', gap: 8 }}>
        {['경보', '주의', '예보'].map(s => (
          <span key={s} style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: 1, background: SEV_COLOR_MAP[s], display: 'inline-block' }} />
            <span style={{ color: '#87b8d4' }}>{s}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function MapPanel({ layers = { '도매시장': true, '기상특보': true, '병해충': true } }) {
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
    client.get('/alerts/pest').then(r => setPestAlerts(r.data || [])).catch(() => {})
    client.get('/alerts/disaster').then(r => setDisasterAlerts(r.data || [])).catch(() => {})
  }, [])

  const pestSource = useMemo(() =>
    pestAlerts.length > 0 ? pestAlerts : (SEASONAL[new Date().getMonth() + 1] || [])
  , [pestAlerts])

  const pestColorMap = useMemo(() => {
    const names = [...new Set(pestSource.map(p => p.itemName))]
    return Object.fromEntries(names.map((n, i) => [n, PEST_COLORS[i % PEST_COLORS.length]]))
  }, [pestSource])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* leaflet tooltip 기본 흰 배경 제거 */}
      <style>{`.pest-tip { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }`}</style>

      <MapContainer center={[36.5, 127.5]} zoom={7} style={{ width: '100%', height: '100%' }} zoomControl>
        <MapResizer />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* 도매시장 마커 */}
        {layers['도매시장'] && MARKETS.map(m => {
          const prices = pricesByMarket[m.code] || []
          return (
            <Marker key={m.name} position={[m.lat, m.lng]} icon={MARKET_ICON}>
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

        {/* 기상특보 마커 */}
        {layers['기상특보'] && disasterAlerts.map(a => {
          const coords = resolveRegionCoords(a.region)
          if (!coords) return null
          return (
            <Marker key={a.id} position={coords} icon={DISASTER_ICON}>
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

        {/* 병해충 콜로플레스 */}
        {layers['병해충'] && <PestChoropleth source={pestSource} colorMap={pestColorMap} />}
      </MapContainer>

      {layers['병해충'] && <PestLegend colorMap={pestColorMap} source={pestSource} />}
    </div>
  )
}

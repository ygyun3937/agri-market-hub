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
  '제주': [33.4, 126.5],
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
  1:  [{ itemName: '잿빛곰팡이병', severity: '주의', region: '전국', crops: ['딸기', '상추', '시금치'] },
       { itemName: '흰가루병',     severity: '주의', region: '전국', crops: ['오이', '호박'] }],
  2:  [{ itemName: '총채벌레',     severity: '주의', region: '전국', crops: ['딸기', '파프리카'] },
       { itemName: '잿빛곰팡이병', severity: '주의', region: '전국', crops: ['딸기', '상추', '오이'] }],
  3:  [{ itemName: '진딧물',       severity: '경보', region: '전국', crops: ['배추', '무', '감자'] },
       { itemName: '배추좀나방',   severity: '주의', region: '남부', crops: ['배추'] },
       { itemName: '흰가루병',     severity: '주의', region: '전국', crops: ['오이', '딸기'] }],
  4:  [{ itemName: '진딧물',       severity: '경보', region: '전국', crops: ['배추', '감자', '고추', '사과', '배'] },
       { itemName: '배추좀나방',   severity: '경보', region: '전국', crops: ['배추'] },
       { itemName: '총채벌레',     severity: '주의', region: '전국', crops: ['딸기', '고추', '파프리카'] },
       { itemName: '잿빛곰팡이병', severity: '주의', region: '전국', crops: ['딸기', '토마토'] },
       { itemName: '벼 줄무늬잎마름병', severity: '예비주의', region: '남부', crops: ['쌀', '벼'] }],
  5:  [{ itemName: '복숭아순나방', severity: '경보', region: '전국', crops: ['사과', '복숭아', '배'] },
       { itemName: '진딧물',       severity: '주의', region: '전국', crops: ['고추', '옥수수'] },
       { itemName: '역병',         severity: '주의', region: '전국', crops: ['고추'] }],
  6:  [{ itemName: '벼멸구',       severity: '주의', region: '남부', crops: ['쌀', '벼'] },
       { itemName: '고추 탄저병',  severity: '경보', region: '전국', crops: ['고추'] },
       { itemName: '복숭아순나방', severity: '주의', region: '전국', crops: ['사과', '복숭아', '배'] }],
  7:  [{ itemName: '벼멸구',           severity: '경보', region: '남부', crops: ['쌀', '벼'] },
       { itemName: '흰등멸구',         severity: '주의', region: '남부', crops: ['쌀', '벼'] },
       { itemName: '고추 역병·탄저병', severity: '경보', region: '전국', crops: ['고추'] }],
  8:  [{ itemName: '벼멸구',           severity: '경보', region: '전국', crops: ['쌀', '벼'] },
       { itemName: '배추 무름병',      severity: '주의', region: '전국', crops: ['배추'] },
       { itemName: '사과 겹무늬썩음병', severity: '주의', region: '전국', crops: ['사과'] }],
  9:  [{ itemName: '벼 이삭도열병', severity: '경보', region: '전국', crops: ['쌀', '벼'] },
       { itemName: '배추 진딧물',   severity: '주의', region: '전국', crops: ['배추'] },
       { itemName: '노린재',        severity: '주의', region: '전국', crops: ['쌀', '벼', '콩'] }],
  10: [{ itemName: '노린재',      severity: '주의', region: '전국', crops: ['쌀', '벼', '사과', '배'] },
       { itemName: '배추 무름병', severity: '주의', region: '전국', crops: ['배추'] }],
  11: [{ itemName: '흰가루병',     severity: '주의', region: '전국', crops: ['딸기', '상추'] },
       { itemName: '잿빛곰팡이병', severity: '주의', region: '전국', crops: ['딸기', '상추', '오이'] }],
  12: [{ itemName: '잿빛곰팡이병', severity: '주의', region: '전국', crops: ['딸기', '상추'] },
       { itemName: '흰가루병',     severity: '주의', region: '전국', crops: ['오이', '상추'] }],
}

const SOUTH_REGIONS = ['전남', '전북', '경남', '경북', '부산', '광주', '대구', '울산', '제주']
const GEO_ORDER = ['서울', '인천', '경기', '강원', '충북', '충남', '대전', '전북', '전남', '광주', '경북', '대구', '울산', '경남', '부산', '제주']

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

let _siGeo = null
async function getSiGeo() {
  if (_siGeo) return _siGeo
  const r = await fetch(
    'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json/skorea_municipalities_geo_simple.json'
  )
  _siGeo = await r.json()
  return _siGeo
}

// 도 단위 특산물
const SP_PROVINCE = {
  '서울특별시':     { items: ['없음(소비지)'],                        color: '#636e72', icon: '🏙️' },
  '인천광역시':     { items: ['쌀', '배'],                            color: '#74b9ff', icon: '🌾' },
  '경기도':         { items: ['쌀', '복숭아', '포도', '배', '딸기'], color: '#4d96ff', icon: '🍑' },
  '강원도':         { items: ['감자', '옥수수', '더덕', '황태'],      color: '#6bcb77', icon: '🥔' },
  '강원특별자치도': { items: ['감자', '옥수수', '더덕', '황태'],      color: '#6bcb77', icon: '🥔' },
  '충청북도':       { items: ['사과', '복숭아', '포도'],              color: '#ff9f43', icon: '🍎' },
  '충청남도':       { items: ['쌀', '딸기', '마늘', '양파'],         color: '#f0a202', icon: '🌾' },
  '대전광역시':     { items: ['쌀', '딸기'],                          color: '#fd79a8', icon: '🍓' },
  '세종특별자치시': { items: ['쌀', '복숭아'],                        color: '#a29bfe', icon: '🍑' },
  '전라북도':       { items: ['쌀', '고추', '수박', '토마토'],        color: '#f85149', icon: '🌶️' },
  '전북특별자치도': { items: ['쌀', '고추', '수박', '토마토'],        color: '#f85149', icon: '🌶️' },
  '전라남도':       { items: ['마늘', '양파', '고구마', '전복', '배추'], color: '#56e890', icon: '🧅' },
  '광주광역시':     { items: ['쌀', '배추'],                          color: '#00b894', icon: '🥬' },
  '경상북도':       { items: ['사과', '포도', '고추', '마늘', '참외'], color: '#ff6348', icon: '🍎' },
  '경상남도':       { items: ['딸기', '양파', '마늘', '참외'],        color: '#ff6b6b', icon: '🍓' },
  '대구광역시':     { items: ['사과', '복숭아'],                      color: '#e17055', icon: '🍎' },
  '울산광역시':     { items: ['배', '쌀'],                            color: '#6c5ce7', icon: '🍐' },
  '부산광역시':     { items: ['고등어', '멸치', '대파'],              color: '#0984e3', icon: '🐟' },
  '제주특별자치도': { items: ['감귤', '한라봉', '당근', '브로콜리'],  color: '#ffd93d', icon: '🍊' },
}

// 시군구 단위 특산물
const SP_SIGUN = {
  // 경기
  '이천시': { items: ['쌀', '복숭아'], color: '#4d96ff', icon: '🍑' },
  '여주시': { items: ['쌀', '고구마'], color: '#4d96ff', icon: '🌾' },
  '안성시': { items: ['배', '쌀', '인삼'], color: '#4d96ff', icon: '🍐' },
  '양평군': { items: ['쌀', '딸기', '사과'], color: '#4d96ff', icon: '🌾' },
  '파주시': { items: ['장단콩', '쌀'], color: '#4d96ff', icon: '🫘' },
  '평택시': { items: ['쌀', '포도', '복숭아'], color: '#4d96ff', icon: '🌾' },
  '화성시': { items: ['포도', '쌀', '복숭아'], color: '#4d96ff', icon: '🍇' },
  '김포시': { items: ['쌀', '포도'], color: '#4d96ff', icon: '🌾' },
  // 강원
  '평창군': { items: ['황기', '더덕', '감자'], color: '#6bcb77', icon: '🥔' },
  '정선군': { items: ['곤드레', '감자', '옥수수'], color: '#6bcb77', icon: '🥔' },
  '횡성군': { items: ['한우', '더덕'], color: '#6bcb77', icon: '🥩' },
  '홍천군': { items: ['쌀', '더덕', '인삼'], color: '#6bcb77', icon: '🌾' },
  '강릉시': { items: ['옥수수', '감자', '황태'], color: '#6bcb77', icon: '🌽' },
  '원주시': { items: ['쌀', '복숭아', '더덕'], color: '#6bcb77', icon: '🌾' },
  '춘천시': { items: ['더덕', '인삼'], color: '#6bcb77', icon: '🌿' },
  '양구군': { items: ['더덕', '곰취', '시래기'], color: '#6bcb77', icon: '🌿' },
  '영월군': { items: ['옥수수', '감자', '고추'], color: '#6bcb77', icon: '🌽' },
  '인제군': { items: ['더덕', '황태', '산나물'], color: '#6bcb77', icon: '🌿' },
  // 충북
  '충주시': { items: ['사과', '복숭아', '쌀'], color: '#ff9f43', icon: '🍎' },
  '음성군': { items: ['쌀', '고추', '멜론'], color: '#ff9f43', icon: '🌾' },
  '괴산군': { items: ['고추', '쌀'], color: '#ff9f43', icon: '🌶️' },
  '단양군': { items: ['마늘', '쌀', '사과'], color: '#ff9f43', icon: '🧄' },
  '옥천군': { items: ['포도', '복숭아', '쌀'], color: '#ff9f43', icon: '🍇' },
  '보은군': { items: ['대추', '사과'], color: '#ff9f43', icon: '🍎' },
  '제천시': { items: ['당귀', '황기', '사과'], color: '#ff9f43', icon: '🌿' },
  // 충남
  '논산시': { items: ['딸기', '쌀', '옥수수'], color: '#f0a202', icon: '🍓' },
  '당진시': { items: ['쌀', '감자'], color: '#f0a202', icon: '🌾' },
  '홍성군': { items: ['쌀', '한우'], color: '#f0a202', icon: '🌾' },
  '부여군': { items: ['쌀', '수박', '연꽃'], color: '#f0a202', icon: '🌾' },
  '예산군': { items: ['사과', '복숭아', '쌀'], color: '#f0a202', icon: '🍎' },
  '서산시': { items: ['마늘', '쌀'], color: '#f0a202', icon: '🧄' },
  '태안군': { items: ['쌀', '꽃게', '바지락'], color: '#f0a202', icon: '🌾' },
  '청양군': { items: ['청양고추', '구기자'], color: '#f0a202', icon: '🌶️' },
  // 전북
  '김제시': { items: ['쌀'], color: '#f85149', icon: '🌾' },
  '완주군': { items: ['쌀', '딸기', '수박'], color: '#f85149', icon: '🍓' },
  '부안군': { items: ['복분자', '쌀'], color: '#f85149', icon: '🍇' },
  '고창군': { items: ['복분자', '수박', '땅콩'], color: '#f85149', icon: '🍇' },
  '순창군': { items: ['고추', '상추'], color: '#f85149', icon: '🌶️' },
  '남원시': { items: ['쌀', '고추'], color: '#f85149', icon: '🌶️' },
  '임실군': { items: ['치즈', '쌀', '더덕'], color: '#f85149', icon: '🧀' },
  // 전남
  '나주시': { items: ['배', '복숭아', '쌀'], color: '#56e890', icon: '🍐' },
  '해남군': { items: ['고구마', '배추', '양파'], color: '#56e890', icon: '🍠' },
  '무안군': { items: ['양파', '고구마'], color: '#56e890', icon: '🧅' },
  '고흥군': { items: ['유자', '석류', '마늘'], color: '#56e890', icon: '🍋' },
  '담양군': { items: ['딸기', '쌀'], color: '#56e890', icon: '🍓' },
  '영암군': { items: ['쌀', '무화과', '포도'], color: '#56e890', icon: '🌾' },
  '보성군': { items: ['녹차', '쌀'], color: '#56e890', icon: '🍵' },
  '순천시': { items: ['쌀', '딸기'], color: '#56e890', icon: '🍓' },
  '여수시': { items: ['돌산갓', '굴', '멸치'], color: '#56e890', icon: '🥬' },
  '장흥군': { items: ['한우', '표고버섯'], color: '#56e890', icon: '🥩' },
  '강진군': { items: ['쌀', '봄동', '딸기'], color: '#56e890', icon: '🌾' },
  '진도군': { items: ['울금', '쌀'], color: '#56e890', icon: '🌾' },
  // 경북
  '안동시': { items: ['사과', '고추', '한우'], color: '#ff6348', icon: '🍎' },
  '영천시': { items: ['포도', '복숭아', '사과'], color: '#ff6348', icon: '🍇' },
  '상주시': { items: ['곶감', '포도', '쌀'], color: '#ff6348', icon: '🍇' },
  '청송군': { items: ['사과'], color: '#ff6348', icon: '🍎' },
  '봉화군': { items: ['송이버섯', '고추'], color: '#ff6348', icon: '🍄' },
  '성주군': { items: ['참외', '수박'], color: '#ff6348', icon: '🍈' },
  '의성군': { items: ['마늘', '사과', '고추'], color: '#ff6348', icon: '🧄' },
  '청도군': { items: ['복숭아', '감', '포도'], color: '#ff6348', icon: '🍑' },
  '문경시': { items: ['사과', '오미자'], color: '#ff6348', icon: '🍎' },
  '영덕군': { items: ['대게', '복숭아'], color: '#ff6348', icon: '🦀' },
  '고령군': { items: ['딸기', '참외'], color: '#ff6348', icon: '🍓' },
  // 경남
  '진주시': { items: ['딸기', '수박', '쌀'], color: '#ff6b6b', icon: '🍓' },
  '합천군': { items: ['딸기', '쌀'], color: '#ff6b6b', icon: '🍓' },
  '남해군': { items: ['마늘', '유자', '시금치'], color: '#ff6b6b', icon: '🧄' },
  '거제시': { items: ['굴', '멸치'], color: '#ff6b6b', icon: '🦪' },
  '하동군': { items: ['녹차', '딸기', '재첩'], color: '#ff6b6b', icon: '🍵' },
  '산청군': { items: ['딸기', '약초'], color: '#ff6b6b', icon: '🌿' },
  '창녕군': { items: ['양파', '마늘', '쌀'], color: '#ff6b6b', icon: '🧅' },
  '함양군': { items: ['곶감', '상황버섯'], color: '#ff6b6b', icon: '🌿' },
  // 제주
  '제주시': { items: ['감귤', '한라봉', '당근'], color: '#ffd93d', icon: '🍊' },
  '서귀포시': { items: ['감귤', '한라봉', '브로콜리', '당근'], color: '#ffd93d', icon: '🍊' },
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

      regions.forEach(r => { regionStyle[r] = { color, fillOpacity, name, sev, crops: items[0]?.crops } })
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
              const cropsHtml = s.crops?.length
                ? `<div style="color:#82cfff;font-size:10px;margin-top:2px">🌿 ${s.crops.join(' · ')}</div>`
                : ''
              layer.bindTooltip(
                `<div style="background:#162330;border:1px solid #2d4255;color:#ddeaf5;padding:5px 9px;border-radius:5px;font-size:12px;line-height:1.6;pointer-events:none">
                  <b style="color:#eef5fb">${r}</b><br>
                  <span style="color:#87b8d4">${s.name}</span>
                  <span style="color:${sevColor};font-weight:600;margin-left:6px">${s.sev}</span>
                  ${cropsHtml}
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
        const item = byName[name]
        const sev = item?.severity
        const sevColor = SEV_COLOR_MAP[sev] || '#87b8d4'
        const crops = item?.crops || []
        return (
          <div key={name} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                background: color + 'aa', border: `1.5px solid ${color}`,
              }} />
              <span style={{ fontSize: 11, color: '#ddeaf5' }}>{name}</span>
              <span style={{ fontSize: 10, color: sevColor, marginLeft: 2 }}>{sev}</span>
            </div>
            {crops.length > 0 && (
              <div style={{ fontSize: 10, color: '#82cfff', marginLeft: 21, marginTop: 1 }}>
                🌿 {crops.join(' · ')}
              </div>
            )}
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

function spTooltip(name, s, borderColor) {
  const chips = s.items.map(i =>
    `<span style="background:#253748aa;border:1px solid #354d65;border-radius:3px;padding:1px 6px;margin:1px;display:inline-block">${i}</span>`
  ).join('')
  return `<div style="background:#162330;border:1px solid ${borderColor};color:#ddeaf5;padding:8px 12px;border-radius:8px;font-size:12px;min-width:130px">
    <div style="font-weight:700;font-size:13px;margin-bottom:4px">${s.icon} ${name}</div>
    <div style="color:#87b8d4;font-size:10px;margin-bottom:4px">주요 특산물</div>
    <div style="line-height:1.8">${chips}</div>
  </div>`
}

function SpecialtyLayer() {
  const map = useMap()

  useEffect(() => {
    let cancelled = false
    let provLayer = null
    let siLayer = null

    getKoreaGeo().then(geo => {
      if (cancelled) return
      provLayer = L.geoJSON(geo, {
        style: f => {
          const s = SP_PROVINCE[f.properties.name]
          return { fillColor: s ? s.color : '#2d4255', fillOpacity: s ? 0.28 : 0.05, color: s ? s.color : '#354d65', weight: 1.2 }
        },
        onEachFeature: (f, l) => {
          const s = SP_PROVINCE[f.properties.name]
          if (!s) return
          l.bindTooltip(spTooltip(f.properties.name, s, s.color), { sticky: true, opacity: 1, className: 'pest-tip' })
          l.on('mouseover', function () { this.setStyle({ fillOpacity: 0.50 }) })
          l.on('mouseout',  function () { this.setStyle({ fillOpacity: 0.28 }) })
        },
      }).addTo(map)
    }).catch(() => {})

    const loadSi = () => {
      if (siLayer || map.getZoom() < 8) return
      getSiGeo().then(geo => {
        if (cancelled) return
        siLayer = L.geoJSON(geo, {
          style: f => {
            const s = SP_SIGUN[f.properties.name]
            return { fillColor: s ? s.color : '#2d4255', fillOpacity: s ? 0.38 : 0.04, color: s ? s.color : '#354d65', weight: 0.6 }
          },
          onEachFeature: (f, l) => {
            const s = SP_SIGUN[f.properties.name]
            if (!s) return
            l.bindTooltip(spTooltip(f.properties.name, s, s.color), { sticky: true, opacity: 1, className: 'pest-tip' })
            l.on('mouseover', function () { this.setStyle({ fillOpacity: 0.60 }) })
            l.on('mouseout',  function () { this.setStyle({ fillOpacity: 0.38 }) })
          },
        }).addTo(map)
      }).catch(() => {})
    }

    const onZoomEnd = () => {
      if (map.getZoom() >= 8) loadSi()
      else if (siLayer) { map.removeLayer(siLayer); siLayer = null }
    }
    map.on('zoomend', onZoomEnd)
    if (map.getZoom() >= 8) loadSi()

    return () => {
      cancelled = true
      map.off('zoomend', onZoomEnd)
      if (provLayer) map.removeLayer(provLayer)
      if (siLayer) map.removeLayer(siLayer)
    }
  }, [map])

  return null
}

function SpecialtyLegend() {
  return (
    <div style={{
      position: 'absolute', bottom: 28, right: 10, zIndex: 1000,
      background: '#111e2acc', border: '1px solid #2d4255', borderRadius: 7,
      padding: '8px 12px', backdropFilter: 'blur(6px)', pointerEvents: 'none', maxWidth: 160,
    }}>
      <div style={{ fontSize: 10, color: '#87b8d4', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        🌾 지역 특산물
      </div>
      <div style={{ fontSize: 10, color: '#ddeaf5', lineHeight: 1.8 }}>
        줌 7 이하: 도 단위<br />
        줌 8 이상: 시군구 단위<br />
        <span style={{ color: '#87b8d4' }}>마우스를 올리면 특산물 표시</span>
      </div>
    </div>
  )
}

export default function MapPanel({ layers = { '도매시장': true, '기상특보': true, '병해충': true, '특산물': false } }) {
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

      <MapContainer center={[36.5, 127.5]} zoom={7} minZoom={6} maxBounds={[[33.0, 124.0], [38.9, 131.0]]} maxBoundsViscosity={1.0} style={{ width: '100%', height: '100%' }} zoomControl>
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

        {/* 특산물 레이어 */}
        {layers['특산물'] && <SpecialtyLayer />}
      </MapContainer>

      {layers['병해충'] && <PestLegend colorMap={pestColorMap} source={pestSource} />}
      {layers['특산물'] && <SpecialtyLegend />}
    </div>
  )
}

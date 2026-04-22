// src/data/analysisMock.js
const UNIT_MAP = {
  '111': '10kg',
  '112': '20kg',
  '211': '20kg',
  '214': '20kg',
  '215': '20kg',
  '311': '10kg',
  '312': '15kg',
  '313': '2kg',
  '314': '개',
  '411': '10kg',
  '421': '30kg',
  '511': '단',
  '612': '10kg',
  '711': '1kg',
  '216': '4kg',
  '217': '100개',
  '315': '4.5kg',
  '218': '5kg',
}

export const MOCK_DAILY = [
  { itemCode: '111', itemName: '봄배추', category: '채소류', date: '2025-04-18', avgPrice: 8200, minPrice: 6000, maxPrice: 11000, volume: 4820, change7d: 12.3, unit: '10kg' },
  { itemCode: '112', itemName: '무', category: '채소류', date: '2025-04-18', avgPrice: 3400, minPrice: 2500, maxPrice: 4800, volume: 3210, change7d: -5.2, unit: '20kg' },
  { itemCode: '211', itemName: '양파', category: '채소류', date: '2025-04-18', avgPrice: 5600, minPrice: 4200, maxPrice: 7100, volume: 2980, change7d: 3.1, unit: '20kg' },
  { itemCode: '214', itemName: '당근', category: '채소류', date: '2025-04-18', avgPrice: 4100, minPrice: 3000, maxPrice: 5500, volume: 1870, change7d: -8.4, unit: '20kg' },
  { itemCode: '215', itemName: '감자', category: '채소류', date: '2025-04-18', avgPrice: 6800, minPrice: 5200, maxPrice: 9000, volume: 2540, change7d: 1.2, unit: '20kg' },
  { itemCode: '311', itemName: '사과', category: '과일류', date: '2025-04-18', avgPrice: 42000, minPrice: 35000, maxPrice: 55000, volume: 1230, change7d: 6.7, unit: '10kg' },
  { itemCode: '312', itemName: '배', category: '과일류', date: '2025-04-18', avgPrice: 38000, minPrice: 30000, maxPrice: 48000, volume: 980, change7d: -2.1, unit: '15kg' },
  { itemCode: '313', itemName: '딸기', category: '과일류', date: '2025-04-18', avgPrice: 28000, minPrice: 22000, maxPrice: 36000, volume: 1560, change7d: 9.3, unit: '2kg' },
  { itemCode: '314', itemName: '수박', category: '과일류', date: '2025-04-18', avgPrice: 22000, minPrice: 18000, maxPrice: 28000, volume: 870, change7d: -1.5, unit: '개' },
  { itemCode: '411', itemName: '쌀', category: '특용작물', date: '2025-04-18', avgPrice: 52000, minPrice: 48000, maxPrice: 58000, volume: 3400, change7d: 0.8, unit: '10kg' },
  { itemCode: '421', itemName: '콩', category: '특용작물', date: '2025-04-18', avgPrice: 14000, minPrice: 11000, maxPrice: 18000, volume: 890, change7d: -3.6, unit: '30kg' },
  { itemCode: '511', itemName: '장미', category: '화훼류', date: '2025-04-18', avgPrice: 8500, minPrice: 6500, maxPrice: 11000, volume: 450, change7d: 5.2, unit: '단' },
  { itemCode: '612', itemName: '고등어', category: '수산물', date: '2025-04-18', avgPrice: 12000, minPrice: 9000, maxPrice: 15000, volume: 760, change7d: -4.1, unit: '10kg' },
  { itemCode: '711', itemName: '돼지고기', category: '축산물', date: '2025-04-18', avgPrice: 18500, minPrice: 15000, maxPrice: 22000, volume: 1120, change7d: 2.4, unit: '1kg' },
  { itemCode: '216', itemName: '시금치', category: '채소류', date: '2025-04-18', avgPrice: 7200, minPrice: 5500, maxPrice: 9500, volume: 1340, change7d: 14.5, unit: '4kg' },
  { itemCode: '217', itemName: '오이', category: '채소류', date: '2025-04-18', avgPrice: 4800, minPrice: 3500, maxPrice: 6200, volume: 1680, change7d: -6.8, unit: '100개' },
  { itemCode: '315', itemName: '복숭아', category: '과일류', date: '2025-04-18', avgPrice: 19000, minPrice: 15000, maxPrice: 24000, volume: 620, change7d: 3.8, unit: '4.5kg' },
  { itemCode: '218', itemName: '파프리카', category: '채소류', date: '2025-04-18', avgPrice: 11000, minPrice: 8500, maxPrice: 14000, volume: 920, change7d: -2.9, unit: '5kg' },
]

export const MOCK_TREND = (itemCode) => {
  const base = MOCK_DAILY.find(d => d.itemCode === itemCode)?.avgPrice || 10000
  const unit = UNIT_MAP[itemCode] || '10kg'
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date('2025-04-18')
    d.setDate(d.getDate() - (29 - i))
    const noise = (Math.random() - 0.5) * 0.15
    const price = Math.round(base * (1 + noise))
    return {
      itemCode,
      date: d.toISOString().slice(0, 10),
      avgPrice: price,
      minPrice: Math.round(price * 0.82),
      maxPrice: Math.round(price * 1.18),
      volume: Math.round(500 + Math.random() * 1500),
      unit,
    }
  })
}

export const MOCK_MARKETS = [
  { code: '110001', name: '서울가락' },
  { code: '110002', name: '서울강서' },
  { code: '210001', name: '부산엄궁' },
  { code: '210002', name: '부산반여' },
  { code: '220001', name: '인천삼산' },
  { code: '220002', name: '인천구월' },
  { code: '230001', name: '대구북부' },
  { code: '240001', name: '광주각화' },
  { code: '250001', name: '대전오정' },
  { code: '260001', name: '울산' },
  { code: '310001', name: '수원' },
  { code: '310002', name: '안양' },
  { code: '310003', name: '부천' },
  { code: '310004', name: '구리' },
  { code: '310005', name: '안산' },
  { code: '320001', name: '춘천' },
  { code: '330001', name: '청주' },
  { code: '340001', name: '천안' },
  { code: '350001', name: '전주' },
  { code: '360001', name: '목포' },
  { code: '370001', name: '포항' },
  { code: '380001', name: '창원마산' },
  { code: '390001', name: '제주' },
]

export const MOCK_MARKET_PRODUCTS = () =>
  MOCK_DAILY.slice(0, 10).map(d => ({
    ...d,
    avgPrice: Math.round(d.avgPrice * (0.9 + Math.random() * 0.2)),
  }))

const VARIETY_MAP = {
  '111': [{ label: '봄배추', avgPrice: 8400, volume: 2100 }, { label: '얼갈이', avgPrice: 7800, volume: 1240 }, { label: '쌈배추', avgPrice: 8500, volume: 980 }, { label: '기타', avgPrice: 7200, volume: 430 }],
  '112': [{ label: '청무', avgPrice: 3600, volume: 1800 }, { label: '왜무', avgPrice: 3200, volume: 920 }, { label: '기타', avgPrice: 3100, volume: 290 }],
  '211': [{ label: '황양파', avgPrice: 5800, volume: 1950 }, { label: '적양파', avgPrice: 6200, volume: 680 }, { label: '기타', avgPrice: 5300, volume: 250 }],
  '214': [{ label: '수입당근', avgPrice: 4300, volume: 1100 }, { label: '국내당근', avgPrice: 3800, volume: 670 }, { label: '기타', avgPrice: 3500, volume: 100 }],
  '215': [{ label: '수미', avgPrice: 7100, volume: 1400 }, { label: '대지마', avgPrice: 6500, volume: 820 }, { label: '두백', avgPrice: 6800, volume: 220 }],
  '311': [{ label: '부사', avgPrice: 44000, volume: 750 }, { label: '홍로', avgPrice: 40000, volume: 320 }, { label: '아오리', avgPrice: 38000, volume: 160 }],
  '312': [{ label: '신고', avgPrice: 39000, volume: 620 }, { label: '원황', avgPrice: 36000, volume: 240 }, { label: '기타', avgPrice: 34000, volume: 120 }],
  '313': [{ label: '설향', avgPrice: 29000, volume: 980 }, { label: '매향', avgPrice: 26000, volume: 420 }, { label: '기타', avgPrice: 24000, volume: 160 }],
  '314': [{ label: '수박(대)', avgPrice: 24000, volume: 520 }, { label: '수박(소)', avgPrice: 18000, volume: 280 }, { label: '기타', avgPrice: 20000, volume: 70 }],
  '411': [{ label: '일반계', avgPrice: 53000, volume: 2100 }, { label: '찹쌀', avgPrice: 58000, volume: 980 }, { label: '기타', avgPrice: 50000, volume: 320 }],
  '421': [{ label: '백태', avgPrice: 14500, volume: 520 }, { label: '서리태', avgPrice: 16000, volume: 280 }, { label: '기타', avgPrice: 13000, volume: 90 }],
  '216': [{ label: '시금치(일반)', avgPrice: 7400, volume: 820 }, { label: '포항초', avgPrice: 7800, volume: 420 }, { label: '기타', avgPrice: 6800, volume: 100 }],
  '217': [{ label: '취청오이', avgPrice: 5000, volume: 980 }, { label: '가시오이', avgPrice: 4500, volume: 580 }, { label: '기타', avgPrice: 4200, volume: 120 }],
  '315': [{ label: '천중도', avgPrice: 20000, volume: 380 }, { label: '창방조생', avgPrice: 18000, volume: 180 }, { label: '기타', avgPrice: 17000, volume: 62 }],
  '218': [{ label: '빨강', avgPrice: 11500, volume: 580 }, { label: '노랑', avgPrice: 10800, volume: 240 }, { label: '초록', avgPrice: 10200, volume: 100 }],
  '612': [{ label: '국내산', avgPrice: 12500, volume: 480 }, { label: '수입산', avgPrice: 10500, volume: 280 }],
  '711': [{ label: '삼겹살', avgPrice: 20000, volume: 680 }, { label: '목살', avgPrice: 18000, volume: 320 }, { label: '기타부위', avgPrice: 15000, volume: 120 }],
}

const ORIGIN_MAP = {
  '111': [{ label: '전남 해남', avgPrice: 7900, volume: 1350 }, { label: '강원 삼척', avgPrice: 8100, volume: 820 }, { label: '충남 아산', avgPrice: 7600, volume: 480 }, { label: '기타', avgPrice: 7400, volume: 170 }],
  '112': [{ label: '경북 의성', avgPrice: 3500, volume: 980 }, { label: '전남 담양', avgPrice: 3300, volume: 720 }, { label: '제주', avgPrice: 3700, volume: 310 }],
  '211': [{ label: '경남 창녕', avgPrice: 5700, volume: 1200 }, { label: '전남 무안', avgPrice: 5500, volume: 980 }, { label: '경북 영천', avgPrice: 5900, volume: 520 }, { label: '기타', avgPrice: 5400, volume: 180 }],
  '214': [{ label: '수입(호주)', avgPrice: 4400, volume: 1050 }, { label: '제주', avgPrice: 3700, volume: 420 }, { label: '기타', avgPrice: 3600, volume: 100 }],
  '215': [{ label: '강원 정선', avgPrice: 7200, volume: 850 }, { label: '경북 안동', avgPrice: 6800, volume: 650 }, { label: '전북 김제', avgPrice: 6600, volume: 320 }, { label: '기타', avgPrice: 6400, volume: 120 }],
  '311': [{ label: '경북 청송', avgPrice: 45000, volume: 480 }, { label: '경북 영주', avgPrice: 43000, volume: 320 }, { label: '충북 충주', avgPrice: 41000, volume: 210 }, { label: '기타', avgPrice: 39000, volume: 120 }],
  '312': [{ label: '전남 나주', avgPrice: 40000, volume: 520 }, { label: '충남 천안', avgPrice: 37000, volume: 280 }, { label: '기타', avgPrice: 35000, volume: 80 }],
  '313': [{ label: '경남 남해', avgPrice: 30000, volume: 680 }, { label: '충남 논산', avgPrice: 28000, volume: 520 }, { label: '전북 담양', avgPrice: 27000, volume: 200 }, { label: '기타', avgPrice: 25000, volume: 160 }],
  '314': [{ label: '충남 부여', avgPrice: 24000, volume: 380 }, { label: '전북 고창', avgPrice: 22000, volume: 280 }, { label: '기타', avgPrice: 20000, volume: 80 }],
  '411': [{ label: '경기 이천', avgPrice: 56000, volume: 1200 }, { label: '충남 당진', avgPrice: 52000, volume: 980 }, { label: '전북 김제', avgPrice: 50000, volume: 680 }, { label: '기타', avgPrice: 49000, volume: 340 }],
  '421': [{ label: '경북 의성', avgPrice: 15000, volume: 320 }, { label: '전북 임실', avgPrice: 14000, volume: 180 }, { label: '기타', avgPrice: 13000, volume: 90 }],
  '216': [{ label: '경북 포항', avgPrice: 7800, volume: 420 }, { label: '남해', avgPrice: 7200, volume: 280 }, { label: '기타', avgPrice: 6800, volume: 120 }],
  '217': [{ label: '경남 밀양', avgPrice: 5100, volume: 620 }, { label: '충남 부여', avgPrice: 4800, volume: 480 }, { label: '기타', avgPrice: 4500, volume: 180 }],
  '315': [{ label: '충북 음성', avgPrice: 20500, volume: 280 }, { label: '경기 이천', avgPrice: 19000, volume: 180 }, { label: '기타', avgPrice: 17500, volume: 62 }],
  '218': [{ label: '전남 담양', avgPrice: 11500, volume: 480 }, { label: '경남 밀양', avgPrice: 10800, volume: 280 }, { label: '기타', avgPrice: 10200, volume: 80 }],
  '612': [{ label: '국내산', avgPrice: 12500, volume: 480 }, { label: '수입산', avgPrice: 10500, volume: 280 }],
  '711': [{ label: '국내산', avgPrice: 20000, volume: 820 }, { label: '수입산(덴마크)', avgPrice: 15000, volume: 300 }],
}

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function MOCK_VARIETY(itemCode) {
  if (VARIETY_MAP[itemCode]) return VARIETY_MAP[itemCode]
  const seed = hashCode(itemCode)
  const labels = ['일반', '특품', '상품', '기타']
  const base = 5000 + (seed % 30000)
  return labels.map((label, i) => ({
    label,
    avgPrice: Math.round(base * (1 - i * 0.05)),
    volume: Math.round((1000 - i * 150) * (0.8 + (seed % 5) * 0.08)),
  }))
}

export function MOCK_ORIGIN(itemCode) {
  if (ORIGIN_MAP[itemCode]) return ORIGIN_MAP[itemCode]
  const seed = hashCode(itemCode)
  const regions = ['전남', '경북', '충남', '강원', '제주']
  const base = 5000 + (seed % 30000)
  return regions.slice(0, 3 + (seed % 2)).map((region, i) => ({
    label: region,
    avgPrice: Math.round(base * (1 - i * 0.04)),
    volume: Math.round((900 - i * 180) * (0.8 + (seed % 4) * 0.08)),
  }))
}

// src/data/analysisMock.js
export const MOCK_DAILY = [
  { itemCode: '111', itemName: '봄배추', category: '채소류', date: '2025-04-18', avgPrice: 8200, minPrice: 6000, maxPrice: 11000, volume: 4820, change7d: 12.3 },
  { itemCode: '112', itemName: '무', category: '채소류', date: '2025-04-18', avgPrice: 3400, minPrice: 2500, maxPrice: 4800, volume: 3210, change7d: -5.2 },
  { itemCode: '211', itemName: '양파', category: '채소류', date: '2025-04-18', avgPrice: 5600, minPrice: 4200, maxPrice: 7100, volume: 2980, change7d: 3.1 },
  { itemCode: '214', itemName: '당근', category: '채소류', date: '2025-04-18', avgPrice: 4100, minPrice: 3000, maxPrice: 5500, volume: 1870, change7d: -8.4 },
  { itemCode: '215', itemName: '감자', category: '채소류', date: '2025-04-18', avgPrice: 6800, minPrice: 5200, maxPrice: 9000, volume: 2540, change7d: 1.2 },
  { itemCode: '311', itemName: '사과', category: '과일류', date: '2025-04-18', avgPrice: 42000, minPrice: 35000, maxPrice: 55000, volume: 1230, change7d: 6.7 },
  { itemCode: '312', itemName: '배', category: '과일류', date: '2025-04-18', avgPrice: 38000, minPrice: 30000, maxPrice: 48000, volume: 980, change7d: -2.1 },
  { itemCode: '313', itemName: '딸기', category: '과일류', date: '2025-04-18', avgPrice: 28000, minPrice: 22000, maxPrice: 36000, volume: 1560, change7d: 9.3 },
  { itemCode: '314', itemName: '수박', category: '과일류', date: '2025-04-18', avgPrice: 22000, minPrice: 18000, maxPrice: 28000, volume: 870, change7d: -1.5 },
  { itemCode: '411', itemName: '쌀', category: '특용작물', date: '2025-04-18', avgPrice: 52000, minPrice: 48000, maxPrice: 58000, volume: 3400, change7d: 0.8 },
  { itemCode: '421', itemName: '콩', category: '특용작물', date: '2025-04-18', avgPrice: 14000, minPrice: 11000, maxPrice: 18000, volume: 890, change7d: -3.6 },
  { itemCode: '511', itemName: '장미', category: '화훼류', date: '2025-04-18', avgPrice: 8500, minPrice: 6500, maxPrice: 11000, volume: 450, change7d: 5.2 },
  { itemCode: '612', itemName: '고등어', category: '수산물', date: '2025-04-18', avgPrice: 12000, minPrice: 9000, maxPrice: 15000, volume: 760, change7d: -4.1 },
  { itemCode: '711', itemName: '돼지고기', category: '축산물', date: '2025-04-18', avgPrice: 18500, minPrice: 15000, maxPrice: 22000, volume: 1120, change7d: 2.4 },
  { itemCode: '216', itemName: '시금치', category: '채소류', date: '2025-04-18', avgPrice: 7200, minPrice: 5500, maxPrice: 9500, volume: 1340, change7d: 14.5 },
  { itemCode: '217', itemName: '오이', category: '채소류', date: '2025-04-18', avgPrice: 4800, minPrice: 3500, maxPrice: 6200, volume: 1680, change7d: -6.8 },
  { itemCode: '315', itemName: '복숭아', category: '과일류', date: '2025-04-18', avgPrice: 19000, minPrice: 15000, maxPrice: 24000, volume: 620, change7d: 3.8 },
  { itemCode: '218', itemName: '파프리카', category: '채소류', date: '2025-04-18', avgPrice: 11000, minPrice: 8500, maxPrice: 14000, volume: 920, change7d: -2.9 },
]

export const MOCK_TREND = (itemCode) => {
  const base = MOCK_DAILY.find(d => d.itemCode === itemCode)?.avgPrice || 10000
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

export const MOCK_VARIETY = [
  { label: '얼갈이', avgPrice: 7800, volume: 1240 },
  { label: '쌈배추', avgPrice: 8500, volume: 980 },
  { label: '기타', avgPrice: 7200, volume: 430 },
]

export const MOCK_ORIGIN = [
  { label: '전남 해남', avgPrice: 7900, volume: 1350 },
  { label: '강원 삼척', avgPrice: 8100, volume: 820 },
  { label: '충남 아산', avgPrice: 7600, volume: 480 },
]

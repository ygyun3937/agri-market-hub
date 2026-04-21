// src/components/PestPanel/PestPanel.jsx
import { useEffect, useState } from 'react'
import client from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

const SEASONAL = {
  1:  [{ itemName: '잿빛곰팡이병', severity: '주의', region: '전국', crops: ['딸기', '상추', '시금치'], description: '시설 딸기·상추 겨울철 저온 다습 환경 주의' },
       { itemName: '흰가루병',     severity: '주의', region: '전국', crops: ['오이', '호박'],           description: '시설 오이·호박 겨울 재배 시 발생' }],
  2:  [{ itemName: '총채벌레',     severity: '주의', region: '전국', crops: ['딸기', '파프리카'],       description: '시설 딸기·파프리카 이른 봄 발생 증가' },
       { itemName: '잿빛곰팡이병', severity: '주의', region: '전국', crops: ['딸기', '상추', '오이'],   description: '시설 작물 환기 불량 시 급증' }],
  3:  [{ itemName: '진딧물',       severity: '경보', region: '전국', crops: ['배추', '무', '감자'],     description: '봄 기온 상승으로 배추·무·감자 진딧물 급증 시기' },
       { itemName: '배추좀나방',   severity: '주의', region: '남부', crops: ['배추'],                   description: '월동 세대 성충 발생 시작, 배추·양배추 주의' },
       { itemName: '흰가루병',     severity: '주의', region: '전국', crops: ['오이', '딸기'],           description: '봄 건조한 날씨에 오이·딸기 발생 증가' }],
  4:  [{ itemName: '진딧물',       severity: '경보', region: '전국', crops: ['배추', '감자', '고추', '사과', '배'], description: '4월 최성기. 배추·감자·고추·과수류 일제 발생 주의' },
       { itemName: '배추좀나방',   severity: '경보', region: '전국', crops: ['배추'],                   description: '1세대 유충 발생 최성기, 방제 적기' },
       { itemName: '총채벌레',     severity: '주의', region: '전국', crops: ['딸기', '고추', '파프리카'], description: '딸기·고추·파프리카 시설 재배 집중 방제 필요' },
       { itemName: '잿빛곰팡이병', severity: '주의', region: '전국', crops: ['딸기', '토마토'],         description: '딸기·토마토 수확기 다습 조건 주의' },
       { itemName: '벼 줄무늬잎마름병', severity: '예비주의', region: '남부', crops: ['쌀', '벼'],     description: '애멸구 이동 시기 앞두고 예찰 강화' }],
  5:  [{ itemName: '복숭아순나방', severity: '경보', region: '전국', crops: ['사과', '복숭아', '배'],  description: '1세대 성충 발생, 사과·복숭아·배 과수 방제 적기' },
       { itemName: '진딧물',       severity: '주의', region: '전국', crops: ['고추', '옥수수'],         description: '고추·옥수수 정식 후 초기 발생 주의' },
       { itemName: '역병',         severity: '주의', region: '전국', crops: ['고추'],                   description: '고추 정식 후 저온 다우 시 역병 발생 증가' }],
  6:  [{ itemName: '벼멸구',       severity: '주의', region: '남부', crops: ['쌀', '벼'],              description: '중국에서 비래 시작, 예찰 강화' },
       { itemName: '고추 탄저병',  severity: '경보', region: '전국', crops: ['고추'],                  description: '장마 전후 고온다습, 방제 철저' },
       { itemName: '복숭아순나방', severity: '주의', region: '전국', crops: ['사과', '복숭아', '배'],  description: '2세대 발생, 과수 피해 주의' }],
  7:  [{ itemName: '벼멸구',        severity: '경보', region: '남부', crops: ['쌀', '벼'],             description: '장마기 밀도 급증, 논 예찰 필수' },
       { itemName: '흰등멸구',      severity: '주의', region: '남부', crops: ['쌀', '벼'],             description: '벼멸구와 혼재 발생, 동시 방제' },
       { itemName: '고추 역병·탄저병', severity: '경보', region: '전국', crops: ['고추'],             description: '장마철 가장 위험한 시기' }],
  8:  [{ itemName: '벼멸구',         severity: '경보', region: '전국', crops: ['쌀', '벼'],            description: '8월 최성기, 줄기 황변·도복 주의' },
       { itemName: '배추 무름병',    severity: '주의', region: '전국', crops: ['배추'],                description: '고온다습, 가을 배추 정식 후 주의' },
       { itemName: '사과 겹무늬썩음병', severity: '주의', region: '전국', crops: ['사과'],            description: '수확 전 방제 마지막 시기' }],
  9:  [{ itemName: '벼 이삭도열병', severity: '경보', region: '전국', crops: ['쌀', '벼'],            description: '출수기 저온·다습 조건 방제 필수' },
       { itemName: '배추 진딧물',    severity: '주의', region: '전국', crops: ['배추'],                description: '가을 배추 정착 후 진딧물 발생' },
       { itemName: '노린재',         severity: '주의', region: '전국', crops: ['쌀', '벼', '콩'],     description: '벼·콩 수확기 노린재 피해 증가' }],
  10: [{ itemName: '노린재',         severity: '주의', region: '전국', crops: ['쌀', '벼', '사과', '배'], description: '벼 수확기, 과수 수확 전 피해 주의' },
       { itemName: '배추 무름병',    severity: '주의', region: '전국', crops: ['배추'],                description: '가을 배추 결구기 방제' }],
  11: [{ itemName: '흰가루병',       severity: '주의', region: '전국', crops: ['딸기', '상추'],        description: '시설 재배 시작, 딸기·상추 발생 증가' },
       { itemName: '잿빛곰팡이병',   severity: '주의', region: '전국', crops: ['딸기', '상추', '오이'], description: '시설 내 저온·다습 조건 주의' }],
  12: [{ itemName: '잿빛곰팡이병',   severity: '주의', region: '전국', crops: ['딸기', '상추'],        description: '시설 딸기 수확기 저온 관리 필요' },
       { itemName: '흰가루병',       severity: '주의', region: '전국', crops: ['오이', '상추'],         description: '시설 오이·상추 겨울 재배 주의' }],
}

function matchesCrop(pestCrops, watchName) {
  const norm = watchName.toLowerCase().replace(/[봄여름가을겨울]/g, '')
  return pestCrops.some(c => norm.includes(c) || c.includes(norm))
}

const SEVERITY_COLOR = {
  '경보': { text: '#f85149', bg: '#f8514920' },
  '주의': { text: '#d29922', bg: '#d2992220' },
}

function PestBadge({ p }) {
  const col = SEVERITY_COLOR[p.severity] || { text: '#87b8d4', bg: '#87b8d420' }
  return (
    <div style={{ marginBottom: 6, padding: '6px 8px', borderRadius: 5, background: '#253748', border: '1px solid #354d65' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#ddeaf5' }}>{p.itemName}</span>
        {p.severity && (
          <span style={{ fontSize: 10, borderRadius: 3, padding: '1px 5px', color: col.text, background: col.bg }}>
            {p.severity}
          </span>
        )}
      </div>
      {p.region && <div style={{ fontSize: 10, color: '#87b8d4' }}>📍 {p.region}</div>}
      {p.description && (
        <div style={{ fontSize: 11, color: '#aacde0', marginTop: 2, lineHeight: 1.4,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {p.description}
        </div>
      )}
    </div>
  )
}

export default function PestPanel() {
  const [pests, setPests] = useState([])
  const [isApiData, setIsApiData] = useState(false)
  const [loading, setLoading] = useState(true)
  const [watchItems, setWatchItems] = useState([])
  const { user } = useAuth()

  const month = new Date().getMonth() + 1

  useEffect(() => {
    setLoading(true)
    client.get('/alerts/pest')
      .then(r => {
        const data = r.data || []
        if (data.length > 0) { setPests(data); setIsApiData(true) }
        else { setPests(SEASONAL[month] || []); setIsApiData(false) }
      })
      .catch(() => { setPests(SEASONAL[month] || []); setIsApiData(false) })
      .finally(() => setLoading(false))

    if (user) {
      client.get('/user/watchlist').then(r => setWatchItems(r.data || [])).catch(() => {})
    }
  }, [user, month])

  // 관심 품목별 해당 병해충 매칭
  const watchPests = watchItems
    .map(w => ({
      ...w,
      pests: pests.filter(p => matchesCrop(p.crops || [], w.itemName || '')),
    }))
    .filter(w => w.pests.length > 0)

  // 관심 품목에 해당 안 되는 나머지 병해충
  const otherPests = pests.filter(p =>
    watchItems.length === 0 || !watchItems.some(w => matchesCrop(p.crops || [], w.itemName || ''))
  )

  return (
    <div style={{ padding: '10px 6px', marginTop: 8, borderTop: '1px solid #2d4255' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#87b8d4', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          🐛 병해충 정보
        </div>
        {!isApiData && !loading && (
          <span style={{ fontSize: 10, color: '#6a8fa8', background: '#2d4255', borderRadius: 3, padding: '1px 5px' }}>
            {month}월 예보
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ fontSize: 11, color: '#87b8d4' }}>로딩 중...</div>
      ) : (
        <>
          {/* 관심 품목별 병해충 */}
          {watchPests.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: '#82cfff', marginBottom: 6, letterSpacing: 0.5 }}>
                ⭐ 관심 품목 병해충
              </div>
              {watchPests.map(w => (
                <div key={w.itemCode} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: '#ddeaf5', fontWeight: 600, marginBottom: 4,
                    padding: '2px 6px', background: '#1c2a36', borderRadius: 4,
                    borderLeft: '2px solid #82cfff' }}>
                    {w.itemName}
                  </div>
                  {w.pests.map((p, i) => <PestBadge key={i} p={p} />)}
                </div>
              ))}
            </div>
          )}

          {/* 이달의 전체 병해충 (관심 품목 없거나 미매칭 포함) */}
          {(watchItems.length === 0 ? pests : otherPests).length > 0 && (
            <div>
              {watchPests.length > 0 && (
                <div style={{ fontSize: 10, color: '#87b8d4', marginBottom: 6, letterSpacing: 0.5 }}>
                  기타 {month}월 예보
                </div>
              )}
              {(watchItems.length === 0 ? pests : otherPests).slice(0, 5).map((p, i) => (
                <PestBadge key={p.id ?? i} p={p} />
              ))}
            </div>
          )}

          {pests.length === 0 && (
            <div style={{ fontSize: 11, color: '#87b8d4' }}>이달 병해충 정보 없음</div>
          )}
        </>
      )}
    </div>
  )
}

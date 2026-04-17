// src/components/AlertBanner/AlertBanner.jsx
export default function AlertBanner({ alerts = [] }) {
  if (alerts.length === 0) return null
  const latest = alerts[0]
  return (
    <div style={{
      background: '#da3633', padding: '6px 16px',
      fontSize: 13, color: '#fff', fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0
    }}>
      🚨 [긴급특보] {latest.message || latest.region}
    </div>
  )
}

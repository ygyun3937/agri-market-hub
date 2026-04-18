import client from '../api/client'

export function usePush() {
  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const reg = await navigator.serviceWorker.register('/sw.js')
    const res = await client.get('/user/vapid-public-key')
    const publicKey = res.data.publicKey
    if (!publicKey) return

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    })

    const json = subscription.toJSON()
    await client.post('/push/subscribe', {
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth
    })
  }

  return { subscribe }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

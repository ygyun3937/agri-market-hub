self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'AGRIHUB', {
      body: data.body || '',
      icon: '/vite.svg'
    })
  )
})

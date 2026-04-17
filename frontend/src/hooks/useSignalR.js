// src/hooks/useSignalR.js
import { useEffect, useRef, useState } from 'react'
import * as signalR from '@microsoft/signalr'

export function useSignalR(onPriceUpdate, onAlertUpdate) {
  const connRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const conn = new signalR.HubConnectionBuilder()
      .withUrl('/hub/dashboard', { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build()

    conn.on('PriceUpdate', onPriceUpdate)
    conn.on('AlertUpdate', onAlertUpdate)

    conn.start()
      .then(() => setConnected(true))
      .catch(err => console.error('SignalR error:', err))

    connRef.current = conn
    return () => { conn.stop() }
  }, [])

  return connected
}

// src/hooks/useSignalR.js
import { useEffect, useRef, useState } from 'react'
import * as signalR from '@microsoft/signalr'

export function useSignalR(onPriceUpdate, onAlertUpdate) {
  const connRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const priceRef = useRef(onPriceUpdate)
  const alertRef = useRef(onAlertUpdate)

  useEffect(() => { priceRef.current = onPriceUpdate }, [onPriceUpdate])
  useEffect(() => { alertRef.current = onAlertUpdate }, [onAlertUpdate])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const conn = new signalR.HubConnectionBuilder()
      .withUrl('/hub/dashboard', { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build()

    conn.on('PriceUpdate', (...args) => priceRef.current?.(...args))
    conn.on('AlertUpdate', (...args) => alertRef.current?.(...args))

    conn.start()
      .then(() => setConnected(true))
      .catch(err => console.error('SignalR error:', err))

    connRef.current = conn
    return () => { conn.stop() }
  }, [])

  return connected
}

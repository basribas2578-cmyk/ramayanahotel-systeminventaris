"use client"

import { useEffect, useRef } from "react"

export function useDataSync({
  refreshData,
  intervalMs = 30000,
  enabled = true,
}: { refreshData: () => void; intervalMs?: number; enabled?: boolean }) {
  const timer = useRef<number | null>(null)
  useEffect(() => {
    if (!enabled) {
      if (timer.current) window.clearInterval(timer.current)
      timer.current = null
      return
    }
    refreshData()
    timer.current = window.setInterval(() => {
      refreshData()
    }, intervalMs)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
      timer.current = null
    }
  }, [refreshData, intervalMs, enabled])
}

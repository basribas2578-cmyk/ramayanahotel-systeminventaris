"use client"

import { useEffect, useRef } from "react"

interface DataSyncOptions {
  refreshData: () => Promise<void>
  intervalMs: number
  enabled: boolean
}

export function useDataSync({ refreshData, intervalMs, enabled }: DataSyncOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Set up periodic sync
    intervalRef.current = setInterval(() => {
      refreshData()
    }, intervalMs)

    // Sync when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshData()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [refreshData, intervalMs, enabled])
}

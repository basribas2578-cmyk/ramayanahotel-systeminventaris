"use client"

import { useEffect } from "react"

type Payload = { new?: unknown; old?: unknown }
type Opts = {
  table: string
  enabled?: boolean
  onInsert?: (payload: Payload) => void
  onUpdate?: (payload: Payload) => void
  onDelete?: (payload: Payload) => void
}

/**
 * Mock realtime hook. In production, connect your provider (e.g., Supabase channel).
 */
export function useRealtimeData({ table, enabled = true }: Opts) {
  useEffect(() => {
    if (!enabled) return
    // Placeholder for subscription setup
    return () => {
      // Cleanup subscription
    }
  }, [table, enabled])
}

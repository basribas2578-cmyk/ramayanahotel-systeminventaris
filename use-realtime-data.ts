"use client"

import { useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase"

interface RealtimeDataOptions {
  table: string
  enabled: boolean
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
}

export function useRealtimeData({ table, enabled, onInsert, onUpdate, onDelete }: RealtimeDataOptions) {
  useEffect(() => {
    if (!enabled) return

    // Re-use the singleton browser client (handles fallback values)
    const supabase = getSupabaseClient()

    if (!supabase) {
      console.warn("Supabase client not available, skipping real-time subscription")
      return
    }

    const channel = supabase
      .channel(`realtime-${table}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table }, (payload) => onInsert?.(payload))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table }, (payload) => onUpdate?.(payload))
      .on("postgres_changes", { event: "DELETE", schema: "public", table }, (payload) => onDelete?.(payload))
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, enabled, onInsert, onUpdate, onDelete])
}

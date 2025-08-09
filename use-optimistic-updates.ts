"use client"

import { useState, useCallback } from "react"

interface OptimisticUpdate<T> {
  id: string
  type: "create" | "update" | "delete"
  data: T
  timestamp: number
}

export function useOptimisticUpdates<T extends { id: number | string }>() {
  const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdate<T>[]>([])

  const addOptimisticUpdate = useCallback((type: OptimisticUpdate<T>["type"], data: T) => {
    const update: OptimisticUpdate<T> = {
      id: `${type}-${data.id}-${Date.now()}`,
      type,
      data,
      timestamp: Date.now(),
    }

    setOptimisticUpdates((prev) => [...prev, update])

    // Auto-remove after 5 seconds to prevent memory leaks
    setTimeout(() => {
      setOptimisticUpdates((prev) => prev.filter((u) => u.id !== update.id))
    }, 5000)
  }, [])

  const removeOptimisticUpdate = useCallback((updateId: string) => {
    setOptimisticUpdates((prev) => prev.filter((u) => u.id !== updateId))
  }, [])

  const applyOptimisticUpdates = useCallback(
    (serverData: T[]): T[] => {
      let result = [...serverData]

      optimisticUpdates.forEach((update) => {
        switch (update.type) {
          case "create":
            // Add if not already in server data
            if (!result.find((item) => item.id === update.data.id)) {
              result.push(update.data)
            }
            break
          case "update":
            // Update existing item
            result = result.map((item) => (item.id === update.data.id ? { ...item, ...update.data } : item))
            break
          case "delete":
            // Remove item
            result = result.filter((item) => item.id !== update.data.id)
            break
        }
      })

      return result
    },
    [optimisticUpdates],
  )

  return {
    addOptimisticUpdate,
    removeOptimisticUpdate,
    applyOptimisticUpdates,
    optimisticUpdates,
  }
}

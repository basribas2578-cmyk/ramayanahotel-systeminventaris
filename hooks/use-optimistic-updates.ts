"use client"

import { useRef } from "react"

type Update<T> = (items: T[]) => T[]

export function useOptimisticUpdates<T>() {
  const queue = useRef<Update<T>[]>([])

  const addUpdate = (fn: Update<T>) => {
    queue.current.push(fn)
  }

  const applyOptimisticUpdates = (items: T[]): T[] => {
    return queue.current.reduce((acc, fn) => fn(acc), items)
  }

  const clear = () => {
    queue.current = []
  }

  return { addUpdate, applyOptimisticUpdates, clear }
}

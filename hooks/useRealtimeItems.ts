'use client'

import { useEffect, useRef } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { Item } from '@/types'

interface UseRealtimeItemsOptions {
  onInsert: (item: Item) => void
  onUpdate: (item: Item) => void
  onDelete: (id: string) => void
}

export function useRealtimeItems({ onInsert, onUpdate, onDelete }: UseRealtimeItemsOptions) {
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete })
  callbacksRef.current = { onInsert, onUpdate, onDelete }

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const supabase = createClient()
    const channelName = `items-realtime-${Math.random().toString(36).substring(2, 9)}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'items' },
        (payload) => {
          if (payload.new) {
            callbacksRef.current.onInsert(payload.new as Item)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'items' },
        (payload) => {
          if (payload.new) {
            callbacksRef.current.onUpdate(payload.new as Item)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'items' },
        (payload) => {
          if (payload.old && payload.old.id) {
            callbacksRef.current.onDelete(payload.old.id as string)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { Item, FilterTab, Category } from '@/types'

interface UseItemsOptions {
  filter: FilterTab
  category: Category | ''
  search: string
  userId?: string
}

export function useItems({ filter, category, search, userId }: UseItemsOptions) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()

      if (filter === 'mine' && !userId) {
        setItems([])
        setLoading(false)
        return
      }

      let query = supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter === 'need') {
        query = query.eq('type', 'need')
      } else if (filter === 'offer') {
        query = query.eq('type', 'offer')
      } else if (filter === 'mine' && userId) {
        query = query.eq('user_id', userId)
      }

      if (category) {
        query = query.eq('category', category)
      }

      if (search.trim()) {
        const term = `%${search.trim()}%`
        query = query.or(`title.ilike.${term},description.ilike.${term},category.ilike.${term},location.ilike.${term}`)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setItems((data as Item[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [filter, category, search, userId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const updateItem = useCallback((updated: Item) => {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
  }, [])

  const addItem = useCallback((newItem: Item) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === newItem.id)) return prev
      return [newItem, ...prev]
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  return { items, loading, error, refetch: fetchItems, updateItem, addItem, removeItem }
}

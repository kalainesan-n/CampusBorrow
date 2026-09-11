'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/Header'
import SearchBar from '@/components/SearchBar'
import FilterTabs from '@/components/FilterTabs'
import CategoryFilters from '@/components/CategoryFilters'
import ItemCard from '@/components/ItemCard'
import { LoadingSkeletonGrid } from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import ItemDetailModal from '@/components/ItemDetailModal'
import ItemFormModal from '@/components/ItemFormModal'
import { useAuth } from '@/hooks/useAuth'
import { useItems } from '@/hooks/useItems'
import { useRealtimeItems } from '@/hooks/useRealtimeItems'
import type { Item, FilterTab, Category } from '@/types'
import Link from 'next/link'

export default function Home() {
  const { user, isConfigured } = useAuth()

  // Feed filter states
  const [filter, setFilter] = useState<FilterTab>('all')
  const [category, setCategory] = useState<Category | ''>('')
  const [search, setSearch] = useState('')

  // Modals state
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null)

  // Items query hook
  const {
    items,
    loading,
    error,
    refetch,
    updateItem,
    addItem,
    removeItem,
  } = useItems({
    filter,
    category,
    search,
    userId: user?.id,
  })

  // Realtime synchronization hook
  useRealtimeItems({
    onInsert: useCallback(
      (newItem: Item) => {
        // Only prepend if it matches the current active filters
        let matches = true
        if (filter === 'need' && newItem.type !== 'need') matches = false
        if (filter === 'offer' && newItem.type !== 'offer') matches = false
        if (filter === 'mine' && newItem.user_id !== user?.id) matches = false
        if (category && newItem.category !== category) matches = false
        if (search.trim()) {
          const s = search.toLowerCase()
          const inTitle = newItem.title?.toLowerCase().includes(s)
          const inDesc = newItem.description?.toLowerCase().includes(s)
          const inCat = newItem.category?.toLowerCase().includes(s)
          const inLoc = newItem.location?.toLowerCase().includes(s)
          if (!inTitle && !inDesc && !inCat && !inLoc) matches = false
        }

        if (matches) {
          addItem(newItem)
        }
      },
      [filter, category, search, user?.id, addItem]
    ),
    onUpdate: useCallback(
      (updatedItem: Item) => {
        updateItem(updatedItem)
        // Also update the active modal if it's currently showing this item
        setSelectedItem((prev) => (prev?.id === updatedItem.id ? updatedItem : prev))
      },
      [updateItem]
    ),
    onDelete: useCallback(
      (deletedId: string) => {
        removeItem(deletedId)
        // Close detail modal if currently showing the deleted item
        setSelectedItem((prev) => {
          if (prev?.id === deletedId) {
            setIsDetailOpen(false)
            return null
          }
          return prev
        })
      },
      [removeItem]
    ),
  })

  // Post action trigger
  const handleOpenPost = () => {
    if (!user) {
      window.location.href = '/auth/sign-in'
      return
    }
    setItemToEdit(null)
    setIsFormOpen(true)
  }

  // Card click handler
  const handleCardClick = (item: Item) => {
    setSelectedItem(item)
    setIsDetailOpen(true)
  }

  // Edit action trigger from detail modal
  const handleEditClick = (item: Item) => {
    setIsDetailOpen(false)
    setItemToEdit(item)
    setIsFormOpen(true)
  }

  // Form submission success handler
  const handleFormSuccess = (item: Item) => {
    if (itemToEdit) {
      updateItem(item)
    } else {
      addItem(item)
    }
  }

  // Clear filters & search
  const handleClearFilters = () => {
    setFilter('all')
    setCategory('')
    setSearch('')
  }

  const isFiltered = Boolean(filter !== 'all' || category !== '' || search.trim() !== '')

  return (
    <div className="min-h-screen flex flex-col bg-stone-50/60">
      <Header onPost={handleOpenPost} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Unconfigured Supabase Banner (helpful guidance) */}
        {!isConfigured && (
          <div className="p-4 bg-amber-100 border border-amber-300 rounded-2xl text-amber-900 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-bold mb-1">
              <span>ℹ️</span> Supabase Credentials Needed
            </div>
            <p>
              Please set <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono text-amber-950">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono text-amber-950">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{' '}
              <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono text-amber-950">.env.local</code> to enable backend storage and authentication.
            </p>
          </div>
        )}

        {/* Signed Out Banner (Section 13 requirement) */}
        {!user && (
          <div className="p-3.5 sm:p-4 bg-amber-500/10 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎓</span>
              <div>
                <p className="text-sm font-semibold text-amber-950">
                  Sign in to post or claim an item.
                </p>
                <p className="text-xs text-amber-800/80 hidden sm:block">
                  Join fellow students in sharing calculators, adapters, textbooks, and gear.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/auth/sign-in"
                className="px-3 py-1.5 text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}

        {/* Hero & Search Controls */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                Campus Resource Board
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Borrow what you need. Share what you have.
              </p>
            </div>
            {user && (
              <button
                onClick={handleOpenPost}
                className="self-start sm:self-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 flex items-center gap-2"
              >
                <span>+</span> Post an Item
              </button>
            )}
          </div>

          {/* Search Bar */}
          <SearchBar value={search} onChange={setSearch} />

          {/* Filter Tabs & Category Filters */}
          <div className="space-y-3">
            <FilterTabs
              active={filter}
              onChange={setFilter}
              isAuthenticated={Boolean(user)}
            />
            <CategoryFilters
              active={category}
              onChange={setCategory}
            />
          </div>
        </section>

        {/* Feed Grid / States */}
        <section aria-label="Campus borrow posts">
          {loading ? (
            <LoadingSkeletonGrid />
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : items.length === 0 ? (
            <EmptyState
              isFiltered={isFiltered}
              onClearFilters={handleClearFilters}
              onPost={handleOpenPost}
              isAuthenticated={Boolean(user)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedItem(null)
        }}
        currentUserId={user?.id}
        onUpdateItem={(updated) => {
          updateItem(updated)
          setSelectedItem(updated)
        }}
        onDeleteItem={(deletedId) => {
          removeItem(deletedId)
        }}
        onEditItem={handleEditClick}
      />

      {/* Post / Edit Item Modal */}
      {user && (
        <ItemFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setItemToEdit(null)
          }}
          onSuccess={handleFormSuccess}
          userId={user.id}
          editItem={itemToEdit}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200/80 bg-white/50 py-6 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} CampusBorrow — Student Peer-to-Peer Sharing</p>
          <p className="text-stone-400">Post → Discover → Claim → Borrow → Return</p>
        </div>
      </footer>
    </div>
  )
}

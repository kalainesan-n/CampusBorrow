'use client'

import type { Category } from '@/types'

const categories: Category[] = ['Electronics', 'Academic', 'Books', 'Accessories', 'Sports', 'Other']

interface CategoryFiltersProps {
  active: Category | ''
  onChange: (category: Category | '') => void
}

export default function CategoryFilters({ active, onChange }: CategoryFiltersProps) {
  const categoryIcons: Record<Category, string> = {
    Electronics: '⚡',
    Academic: '🎓',
    Books: '📚',
    Accessories: '🎒',
    Sports: '⚽',
    Other: '📦',
  }

  return (
    <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter by category">
      <button
        onClick={() => onChange('')}
        className={`px-3 py-1.5 text-sm rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 ${
          active === ''
            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
            : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400 hover:bg-amber-50'
        }`}
        aria-pressed={active === ''}
      >
        All Categories
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(active === cat ? '' : cat)}
          className={`px-3 py-1.5 text-sm rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 ${
            active === cat
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400 hover:bg-amber-50'
          }`}
          aria-pressed={active === cat}
        >
          <span aria-hidden="true">{categoryIcons[cat]} </span>
          {cat}
        </button>
      ))}
    </div>
  )
}

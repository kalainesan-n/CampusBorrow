'use client'

import type { FilterTab } from '@/types'

interface FilterTabsProps {
  active: FilterTab
  onChange: (tab: FilterTab) => void
  isAuthenticated: boolean
}

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'need', label: 'Need' },
  { key: 'offer', label: 'Have' },
  { key: 'mine', label: 'My Posts' },
]

export default function FilterTabs({ active, onChange, isAuthenticated }: FilterTabsProps) {
  return (
    <div className="flex gap-1 bg-amber-100 p-1 rounded-xl" role="tablist" aria-label="Filter posts">
      {tabs.map(tab => {
        const disabled = tab.key === 'mine' && !isAuthenticated
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active === tab.key}
            disabled={disabled}
            onClick={() => !disabled && onChange(tab.key)}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 ${
              active === tab.key
                ? 'bg-white text-amber-800 shadow-sm'
                : disabled
                ? 'text-amber-400 cursor-not-allowed'
                : 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
            }`}
            title={disabled ? 'Sign in to see your posts' : undefined}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

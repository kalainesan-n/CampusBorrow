'use client'

import type { Item } from '@/types'
import Image from 'next/image'

interface ItemCardProps {
  item: Item
  onClick: (item: Item) => void
}

const statusColors: Record<string, string> = {
  open: 'bg-green-100 text-green-800',
  claimed: 'bg-yellow-100 text-yellow-800',
  borrowed: 'bg-blue-100 text-blue-800',
  returned: 'bg-gray-100 text-gray-700',
  closed: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  open: 'Open',
  claimed: 'Claimed',
  borrowed: 'Borrowed',
  returned: 'Returned',
  closed: 'Closed',
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString()
}

export default function ItemCard({ item, onClick }: ItemCardProps) {
  const typeLabel = item.type === 'need' ? 'NEED' : 'HAVE'
  const typeColor = item.type === 'need'
    ? 'bg-orange-100 text-orange-800'
    : 'bg-teal-100 text-teal-800'

  return (
    <button
      onClick={() => onClick(item)}
      className="w-full text-left bg-white rounded-2xl border border-amber-100 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-200 overflow-hidden group focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
      aria-label={`${typeLabel}: ${item.title} — ${item.status}`}
    >
      {/* Image */}
      {item.image_url && (
        <div className="relative w-full h-40 bg-amber-50 overflow-hidden">
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="p-4">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeColor}`}>
            {typeLabel}
          </span>
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            {item.category}
          </span>
          {item.status !== 'open' && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>
              {statusLabels[item.status]}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
          {item.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate max-w-[100px]">{item.location}</span>
          </div>
          <time dateTime={item.created_at} className="shrink-0">
            {timeAgo(item.created_at)}
          </time>
        </div>
      </div>
    </button>
  )
}

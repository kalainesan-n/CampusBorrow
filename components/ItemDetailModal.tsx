'use client'

import { useState } from 'react'
import type { Item, ItemStatus } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ToastProvider'
import Image from 'next/image'
import Link from 'next/link'

interface ItemDetailModalProps {
  item: Item | null
  isOpen: boolean
  onClose: () => void
  currentUserId?: string
  onUpdateItem: (item: Item) => void
  onDeleteItem: (id: string) => void
  onEditItem: (item: Item) => void
}

const statusColors: Record<ItemStatus, string> = {
  open: 'bg-green-100 text-green-800 border-green-200',
  claimed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  borrowed: 'bg-blue-100 text-blue-800 border-blue-200',
  returned: 'bg-stone-100 text-stone-700 border-stone-200',
  closed: 'bg-red-100 text-red-700 border-red-200',
}

const statusLabels: Record<ItemStatus, string> = {
  open: 'Open',
  claimed: 'Claimed',
  borrowed: 'Borrowed',
  returned: 'Returned',
  closed: 'Closed',
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function ItemDetailModal({
  item,
  isOpen,
  onClose,
  currentUserId,
  onUpdateItem,
  onDeleteItem,
  onEditItem,
}: ItemDetailModalProps) {
  const { addToast } = useToast()
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!isOpen || !item) return null

  const isOwner = Boolean(currentUserId && item.user_id === currentUserId)
  const isClaimant = Boolean(currentUserId && item.claimed_by === currentUserId)
  const isAnonymous = !currentUserId
  const isNeed = item.type === 'need'

  // Non-owner: Secure Claim RPC Call
  const handleClaim = async () => {
    if (isAnonymous) return
    setActionLoading(true)
    const supabase = createClient()

    try {
      // Call Postgres claim_item RPC
      const { data, error } = await supabase.rpc('claim_item', {
        item_id: item.id,
      })

      if (error) {
        throw error
      }

      addToast('Item claimed successfully! You can now coordinate handover.')
      onUpdateItem(data as unknown as Item)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not claim item.'
      addToast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Owner: Status Transitions
  const handleStatusChange = async (newStatus: ItemStatus) => {
    if (!isOwner || !currentUserId) return
    setActionLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('items')
        .update({ status: newStatus })
        .eq('id', item.id)
        .eq('user_id', currentUserId)
        .select()
        .single()

      if (error) throw error

      if (newStatus === 'borrowed') {
        addToast('Item marked as borrowed.')
      } else if (newStatus === 'returned') {
        addToast('Item marked as returned.')
      } else if (newStatus === 'closed') {
        addToast('Item closed.')
      }

      onUpdateItem(data as Item)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update item status.'
      addToast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Owner: Delete Item
  const handleDelete = async () => {
    if (!isOwner || !currentUserId) return
    setActionLoading(true)
    const supabase = createClient()

    try {
      // Clean up storage image if present
      if (item.image_url) {
        try {
          const urlObj = new URL(item.image_url)
          const parts = urlObj.pathname.split('/item-images/')
          if (parts[1]) {
            await supabase.storage.from('item-images').remove([decodeURIComponent(parts[1])])
          }
        } catch {
          // Ignore URL parsing errors
        }
      }

      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id)
        .eq('user_id', currentUserId)

      if (error) throw error

      addToast('Item deleted.')
      onDeleteItem(item.id)
      setShowDeleteConfirm(false)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete item.'
      addToast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-detail-title"
    >
      <div className="relative w-full max-w-xl my-8 bg-white rounded-2xl shadow-2xl border border-amber-100 overflow-hidden text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-amber-50 border-b border-amber-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                isNeed ? 'bg-orange-100 text-orange-800' : 'bg-teal-100 text-teal-800'
              }`}
            >
              {isNeed ? 'NEED' : 'HAVE'}
            </span>
            <span className="text-xs text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-full font-medium">
              {item.category}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[item.status]}`}
            >
              {statusLabels[item.status]}
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={actionLoading}
            className="p-1 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-amber-100/60 transition-colors focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Large Image (if available) */}
        {item.image_url && (
          <div className="relative w-full h-64 bg-stone-100 overflow-hidden border-b border-stone-100">
            <Image
              src={item.image_url}
              alt={item.title}
              fill
              priority
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          <div>
            <h2 id="item-detail-title" className="text-xl font-bold text-stone-900 leading-snug">
              {item.title}
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Posted on {formatDate(item.created_at)}
            </p>
          </div>

          {/* Description */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              Description
            </h4>
            <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Meta Information Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex items-start gap-2.5">
              <span className="text-base">📍</span>
              <div>
                <span className="block text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Campus Location
                </span>
                <span className="text-sm text-stone-800 font-medium">{item.location}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex items-start gap-2.5">
              <span className="text-base">📞</span>
              <div>
                <span className="block text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Contact Information
                </span>
                <span className="text-sm text-stone-800 font-medium">{item.contact}</span>
              </div>
            </div>

            {item.expires_at && (
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex items-start gap-2.5">
                <span className="text-base">📅</span>
                <div>
                  <span className="block text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    {isNeed ? 'Needed Until' : 'Available Until'}
                  </span>
                  <span className="text-sm text-stone-800 font-medium">
                    {formatDate(item.expires_at)}
                  </span>
                </div>
              </div>
            )}

            {/* Claimant indicator */}
            {item.status !== 'open' && (
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex items-start gap-2.5">
                <span className="text-base">🤝</span>
                <div>
                  <span className="block text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    Claim Status
                  </span>
                  <span className="text-sm text-stone-800 font-medium">
                    {isClaimant
                      ? 'You claimed this item'
                      : item.claimed_by
                      ? 'Claimed by a classmate'
                      : 'Closed'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Lifecycle Buttons */}
          <div className="pt-4 border-t border-stone-100">
            {/* Non-Owner Claiming */}
            {!isOwner && item.status === 'open' && (
              <div>
                {isAnonymous ? (
                  <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-sm font-medium text-amber-900 mb-2">
                      Sign in to claim this item.
                    </p>
                    <Link
                      href="/auth/sign-in"
                      className="inline-block px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
                    >
                      Sign In Now
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleClaim}
                    disabled={actionLoading}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-white text-sm shadow-xs transition-all flex items-center justify-center gap-2 focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${
                      isNeed
                        ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                        : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500'
                    } disabled:opacity-50`}
                  >
                    {actionLoading && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {actionLoading
                      ? 'Claiming Item...'
                      : isNeed
                      ? 'I Can Lend This'
                      : 'I Want to Borrow This'}
                  </button>
                )}
              </div>
            )}

            {/* Owner Actions */}
            {isOwner && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                  Owner Management
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* If Open: Edit, Close, Delete */}
                  {item.status === 'open' && (
                    <>
                      <button
                        onClick={() => {
                          onEditItem(item)
                          onClose()
                        }}
                        disabled={actionLoading}
                        className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                      >
                        ✏️ Edit Post
                      </button>
                      <button
                        onClick={() => handleStatusChange('closed')}
                        disabled={actionLoading}
                        className="px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                      >
                        🚫 Close Post
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={actionLoading}
                        className="px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors ml-auto"
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}

                  {/* If Claimed: Mark Borrowed, Close */}
                  {item.status === 'claimed' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('borrowed')}
                        disabled={actionLoading}
                        className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        {actionLoading ? 'Updating...' : '📦 Mark as Borrowed'}
                      </button>
                      <button
                        onClick={() => handleStatusChange('closed')}
                        disabled={actionLoading}
                        className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                      >
                        Cancel & Close
                      </button>
                    </>
                  )}

                  {/* If Borrowed: Mark Returned */}
                  {item.status === 'borrowed' && (
                    <button
                      onClick={() => handleStatusChange('returned')}
                      disabled={actionLoading}
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      {actionLoading ? 'Updating...' : '✅ Mark as Returned'}
                    </button>
                  )}

                  {/* If Returned or Closed: Read-only */}
                  {(item.status === 'returned' || item.status === 'closed') && (
                    <p className="text-xs text-stone-500 italic">
                      This post is {item.status} and archived. No further actions required.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div
            className="absolute inset-0 z-60 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            role="alertdialog"
            aria-labelledby="delete-confirm-title"
          >
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-red-100 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl mx-auto">
                ⚠️
              </div>
              <div>
                <h3 id="delete-confirm-title" className="text-base font-bold text-stone-900">
                  Delete this post?
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Delete this post? This cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                >
                  Keep Post
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {actionLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

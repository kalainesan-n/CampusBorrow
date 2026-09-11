'use client'

import { useState, useEffect, useRef } from 'react'
import type { Item, ItemType, Category } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ToastProvider'
import Image from 'next/image'

interface ItemFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (item: Item) => void
  userId: string
  editItem?: Item | null
}

const CATEGORIES: Category[] = [
  'Electronics',
  'Academic',
  'Books',
  'Accessories',
  'Sports',
  'Other',
]

const MAX_TITLE = 100
const MAX_DESC = 500
const MAX_LOC = 80
const MAX_CONTACT = 80
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export default function ItemFormModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  editItem,
}: ItemFormModalProps) {
  const { addToast } = useToast()
  const isEditing = Boolean(editItem)

  const [type, setType] = useState<ItemType>(editItem?.type || 'need')
  const [title, setTitle] = useState(editItem?.title || '')
  const [description, setDescription] = useState(editItem?.description || '')
  const [category, setCategory] = useState<Category | ''>(editItem?.category || '')
  const [location, setLocation] = useState(editItem?.location || '')
  const [contact, setContact] = useState(editItem?.contact || '')
  const [expiresAt, setExpiresAt] = useState(editItem?.expires_at || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(editItem?.image_url || null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editItem) {
      setType(editItem.type)
      setTitle(editItem.title)
      setDescription(editItem.description)
      setCategory(editItem.category)
      setLocation(editItem.location)
      setContact(editItem.contact)
      setExpiresAt(editItem.expires_at || '')
      setImagePreview(editItem.image_url || null)
      setImageFile(null)
    } else {
      setType('need')
      setTitle('')
      setDescription('')
      setCategory('')
      setLocation('')
      setContact('')
      setExpiresAt('')
      setImagePreview(null)
      setImageFile(null)
    }
    setErrors({})
  }, [editItem, isOpen])

  if (!isOpen) return null

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'Image must be JPEG, PNG, WebP, or GIF' }))
      return
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setErrors(prev => ({ ...prev, image: 'Image must be less than 5 MB' }))
      return
    }

    setErrors(prev => {
      const next = { ...prev }
      delete next.image
      return next
    })

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.trim().length > MAX_TITLE) {
      newErrors.title = `Title must be ${MAX_TITLE} characters or fewer`
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required'
    } else if (description.trim().length > MAX_DESC) {
      newErrors.description = `Description must be ${MAX_DESC} characters or fewer`
    }

    if (!category) {
      newErrors.category = 'Category is required'
    }

    if (!location.trim()) {
      newErrors.location = 'Campus location is required'
    } else if (location.trim().length > MAX_LOC) {
      newErrors.location = `Location must be ${MAX_LOC} characters or fewer`
    }

    if (!contact.trim()) {
      newErrors.contact = 'Contact information is required'
    } else if (contact.trim().length > MAX_CONTACT) {
      newErrors.contact = `Contact must be ${MAX_CONTACT} characters or fewer`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || submitting) return

    setSubmitting(true)
    const supabase = createClient()
    let uploadedImageUrl = editItem?.image_url || null
    let uploadedStoragePath: string | null = null

    try {
      // 1. Handle image upload if a new file was selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`
        const filePath = `${userId}/${fileName}`
        uploadedStoragePath = filePath

        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage
          .from('item-images')
          .getPublicUrl(filePath)

        uploadedImageUrl = urlData.publicUrl
      } else if (!imagePreview && editItem?.image_url) {
        // User removed the image while editing
        uploadedImageUrl = null
      }

      const verifiedCategory = category as Category

      if (isEditing && editItem) {
        // Update existing item
        const { data, error: updateError } = await supabase
          .from('items')
          .update({
            type,
            title: title.trim(),
            description: description.trim(),
            category: verifiedCategory,
            location: location.trim(),
            contact: contact.trim(),
            expires_at: expiresAt || null,
            image_url: uploadedImageUrl,
          })
          .eq('id', editItem.id)
          .eq('user_id', userId)
          .select()
          .single()

        if (updateError) throw updateError

        addToast('Item updated successfully.')
        onSuccess(data as Item)
        onClose()
      } else {
        // Insert new item
        const { data, error: insertError } = await supabase
          .from('items')
          .insert({
            user_id: userId,
            type,
            title: title.trim(),
            description: description.trim(),
            category: verifiedCategory,
            location: location.trim(),
            contact: contact.trim(),
            expires_at: expiresAt || null,
            image_url: uploadedImageUrl,
            status: 'open',
          })
          .select()
          .single()

        if (insertError) {
          // If insert fails and we uploaded an image, attempt cleanup
          if (uploadedStoragePath) {
            await supabase.storage.from('item-images').remove([uploadedStoragePath]).catch(() => {})
          }
          throw insertError
        }

        addToast('Item posted successfully.')
        onSuccess(data as Item)
        onClose()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Operation failed. Please try again.'
      addToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
    >
      <div className="relative w-full max-w-lg my-8 bg-white rounded-2xl shadow-2xl border border-amber-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-amber-50 border-b border-amber-100">
          <h2 id="form-modal-title" className="text-lg font-bold text-amber-950">
            {isEditing ? 'Edit Post' : 'Post an Item'}
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-amber-100/60 transition-colors focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          {/* Post Type Selector (Need vs Have) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              What would you like to do? *
            </label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Post Type">
              <button
                type="button"
                role="radio"
                aria-checked={type === 'need'}
                onClick={() => setType('need')}
                className={`py-2.5 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all focus:outline-hidden focus:ring-2 focus:ring-orange-400 ${
                  type === 'need'
                    ? 'bg-orange-50 text-orange-900 border-orange-400 ring-1 ring-orange-400'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span>🙋</span> I Need Something
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={type === 'offer'}
                onClick={() => setType('offer')}
                className={`py-2.5 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all focus:outline-hidden focus:ring-2 focus:ring-teal-400 ${
                  type === 'offer'
                    ? 'bg-teal-50 text-teal-900 border-teal-400 ring-1 ring-teal-400'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span>🤝</span> I Have Something
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="item-title" className="text-xs font-bold text-stone-700">
                Title *
              </label>
              <span className="text-[11px] text-stone-400">
                {title.length}/{MAX_TITLE}
              </span>
            </div>
            <input
              id="item-title"
              type="text"
              value={title}
              maxLength={MAX_TITLE}
              onChange={e => setTitle(e.target.value)}
              placeholder={type === 'need' ? 'e.g. TI-84 Plus Graphing Calculator' : 'e.g. USB-C to HDMI Adapter (4K 60Hz)'}
              className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white focus:outline-hidden focus:ring-2 transition-colors ${
                errors.title
                  ? 'border-red-400 focus:ring-red-300'
                  : 'border-stone-200 focus:border-amber-500 focus:ring-amber-200'
              }`}
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          {/* Category & Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="item-category" className="block text-xs font-bold text-stone-700 mb-1">
                Category *
              </label>
              <select
                id="item-category"
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white focus:outline-hidden focus:ring-2 transition-colors ${
                  errors.category
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-stone-200 focus:border-amber-500 focus:ring-amber-200'
                }`}
              >
                <option value="">Select Category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="item-expiry" className="block text-xs font-bold text-stone-700 mb-1">
                {type === 'need' ? 'Needed Until' : 'Available Until'} (Optional)
              </label>
              <input
                id="item-expiry"
                type="date"
                value={expiresAt}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setExpiresAt(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-200 transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="item-desc" className="text-xs font-bold text-stone-700">
                Description *
              </label>
              <span className="text-[11px] text-stone-400">
                {description.length}/{MAX_DESC}
              </span>
            </div>
            <textarea
              id="item-desc"
              rows={3}
              maxLength={MAX_DESC}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide details: condition, specific course, how long you need/have it, etc."
              className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white focus:outline-hidden focus:ring-2 transition-colors resize-none ${
                errors.description
                  ? 'border-red-400 focus:ring-red-300'
                  : 'border-stone-200 focus:border-amber-500 focus:ring-amber-200'
              }`}
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>

          {/* Location & Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="item-location" className="text-xs font-bold text-stone-700">
                  Campus Location *
                </label>
                <span className="text-[11px] text-stone-400">
                  {location.length}/{MAX_LOC}
                </span>
              </div>
              <input
                id="item-location"
                type="text"
                maxLength={MAX_LOC}
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Science Library, Dorm 4B"
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white focus:outline-hidden focus:ring-2 transition-colors ${
                  errors.location
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-stone-200 focus:border-amber-500 focus:ring-amber-200'
                }`}
              />
              {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="item-contact" className="text-xs font-bold text-stone-700">
                  Contact Information *
                </label>
                <span className="text-[11px] text-stone-400">
                  {contact.length}/{MAX_CONTACT}
                </span>
              </div>
              <input
                id="item-contact"
                type="text"
                maxLength={MAX_CONTACT}
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="e.g. WhatsApp @ 555-0192 or student@univ.edu"
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white focus:outline-hidden focus:ring-2 transition-colors ${
                  errors.contact
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-stone-200 focus:border-amber-500 focus:ring-amber-200'
                }`}
              />
              {errors.contact && <p className="text-xs text-red-600 mt-1">{errors.contact}</p>}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Image (Optional, max 5 MB)
            </label>
            {imagePreview ? (
              <div className="relative w-full h-36 bg-amber-50 rounded-xl overflow-hidden border border-amber-200 flex items-center justify-center">
                <Image
                  src={imagePreview}
                  alt="Item preview"
                  fill
                  className="object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 px-2 py-1 bg-stone-900/80 hover:bg-stone-900 text-white text-xs rounded-lg shadow-sm transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer bg-stone-50 hover:bg-amber-50/50 hover:border-amber-300 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <span className="text-lg">📷</span>
                    <p className="text-xs text-stone-600 mt-1">
                      <span className="font-semibold text-amber-700">Click to upload</span> image
                    </p>
                    <p className="text-[10px] text-stone-400">PNG, JPG, WebP or GIF up to 5MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    id="dropzone-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            )}
            {errors.image && <p className="text-xs text-red-600 mt-1">{errors.image}</p>}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              {submitting && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {submitting
                ? isEditing
                  ? 'Saving Changes...'
                  : 'Posting...'
                : isEditing
                ? 'Save Changes'
                : 'Post Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

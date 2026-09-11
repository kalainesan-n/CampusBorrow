export type ItemType = 'need' | 'offer'

export type ItemStatus = 'open' | 'claimed' | 'borrowed' | 'returned' | 'closed'

export type Category =
  | 'Electronics'
  | 'Academic'
  | 'Books'
  | 'Accessories'
  | 'Sports'
  | 'Other'

export interface Item {
  id: string
  user_id: string
  claimed_by: string | null
  type: ItemType
  title: string
  description: string
  category: Category
  location: string
  contact: string
  image_url: string | null
  status: ItemStatus
  expires_at: string | null
  created_at: string
}

export interface ItemFormData {
  type: ItemType
  title: string
  description: string
  category: Category | ''
  location: string
  contact: string
  expires_at: string
  image: File | null
}

export type FilterTab = 'all' | 'need' | 'offer' | 'mine'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      items: {
        Row: {
          id: string
          user_id: string
          claimed_by: string | null
          type: ItemType
          title: string
          description: string
          category: Category
          location: string
          contact: string
          image_url: string | null
          status: ItemStatus
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          claimed_by?: string | null
          type: ItemType
          title: string
          description: string
          category: Category
          location: string
          contact: string
          image_url?: string | null
          status?: ItemStatus
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          claimed_by?: string | null
          type?: ItemType
          title?: string
          description?: string
          category?: Category
          location?: string
          contact?: string
          image_url?: string | null
          status?: ItemStatus
          expires_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'items_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'items_claimed_by_fkey'
            columns: ['claimed_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_item: {
        Args: {
          item_id: string
        }
        Returns: {
          id: string
          user_id: string
          claimed_by: string | null
          type: ItemType
          title: string
          description: string
          category: Category
          location: string
          contact: string
          image_url: string | null
          status: ItemStatus
          expires_at: string | null
          created_at: string
        }
      }
    }
    Enums: {
      item_type: ItemType
      item_status: ItemStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

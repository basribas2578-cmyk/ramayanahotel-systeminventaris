import { createClient } from '@supabase/supabase-js'

// Pastikan variable ini ada di .env.local dan Vercel Environment Variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are missing!")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Interfaces
export interface Item {
  id: string
  name: string
  category: string
  quantity: number
  location: string
  condition: string
  purchase_date: string
  price: number
  supplier: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

// CRUD Functions for Items
export const db = {
  async getItems(): Promise<Item[]> {
    const { data, error } = await supabase.from<Item>('items').select('*')
    if (error) throw error
    return data || []
  },

  async getItemById(id: string): Promise<Item | null> {
    const { data, error } = await supabase.from<Item>('items').select('*').eq('id', id).single()
    if (error) throw error
    return data || null
  },

  async addItem(item: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Promise<Item> {
    const { data, error } = await supabase.from<Item>('items').insert(item).select().single()
    if (error) throw error
    return data
  },

  async updateItem(id: string, updates: Partial<Item>): Promise<Item> {
    const { data, error } = await supabase.from<Item>('items').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async deleteItem(id: string): Promise<boolean> {
    const { error } = await supabase.from<Item>('items').delete().eq('id', id)
    if (error) throw error
    return true
  }
}

export default db

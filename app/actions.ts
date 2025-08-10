"use server"

import { createServerClient } from "@/supabase"

// Shared types used by the UI
export type Role = "admin" | "manager" | "staff"
export type Status = "active" | "inactive"

export interface User {
  id: number
  username: string
  name: string
  email: string
  role: Role
  status: Status
  lastLogin: string
  avatarUrl?: string
}

export interface Supplier {
  id: number
  code: string
  name: string
  contact: string
  phone: string
  email: string
  address: string
  status: Status
  createdAt: string
}

export interface Item {
  id: number
  code: string
  name: string
  category: string
  description: string
  unit: string
  minStock: number
  currentStock: number
  location: string
  supplierId: number
  price: number
  status: Status
  createdAt: string
  updatedAt: string
  imageUrl?: string
}

export type TransactionType = "in" | "out" | "borrow" | "return"
export type TransactionStatus = "pending" | "approved" | "completed" | "cancelled"

export interface Transaction {
  id: number
  type: TransactionType
  itemId: number
  quantity: number
  userId: number
  supplierId?: number
  borrowerId?: string
  notes: string
  status: TransactionStatus
  date: string
  dueDate?: string
  returnDate?: string
}

export interface Depreciation {
  id: number
  itemId: number
  quantity: number
  date: string
  reason: string
  userId: number
  status: "completed" | "pending"
}

export interface Category {
  id: number
  code: string
  name: string
  description: string
  status: Status
  createdAt: string
  updatedAt: string
}

// Helpers
const toInt = (v: FormDataEntryValue | null, fallback = 0) => (v !== null ? Number.parseInt(String(v), 10) : fallback)
const toFloat = (v: FormDataEntryValue | null, fallback = 0) =>
  v !== null && String(v) !== "" ? Number.parseFloat(String(v)) : fallback

// Mappers
const mapUser = (r: any): User => ({
  id: r.id,
  username: r.username,
  name: r.name,
  email: r.email,
  role: r.role,
  status: r.status,
  lastLogin: r.last_login ? new Date(r.last_login).toISOString() : "",
  avatarUrl: r.avatar_url ?? undefined,
})

const mapSupplier = (r: any): Supplier => ({
  id: r.id,
  code: r.code,
  name: r.name,
  contact: r.contact,
  phone: r.phone,
  email: r.email,
  address: r.address,
  status: r.status,
  createdAt: r.created_at ? new Date(r.created_at).toISOString() : "",
})

const mapItem = (r: any): Item => ({
  id: r.id,
  code: r.code,
  name: r.name,
  category: r.category,
  description: r.description ?? "",
  unit: r.unit,
  minStock: r.min_stock,
  currentStock: r.current_stock,
  location: r.location,
  supplierId: r.supplier_id,
  price: Number(r.price ?? 0),
  status: r.status,
  createdAt: r.created_at ? new Date(r.created_at).toISOString() : "",
  updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : "",
  imageUrl: r.image_url ?? undefined,
})

const mapTransaction = (r: any): Transaction => ({
  id: r.id,
  type: r.type,
  itemId: r.item_id,
  quantity: r.quantity,
  userId: r.user_id,
  supplierId: r.supplier_id ?? undefined,
  borrowerId: r.borrower_id ?? undefined,
  notes: r.notes ?? "",
  status: r.status,
  date: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
  dueDate: r.due_date ? new Date(r.due_date).toISOString().slice(0, 10) : undefined,
  returnDate: r.return_date ? new Date(r.return_date).toISOString().slice(0, 10) : undefined,
})

const mapCategory = (r: any): Category => ({
  id: r.id,
  code: r.code,
  name: r.name,
  description: r.description ?? "",
  status: r.status,
  createdAt: r.created_at ? new Date(r.created_at).toISOString() : "",
  updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : "",
})

const mapDepreciation = (r: any): Depreciation => ({
  id: r.id,
  itemId: r.item_id,
  quantity: r.quantity,
  date: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
  reason: r.reason ?? "",
  userId: r.user_id,
  status: r.status,
})

// Users
export async function fetchUsers(): Promise<User[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("users").select("*").order("id", { ascending: true })
  if (error || !data) return []
  return data.map(mapUser)
}

export async function createUser(form: FormData) {
  const supabase = createServerClient()
  const username = String(form.get("username") || "").trim()
  const name = String(form.get("name") || "").trim()
  const email = String(form.get("email") || "").trim()
  const role = String(form.get("role") || "staff") as Role
  if (!username || !name || !email) return { success: false, message: "Data tidak lengkap." }

  const { data: exists } = await supabase.from("users").select("id").eq("username", username).maybeSingle()
  if (exists) return { success: false, message: "Username sudah digunakan." }

  const { data, error } = await supabase
    .from("users")
    .insert({
      username,
      name,
      email,
      role,
      status: "active",
      last_login: new Date().toISOString(),
    })
    .select("*")
    .single()

  if (error || !data) return { success: false, message: "Gagal menambah pengguna." }
  return { success: true, message: "Pengguna berhasil ditambahkan.", user: mapUser(data) }
}

export async function updateUser(form: FormData) {
  const supabase = createServerClient()
  const id = toInt(form.get("id"))
  if (!id) return { success: false, message: "ID tidak valid." }
  const payload: any = {
    username: form.get("username") ?? undefined,
    name: form.get("name") ?? undefined,
    email: form.get("email") ?? undefined,
    role: form.get("role") ?? undefined,
    status: form.get("status") ?? undefined,
    last_login: form.get("lastLogin") ?? undefined,
  }
  const { data, error } = await supabase.from("users").update(payload).eq("id", id).select("*").single()
  if (error || !data) return { success: false, message: "Gagal memperbarui pengguna." }
  return { success: true, message: "Pengguna berhasil diperbarui.", user: mapUser(data) }
}

export async function deleteUser(id: number) {
  const supabase = createServerClient()
  const { error } = await supabase.from("users").delete().eq("id", id)
  if (error) return { success: false, message: "Gagal menghapus pengguna." }
  return { success: true, message: "Pengguna berhasil dihapus." }
}

// Suppliers
export async function fetchSuppliers(): Promise<Supplier[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("suppliers").select("*").order("id", { ascending: true })
  if (error || !data) return []
  return data.map(mapSupplier)
}

// Categories
export async function fetchCategories(): Promise<Category[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("categories").select("*").order("id", { ascending: true })
  if (error || !data) return []
  return data.map(mapCategory)
}

export async function createCategory(form: FormData) {
  const supabase = createServerClient()
  const code = String(form.get("code") || "").trim()
  const name = String(form.get("name") || "").trim()
  const description = String(form.get("description") || "")
  const status = String(form.get("status") || "active") as Status
  if (!code || !name) return { success: false, message: "Data kategori tidak lengkap." }

  const { data: exists } = await supabase.from("categories").select("id").eq("code", code).maybeSingle()
  if (exists) return { success: false, message: "Kode kategori sudah ada." }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      code,
      name,
      description,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single()
  if (error || !data) return { success: false, message: "Gagal menambah kategori." }
  return { success: true, message: "Kategori ditambahkan.", category: mapCategory(data) }
}

export async function updateCategory(form: FormData) {
  const supabase = createServerClient()
  const id = toInt(form.get("id"))
  if (!id) return { success: false, message: "ID kategori tidak valid." }
  const payload: any = {
    code: form.get("code") ?? undefined,
    name: form.get("name") ?? undefined,
    description: form.get("description") ?? undefined,
    status: form.get("status") ?? undefined,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from("categories").update(payload).eq("id", id).select("*").single()
  if (error || !data) return { success: false, message: "Gagal memperbarui kategori." }
  return { success: true, message: "Kategori diperbarui.", category: mapCategory(data) }
}

export async function deleteCategory(id: number) {
  const supabase = createServerClient()
  const { error } = await supabase.from("categories").delete().eq("id", id)
  if (error) return { success: false, message: "Gagal menghapus kategori." }
  return { success: true, message: "Kategori dihapus." }
}

// Items
export async function fetchItems(): Promise<Item[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("items").select("*").order("id", { ascending: true })
  if (error || !data) return []
  return data.map(mapItem)
}

export async function createItem(form: FormData, imageUrl?: string) {
  const supabase = createServerClient()
  const payload: any = {
    code: form.get("code"),
    name: form.get("name"),
    category: form.get("category"),
    description: form.get("description") ?? "",
    unit: form.get("unit"),
    min_stock: toInt(form.get("minStock")),
    current_stock: toInt(form.get("currentStock")),
    location: form.get("location"),
    supplier_id: toInt(form.get("supplierId")),
    price: toFloat(form.get("price")),
    status: (form.get("status") || "active") as Status,
    image_url: imageUrl ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Basic validation
  if (!payload.code || !payload.name || !payload.unit) return { success: false, message: "Data item tidak lengkap." }

  const { data: exists } = await supabase.from("items").select("id").eq("code", payload.code).maybeSingle()
  if (exists) return { success: false, message: "Kode barang sudah ada." }

  const { data, error } = await supabase.from("items").insert(payload).select("*").single()
  if (error || !data) return { success: false, message: "Gagal menambah barang." }
  return { success: true, message: "Barang ditambahkan.", item: mapItem(data) }
}

export async function updateItem(form: FormData, imageUrl?: string) {
  const supabase = createServerClient()
  const id = toInt(form.get("id"))
  if (!id) return { success: false, message: "ID tidak valid." }
  const payload: any = {
    code: form.get("code") ?? undefined,
    name: form.get("name") ?? undefined,
    category: form.get("category") ?? undefined,
    description: form.get("description") ?? undefined,
    unit: form.get("unit") ?? undefined,
    min_stock: toInt(form.get("minStock"), undefined as unknown as number),
    current_stock: toInt(form.get("currentStock"), undefined as unknown as number),
    location: form.get("location") ?? undefined,
    supplier_id: toInt(form.get("supplierId"), undefined as unknown as number),
    price: toFloat(form.get("price"), undefined as unknown as number),
    status: (form.get("status") as Status) ?? undefined,
    image_url: imageUrl !== undefined ? imageUrl : undefined,
    updated_at: new Date().toISOString(),
  }

  // Remove undefined to avoid overwriting with null
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

  const { data, error } = await supabase.from("items").update(payload).eq("id", id).select("*").single()
  if (error || !data) return { success: false, message: "Gagal memperbarui barang." }
  return { success: true, message: "Barang diperbarui.", item: mapItem(data) }
}

export async function deleteItem(id: number) {
  const supabase = createServerClient()
  const { error } = await supabase.from("items").delete().eq("id", id)
  if (error) return { success: false, message: "Gagal menghapus barang." }
  return { success: true, message: "Barang dihapus." }
}

// Transactions
export async function fetchTransactions(): Promise<Transaction[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("transactions").select("*").order("id", { ascending: true })
  if (error || !data) return []
  return data.map(mapTransaction)
}

export async function createTransaction(form: FormData, userIdOverride?: number) {
  const supabase = createServerClient()
  const type = String(form.get("type") || "in") as TransactionType
  const itemId = toInt(form.get("itemId"))
  const quantity = toInt(form.get("quantity"))
  const userId = userIdOverride || toInt(form.get("userId"))
  const supplierId = toInt(form.get("supplierId"), undefined as unknown as number)
  const borrowerId = String(form.get("borrowerId") || "")
  const notes = String(form.get("notes") || "")
  const date = String(form.get("date") || new Date().toISOString().slice(0, 10))
  const dueDate = String(form.get("dueDate") || "") || undefined
  const returnDate = String(form.get("returnDate") || "") || undefined
  const status = String(form.get("status") || (type === "borrow" ? "pending" : "completed")) as TransactionStatus

  if (!itemId || !quantity || !userId) return { success: false, message: "Data transaksi tidak lengkap." }

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      type,
      item_id: itemId,
      quantity,
      user_id: userId,
      supplier_id: supplierId || null,
      borrower_id: borrowerId || null,
      notes,
      status,
      date,
      due_date: dueDate || null,
      return_date: returnDate || null,
    })
    .select("*")
    .single()

  if (error || !data) return { success: false, message: "Gagal membuat transaksi." }

  // Optional: adjust stock based on type
  const sign = type === "in" || type === "return" ? +1 : type === "out" || type === "borrow" ? -1 : 0
  if (sign !== 0) {
    // Fetch current stock, then update safely
    const { data: current } = await supabase.from("items").select("current_stock").eq("id", itemId).single()
    if (current) {
      const newStock = Number(current.current_stock || 0) + sign * quantity
      await supabase
        .from("items")
        .update({ current_stock: newStock, updated_at: new Date().toISOString() })
        .eq("id", itemId)
    }
  }

  return { success: true, message: "Transaksi dibuat.", transaction: mapTransaction(data) }
}

export async function updateTransaction(form: FormData) {
  const supabase = createServerClient()
  const id = toInt(form.get("id"))
  if (!id) return { success: false, message: "ID transaksi tidak valid." }

  const strOrUndef = (key: string) => {
    const v = form.get(key)
    const s = v !== null ? String(v) : ""
    return s === "" ? undefined : s
  }

  const maybeInt = (key: string) => {
    const v = form.get(key)
    const s = v !== null ? String(v) : ""
    if (s === "") return undefined
    const n = Number.parseInt(s, 10)
    return Number.isNaN(n) ? undefined : n
  }

  const payload: any = {
    type: strOrUndef("type"),
    item_id: maybeInt("itemId"),
    quantity: maybeInt("quantity"),
    user_id: maybeInt("userId"),
    supplier_id: maybeInt("supplierId"),
    borrower_id: strOrUndef("borrowerId"),
    notes: strOrUndef("notes"),
    status: strOrUndef("status"),
    date: strOrUndef("date"),
    due_date: strOrUndef("dueDate"),
    return_date: strOrUndef("returnDate"),
  }

  // Remove undefined values so we don't overwrite with null/empty
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

  const { data, error } = await supabase.from("transactions").update(payload).eq("id", id).select("*").single()
  if (error || !data) return { success: false, message: "Gagal memperbarui transaksi." }
  return { success: true, message: "Transaksi diperbarui.", transaction: mapTransaction(data) }
}

export async function deleteTransaction(id: number) {
  const supabase = createServerClient()
  if (!id) return { success: false, message: "ID transaksi tidak valid." }

  const { error } = await supabase.from("transactions").delete().eq("id", id)
  if (error) return { success: false, message: "Gagal menghapus transaksi." }
  return { success: true, message: "Transaksi dihapus." }
}

// Depreciations
export async function fetchDepreciations(): Promise<Depreciation[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("depreciations").select("*").order("id", { ascending: true })
  if (error || !data) return []
  return data.map(mapDepreciation)
}
"use server";

import { supabase } from "@/lib/supabase"; // path sesuai proyekmu

export async function updatePassword(userId: string, newPassword: string) {
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
export async function updateUserPassword(userId: string, newPassword: string) {
  ...
}

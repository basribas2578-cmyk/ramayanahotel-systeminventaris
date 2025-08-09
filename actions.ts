"use server"

import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { Item, Supplier, Transaction, User, Depreciation, Category } from "@/app/page" // Import types from app/page

// Helper to convert snake_case to camelCase for fetched data
const toCamelCase = (obj: any) => {
  if (Array.isArray(obj)) {
    return obj.map((v) => toCamelCase(v))
  } else if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
      acc[camelKey] = toCamelCase(obj[key])
      return acc
    }, {} as any)
  }
  return obj
}

// Helper to convert camelCase to snake_case for inserts/updates
const toSnakeCase = (obj: any) => {
  if (Array.isArray(obj)) {
    return obj.map((v) => toSnakeCase(v))
  } else if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      acc[snakeKey] = toSnakeCase(obj[key])
      return acc
    }, {} as any)
  }
  return obj
}

// Add data validation and conflict resolution
const validateAndResolveConflicts = async (
  supabase: ReturnType<typeof createServerClient>,
  table: string,
  id: number,
  expectedVersion?: string,
) => {
  if (!expectedVersion) return true

  const { data, error } = await supabase.from(table).select("updated_at").eq("id", id).single()

  if (error) return false

  // Check if data has been modified by another user
  return data.updated_at === expectedVersion
}

// Category Actions
export async function fetchCategories(): Promise<Category[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("categories").select("*").order("name")
  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }
  return toCamelCase(data) as Category[]
}

export async function createCategory(formData: FormData) {
  try {
    const supabase = createServerClient()
    const category: Omit<Category, "id" | "createdAt" | "updatedAt" | "status"> = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
    }

    // Check for duplicate code/name
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .or(`code.eq.${category.code},name.eq.${category.name}`)
      .limit(1)

    if (existing && existing.length > 0) {
      throw new Error("Kode atau nama kategori sudah ada")
    }

    const { data, error } = await supabase.from("categories").insert(toSnakeCase(category)).select().single()
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, category: toCamelCase(data) as Category, message: "Kategori berhasil ditambahkan." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function updateCategory(formData: FormData) {
  try {
    const supabase = createServerClient()
    const id = Number(formData.get("id"))
    const expectedVersion = formData.get("expectedVersion") as string

    // Validate version for conflict resolution
    if (expectedVersion && !(await validateAndResolveConflicts(supabase, "categories", id, expectedVersion))) {
      throw new Error("Data telah diubah oleh pengguna lain. Silakan refresh dan coba lagi.")
    }

    const updatedCategory: Partial<Category> = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      status: formData.get("status") as Category["status"],
      updatedAt: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("categories")
      .update(toSnakeCase(updatedCategory))
      .eq("id", id)
      .select()
      .single()
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, category: toCamelCase(data) as Category, message: "Kategori berhasil diperbarui." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function deleteCategory(id: number) {
  try {
    const supabase = createServerClient()

    // Use transaction-like approach with proper error handling
    const { count: itemCount, error: itemError } = await supabase
      .from("items")
      .select("id", { count: "exact" })
      .eq("category", id)

    if (itemError) throw new Error(itemError.message)
    if (itemCount && itemCount > 0) {
      throw new Error("Tidak dapat menghapus kategori yang memiliki barang terkait.")
    }

    const { error } = await supabase.from("categories").delete().eq("id", id)
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, message: "Kategori berhasil dihapus." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

// User Actions with improved error handling
export async function fetchUsers(): Promise<User[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("users").select("*").order("name")
  if (error) {
    console.error("Error fetching users:", error)
    return []
  }
  return toCamelCase(data) as User[]
}

export async function createUser(formData: FormData) {
  try {
    const supabase = createServerClient()
    const user: Omit<User, "id" | "lastLogin" | "status"> = {
      username: formData.get("username") as string,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as User["role"],
    }

    // Check for duplicate username/email
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .or(`username.eq.${user.username},email.eq.${user.email}`)
      .limit(1)

    if (existing && existing.length > 0) {
      throw new Error("Username atau email sudah ada")
    }

    const { data, error } = await supabase.from("users").insert(toSnakeCase(user)).select().single()
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, user: toCamelCase(data) as User, message: "Pengguna berhasil ditambahkan." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function updateUser(formData: FormData) {
  try {
    const supabase = createServerClient()
    const id = Number(formData.get("id"))
    const expectedVersion = formData.get("expectedVersion") as string

    if (expectedVersion && !(await validateAndResolveConflicts(supabase, "users", id, expectedVersion))) {
      throw new Error("Data telah diubah oleh pengguna lain. Silakan refresh dan coba lagi.")
    }

    const updatedUser: Partial<User> = {
      username: formData.get("username") as string,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as User["role"],
      status: formData.get("status") as User["status"],
    }

    const { data, error } = await supabase.from("users").update(toSnakeCase(updatedUser)).eq("id", id).select().single()
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, user: toCamelCase(data) as User, message: "Pengguna berhasil diperbarui." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function deleteUser(id: number) {
  try {
    const supabase = createServerClient()

    // Check for related transactions
    const { count: transactionCount, error: transactionError } = await supabase
      .from("transactions")
      .select("id", { count: "exact" })
      .eq("user_id", id)

    if (transactionError) throw new Error(transactionError.message)
    if (transactionCount && transactionCount > 0) {
      throw new Error("Tidak dapat menghapus user yang memiliki transaksi terkait.")
    }

    const { error } = await supabase.from("users").delete().eq("id", id)
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, message: "Pengguna berhasil dihapus." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

// Item Actions with improved concurrency handling
export async function fetchItems(): Promise<Item[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("items").select("*").order("name")
  if (error) {
    console.error("Error fetching items:", error)
    return []
  }
  return toCamelCase(data) as Item[]
}

export async function createItem(formData: FormData, imageUrl?: string) {
  try {
    const supabase = createServerClient()
    const item: Omit<Item, "id" | "createdAt" | "updatedAt" | "status"> = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      unit: formData.get("unit") as string,
      minStock: Number(formData.get("minStock")),
      currentStock: Number(formData.get("currentStock")),
      location: formData.get("location") as string,
      supplierId: Number(formData.get("supplierId")),
      price: Number(formData.get("price")),
      imageUrl: imageUrl,
    }

    // Check for duplicate code
    const { data: existing } = await supabase.from("items").select("id").eq("code", item.code).limit(1)

    if (existing && existing.length > 0) {
      throw new Error("Kode barang sudah ada")
    }

    const { data, error } = await supabase.from("items").insert(toSnakeCase(item)).select().single()
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, item: toCamelCase(data) as Item, message: "Barang berhasil ditambahkan." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function updateItem(formData: FormData, imageUrl?: string) {
  try {
    const supabase = createServerClient()
    const id = Number(formData.get("id"))
    const expectedVersion = formData.get("expectedVersion") as string

    if (expectedVersion && !(await validateAndResolveConflicts(supabase, "items", id, expectedVersion))) {
      throw new Error("Data telah diubah oleh pengguna lain. Silakan refresh dan coba lagi.")
    }

    const updatedItem: Partial<Item> = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      unit: formData.get("unit") as string,
      minStock: Number(formData.get("minStock")),
      currentStock: Number(formData.get("currentStock")),
      location: formData.get("location") as string,
      supplierId: Number(formData.get("supplierId")),
      price: Number(formData.get("price")),
      status: formData.get("status") as Item["status"],
      updatedAt: new Date().toISOString(),
      imageUrl: imageUrl,
    }

    const { data, error } = await supabase.from("items").update(toSnakeCase(updatedItem)).eq("id", id).select().single()
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, item: toCamelCase(data) as Item, message: "Barang berhasil diperbarui." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function deleteItem(id: number) {
  try {
    const supabase = createServerClient()

    // Check for related transactions
    const { count: transactionCount, error: transactionError } = await supabase
      .from("transactions")
      .select("id", { count: "exact" })
      .eq("item_id", id)

    if (transactionError) throw new Error(transactionError.message)
    if (transactionCount && transactionCount > 0) {
      throw new Error("Tidak dapat menghapus barang yang memiliki transaksi terkait.")
    }

    const { error } = await supabase.from("items").delete().eq("id", id)
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, message: "Barang berhasil dihapus." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

// Supplier Actions
export async function fetchSuppliers(): Promise<Supplier[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("suppliers").select("*").order("name")
  if (error) {
    console.error("Error fetching suppliers:", error)
    return []
  }
  return toCamelCase(data) as Supplier[]
}

export async function createSupplier(formData: FormData) {
  try {
    const supabase = createServerClient()
    const supplier: Omit<Supplier, "id" | "createdAt" | "status"> = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      contact: formData.get("contact") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
    }

    // Check for duplicate code/email
    const { data: existing } = await supabase
      .from("suppliers")
      .select("id")
      .or(`code.eq.${supplier.code},email.eq.${supplier.email}`)
      .limit(1)

    if (existing && existing.length > 0) {
      throw new Error("Kode atau email supplier sudah ada")
    }

    const { data, error } = await supabase.from("suppliers").insert(toSnakeCase(supplier)).select().single()
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, supplier: toCamelCase(data) as Supplier, message: "Supplier berhasil ditambahkan." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function updateSupplier(formData: FormData) {
  try {
    const supabase = createServerClient()
    const id = Number(formData.get("id"))
    const expectedVersion = formData.get("expectedVersion") as string

    if (expectedVersion && !(await validateAndResolveConflicts(supabase, "suppliers", id, expectedVersion))) {
      throw new Error("Data telah diubah oleh pengguna lain. Silakan refresh dan coba lagi.")
    }

    const updatedSupplier: Partial<Supplier> = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      contact: formData.get("contact") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      status: formData.get("status") as Supplier["status"],
    }

    const { data, error } = await supabase
      .from("suppliers")
      .update(toSnakeCase(updatedSupplier))
      .eq("id", id)
      .select()
      .single()
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, supplier: toCamelCase(data) as Supplier, message: "Supplier berhasil diperbarui." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function deleteSupplier(id: number) {
  try {
    const supabase = createServerClient()

    // Check for related items
    const { count: itemCount, error: itemError } = await supabase
      .from("items")
      .select("id", { count: "exact" })
      .eq("supplier_id", id)

    if (itemError) throw new Error(itemError.message)
    if (itemCount && itemCount > 0) {
      throw new Error("Tidak dapat menghapus supplier yang memiliki barang terkait.")
    }

    const { error } = await supabase.from("suppliers").delete().eq("id", id)
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, message: "Supplier berhasil dihapus." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

// Transaction Actions with improved stock management
export async function fetchTransactions(): Promise<Transaction[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false })
  if (error) {
    console.error("Error fetching transactions:", error)
    return []
  }
  return toCamelCase(data) as Transaction[]
}

export async function createTransaction(formData: FormData, userId: number) {
  try {
    const supabase = createServerClient()
    const transactionType = formData.get("type") as Transaction["type"]
    const itemId = Number(formData.get("itemId"))
    const quantity = Number(formData.get("quantity"))

    // Use database transaction for atomic operations
    const { data: itemData, error: itemError } = await supabase
      .from("items")
      .select("current_stock, min_stock, updated_at")
      .eq("id", itemId)
      .single()

    if (itemError || !itemData) {
      throw new Error("Barang tidak ditemukan.")
    }

    let newStock = itemData.current_stock

    if (transactionType === "out" || transactionType === "borrow") {
      if (itemData.current_stock < quantity) {
        throw new Error("Stok tidak mencukupi.")
      }
      newStock -= quantity
    } else if (transactionType === "in") {
      newStock += quantity
    }

    // Update item stock with version check
    const { error: updateItemError } = await supabase
      .from("items")
      .update({
        current_stock: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("updated_at", itemData.updated_at) // Optimistic locking

    if (updateItemError) {
      throw new Error(`Gagal memperbarui stok barang: ${updateItemError.message}`)
    }

    const newTransaction: Omit<Transaction, "id" | "date" | "status" | "returnDate"> = {
      type: transactionType,
      itemId: itemId,
      quantity: quantity,
      userId: userId,
      supplierId: formData.get("supplierId") ? Number(formData.get("supplierId")) : undefined,
      borrowerId: formData.get("borrowerId") as string | undefined,
      notes: formData.get("notes") as string,
      dueDate: formData.get("dueDate") as string | undefined,
    }

    const { data, error } = await supabase.from("transactions").insert(toSnakeCase(newTransaction)).select().single()
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, transaction: toCamelCase(data) as Transaction, message: "Transaksi berhasil ditambahkan." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function updateTransaction(formData: FormData) {
  try {
    const supabase = createServerClient()
    const transactionId = Number(formData.get("id"))
    const updatedItemId = Number(formData.get("itemId"))
    const updatedQuantity = Number(formData.get("quantity"))
    const updatedType = formData.get("type") as Transaction["type"]
    const updatedStatus = formData.get("status") as Transaction["status"]

    // Fetch old transaction and item data
    const { data: oldTransaction, error: oldTransactionError } = await supabase
      .from("transactions")
      .select("item_id, quantity, type, status")
      .eq("id", transactionId)
      .single()

    if (oldTransactionError || !oldTransaction) {
      throw new Error("Transaksi tidak ditemukan.")
    }

    const { data: itemData, error: itemError } = await supabase
      .from("items")
      .select("current_stock, updated_at")
      .eq("id", updatedItemId)
      .single()

    if (itemError || !itemData) {
      throw new Error("Barang tidak ditemukan.")
    }

    let currentStock = itemData.current_stock

    // Revert old transaction's stock effect if item_id is the same
    if (oldTransaction.item_id === updatedItemId) {
      if (oldTransaction.type === "out" || oldTransaction.type === "borrow") {
        currentStock += oldTransaction.quantity
      } else if (oldTransaction.type === "in") {
        currentStock -= oldTransaction.quantity
      }
    }

    // Apply new transaction's stock effect
    if (updatedType === "out" || updatedType === "borrow") {
      if (currentStock < updatedQuantity) {
        throw new Error("Stok tidak mencukupi untuk perubahan ini.")
      }
      currentStock -= updatedQuantity
    } else if (updatedType === "in") {
      currentStock += updatedQuantity
    }

    // Update item's stock with optimistic locking
    const { error: updateItemError } = await supabase
      .from("items")
      .update({
        current_stock: currentStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", updatedItemId)
      .eq("updated_at", itemData.updated_at)

    if (updateItemError) {
      throw new Error(`Gagal memperbarui stok barang: ${updateItemError.message}`)
    }

    const updatedTransactionData: Partial<Transaction> = {
      type: updatedType,
      itemId: updatedItemId,
      quantity: updatedQuantity,
      userId: Number(formData.get("userId")),
      supplierId: formData.get("supplierId") ? Number(formData.get("supplierId")) : undefined,
      borrowerId: formData.get("borrowerId") as string | undefined,
      notes: formData.get("notes") as string,
      status: updatedStatus,
      dueDate: formData.get("dueDate") as string | undefined,
      returnDate: formData.get("returnDate") as string | undefined,
    }

    const { data, error } = await supabase
      .from("transactions")
      .update(toSnakeCase(updatedTransactionData))
      .eq("id", transactionId)
      .select()
      .single()
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, transaction: toCamelCase(data) as Transaction, message: "Transaksi berhasil diperbarui." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function deleteTransaction(id: number) {
  try {
    const supabase = createServerClient()

    // Fetch transaction to revert stock
    const { data: transactionToDelete, error: fetchError } = await supabase
      .from("transactions")
      .select("item_id, quantity, type")
      .eq("id", id)
      .single()

    if (fetchError || !transactionToDelete) {
      throw new Error("Transaksi tidak ditemukan.")
    }

    // Revert stock with proper error handling
    const { data: itemData, error: itemError } = await supabase
      .from("items")
      .select("current_stock, updated_at")
      .eq("id", transactionToDelete.item_id)
      .single()

    if (itemData) {
      let newStock = itemData.current_stock
      if (transactionToDelete.type === "out" || transactionToDelete.type === "borrow") {
        newStock += transactionToDelete.quantity
      } else if (transactionToDelete.type === "in") {
        newStock -= transactionToDelete.quantity
      }

      await supabase
        .from("items")
        .update({
          current_stock: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transactionToDelete.item_id)
        .eq("updated_at", itemData.updated_at)
    }

    const { error } = await supabase.from("transactions").delete().eq("id", id)
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, message: "Transaksi berhasil dihapus." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function returnBorrowing(transactionId: number) {
  try {
    const supabase = createServerClient()
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("item_id, quantity, status")
      .eq("id", transactionId)
      .eq("type", "borrow")
      .single()

    if (fetchError || !transaction) {
      return { success: false, message: "Transaksi peminjaman tidak ditemukan." }
    }
    if (transaction.status === "completed") {
      return { success: false, message: "Peminjaman sudah dikembalikan." }
    }

    // Return item to stock with optimistic locking
    const { data: itemData, error: itemError } = await supabase
      .from("items")
      .select("current_stock, updated_at")
      .eq("id", transaction.item_id)
      .single()

    if (itemError || !itemData) {
      return { success: false, message: "Barang tidak ditemukan untuk transaksi ini." }
    }

    const newStock = itemData.current_stock + transaction.quantity
    const { error: updateItemError } = await supabase
      .from("items")
      .update({
        current_stock: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.item_id)
      .eq("updated_at", itemData.updated_at)

    if (updateItemError) {
      throw new Error(`Gagal memperbarui stok barang: ${updateItemError.message}`)
    }

    // Update transaction status and return date
    const { error: updateTransactionError } = await supabase
      .from("transactions")
      .update({
        status: "completed",
        return_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", transactionId)

    if (updateTransactionError) {
      throw new Error(`Gagal memperbarui status transaksi: ${updateTransactionError.message}`)
    }
    revalidatePath("/")
    return { success: true, message: "Barang berhasil dikembalikan." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

// Depreciation Actions
export async function fetchDepreciations(): Promise<Depreciation[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("depreciations").select("*").order("date", { ascending: false })
  if (error) {
    console.error("Error fetching depreciations:", error)
    return []
  }
  return toCamelCase(data) as Depreciation[]
}

export async function createDepreciation(formData: FormData, userId: number) {
  try {
    const supabase = createServerClient()
    const itemId = Number(formData.get("itemId"))
    const quantity = Number(formData.get("quantity"))

    // Fetch item to check stock and update with optimistic locking
    const { data: itemData, error: itemError } = await supabase
      .from("items")
      .select("current_stock, updated_at")
      .eq("id", itemId)
      .single()

    if (itemError || !itemData) {
      throw new Error("Barang tidak ditemukan.")
    }

    if (itemData.current_stock < quantity) {
      throw new Error("Stok tidak mencukupi untuk penyusutan.")
    }

    const newStock = itemData.current_stock - quantity

    // Update item stock
    const { error: updateItemError } = await supabase
      .from("items")
      .update({
        current_stock: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("updated_at", itemData.updated_at)

    if (updateItemError) {
      throw new Error(`Gagal memperbarui stok barang: ${updateItemError.message}`)
    }

    const depreciation: Omit<Depreciation, "id" | "date" | "status"> = {
      itemId: itemId,
      quantity: quantity,
      reason: formData.get("reason") as string,
      userId: userId,
    }

    const { data, error } = await supabase.from("depreciations").insert(toSnakeCase(depreciation)).select().single()
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, depreciation: toCamelCase(data) as Depreciation, message: "Penyusutan berhasil dicatat." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function updateDepreciation(formData: FormData) {
  try {
    const supabase = createServerClient()
    const depreciationId = Number(formData.get("id"))
    const updatedItemId = Number(formData.get("itemId"))
    const updatedQuantity = Number(formData.get("quantity"))

    // Fetch old depreciation and item data
    const { data: oldDepreciation, error: oldDepreciationError } = await supabase
      .from("depreciations")
      .select("item_id, quantity")
      .eq("id", depreciationId)
      .single()

    if (oldDepreciationError || !oldDepreciation) {
      throw new Error("Penyusutan tidak ditemukan.")
    }

    const { data: itemData, error: itemError } = await supabase
      .from("items")
      .select("current_stock, updated_at")
      .eq("id", updatedItemId)
      .single()

    if (itemError || !itemData) {
      throw new Error("Barang tidak ditemukan.")
    }

    let currentStock = itemData.current_stock

    // Revert old depreciation's stock effect if item_id is the same
    if (oldDepreciation.item_id === updatedItemId) {
      currentStock += oldDepreciation.quantity
    }

    // Apply new depreciation's stock effect
    if (currentStock < updatedQuantity) {
      throw new Error("Stok tidak mencukupi untuk perubahan ini.")
    }
    currentStock -= updatedQuantity

    // Update item's stock
    const { error: updateItemError } = await supabase
      .from("items")
      .update({
        current_stock: currentStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", updatedItemId)
      .eq("updated_at", itemData.updated_at)

    if (updateItemError) {
      throw new Error(`Gagal memperbarui stok barang: ${updateItemError.message}`)
    }

    const updatedDepreciationData: Partial<Depreciation> = {
      itemId: updatedItemId,
      quantity: updatedQuantity,
      reason: formData.get("reason") as string,
      userId: Number(formData.get("userId")),
      status: formData.get("status") as Depreciation["status"],
    }

    const { data, error } = await supabase
      .from("depreciations")
      .update(toSnakeCase(updatedDepreciationData))
      .eq("id", depreciationId)
      .select()
      .single()
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return {
      success: true,
      depreciation: toCamelCase(data) as Depreciation,
      message: "Penyusutan berhasil diperbarui.",
    }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function deleteDepreciation(id: number) {
  try {
    const supabase = createServerClient()

    // Fetch depreciation to revert stock
    const { data: depreciationToDelete, error: fetchError } = await supabase
      .from("depreciations")
      .select("item_id, quantity")
      .eq("id", id)
      .single()

    if (fetchError || !depreciationToDelete) {
      throw new Error("Penyusutan tidak ditemukan.")
    }

    // Revert stock
    const { data: itemData, error: itemError } = await supabase
      .from("items")
      .select("current_stock, updated_at")
      .eq("id", depreciationToDelete.item_id)
      .single()

    if (itemData) {
      const newStock = itemData.current_stock + depreciationToDelete.quantity
      await supabase
        .from("items")
        .update({
          current_stock: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", depreciationToDelete.item_id)
        .eq("updated_at", itemData.updated_at)
    }

    const { error } = await supabase.from("depreciations").delete().eq("id", id)
    if (error) {
      throw new Error(error.message)
    }
    revalidatePath("/")
    return { success: true, message: "Penyusutan berhasil dihapus." }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

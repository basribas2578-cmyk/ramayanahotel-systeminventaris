// Mock database functions for development and fallback
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

// Mock data
const mockItems: Item[] = [
  {
    id: "1",
    name: "Laptop Dell Inspiron",
    category: "Electronics",
    quantity: 5,
    location: "Office",
    condition: "Good",
    purchase_date: "2024-01-15",
    price: 15000000,
    supplier: "PT Tech Solutions",
    description: "Laptop untuk staff administrasi",
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
  {
    id: "2",
    name: "Meja Kerja Kayu",
    category: "Furniture",
    quantity: 10,
    location: "Reception",
    condition: "Excellent",
    purchase_date: "2024-02-01",
    price: 2500000,
    supplier: "CV Furniture Jaya",
    description: "Meja kerja untuk reception",
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
  },
]

const mockCategories: Category[] = [
  {
    id: "1",
    name: "Electronics",
    description: "Electronic devices and equipment",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Furniture",
    description: "Office and hotel furniture",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

const mockLocations: Location[] = [
  {
    id: "1",
    name: "Office",
    description: "Main office area",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Reception",
    description: "Hotel reception area",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

// Mock database functions
export async function dbFetchItems(): Promise<Item[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockItems
}

export async function dbFetchCategories(): Promise<Category[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockCategories
}

export async function dbFetchLocations(): Promise<Location[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockLocations
}

export async function dbCreateItem(item: Omit<Item, "id" | "created_at" | "updated_at">): Promise<Item> {
  const newItem: Item = {
    ...item,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mockItems.push(newItem)
  return newItem
}

export async function dbUpdateItem(id: string, updates: Partial<Item>): Promise<Item | null> {
  const index = mockItems.findIndex((item) => item.id === id)
  if (index === -1) return null

  mockItems[index] = {
    ...mockItems[index],
    ...updates,
    updated_at: new Date().toISOString(),
  }
  return mockItems[index]
}

export async function dbDeleteItem(id: string): Promise<boolean> {
  const index = mockItems.findIndex((item) => item.id === id)
  if (index === -1) return false

  mockItems.splice(index, 1)
  return true
}

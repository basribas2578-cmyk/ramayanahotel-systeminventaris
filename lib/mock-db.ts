// lib/mock-db.ts
/**
 * Mock database fallback untuk development atau testing.
 * Gunakan koneksi database asli di environment production.
 */

interface Item {
  id: number;
  name: string;
  quantity: number;
  category?: string;
  location?: string;
}

const mockItems: Item[] = [
  { id: 1, name: "Contoh Barang 1", quantity: 10, category: "Peralatan", location: "Gudang" },
  { id: 2, name: "Contoh Barang 2", quantity: 5, category: "Bahan", location: "Pantry" },
];

export const mockDB = {
  getItems: () => {
    console.warn("⚠ Menggunakan MOCK DB: getItems() - data hanya untuk testing.");
    return mockItems;
  },
  getItemById: (id: number) => {
    console.warn("⚠ Menggunakan MOCK DB: getItemById()");
    return mockItems.find(item => item.id === id) || null;
  },
  addItem: (item: Item) => {
    console.warn("⚠ Menggunakan MOCK DB: addItem()");
    mockItems.push(item);
    return item;
  },
  updateItem: (id: number, data: Partial<Item>) => {
    console.warn("⚠ Menggunakan MOCK DB: updateItem()");
    const index = mockItems.findIndex(item => item.id === id);
    if (index !== -1) {
      mockItems[index] = { ...mockItems[index], ...data };
      return mockItems[index];
    }
    return null;
  },
  deleteItem: (id: number) => {
    console.warn("⚠ Menggunakan MOCK DB: deleteItem()");
    const index = mockItems.findIndex(item => item.id === id);
    if (index !== -1) {
      return mockItems.splice(index, 1)[0];
    }
    return null;
  }
};

export default mockDB;

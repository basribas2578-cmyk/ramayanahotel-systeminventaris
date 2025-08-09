"use client"
import type React from "react"
import { useMemo, useState } from "react"
import Papa from "papaparse"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Filter,
  AlertTriangle,
  ArrowUpRight,
  Package,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { createTransaction, updateTransaction, deleteTransaction } from "@/app/actions"
import type { Item, Transaction, User, Supplier } from "@/app/page"

// Helper function to download CSV
const downloadCsv = (data: any[], filename: string, headers: string[], toast: ReturnType<typeof useToast>["toast"]) => {
  try {
    const csv = Papa.unparse(data, {
      header: true,
      columns: headers,
    })
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast({
        title: "Export Berhasil",
        description: `Data berhasil diekspor ke ${filename}`,
      })
    }
  } catch (error: any) {
    toast({
      title: "Export Gagal",
      description: `Terjadi kesalahan saat mengekspor: ${error.message}`,
      variant: "destructive",
    })
  }
}

export function ItemsOutManagement({
  user,
  items,
  transactions,
  refreshData,
  suppliers,
}: {
  user: User
  items: Item[]
  transactions: Transaction[]
  refreshData: () => void
  suppliers: Supplier[]
}) {
  const { toast } = useToast()
  const [itemId, setItemId] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("")
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState<string>("")
  const [search, setSearch] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all")
  const [selectedItemFilter, setSelectedItemFilter] = useState("all")

  const recentOut = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "out")
        .slice(-50)
        .reverse(),
    [transactions],
  )

  const filteredTransactions = useMemo(() => {
    if (!search) return recentOut
    return recentOut.filter((t) => {
      const it = items.find((i) => i.id === t.itemId)
      const text = `${it?.name ?? ""} ${t.notes ?? ""}`.toLowerCase()
      return text.includes(search.toLowerCase())
    })
  }, [recentOut, items, search])

  const itemsOutTransactions = transactions.filter((t) => t.type === "out")
  const itemsInTransactions = transactions.filter((t) => t.type === "in")

  const totalItemsOut = itemsOutTransactions.reduce((sum, t) => sum + t.quantity, 0)
  const totalItemsIn = itemsInTransactions.reduce((sum, t) => sum + t.quantity, 0)
  const totalTransactionsOut = itemsOutTransactions.length
  const totalTransactionsIn = itemsInTransactions.length
  const pendingTransactionsOut = itemsOutTransactions.filter((t) => t.status === "pending").length
  const completedTransactionsOut = itemsOutTransactions.filter((t) => t.status === "completed").length

  const submit = async () => {
    const fd = new FormData()
    fd.append("type", "out")
    fd.append("itemId", itemId)
    fd.append("quantity", quantity)
    fd.append("userId", String(user.id))
    fd.append("date", date)
    fd.append("notes", notes)
    const r = await createTransaction(fd)
    if (r.success) {
      toast({ title: "Barang Keluar dicatat" })
      setItemId("")
      setQuantity("")
      setNotes("")
      await refreshData()
    } else {
      toast({ title: "Gagal", description: r.message, variant: "destructive" })
    }
  }

  const exportCsv = () => {
    const rows = filteredTransactions.map((t) => {
      const it = items.find((i) => i.id === t.itemId)
      return {
        Date: t.date,
        ItemCode: it?.code ?? "",
        ItemName: it?.name ?? "",
        Quantity: t.quantity,
        Unit: it?.unit ?? "",
        Notes: t.notes ?? "",
      }
    })
    const csv = Papa.unparse(rows, { header: true })
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "barang-keluar.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Export Berhasil" })
  }

  const handleAddOutTransaction = async (formData: FormData) => {
    formData.append("type", "out")
    const result = await createTransaction(formData, user.id)
    if (result.success && result.transaction) {
      await refreshData() // Refresh all data immediately
      setIsAddDialogOpen(false)
      toast({ title: "Transaksi Barang Keluar Ditambahkan", description: result.message })
    } else {
      toast({ title: "Gagal Menambah Transaksi", description: result.message, variant: "destructive" })
    }
  }

  const handleEditOutTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsEditDialogOpen(true)
  }

  const handleUpdateOutTransaction = async (formData: FormData) => {
    if (!selectedTransaction) return
    formData.append("id", selectedTransaction.id.toString())
    formData.append("type", selectedTransaction.type)
    formData.append("userId", selectedTransaction.userId.toString())
    formData.append("date", selectedTransaction.date)
    const result = await updateTransaction(formData)
    if (result.success && result.transaction) {
      await refreshData() // Refresh all data immediately
      setIsEditDialogOpen(false)
      setSelectedTransaction(null)
      toast({ title: "Transaksi Barang Keluar Diperbarui", description: result.message })
    } else {
      toast({ title: "Gagal Memperbarui Transaksi", description: result.message, variant: "destructive" })
    }
  }

  const handleDeleteOutTransaction = async (id: number) => {
    const result = await deleteTransaction(id)
    if (result.success) {
      await refreshData() // Refresh all data immediately
      toast({ title: "Transaksi Barang Keluar Dihapus", description: result.message, variant: "destructive" })
    } else {
      toast({ title: "Gagal Menghapus Transaksi", description: result.message, variant: "destructive" })
    }
  }

  const handleImportItemsOut = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.errors.length) {
          toast({
            title: "Import Gagal",
            description: `Ada kesalahan dalam parsing CSV: ${results.errors[0].message}`,
            variant: "destructive",
          })
          return
        }

        const importedData = results.data as Record<string, string>[]
        let successCount = 0
        let errorCount = 0

        for (const row of importedData) {
          const formData = new FormData()
          formData.append("type", "out")
          formData.append("itemId", row.itemId)
          formData.append("quantity", row.quantity)
          formData.append("notes", row.notes || "")

          const result = await createTransaction(formData, user.id)
          if (result.success) {
            successCount++
          } else {
            errorCount++
            toast({
              title: "Import Sebagian Gagal",
              description: `Gagal mengimpor baris untuk item ID ${row.itemId}: ${result.message}`,
              variant: "destructive",
            })
          }
        }

        if (successCount > 0) {
          await refreshData() // Refresh all data immediately
          toast({
            title: "Import Selesai",
            description: `${successCount} transaksi barang keluar berhasil diimpor, ${errorCount} gagal.`,
          })
        } else if (errorCount > 0) {
          toast({
            title: "Import Gagal Total",
            description: `Tidak ada transaksi barang keluar yang berhasil diimpor.`,
            variant: "destructive",
          })
        }
      },
      error: (error) => {
        toast({
          title: "Import Gagal",
          description: `Terjadi kesalahan saat membaca file: ${error.message}`,
          variant: "destructive",
        })
      },
    })
  }

  if (user.role !== "admin" && user.role !== "manager") {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
        <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold">Barang Keluar</h2>
          <p className="text-sm sm:text-base text-gray-600">Kelola pencatatan barang keluar hotel</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={exportCsv} size="sm" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <input
            type="file"
            accept=".csv"
            onChange={handleImportItemsOut}
            className="hidden"
            id="import-items-out-csv"
          />
          <Button
            onClick={() => document.getElementById("import-items-out-csv")?.click()}
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Barang Keluar
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Barang Keluar Baru</DialogTitle>
                <DialogDescription>Masukkan informasi barang keluar</DialogDescription>
              </DialogHeader>
              <form action={handleAddOutTransaction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="itemId">Barang</Label>
                  <Select name="itemId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih barang" />
                    </SelectTrigger>
                    <SelectContent>
                      {items
                        .filter((item) => item.currentStock > 0)
                        .map((item) => {
                          const supplier = suppliers.find((s) => s.id === item.supplierId)
                          return (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.name} (Stok: {item.currentStock}) - {supplier?.name || "N/A"}
                            </SelectItem>
                          )
                        })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Jumlah</Label>
                  <Input id="quantity" name="quantity" type="number" required min="1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea id="notes" name="notes" placeholder="Contoh: Penggunaan harian, rusak" />
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">
                    Simpan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <Card className="bg-red-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Barang Keluar</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalItemsOut} unit</div>
            <p className="text-xs text-white/80">Total kuantitas keluar</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Barang Masuk</CardTitle>
            <Package className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalItemsIn} unit</div>
            <p className="text-xs text-white/80">Total kuantitas masuk</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Keluar</CardTitle>
            <BarChart3 className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalTransactionsOut}</div>
            <p className="text-xs text-white/80">Total transaksi keluar</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Masuk</CardTitle>
            <BarChart3 className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalTransactionsIn}</div>
            <p className="text-xs text-white/80">Total transaksi masuk</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <Card className="bg-orange-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Keluar</CardTitle>
            <AlertTriangle className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{pendingTransactionsOut}</div>
            <p className="text-xs text-white/80">Transaksi pending</p>
          </CardContent>
        </Card>
        <Card className="bg-teal-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai Keluar</CardTitle>
            <Package className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{completedTransactionsOut}</div>
            <p className="text-xs text-white/80">Transaksi selesai</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari barang, supplier, atau catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedItemFilter} onValueChange={setSelectedItemFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter Barang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Barang</SelectItem>
            {items
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items Out Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead className="hidden sm:table-cell">Jumlah</TableHead>
                  <TableHead className="hidden md:table-cell">Supplier</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  {(user.role === "admin" || user.role === "manager") && <TableHead className="w-20">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <ArrowUpRight className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {search || selectedStatusFilter !== "all" || selectedItemFilter !== "all"
                          ? "Tidak ada transaksi yang sesuai dengan pencarian"
                          : "Belum ada data barang keluar. Tambahkan transaksi pertama Anda!"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const item = items.find((i) => i.id === transaction.itemId)
                    const supplier = suppliers.find((s) => s.id === item?.supplierId)
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-sm">{transaction.date}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm truncate max-w-32">{item?.name}</p>
                            <p className="text-xs text-gray-500 hidden sm:block">{item?.code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {transaction.quantity} {item?.unit}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div>
                            <p className="text-sm truncate max-w-24">{supplier?.name || "N/A"}</p>
                            <p className="text-xs text-gray-500">{supplier?.code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm truncate max-w-32">{transaction.notes}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge
                            variant={transaction.status === "completed" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {transaction.status === "completed" ? "Selesai" : "Pending"}
                          </Badge>
                        </TableCell>
                        {(user.role === "admin" || user.role === "manager") && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditOutTransaction(transaction)}>
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteOutTransaction(transaction.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Items Out Dialog */}
      {selectedTransaction && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Barang Keluar</DialogTitle>
              <DialogDescription>Perbarui informasi barang keluar</DialogDescription>
            </DialogHeader>
            <form action={handleUpdateOutTransaction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editItemId">Barang</Label>
                <Select name="itemId" required defaultValue={selectedTransaction.itemId.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih barang" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => {
                      const supplier = suppliers.find((s) => s.id === item.supplierId)
                      return (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} (Stok: {item.currentStock}) - {supplier?.name || "N/A"}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editQuantity">Jumlah</Label>
                <Input
                  id="editQuantity"
                  name="quantity"
                  type="number"
                  required
                  min="1"
                  defaultValue={selectedTransaction.quantity}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editNotes">Catatan</Label>
                <Textarea id="editNotes" name="notes" defaultValue={selectedTransaction.notes} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select name="status" required defaultValue={selectedTransaction.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Batal
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

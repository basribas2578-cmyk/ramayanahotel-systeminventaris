"use client"

import { useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Activity, AlertTriangle, Calculator, Download, Edit, Upload } from "lucide-react"

interface LogEntry {
  id: number
  date: string
  itemId: number
  outQuantity: number
  inQuantity: number
  pendingQuantity: number
  returnedQuantity: number
  returnedImageUrl?: string
  returnedDate?: string
}

interface CostItemDefinition {
  id: number
  name: string
  price: number
}

// Master items (default prices)
const initialItemDefinitions: CostItemDefinition[] = [
  { id: 1, name: "Bath Towel Baru", price: 2600 },
  { id: 2, name: "Bath Towel Lama", price: 2600 },
  { id: 3, name: "Bath Mat", price: 2400 },
  { id: 4, name: "Bed Sheet Single", price: 3300 },
  { id: 5, name: "Bed Sheet Double", price: 3600 },
  { id: 6, name: "Duvet Cover Single", price: 4600 },
  { id: 7, name: "Duvet Cover Double", price: 5600 },
  { id: 8, name: "Pillow Case Baru", price: 1400 },
  { id: 9, name: "Pillow Case Lama", price: 1400 },
  { id: 10, name: "Pillow Case (MIX)", price: 1400 },
  { id: 11, name: "Inner Duvet Single", price: 15000 },
  { id: 12, name: "Inner Duvet Double", price: 25000 },
  { id: 13, name: "Skarting Duvet Single", price: 0 },
  { id: 14, name: "Skarting Duvet Double", price: 0 },
  { id: 15, name: "Napkin", price: 1200 },
  { id: 16, name: "Cover Chair", price: 2500 },
  { id: 17, name: "Table Cloth", price: 6000 },
  { id: 18, name: "Bath Robe", price: 0 },
]

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]

function formatRp(v: number) {
  return `Rp ${Number.isFinite(v) ? v.toLocaleString("id-ID") : "0"}`
}

export function CostControlManagement({
  user,
  logBookEntries,
}: {
  user: any
  logBookEntries: LogEntry[]
}) {
  const { toast } = useToast()
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1))
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()))
  const [prices, setPrices] = useState<Record<number, number>>(
    Object.fromEntries(initialItemDefinitions.map((i) => [i.id, i.price])),
  )
  const [editItem, setEditItem] = useState<CostItemDefinition | null>(null)
  const [editPrice, setEditPrice] = useState<number>(0)
  const importRef = useRef<HTMLInputElement>(null)

  // Last update string (now or based on latest entry)
  const lastUpdate = useMemo(() => {
    const latest =
      (logBookEntries ?? [])
        .map((e) => e.returnedDate || e.date)
        .filter(Boolean)
        .sort()
        .pop() || new Date().toISOString()
    const d = new Date(latest)
    return d.toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }, [logBookEntries])

  // Filter by month/year
  const filteredLogs = useMemo(() => {
    const m = Number(selectedMonth)
    const y = Number(selectedYear)
    return (logBookEntries ?? []).filter((e) => {
      const d = new Date(e.date)
      return d.getMonth() + 1 === m && d.getFullYear() === y
    })
  }, [logBookEntries, selectedMonth, selectedYear])

  // Aggregation per item
  const rows = useMemo(() => {
    return initialItemDefinitions.map((def) => {
      const logs = filteredLogs.filter((l) => l.itemId === def.id)
      const qtyPickUp = logs.reduce((s, l) => s + (l.outQuantity || 0), 0)
      const totalPending = logs.reduce((s, l) => s + (l.pendingQuantity || 0), 0)
      const totalReturned = logs.reduce((s, l) => s + (l.returnedQuantity || 0), 0)
      const lastPickUp =
        logs
          .map((l) => l.date)
          .sort()
          .pop() || "-"
      const price = prices[def.id] ?? def.price
      const totalCost = qtyPickUp * price
      return {
        no: def.id,
        itemName: def.name,
        pickUpDate: lastPickUp,
        qtyPickUp,
        pending: totalPending,
        returned: totalReturned,
        price,
        totalCost,
        def,
      }
    })
  }, [filteredLogs, prices])

  const totalCostAll = rows.reduce((s, r) => s + r.totalCost, 0)
  const totalProcessed = rows.reduce((s, r) => s + r.qtyPickUp, 0)
  const totalPendingAll = rows.reduce((s, r) => s + Math.max(0, r.pending - r.returned), 0)
  const avgCost = totalProcessed > 0 ? Math.round(totalCostAll / totalProcessed) : 0

  // Import price CSV: expected headers itemId,price
  const handleImportPrices = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
      const [header, ...rest] = lines
      const cols = header.split(",").map((h) => h.trim().toLowerCase())
      const idIdx = cols.indexOf("itemid")
      const priceIdx = cols.indexOf("price")
      if (idIdx === -1 || priceIdx === -1) {
        toast({
          title: "Format tidak valid",
          description: "CSV harus memiliki kolom: itemId,price",
          variant: "destructive",
        })
        return
      }
      const updates: Record<number, number> = {}
      for (const line of rest) {
        const parts = line.split(",")
        const id = Number(parts[idIdx])
        const price = Number(parts[priceIdx])
        if (Number.isFinite(id) && Number.isFinite(price)) {
          updates[id] = price
        }
      }
      if (Object.keys(updates).length === 0) {
        toast({ title: "Tidak ada data harga yang valid", variant: "destructive" })
        return
      }
      setPrices((prev) => ({ ...prev, ...updates }))
      toast({ title: "Harga diperbarui", description: "Harga berhasil diimpor dari CSV" })
    } catch (e: any) {
      toast({ title: "Gagal impor", description: e?.message || "Unknown error", variant: "destructive" })
    }
  }

  const handleExportReport = () => {
    const headers = ["No", "Item", "TanggalPickUp", "QtyPickUp", "Pending", "Returned", "Harga(Rp)", "TotalBiaya(Rp)"]
    const content = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.no,
          `"${r.itemName}"`,
          r.pickUpDate === "-" ? "-" : r.pickUpDate,
          r.qtyPickUp,
          r.pending,
          r.returned,
          r.price,
          r.totalCost,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "laporan_cost_control.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Ekspor berhasil", description: "Laporan diekspor dalam format CSV" })
  }

  const openEdit = (def: CostItemDefinition) => {
    setEditItem(def)
    setEditPrice(prices[def.id] ?? def.price)
  }
  const saveEdit = () => {
    if (!editItem) return
    setPrices((prev) => ({ ...prev, [editItem.id]: Math.max(0, Number(editPrice) || 0) }))
    setEditItem(null)
    toast({ title: "Harga disimpan", description: `${editItem.name} diperbarui` })
  }

  // Access guard (only admin/manager)
  if (user.role !== "admin" && user.role !== "manager") {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
        <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 7 }, (_, i) => String(currentYear - 5 + i))

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page title */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold">Cost Control CM Coin Laundry</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Analisis biaya operasional berdasarkan data real-time dari Loog Book
        </p>
      </div>

      {/* Realtime banner */}
      <div className="bg-green-50 border border-green-200 rounded-md p-3">
        <div className="flex items-start gap-3">
          <Activity className="h-5 w-5 text-green-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">Real-time Calculation</p>
            <p className="text-xs text-green-700">
              Data otomatis terupdate dari Loog Book | Terakhir update: {lastUpdate}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-green-700 border-green-300 hover:bg-green-100 bg-transparent"
          >
            Live Data
          </Button>
        </div>
      </div>

      {/* Filters and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Bulan</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((m, idx) => (
                  <SelectItem key={m} value={String(idx + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tahun</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            ref={importRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImportPrices(f)
              e.currentTarget.value = ""
            }}
          />
          <Button className="bg-black text-white hover:bg-black/90" onClick={() => importRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Impor Harga
          </Button>
          <Button className="bg-black text-white hover:bg-black/90" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Ekspor Laporan
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
              Total Biaya <Calculator className="h-4 w-4 text-blue-700" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatRp(totalCostAll)}</div>
            <p className="text-xs text-blue-700">Biaya operasional periode ini</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-800">Total Item Diproses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{totalProcessed}</div>
            <p className="text-xs text-green-700">Item yang telah diproses</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-800">Item Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{totalPendingAll}</div>
            <p className="text-xs text-yellow-700">Item yang belum dikembalikan</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-800">Rata-rata Biaya</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{formatRp(avgCost)}</div>
            <p className="text-xs text-purple-700">Per item yang diproses</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Tabel Cost Control</CardTitle>
          <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">
            Data dari Loog Book
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="hidden sm:table-cell">Tanggal Pick Up</TableHead>
                  <TableHead className="text-right">QTY Pick Up</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Returned</TableHead>
                  <TableHead className="text-right">Harga (Rp)</TableHead>
                  <TableHead className="text-right">Total Biaya (Rp)</TableHead>
                  <TableHead className="w-16 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.no}>
                    <TableCell className="text-center">{r.no}</TableCell>
                    <TableCell className="font-medium">{r.itemName}</TableCell>
                    <TableCell className="hidden sm:table-cell">{r.pickUpDate === "-" ? "-" : r.pickUpDate}</TableCell>
                    <TableCell className="text-right">{r.qtyPickUp}</TableCell>
                    <TableCell className="text-right">{Math.max(0, r.pending - r.returned)}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">{r.returned}</TableCell>
                    <TableCell className="text-right">{formatRp(r.price)}</TableCell>
                    <TableCell className="text-right text-blue-600 font-semibold">{formatRp(r.totalCost)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r.def)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-gray-500">
                      Tidak ada data.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit price dialog */}
      {editItem && (
        <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
          <DialogContent className="w-[95vw] max-w-sm">
            <DialogHeader>
              <DialogTitle>Edit Harga</DialogTitle>
              <DialogDescription>Perbarui harga per item untuk: {editItem.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="price">Harga (Rp)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={editPrice}
                onChange={(e) => setEditPrice(Number(e.target.value))}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditItem(null)}>
                Batal
              </Button>
              <Button onClick={saveEdit}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

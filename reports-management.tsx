"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Filter, CalendarDays } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Papa from "papaparse"

import type { Item, Supplier, Transaction, Category } from "@/app/actions" // Import types

export function ReportsManagement({
  user,
  items,
  suppliers,
  transactions,
  categories,
}: { user: any; items: Item[]; transactions: Transaction[]; suppliers: Supplier[]; categories: Category[] }) {
  const [reportType, setReportType] = useState("items")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const { toast } = useToast()

  const totals = {
    items: items.length,
    suppliers: suppliers.length,
    categories: categories.length,
    in: transactions.filter((t) => t.type === "in").length,
    out: transactions.filter((t) => t.type === "out").length,
    borrow: transactions.filter((t) => t.type === "borrow").length,
    return: transactions.filter((t) => t.type === "return").length,
  }

  const lowStock = items.filter((i) => i.currentStock <= i.minStock)

  // -----------------------------------------------------------------
  // Ensure we always work with arrays – avoids undefined .find/.map
  // -----------------------------------------------------------------
  const safeItems = items ?? []
  const safeSuppliers = suppliers ?? []
  const safeTransactions = transactions ?? []
  const safeCategories = categories ?? []

  const filterDataByDate = (rows: any[], dateField: string) => {
    return (rows ?? []).filter((row) => {
      const rowDate = new Date(row[dateField])
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null

      if (start && rowDate < start) return false
      if (end && rowDate > end) return false
      return true
    })
  }

  const generateReportData = () => {
    let data: any[] = []
    let headers: string[] = []
    let filename = "report.csv"

    switch (reportType) {
      case "items":
        data = filterDataByDate(safeItems, "createdAt")
        headers = [
          "id",
          "code",
          "name",
          "category",
          "currentStock",
          "minStock",
          "location",
          "price",
          "status",
          "createdAt",
        ]
        filename = "laporan_barang.csv"
        break
      case "transactions":
        data = filterDataByDate(safeTransactions, "date").map((t) => {
          const item = safeItems.find((i) => i.id === t.itemId)
          const supplier = safeSuppliers.find((s) => s.id === t.supplierId)
          return {
            ...t,
            itemName: item?.name,
            itemCode: item?.code,
            supplierName: supplier?.name,
          }
        })
        headers = [
          "id",
          "type",
          "itemName",
          "itemCode",
          "quantity",
          "supplierName",
          "notes",
          "status",
          "date",
          "dueDate",
          "returnDate",
        ]
        filename = "laporan_transaksi.csv"
        break
      case "suppliers":
        data = filterDataByDate(safeSuppliers, "createdAt")
        headers = ["id", "code", "name", "contact", "phone", "email", "address", "status", "createdAt"]
        filename = "laporan_supplier.csv"
        break
      case "categories":
        data = safeCategories
        headers = ["id", "name", "description"]
        filename = "laporan_kategori.csv"
        break
      default:
        break
    }
    return { data, headers, filename }
  }

  const handleExport = () => {
    const { data, headers, filename } = generateReportData()
    if (data.length === 0) {
      toast({
        title: "Export Gagal",
        description: "Tidak ada data untuk diekspor dengan filter yang dipilih.",
        variant: "destructive",
      })
      return
    }
    // Helper function to download CSV (from app/page.tsx)
    const downloadCsvLocal = (data: any[], filename: string, headers: string[]) => {
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
    downloadCsvLocal(data, filename, headers)
  }

  const { data: previewData, headers: previewHeaders } = generateReportData()

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Items</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totals.items}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totals.suppliers}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Categories</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totals.categories}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Low Stock</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{lowStock.length}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-md bg-green-50">
              <div className="text-sm text-green-700">Barang Masuk</div>
              <div className="text-2xl font-bold text-green-800">{totals.in}</div>
            </div>
            <div className="p-3 rounded-md bg-red-50">
              <div className="text-sm text-red-700">Barang Keluar</div>
              <div className="text-2xl font-bold text-red-800">{totals.out}</div>
            </div>
            <div className="p-3 rounded-md bg-blue-50">
              <div className="text-sm text-blue-700">Peminjaman</div>
              <div className="text-2xl font-bold text-blue-800">{totals.borrow}</div>
            </div>
            <div className="p-3 rounded-md bg-purple-50">
              <div className="text-sm text-purple-700">Pengembalian</div>
              <div className="text-2xl font-bold text-purple-800">{totals.return}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold">Laporan</h2>
          <p className="text-sm sm:text-base text-gray-600">Buat dan ekspor laporan inventaris</p>
        </div>
        <Button onClick={handleExport} size="sm" className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export Laporan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reportType">Jenis Laporan</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="reportType">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Pilih jenis laporan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="items">Data Barang</SelectItem>
                <SelectItem value="transactions">Transaksi (Masuk/Keluar/Peminjaman)</SelectItem>
                <SelectItem value="suppliers">Data Supplier</SelectItem>
                <SelectItem value="categories">Data Kategori</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Tanggal Mulai</Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Tanggal Akhir</Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pratinjau Laporan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {previewData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewHeaders.map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 10).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {previewHeaders.map((header, colIndex) => (
                        <TableCell key={colIndex} className="text-sm">
                          {String(row[header])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-600 py-8">Tidak ada data untuk pratinjau laporan ini.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

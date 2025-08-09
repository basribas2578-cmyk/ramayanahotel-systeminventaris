"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Edit, Filter, FileText, FileSpreadsheet, FileDown, Calculator, TrendingUp } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

// Import external libraries for export
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

// Define a type for an invoice entry
export interface InvoiceEntry {
  invoiceNo: string
  pickupDate: string
  returnDate: string | null
  totalPrice: number
  totalCost: number
  profit: number
  logEntryIds: number[]
  itemDetails: Array<{
    itemName: string
    quantity: number
    price: number
    cost: number
  }>
}

export function InvoiceManagement({ user, logEntries, items }: { user: any; logEntries: any[]; items: any[] }) {
  const [invoices, setInvoices] = useState<InvoiceEntry[]>([])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceEntry | null>(null)
  const [editReturnDate, setEditReturnDate] = useState<string>("")
  const [editInvoiceNo, setEditInvoiceNo] = useState<string>("")
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("")
  const { toast } = useToast()

  const [hasAccess, setHasAccess] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")

  const tableRef = useRef<HTMLTableElement>(null)

  // Item pricing and cost data
  const getItemData = (itemId: number) => {
    const itemPrices = {
      1: { price: 3500, cost: 2600 }, // Bath Towel Baru
      2: { price: 3500, cost: 2600 }, // Bath Towel Lama
      3: { price: 3200, cost: 2400 }, // Bath Mat
      4: { price: 4400, cost: 3300 }, // Bed Sheet Single
      5: { price: 4800, cost: 3600 }, // Bed Sheet Double
      6: { price: 6100, cost: 4600 }, // Duvet Cover Single
      7: { price: 7500, cost: 5600 }, // Duvet Cover Double
      8: { price: 1900, cost: 1400 }, // Pillow Case Baru
      9: { price: 1900, cost: 1400 }, // Pillow Case Lama
      10: { price: 1900, cost: 1400 }, // Pillow Case (MIX)
      11: { price: 20000, cost: 15000 }, // Inner Duvet Single
      12: { price: 33000, cost: 25000 }, // Inner Duvet Double
      13: { price: 0, cost: 0 }, // Skarting Duvet Single
      14: { price: 0, cost: 0 }, // Skarting Duvet Double
      15: { price: 1600, cost: 1200 }, // Napkin
      16: { price: 3300, cost: 2500 }, // Cover Chair
      17: { price: 8000, cost: 6000 }, // Table Cloth
      18: { price: 0, cost: 0 }, // Bath Robe
    }
    return itemPrices[itemId as keyof typeof itemPrices] || { price: 0, cost: 0 }
  }

  const getItemName = (itemId: number) => {
    const itemNames = {
      1: "Bath Towel Baru",
      2: "Bath Towel Lama",
      3: "Bath Mat",
      4: "Bed Sheet Single",
      5: "Bed Sheet Double",
      6: "Duvet Cover Single",
      7: "Duvet Cover Double",
      8: "Pillow Case Baru",
      9: "Pillow Case Lama",
      10: "Pillow Case (MIX)",
      11: "Inner Duvet Single",
      12: "Inner Duvet Double",
      13: "Skarting Duvet Single",
      14: "Skarting Duvet Double",
      15: "Napkin",
      16: "Cover Chair",
      17: "Table Cloth",
      18: "Bath Robe",
    }
    return itemNames[itemId as keyof typeof itemNames] || "Unknown Item"
  }

  useEffect(() => {
    if (user.role !== "admin" && user.role !== "manager") {
      setHasAccess(false)
    }
  }, [user])

  useEffect(() => {
    if (!hasAccess) return

    // Group log entries by pickup date and calculate total price and cost
    const groupedInvoices: {
      [key: string]: {
        totalPrice: number
        totalCost: number
        logIds: number[]
        itemDetails: Array<{
          itemName: string
          quantity: number
          price: number
          cost: number
        }>
      }
    } = {}

    logEntries.forEach((entry) => {
      if (entry.outQuantity > 0) {
        const itemData = getItemData(entry.itemId)
        const itemName = getItemName(entry.itemId)
        const itemTotalPrice = itemData.price * entry.outQuantity
        const itemTotalCost = itemData.cost * entry.outQuantity

        if (!groupedInvoices[entry.date]) {
          groupedInvoices[entry.date] = {
            totalPrice: 0,
            totalCost: 0,
            logIds: [],
            itemDetails: [],
          }
        }

        groupedInvoices[entry.date].totalPrice += itemTotalPrice
        groupedInvoices[entry.date].totalCost += itemTotalCost
        groupedInvoices[entry.date].logIds.push(entry.id)
        groupedInvoices[entry.date].itemDetails.push({
          itemName: itemName,
          quantity: entry.outQuantity,
          price: itemData.price,
          cost: itemData.cost,
        })
      }
    })

    const generatedInvoices: InvoiceEntry[] = Object.keys(groupedInvoices)
      .sort()
      .map((date, index) => {
        const invoiceNo = `INV-${date.replace(/-/g, "")}-${(index + 1).toString().padStart(3, "0")}`
        const totalPrice = groupedInvoices[date].totalPrice
        const totalCost = groupedInvoices[date].totalCost
        const profit = totalPrice - totalCost

        return {
          invoiceNo: invoiceNo,
          pickupDate: date,
          returnDate: null,
          totalPrice: totalPrice,
          totalCost: totalCost,
          profit: profit,
          logEntryIds: groupedInvoices[date].logIds,
          itemDetails: groupedInvoices[date].itemDetails,
        }
      })

    setInvoices(generatedInvoices)
    setLastUpdateTime(new Date().toLocaleString("id-ID"))
  }, [logEntries, items, hasAccess])

  const handleEditInvoice = (invoice: InvoiceEntry) => {
    setSelectedInvoice(invoice)
    setEditReturnDate(invoice.returnDate || "")
    setEditInvoiceNo(invoice.invoiceNo)
    setIsEditDialogOpen(true)
  }

  const handleUpdateInvoice = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedInvoice) {
      setInvoices((prevInvoices) =>
        prevInvoices.map((inv) =>
          inv.invoiceNo === selectedInvoice.invoiceNo
            ? { ...inv, returnDate: editReturnDate, invoiceNo: editInvoiceNo }
            : inv,
        ),
      )
      setIsEditDialogOpen(false)
      setSelectedInvoice(null)
      setEditReturnDate("")
      setEditInvoiceNo("")
      toast({
        title: "Invoice Diperbarui",
        description: "Detail invoice berhasil diperbarui.",
      })
    }
  }

  // Generate year options dynamically
  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => {
    const years = ["all"]
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i.toString())
    }
    return years
  }, [currentYear])

  // Filter invoices based on selected month and year
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.pickupDate)
      const invoiceMonth = (invoiceDate.getMonth() + 1).toString()
      const invoiceYear = invoiceDate.getFullYear().toString()

      const matchesMonth = selectedMonth === "all" || invoiceMonth === selectedMonth
      const matchesYear = selectedYear === "all" || invoiceYear === selectedYear

      return matchesMonth && matchesYear
    })
  }, [invoices, selectedMonth, selectedYear])

  // Calculate summary statistics
  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.totalPrice, 0)
  const totalCosts = filteredInvoices.reduce((sum, inv) => sum + inv.totalCost, 0)
  const totalProfit = filteredInvoices.reduce((sum, inv) => sum + inv.profit, 0)
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const handleExportCsv = () => {
    if (filteredInvoices.length === 0) {
      toast({
        title: "Tidak ada data untuk diekspor",
        description: "Filter Anda tidak menghasilkan invoice apa pun.",
        variant: "destructive",
      })
      return
    }
    const headers = ["NO. INVOICE", "PICK UP DATE", "RETURN DATE", "TOTAL PRICE", "TOTAL COST", "PROFIT"]
    const csvContent = [
      headers.join(","),
      ...filteredInvoices.map(
        (inv) =>
          `${inv.invoiceNo},${inv.pickupDate},${inv.returnDate || "-"},${inv.totalPrice},${inv.totalCost},${inv.profit}`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", "invoices.csv")
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast({ title: "Ekspor CSV Berhasil", description: "Data invoice telah diekspor ke CSV." })
    }
  }

  const handleExportXlsx = () => {
    if (filteredInvoices.length === 0) {
      toast({
        title: "Tidak ada data untuk diekspor",
        description: "Filter Anda tidak menghasilkan invoice apa pun.",
        variant: "destructive",
      })
      return
    }
    const data = filteredInvoices.map((inv) => ({
      "NO. INVOICE": inv.invoiceNo,
      "PICK UP DATE": inv.pickupDate,
      "RETURN DATE": inv.returnDate || "-",
      "TOTAL PRICE": inv.totalPrice,
      "TOTAL COST": inv.totalCost,
      PROFIT: inv.profit,
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Invoices")
    XLSX.writeFile(wb, "invoices.xlsx")
    toast({ title: "Ekspor XLSX Berhasil", description: "Data invoice telah diekspor ke XLSX." })
  }

  const handleExportPdf = async () => {
    if (filteredInvoices.length === 0) {
      toast({
        title: "Tidak ada data untuk diekspor",
        description: "Filter Anda tidak menghasilkan invoice apa pun.",
        variant: "destructive",
      })
      return
    }
    if (tableRef.current) {
      try {
        const canvas = await html2canvas(tableRef.current)
        const imgData = canvas.toDataURL("image/png")
        const pdf = new jsPDF("p", "mm", "a4")
        const imgWidth = 210
        const pageHeight = 297
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight
        let position = 0

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }
        pdf.save("invoices.pdf")
        toast({ title: "Ekspor PDF Berhasil", description: "Data invoice telah diekspor ke PDF." })
      } catch (error) {
        console.error("Error generating PDF:", error)
        toast({
          title: "Ekspor PDF Gagal",
          description: "Terjadi kesalahan saat membuat file PDF.",
          variant: "destructive",
        })
      }
    } else {
      toast({ title: "Ekspor PDF Gagal", description: "Tabel tidak ditemukan untuk diekspor.", variant: "destructive" })
    }
  }

  if (!hasAccess) {
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
      {/* Header with Integration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Kelola invoice (stub).</p>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">Rp {totalRevenue.toLocaleString("id-ID")}</div>
            <p className="text-xs text-green-600">Pendapatan kotor</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Total Cost</CardTitle>
            <Calculator className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">Rp {totalCosts.toLocaleString("id-ID")}</div>
            <p className="text-xs text-red-600">Biaya operasional</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">Rp {totalProfit.toLocaleString("id-ID")}</div>
            <p className="text-xs text-blue-600">Keuntungan bersih</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Profit Margin</CardTitle>
            <Calculator className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-yellow-600">Margin keuntungan</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter Bulan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Bulan</SelectItem>
            <SelectItem value="1">Januari</SelectItem>
            <SelectItem value="2">Februari</SelectItem>
            <SelectItem value="3">Maret</SelectItem>
            <SelectItem value="4">April</SelectItem>
            <SelectItem value="5">Mei</SelectItem>
            <SelectItem value="6">Juni</SelectItem>
            <SelectItem value="7">Juli</SelectItem>
            <SelectItem value="8">Agustus</SelectItem>
            <SelectItem value="9">September</SelectItem>
            <SelectItem value="10">Oktober</SelectItem>
            <SelectItem value="11">November</SelectItem>
            <SelectItem value="12">Desember</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter Tahun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahun</SelectItem>
            {yearOptions.slice(1).map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={handleExportCsv} className="w-full sm:w-auto">
          <FileText className="h-4 w-4 mr-2" /> Export CSV
        </Button>
        <Button onClick={handleExportXlsx} className="w-full sm:w-auto">
          <FileSpreadsheet className="h-4 w-4 mr-2" /> Export XLSX
        </Button>
        <Button onClick={handleExportPdf} className="w-full sm:w-auto">
          <FileDown className="h-4 w-4 mr-2" /> Export PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Daftar Invoice</span>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Data dari Loog Book + Cost Control
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table ref={tableRef}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">NO. INVOICE</TableHead>
                  <TableHead className="w-[150px]">PICK UP DATE</TableHead>
                  <TableHead className="w-[150px]">RETURN DATE</TableHead>
                  <TableHead className="text-right">REVENUE</TableHead>
                  <TableHead className="text-right">COST</TableHead>
                  <TableHead className="text-right">PROFIT</TableHead>
                  <TableHead className="w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-4">
                      Tidak ada data invoice yang sesuai dengan filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.invoiceNo}>
                      <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                      <TableCell>{invoice.pickupDate}</TableCell>
                      <TableCell>{invoice.returnDate || "-"}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        Rp {invoice.totalPrice.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        Rp {invoice.totalCost.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        Rp {invoice.profit.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEditInvoice(invoice)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Invoice Dialog */}
      {selectedInvoice && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Invoice</DialogTitle>
              <DialogDescription>Perbarui detail untuk Invoice: {selectedInvoice.invoiceNo}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateInvoice} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNo">No. Invoice</Label>
                <Input
                  id="invoiceNo"
                  type="text"
                  value={editInvoiceNo}
                  onChange={(e) => setEditInvoiceNo(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnDate">Tanggal Kembali</Label>
                <Input
                  id="returnDate"
                  type="date"
                  value={editReturnDate}
                  onChange={(e) => setEditReturnDate(e.target.value)}
                  required
                />
              </div>

              {/* Invoice Details Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm">Detail Invoice:</h4>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <span className="font-medium text-green-600">
                      Rp {selectedInvoice.totalPrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost:</span>
                    <span className="font-medium text-red-600">
                      Rp {selectedInvoice.totalCost.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span>Profit:</span>
                    <span className="font-bold text-blue-600">Rp {selectedInvoice.profit.toLocaleString("id-ID")}</span>
                  </div>
                </div>
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

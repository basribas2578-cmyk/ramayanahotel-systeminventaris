"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Edit, Plus, Trash2, CheckCircle, Clock, Package } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function LoogBookManagement({
  user,
  items,
  transactions,
  logEntries,
  setLogEntries,
}: {
  user: any
  items: any[]
  transactions: any[]
  logEntries: any[]
  setLogEntries: (v: any) => void
}) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedLogEntry, setSelectedLogEntry] = useState<any | null>(null)

  const [isRecordReturnDialogOpen, setIsRecordReturnDialogOpen] = useState(false)
  const [selectedLogEntryForReturn, setSelectedLogEntryForReturn] = useState<any | null>(null)
  const [returnQuantityInput, setReturnQuantityInput] = useState<number>(0)
  const [returnImageFile, setReturnImageFile] = useState<File | null>(null)
  const [previewReturnImageUrl, setPreviewReturnImageUrl] = useState<string | null>(null)

  const { toast } = useToast()

  if (user.role !== "admin" && user.role !== "manager") {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
        <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  // Function to get item name from itemId
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

  // Get item price for cost calculation
  const getItemPrice = (itemId: number) => {
    const itemPrices = {
      1: 2600, // Bath Towel Baru
      2: 2600, // Bath Towel Lama
      3: 2400, // Bath Mat
      4: 3300, // Bed Sheet Single
      5: 3600, // Bed Sheet Double
      6: 4600, // Duvet Cover Single
      7: 5600, // Duvet Cover Double
      8: 1400, // Pillow Case Baru
      9: 1400, // Pillow Case Lama
      10: 1400, // Pillow Case (MIX)
      11: 15000, // Inner Duvet Single
      12: 25000, // Inner Duvet Double
      13: 0, // Skarting Duvet Single
      14: 0, // Skarting Duvet Double
      15: 1200, // Napkin
      16: 2500, // Cover Chair
      17: 6000, // Table Cloth
      18: 0, // Bath Robe
    }
    return itemPrices[itemId as keyof typeof itemPrices] || 0
  }

  const handleAddLogEntry = (formData: FormData) => {
    const newEntry: any = {
      id: logEntries.length > 0 ? Math.max(...logEntries.map((e: any) => e.id)) + 1 : 1,
      date: formData.get("date") as string,
      itemId: Number(formData.get("itemId")),
      outQuantity: Number(formData.get("outQuantity")),
      inQuantity: Number(formData.get("inQuantity")),
      pendingQuantity: Number(formData.get("pendingQuantity")),
      returnedQuantity: 0,
    }
    setLogEntries((prev: any) => [...prev, newEntry])
    setIsAddDialogOpen(false)
    toast({
      title: "Catatan Log Ditambahkan",
      description: "Data berhasil ditambahkan dan akan mempengaruhi Cost Control & Invoice secara real-time.",
    })
  }

  const handleEditLogEntry = (entry: any) => {
    setSelectedLogEntry(entry)
    setIsEditDialogOpen(true)
  }

  const handleUpdateLogEntry = (formData: FormData) => {
    if (!selectedLogEntry) return

    const updatedEntry: any = {
      ...selectedLogEntry,
      date: formData.get("date") as string,
      itemId: Number(formData.get("itemId")),
      outQuantity: Number(formData.get("outQuantity")),
      inQuantity: Number(formData.get("inQuantity")),
      pendingQuantity: Number(formData.get("pendingQuantity")),
    }

    setLogEntries((prev: any) => prev.map((entry: any) => (entry.id === updatedEntry.id ? updatedEntry : entry)))
    setIsEditDialogOpen(false)
    setSelectedLogEntry(null)
    toast({
      title: "Catatan Log Diperbarui",
      description: "Perubahan akan otomatis mempengaruhi Cost Control & Invoice.",
    })
  }

  const handleDeleteLogEntry = (id: number) => {
    setLogEntries((prev: any) => prev.filter((entry: any) => entry.id !== id))
    toast({
      title: "Catatan Log Dihapus",
      description: "Data dihapus dan Cost Control & Invoice akan terupdate otomatis.",
      variant: "destructive",
    })
  }

  const handleRecordReturnClick = (entry: any) => {
    setSelectedLogEntryForReturn(entry)
    setReturnQuantityInput(entry.pendingQuantity - entry.returnedQuantity)
    setReturnImageFile(null)
    setPreviewReturnImageUrl(null)
    setIsRecordReturnDialogOpen(true)
  }

  const handleReturnImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReturnImageFile(file)
      setPreviewReturnImageUrl(URL.createObjectURL(file))
    } else {
      setReturnImageFile(null)
      setPreviewReturnImageUrl(null)
    }
  }

  const handleRecordReturn = (formData: FormData) => {
    if (!selectedLogEntryForReturn) return

    const quantityToReturn = Number(formData.get("returnedQuantity"))
    const imageFile = returnImageFile

    const remainingPending = selectedLogEntryForReturn.pendingQuantity - selectedLogEntryForReturn.returnedQuantity

    if (quantityToReturn <= 0 || quantityToReturn > remainingPending) {
      toast({
        title: "Input Tidak Valid",
        description: `Jumlah dikembalikan harus antara 1 dan ${remainingPending}.`,
        variant: "destructive",
      })
      return
    }

    const newReturnedQuantity = selectedLogEntryForReturn.returnedQuantity + quantityToReturn
    const isFullyReturned = newReturnedQuantity >= selectedLogEntryForReturn.pendingQuantity

    if (isFullyReturned && !imageFile) {
      toast({
        title: "Gambar Diperlukan",
        description: "Gambar diperlukan untuk menandai item sebagai sepenuhnya dikembalikan.",
        variant: "destructive",
      })
      return
    }

    const now = new Date()
    const returnedDateTime = now.toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

    const updatedEntry: any = {
      ...selectedLogEntryForReturn,
      returnedQuantity: newReturnedQuantity,
      returnedImageUrl: imageFile ? previewReturnImageUrl || undefined : selectedLogEntryForReturn.returnedImageUrl,
      returnedDate: returnedDateTime,
    }

    setLogEntries((prev: any) => prev.map((entry: any) => (entry.id === updatedEntry.id ? updatedEntry : entry)))
    setIsRecordReturnDialogOpen(false)
    setSelectedLogEntryForReturn(null)
    setReturnQuantityInput(0)
    setReturnImageFile(null)
    setPreviewReturnImageUrl(null)
    toast({
      title: "Pengembalian Dicatat",
      description: "Status pengembalian berhasil diperbarui dan akan mempengaruhi Cost Control & Invoice.",
    })
  }

  const getStatus = (entry: any) => {
    const remaining = entry.pendingQuantity - entry.returnedQuantity
    if (remaining <= 0) {
      return "completed"
    }
    return "pending"
  }

  // Calculate summary statistics
  const totalPickUp = logEntries.reduce((sum: number, entry: any) => sum + entry.outQuantity, 0)
  const totalReturn = logEntries.reduce((sum: number, entry: any) => sum + entry.inQuantity, 0)
  const totalPending = logEntries.reduce(
    (sum: number, entry: any) => sum + (entry.pendingQuantity - entry.returnedQuantity),
    0,
  )
  const totalCost = logEntries.reduce(
    (sum: number, entry: any) => sum + entry.outQuantity * getItemPrice(entry.itemId),
    0,
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Integration Info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold">Loog Book CM Coin Laundry</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Sumber data utama untuk Cost Control dan Invoice Management
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
            <div className="flex items-center">
              <Package className="h-5 w-5 text-blue-400 mr-2" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Data Terintegrasi</p>
                <p className="text-xs text-blue-600">
                  Perubahan di Loog Book akan otomatis mempengaruhi Cost Control dan Invoice secara real-time
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <Button size="sm" className="w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Catatan Log
            </Button>
            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Catatan Log Baru</DialogTitle>
                <DialogDescription>Masukkan detail catatan log harian.</DialogDescription>
              </DialogHeader>
              <form action={handleAddLogEntry} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemId">Item</Label>
                  <Select name="itemId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Bath Towel Baru</SelectItem>
                      <SelectItem value="2">Bath Towel Lama</SelectItem>
                      <SelectItem value="3">Bath Mat</SelectItem>
                      <SelectItem value="4">Bed Sheet Single</SelectItem>
                      <SelectItem value="5">Bed Sheet Double</SelectItem>
                      <SelectItem value="6">Duvet Cover Single</SelectItem>
                      <SelectItem value="7">Duvet Cover Double</SelectItem>
                      <SelectItem value="8">Pillow Case Baru</SelectItem>
                      <SelectItem value="9">Pillow Case Lama</SelectItem>
                      <SelectItem value="10">Pillow Case (MIX)</SelectItem>
                      <SelectItem value="11">Inner Duvet Single</SelectItem>
                      <SelectItem value="12">Inner Duvet Double</SelectItem>
                      <SelectItem value="13">Skarting Duvet Single</SelectItem>
                      <SelectItem value="14">Skarting Duvet Double</SelectItem>
                      <SelectItem value="15">Napkin</SelectItem>
                      <SelectItem value="16">Cover Chair</SelectItem>
                      <SelectItem value="17">Table Cloth</SelectItem>
                      <SelectItem value="18">Bath Robe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="outQuantity">PICK UP</Label>
                    <Input id="outQuantity" name="outQuantity" type="number" min="0" defaultValue={0} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inQuantity">RETURN</Label>
                    <Input id="inQuantity" name="inQuantity" type="number" min="0" defaultValue={0} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pendingQuantity">PENDING</Label>
                    <Input
                      id="pendingQuantity"
                      name="pendingQuantity"
                      type="number"
                      min="0"
                      defaultValue={0}
                      required
                    />
                  </div>
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

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-blue-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PICK UP</CardTitle>
            <Package className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalPickUp}</div>
            <p className="text-xs text-white/80">Item yang diambil</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RETURN</CardTitle>
            <CheckCircle className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalReturn}</div>
            <p className="text-xs text-white/80">Item yang dikembalikan</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PENDING</CardTitle>
            <Clock className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-white/80">Item yang tertunda</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Biaya</CardTitle>
            <Package className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">Rp {totalCost.toLocaleString("id-ID")}</div>
            <p className="text-xs text-white/80">Biaya operasional</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Catatan Log Harian</span>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Data Source untuk Cost Control & Invoice
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">DATE</TableHead>
                  <TableHead>ITEM</TableHead>
                  <TableHead className="text-right">PICK UP</TableHead>
                  <TableHead className="text-right">RETURN</TableHead>
                  <TableHead className="text-right">PENDING</TableHead>
                  <TableHead className="text-right">BIAYA</TableHead>
                  <TableHead className="w-[180px] text-center">STATUS PENGEMBALIAN</TableHead>
                  <TableHead className="w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logEntries.map((log: any) => {
                  const status = getStatus(log)
                  const remainingPending = log.pendingQuantity - log.returnedQuantity
                  const itemCost = log.outQuantity * getItemPrice(log.itemId)
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.date}</TableCell>
                      <TableCell>{getItemName(log.itemId)}</TableCell>
                      <TableCell className="text-right">{log.outQuantity}</TableCell>
                      <TableCell className="text-right">{log.inQuantity}</TableCell>
                      <TableCell className="text-right">{log.pendingQuantity}</TableCell>
                      <TableCell className="text-right font-medium text-purple-600">
                        Rp {itemCost.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-3 h-3 rounded-full",
                                status === "completed" ? "bg-green-500" : "bg-red-500",
                              )}
                            />
                            <span className="text-sm">
                              {log.returnedQuantity} / {log.pendingQuantity}
                            </span>
                          </div>
                          {log.returnedDate && (
                            <div className="text-xs text-gray-500 mt-1">Dikembalikan: {log.returnedDate}</div>
                          )}
                          {status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-auto py-1 px-2 bg-transparent"
                              onClick={() => handleRecordReturnClick(log)}
                            >
                              Record Return
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditLogEntry(log)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteLogEntry(log.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {logEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-4">
                      Tidak ada catatan log.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Log Entry Dialog */}
      {selectedLogEntry && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Catatan Log</DialogTitle>
              <DialogDescription>Perbarui detail catatan log harian.</DialogDescription>
            </DialogHeader>
            <form action={handleUpdateLogEntry} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editDate">Tanggal</Label>
                <Input id="editDate" name="date" type="date" required defaultValue={selectedLogEntry.date} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editItemId">Item</Label>
                <Select name="itemId" required defaultValue={selectedLogEntry.itemId.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih item" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Bath Towel Baru</SelectItem>
                    <SelectItem value="2">Bath Towel Lama</SelectItem>
                    <SelectItem value="3">Bath Mat</SelectItem>
                    <SelectItem value="4">Bed Sheet Single</SelectItem>
                    <SelectItem value="5">Bed Sheet Double</SelectItem>
                    <SelectItem value="6">Duvet Cover Single</SelectItem>
                    <SelectItem value="7">Duvet Cover Double</SelectItem>
                    <SelectItem value="8">Pillow Case Baru</SelectItem>
                    <SelectItem value="9">Pillow Case Lama</SelectItem>
                    <SelectItem value="10">Pillow Case (MIX)</SelectItem>
                    <SelectItem value="11">Inner Duvet Single</SelectItem>
                    <SelectItem value="12">Inner Duvet Double</SelectItem>
                    <SelectItem value="13">Skarting Duvet Single</SelectItem>
                    <SelectItem value="14">Skarting Duvet Double</SelectItem>
                    <SelectItem value="15">Napkin</SelectItem>
                    <SelectItem value="16">Cover Chair</SelectItem>
                    <SelectItem value="17">Table Cloth</SelectItem>
                    <SelectItem value="18">Bath Robe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editOutQuantity">PICK UP</Label>
                  <Input
                    id="editOutQuantity"
                    name="outQuantity"
                    type="number"
                    min="0"
                    required
                    defaultValue={selectedLogEntry.outQuantity}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editInQuantity">RETURN</Label>
                  <Input
                    id="editInQuantity"
                    name="inQuantity"
                    type="number"
                    min="0"
                    required
                    defaultValue={selectedLogEntry.inQuantity}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPendingQuantity">PENDING</Label>
                  <Input
                    id="editPendingQuantity"
                    name="pendingQuantity"
                    type="number"
                    min="0"
                    required
                    defaultValue={selectedLogEntry.pendingQuantity}
                  />
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

      {/* Record Return Dialog */}
      {selectedLogEntryForReturn && (
        <Dialog open={isRecordReturnDialogOpen} onOpenChange={setIsRecordReturnDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Catat Pengembalian Barang</DialogTitle>
              <DialogDescription>
                Rekam jumlah barang yang dikembalikan untuk item "{getItemName(selectedLogEntryForReturn.itemId)}".
              </DialogDescription>
            </DialogHeader>
            <form action={handleRecordReturn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="returnedQuantity">Jumlah Dikembalikan</Label>
                <Input
                  id="returnedQuantity"
                  name="returnedQuantity"
                  type="number"
                  min="1"
                  max={selectedLogEntryForReturn.pendingQuantity - selectedLogEntryForReturn.returnedQuantity}
                  value={returnQuantityInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReturnQuantityInput(Number(e.target.value))}
                  required
                />
                <p className="text-sm text-gray-500">
                  Sisa pending: {selectedLogEntryForReturn.pendingQuantity - selectedLogEntryForReturn.returnedQuantity}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnImage">Upload Gambar</Label>
                <Input id="returnImage" type="file" accept="image/*" onChange={handleReturnImageChange} />
                {previewReturnImageUrl && (
                  <img
                    src={previewReturnImageUrl || "/placeholder.svg"}
                    alt="Return Preview"
                    className="mt-2 h-20 w-20 object-cover rounded-md"
                  />
                )}
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRecordReturnDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Batal
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  Simpan Pengembalian
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Log Book Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Log Book</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Jumlah entri: {logEntries?.length ?? 0}</p>
        </CardContent>
      </Card>
    </div>
  )
}

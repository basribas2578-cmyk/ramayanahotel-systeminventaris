"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, UserIcon, Package, Clock } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

interface GuestLaundryEntry {
  id: number
  guestName: string
  roomNumber: string
  phoneNumber: string
  pickupDate: string
  estimatedReturn: string
  actualReturn?: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  totalPrice: number
  status: "pending" | "in_progress" | "ready" | "completed"
  notes?: string
  createdAt: string
}

export function GuestLaundryManagement({ user }: { user: any }) {
  const [guestEntries, setGuestEntries] = useState([
    {
      id: 1,
      guestName: "John Doe",
      roomNumber: "101",
      phoneNumber: "081234567890",
      pickupDate: "2024-07-15",
      estimatedReturn: "2024-07-17",
      items: [
        { name: "Kemeja", quantity: 2, price: 15000 },
        { name: "Celana", quantity: 1, price: 12000 },
      ],
      totalPrice: 42000,
      status: "in_progress",
      notes: "Cuci kering saja",
      createdAt: "2024-07-15T10:00:00",
    },
    {
      id: 2,
      guestName: "Jane Smith",
      roomNumber: "205",
      phoneNumber: "081987654321",
      pickupDate: "2024-07-16",
      estimatedReturn: "2024-07-18",
      actualReturn: "2024-07-18",
      items: [
        { name: "Dress", quantity: 1, price: 25000 },
        { name: "Blouse", quantity: 2, price: 18000 },
      ],
      totalPrice: 61000,
      status: "completed",
      createdAt: "2024-07-16T14:30:00",
    },
  ])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [newItems, setNewItems] = useState([{ name: "", quantity: 1, price: 0 }])

  const { toast } = useToast()

  const handleAddEntry = (formData) => {
    const validItems = newItems.filter((item) => item.name.trim() !== "" && item.quantity > 0 && item.price > 0)

    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Minimal harus ada satu item yang valid.",
        variant: "destructive",
      })
      return
    }

    const totalPrice = validItems.reduce((sum, item) => sum + item.quantity * item.price, 0)

    const newEntry = {
      id: guestEntries.length > 0 ? Math.max(...guestEntries.map((e) => e.id)) + 1 : 1,
      guestName: formData.get("guestName"),
      roomNumber: formData.get("roomNumber"),
      phoneNumber: formData.get("phoneNumber"),
      pickupDate: formData.get("pickupDate"),
      estimatedReturn: formData.get("estimatedReturn"),
      items: validItems,
      totalPrice: totalPrice,
      status: "pending",
      notes: formData.get("notes") || undefined,
      createdAt: new Date().toISOString(),
    }

    setGuestEntries((prev) => [...prev, newEntry])
    setIsAddDialogOpen(false)
    setNewItems([{ name: "", quantity: 1, price: 0 }])
    toast({
      title: "Laundry Guest Ditambahkan",
      description: "Data laundry guest berhasil ditambahkan.",
    })
  }

  const handleEditEntry = (entry) => {
    setSelectedEntry(entry)
    setNewItems([...entry.items])
    setIsEditDialogOpen(true)
  }

  const handleUpdateEntry = (formData) => {
    if (!selectedEntry) return

    const validItems = newItems.filter((item) => item.name.trim() !== "" && item.quantity > 0 && item.price > 0)

    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Minimal harus ada satu item yang valid.",
        variant: "destructive",
      })
      return
    }

    const totalPrice = validItems.reduce((sum, item) => sum + item.quantity * item.price, 0)

    const updatedEntry = {
      ...selectedEntry,
      guestName: formData.get("guestName"),
      roomNumber: formData.get("roomNumber"),
      phoneNumber: formData.get("phoneNumber"),
      pickupDate: formData.get("pickupDate"),
      estimatedReturn: formData.get("estimatedReturn"),
      actualReturn: formData.get("actualReturn") || undefined,
      status: formData.get("status"),
      items: validItems,
      totalPrice: totalPrice,
      notes: formData.get("notes") || undefined,
    }

    setGuestEntries((prev) => prev.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)))
    setIsEditDialogOpen(false)
    setSelectedEntry(null)
    setNewItems([{ name: "", quantity: 1, price: 0 }])
    toast({
      title: "Laundry Guest Diperbarui",
      description: "Data laundry guest berhasil diperbarui.",
    })
  }

  const handleDeleteEntry = (id) => {
    setGuestEntries((prev) => prev.filter((entry) => entry.id !== id))
    toast({
      title: "Laundry Guest Dihapus",
      description: "Data laundry guest berhasil dihapus.",
      variant: "destructive",
    })
  }

  const addNewItem = () => {
    setNewItems((prev) => [...prev, { name: "", quantity: 1, price: 0 }])
  }

  const removeItem = (index) => {
    if (newItems.length > 1) {
      setNewItems((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index, field, value) => {
    setNewItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "secondary", label: "Pending", color: "bg-gray-100 text-gray-800" },
      in_progress: { variant: "default", label: "Dalam Proses", color: "bg-blue-100 text-blue-800" },
      ready: { variant: "default", label: "Siap Diambil", color: "bg-yellow-100 text-yellow-800" },
      completed: { variant: "default", label: "Selesai", color: "bg-green-100 text-green-800" },
    }

    const config = statusConfig[status]
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  // Calculate statistics
  const totalEntries = guestEntries.length
  const pendingEntries = guestEntries.filter((e) => e.status === "pending").length
  const inProgressEntries = guestEntries.filter((e) => e.status === "in_progress").length
  const readyEntries = guestEntries.filter((e) => e.status === "ready").length
  const completedEntries = guestEntries.filter((e) => e.status === "completed").length
  const totalRevenue = guestEntries.filter((e) => e.status === "completed").reduce((sum, e) => sum + e.totalPrice, 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold">Guest Laundry Management</h2>
          <p className="text-sm sm:text-base text-gray-600">Kelola layanan laundry untuk tamu hotel</p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 text-blue-400 mr-2" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Layanan Tamu Hotel</p>
                <p className="text-xs text-blue-600">
                  Sistem manajemen laundry khusus untuk tamu hotel dengan tracking lengkap
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <Button size="sm" className="w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Laundry Guest
            </Button>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Laundry Guest Baru</DialogTitle>
                <DialogDescription>Masukkan detail laundry untuk tamu hotel.</DialogDescription>
              </DialogHeader>
              <form action={handleAddEntry} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guestName">Nama Tamu</Label>
                    <Input id="guestName" name="guestName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roomNumber">No. Kamar</Label>
                    <Input id="roomNumber" name="roomNumber" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">No. Telepon</Label>
                    <Input id="phoneNumber" name="phoneNumber" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pickupDate">Tanggal Pickup</Label>
                    <Input
                      id="pickupDate"
                      name="pickupDate"
                      type="date"
                      required
                      defaultValue={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedReturn">Estimasi Selesai</Label>
                  <Input id="estimatedReturn" name="estimatedReturn" type="date" required />
                </div>

                {/* Items Section */}
                <div className="space-y-2">
                  <Label>Item Laundry</Label>
                  {newItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Input
                          placeholder="Nama item"
                          value={item.name}
                          onChange={(e) => updateItem(index, "name", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          placeholder="Harga"
                          min="0"
                          value={item.price}
                          onChange={(e) => updateItem(index, "price", Number.parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        {newItems.length > 1 && (
                          <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addNewItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Item
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea id="notes" name="notes" placeholder="Catatan khusus..." />
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

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6">
        <Card className="bg-blue-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalEntries}</div>
            <p className="text-xs text-white/80">Total laundry</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{pendingEntries}</div>
            <p className="text-xs text-white/80">Menunggu proses</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proses</CardTitle>
            <Package className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{inProgressEntries}</div>
            <p className="text-xs text-white/80">Dalam proses</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Siap</CardTitle>
            <Package className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{readyEntries}</div>
            <p className="text-xs text-white/80">Siap diambil</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <Package className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{completedEntries}</div>
            <p className="text-xs text-white/80">Telah selesai</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <Package className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold">Rp {totalRevenue.toLocaleString("id-ID")}</div>
            <p className="text-xs text-white/80">Total pendapatan</p>
          </CardContent>
        </Card>
      </div>

      {/* Guest Laundry Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Laundry Guest</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tamu</TableHead>
                  <TableHead>Kamar</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Estimasi Selesai</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guestEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-4">
                      Tidak ada data laundry guest.
                    </TableCell>
                  </TableRow>
                ) : (
                  guestEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.guestName}</p>
                          <p className="text-sm text-gray-500">{entry.phoneNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{entry.roomNumber}</TableCell>
                      <TableCell>{entry.pickupDate}</TableCell>
                      <TableCell>{entry.estimatedReturn}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {entry.items.map((item, idx) => (
                            <div key={idx} className="text-sm">
                              {item.name} ({item.quantity}x)
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Rp {entry.totalPrice.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditEntry(entry)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteEntry(entry.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {selectedEntry && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Laundry Guest</DialogTitle>
              <DialogDescription>Perbarui detail laundry guest.</DialogDescription>
            </DialogHeader>
            <form action={handleUpdateEntry} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editGuestName">Nama Tamu</Label>
                  <Input id="editGuestName" name="guestName" required defaultValue={selectedEntry.guestName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editRoomNumber">No. Kamar</Label>
                  <Input id="editRoomNumber" name="roomNumber" required defaultValue={selectedEntry.roomNumber} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editPhoneNumber">No. Telepon</Label>
                  <Input id="editPhoneNumber" name="phoneNumber" required defaultValue={selectedEntry.phoneNumber} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPickupDate">Tanggal Pickup</Label>
                  <Input
                    id="editPickupDate"
                    name="pickupDate"
                    type="date"
                    required
                    defaultValue={selectedEntry.pickupDate}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editEstimatedReturn">Estimasi Selesai</Label>
                  <Input
                    id="editEstimatedReturn"
                    name="estimatedReturn"
                    type="date"
                    required
                    defaultValue={selectedEntry.estimatedReturn}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editActualReturn">Tanggal Selesai Aktual</Label>
                  <Input
                    id="editActualReturn"
                    name="actualReturn"
                    type="date"
                    defaultValue={selectedEntry.actualReturn || ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select name="status" required defaultValue={selectedEntry.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">Dalam Proses</SelectItem>
                    <SelectItem value="ready">Siap Diambil</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Items Section */}
              <div className="space-y-2">
                <Label>Item Laundry</Label>
                {newItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Input
                        placeholder="Nama item"
                        value={item.name}
                        onChange={(e) => updateItem(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Harga"
                        min="0"
                        value={item.price}
                        onChange={(e) => updateItem(index, "price", Number.parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      {newItems.length > 1 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addNewItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Item
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editNotes">Catatan</Label>
                <Textarea
                  id="editNotes"
                  name="notes"
                  placeholder="Catatan khusus..."
                  defaultValue={selectedEntry.notes || ""}
                />
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

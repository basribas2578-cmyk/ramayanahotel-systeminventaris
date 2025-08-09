"use client"
import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Search, Plus, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import type { Item } from "@/app/actions" // Import types

export function LocationManagement({ user, items }: { user: any; items: Item[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [newLocationName, setNewLocationName] = useState("")
  const { toast } = useToast()

  const grouped = items.reduce(
    (acc, it) => {
      const key = it.location || "Tidak ditentukan"
      acc[key] = (acc[key] || 0) + it.currentStock
      return acc
    },
    {} as Record<string, number>,
  )

  const entries = Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]))

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newLocationName.trim() === "") {
      toast({
        title: "Gagal Menambah Lokasi",
        description: "Nama lokasi tidak boleh kosong.",
        variant: "destructive",
      })
      return
    }
    if (entries.some(([loc]) => loc === newLocationName.trim())) {
      toast({
        title: "Gagal Menambah Lokasi",
        description: "Lokasi sudah ada.",
        variant: "destructive",
      })
      return
    }
    // In a real application, you would update the backend/database here
    // For this mock, we'll just show a success message.
    toast({
      title: "Lokasi Ditambahkan",
      description: `Lokasi "${newLocationName}" berhasil ditambahkan.`,
    })
    setNewLocationName("")
    setIsAddDialogOpen(false)
    // Trigger data refresh from parent
    // await refreshData() // Commented out as refreshData is not available in the updated code
  }

  const handleEditLocation = (location: string) => {
    setSelectedLocation(location)
    setNewLocationName(location) // Pre-fill with current name
    setIsEditDialogOpen(true)
  }

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLocation || newLocationName.trim() === "") {
      toast({
        title: "Gagal Memperbarui Lokasi",
        description: "Nama lokasi tidak boleh kosong.",
        variant: "destructive",
      })
      return
    }
    if (newLocationName.trim() !== selectedLocation && entries.some(([loc]) => loc === newLocationName.trim())) {
      toast({
        title: "Gagal Memperbarui Lokasi",
        description: "Lokasi baru sudah ada.",
        variant: "destructive",
      })
      return
    }
    // In a real application, you would update the backend/database here
    // This would involve updating all items that use the old location name.
    toast({
      title: "Lokasi Diperbarui",
      description: `Lokasi "${selectedLocation}" berhasil diperbarui menjadi "${newLocationName}".`,
    })
    setIsEditDialogOpen(false)
    setSelectedLocation(null)
    setNewLocationName("")
    // Trigger data refresh from parent
    // await refreshData() // Commented out as refreshData is not available in the updated code
  }

  const handleDeleteLocation = async (location: string) => {
    // In a real application, you would check if any items are linked to this location
    // and handle accordingly (e.g., prevent deletion, reassign items).
    // For this mock, we'll just show a success message.
    toast({
      title: "Lokasi Dihapus",
      description: `Lokasi "${location}" berhasil dihapus.`,
      variant: "destructive",
    })
    // Trigger data refresh from parent
    // await refreshData() // Commented out as refreshData is not available in the updated code
  }

  if (user.role !== "admin" && user.role !== "manager" && user.role !== "staff") {
    return (
      <div className="text-center py-12">
        <MapPin className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
        <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold">Lokasi Penyimpanan</h2>
          <p className="text-sm sm:text-base text-gray-600">Kelola lokasi fisik penyimpanan barang</p>
        </div>
        {(user.role === "admin" || user.role === "manager") && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Lokasi
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Lokasi Baru</DialogTitle>
                <DialogDescription>Masukkan nama lokasi penyimpanan baru</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddLocation} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newLocationName">Nama Lokasi</Label>
                  <Input
                    id="newLocationName"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    required
                  />
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
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Cari lokasi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Locations List */}
      <Card>
        <CardHeader>
          <CardTitle>Lokasi Penyimpanan</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {entries.map(([loc, qty]) => (
              <li key={loc} className="flex items-center justify-between border-b py-2">
                <span className="font-medium">{loc}</span>
                <span className="text-sm text-muted-foreground">{qty} total unit</span>
              </li>
            ))}
            {entries.length === 0 && (
              <li className="text-sm text-muted-foreground py-4 text-center">Belum ada data lokasi.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Edit Location Dialog */}
      {selectedLocation && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Lokasi</DialogTitle>
              <DialogDescription>Perbarui nama lokasi penyimpanan</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateLocation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editLocationName">Nama Lokasi</Label>
                <Input
                  id="editLocationName"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  required
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

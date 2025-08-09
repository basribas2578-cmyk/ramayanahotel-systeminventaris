"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Plus, Trash2, Filter, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Category } from "@/app/actions"
import { createCategory, updateCategory, deleteCategory } from "@/app/actions"

export function CategoryManagement({
  user,
  categories,
  items,
  refreshData,
}: { user: any; categories: Category[]; items: any[]; refreshData: () => void }) {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all")
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [selected, setSelected] = useState<Category | null>(null)

  const filtered = useMemo(() => {
    return categories.filter((c) => {
      const s =
        c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
      const st = status === "all" || c.status === status
      return s && st
    })
  }, [categories, search, status])

  const handleAdd = async (formData: FormData) => {
    const r = await createCategory(formData)
    if (r.success) {
      toast({ title: "Kategori ditambahkan" })
      setOpenAdd(false)
      refreshData()
    } else {
      toast({ title: "Gagal", description: r.message, variant: "destructive" })
    }
  }

  const handleUpdate = async (formData: FormData) => {
    if (!selected) return
    formData.append("id", String(selected.id))
    const r = await updateCategory(formData)
    if (r.success) {
      toast({ title: "Kategori diperbarui" })
      setOpenEdit(false)
      setSelected(null)
      refreshData()
    } else {
      toast({ title: "Gagal", description: r.message, variant: "destructive" })
    }
  }

  const handleDelete = async (id: number) => {
    const r = await deleteCategory(id)
    if (r.success) {
      toast({ title: "Kategori dihapus" })
      refreshData()
    } else {
      toast({ title: "Gagal", description: r.message, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Kategori Barang</h2>
          <p className="text-sm text-muted-foreground">Kelola kategori untuk mengelompokkan barang.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari kategori..."
              className="pl-9 w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={(v: any) => setStatus(v)}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          {(user?.role === "admin" || user?.role === "manager") && (
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" /> Tambah Kategori
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Kategori</DialogTitle>
                  <DialogDescription>Masukkan data kategori baru.</DialogDescription>
                </DialogHeader>
                <form action={handleAdd} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Kode</Label>
                      <Input id="code" name="code" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama</Label>
                      <Input id="name" name="name" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Input id="description" name="description" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="active">
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Simpan</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kategori</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.code}</TableCell>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cat.description || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={cat.status === "active" ? "default" : "secondary"}>{cat.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelected(cat)
                            setOpenEdit(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {(user?.role === "admin" || user?.role === "manager") && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                      Belum ada kategori.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Kategori</DialogTitle>
              <DialogDescription>Perbarui data kategori.</DialogDescription>
            </DialogHeader>
            <form action={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCode">Kode</Label>
                  <Input id="editCode" name="code" defaultValue={selected.code} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editName">Nama</Label>
                  <Input id="editName" name="name" defaultValue={selected.name} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDesc">Deskripsi</Label>
                <Input id="editDesc" name="description" defaultValue={selected.description} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select name="status" defaultValue={selected.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit">Simpan Perubahan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

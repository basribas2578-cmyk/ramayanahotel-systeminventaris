"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import Papa from "papaparse"
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  Download,
  Edit,
  Eye,
  Filter,
  Home,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shirt,
  Tag,
  Trash2,
  Users,
  Wifi,
  WifiOff,
  ChevronDown,
  AlertTriangle,
  Upload,
} from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { useRealtimeData } from "@/hooks/use-realtime-data"
import { useDataSync } from "@/hooks/use-data-sync"
import { useOptimisticUpdates } from "@/hooks/use-optimistic-updates"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"

import { CategoryManagement } from "@/category-management"
import { LoogBookManagement } from "@/loog-book-management"
import { CostControlManagement } from "@/cost-control-management"
import { InvoiceManagement } from "@/invoice-management"
import { GuestLaundryManagement } from "@/guest-laundry-management"
import { ItemsInManagement } from "@/items-in-management"
import { ItemsOutManagement } from "@/items-out-management"
import { LocationManagement } from "@/location-management"
import { ReportsManagement } from "@/reports-management"

import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
  fetchSuppliers,
  fetchTransactions,
  fetchDepreciations,
  fetchCategories,
  type User,
  type Item,
  type Supplier,
  type Transaction,
  type Depreciation,
  type Category,
} from "@/app/actions"

// NOTE: The rest of this file matches the functional UI previously sent,
// but now it loads and saves data using the connected database via Server Actions.

function downloadCsv(data: any[], filename: string, headers: string[], toast: ReturnType<typeof useToast>["toast"]) {
  try {
    const csv = Papa.unparse(data, { header: true, columns: headers })
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = filename
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast({ title: "Export Berhasil", description: `Data berhasil diekspor ke ${filename}` })
  } catch (error: any) {
    toast({
      title: "Export Gagal",
      description: `Terjadi kesalahan saat mengekspor: ${error.message}`,
      variant: "destructive",
    })
  }
}

const getNavigationItems = (userRole: string) => {
  const allItems = [
    { title: "DASHBOARD", icon: Home, key: "dashboard", roles: ["admin", "manager", "staff"] },
    {
      title: "LAUNDRY",
      icon: Shirt,
      key: "laundry",
      roles: ["admin", "manager", "staff"],
      children: [
        {
          title: "CM Coin Laundry",
          key: "cm-coin-laundry",
          roles: ["admin", "manager"],
          children: [
            { title: "Loog Book", key: "loog-book", roles: ["admin", "manager"] },
            { title: "Cost Control", key: "cost-control", roles: ["admin", "manager"] },
            { title: "Invoice", key: "invoice", roles: ["admin", "manager"] },
            { title: "Guest Laundry", key: "guest-laundry", roles: ["admin", "manager", "staff"] },
          ],
        },
      ],
    },
    { title: "DATA BARANG", icon: Package, key: "items", roles: ["admin", "manager", "staff"] },
    { title: "KATEGORI BARANG", icon: Tag, key: "categories", roles: ["admin", "manager"] },
    { title: "BARANG MASUK", icon: ArrowDownLeft, key: "items-in", roles: ["admin", "manager"] },
    { title: "BARANG KELUAR", icon: ArrowUpRight, key: "items-out", roles: ["admin", "manager"] },
    { title: "LOKASI PENYIMPANAN", icon: MapPin, key: "locations", roles: ["admin", "manager", "staff"] },
    { title: "DATA PENGGUNA", icon: Users, key: "users", roles: ["admin"] },
    { title: "LAPORAN", icon: BarChart3, key: "reports", roles: ["admin", "manager"] },
    { title: "PENGATURAN", icon: Settings, key: "settings", roles: ["admin", "manager", "staff"] },
  ] as const

  const filterItemsByRole = (items: (typeof allItems)[number][], role: string): (typeof allItems)[number][] =>
    items.reduce((acc, item) => {
      if (item.roles.includes(role as any)) {
        const newItem: any = { ...item }
        if ((item as any).children) newItem.children = filterItemsByRole((item as any).children as any, role)
        acc.push(newItem)
      }
      return acc
    }, [] as any)

  return filterItemsByRole(allItems as any, userRole)
}

function LoginForm({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const availableUsers = await fetchUsers()
      const user = availableUsers.find((u) => u.username === username)
      if (user) {
        const ok =
          (user.username === "Bas" && password === "Husky321") ||
          (user.username === "Kiswanto" && password === "Kiswanto1973") ||
          (user.username === "hkcrew" && password === "Crew321")
        if (ok) onLogin(user)
        else {
          setError("Username atau password salah")
          toast({ title: "Login Gagal", description: "Username atau password salah.", variant: "destructive" })
        }
      } else {
        setError("Username atau password salah")
        toast({ title: "Login Gagal", description: "Username atau password salah.", variant: "destructive" })
      }
    } catch (err: any) {
      setError("Terjadi kesalahan saat login")
      toast({ title: "Login Gagal", description: `Terjadi kesalahan: ${err.message}`, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#25282A] to-[#25282A] p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="w-80 h-20 bg-white rounded-lg flex items-center justify-center mx-auto overflow-hidden p-4 shadow-sm">
            <img
              src="/images/ramayana-hotel-logo.png"
              alt="Ramayana Hotel Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl sm:text-2xl font-bold">Inventaris HK</CardTitle>
            <p className="text-sm sm:text-base text-gray-600">Hotel Management System</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                disabled={isLoading}
              />
            </div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {"Masuk..."}
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// The rest of the UI (Dashboard, UsersManagement, ItemsManagement, SettingsManagement, main component)
// is identical to the previously provided page, except that it now relies on the real Server Actions.
// Dashboard
function Dashboard({
  user,
  items,
  users,
  suppliers,
  transactions,
  setCurrentPage,
  isOnline,
  isLoading,
}: {
  user: User
  items: Item[]
  users: User[]
  suppliers: Supplier[]
  transactions: Transaction[]
  setCurrentPage: (page: string) => void
  isOnline: boolean
  isLoading: boolean
}) {
  const dashboardStats = [
    {
      title: "Model Barang",
      value: items.length.toString(),
      color: "bg-gradient-to-br from-green-500 to-green-600",
      icon: Package,
      link: "items",
    },
    {
      title: "Pengguna",
      value: users.length.toString(),
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      icon: Users,
      link: "users",
    },
  ]

  const transactionStats = [
    {
      title: "Total Barang Masuk",
      value: transactions
        .filter((t) => t.type === "in")
        .reduce((s, t) => s + t.quantity, 0)
        .toString(),
      color: "bg-gradient-to-br from-blue-600 to-blue-700",
      link: "items-in",
    },
    {
      title: "Total Barang Keluar",
      value: transactions
        .filter((t) => t.type === "out")
        .reduce((s, t) => s + t.quantity, 0)
        .toString(),
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      link: "items-out",
    },
    {
      title: "Total Transaksi Barang Masuk",
      value: transactions.filter((t) => t.type === "in").length.toString(),
      color: "bg-gradient-to-br from-orange-600 to-orange-700",
      link: "items-in",
    },
    {
      title: "Total Transaksi Barang Keluar",
      value: transactions.filter((t) => t.type === "out").length.toString(),
      color: "bg-gradient-to-br from-blue-700 to-blue-800",
      link: "items-out",
    },
  ]

  const lowStockItems = items.filter((item) => item.currentStock <= item.minStock).slice(0, 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Memuat data dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {!isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <WifiOff className="h-5 w-5 text-yellow-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Mode Offline</p>
              <p className="text-sm text-yellow-700">
                Anda sedang offline. Data akan disinkronkan ketika koneksi kembali tersedia.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#F0D58D] text-white p-4 sm:p-6 rounded-lg shadow-md">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Selamat Datang, {user.name}!</h2>
        <p className="text-sm sm:text-base opacity-90">
          Role: {user.role.toUpperCase()} | Last Login: {user.lastLogin}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {dashboardStats.map((stat, idx) => (
          <Card
            key={idx}
            className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            onClick={() => setCurrentPage(stat.link)}
          >
            <CardContent className="p-0">
              <div className={`${stat.color} p-4 sm:p-6 text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full -mr-8 sm:-mr-10 -mt-8 sm:-mt-10" />
                <div className="relative z-10">
                  <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" />
                  <div className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">{stat.value}</div>
                  <div className="text-xs sm:text-sm opacity-90">{stat.title}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {transactionStats.map((stat, idx) => (
          <Card
            key={idx}
            className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            onClick={() => setCurrentPage(stat.link)}
          >
            <CardContent className="p-0">
              <div className={`${stat.color} p-4 sm:p-6 text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full -mr-6 sm:-mr-8 -mt-6 sm:-mt-8" />
                <div className="relative z-10">
                  <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{stat.value}</div>
                  <div className="text-xs sm:text-sm opacity-90">{stat.title}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
          <CardTitle className="text-lg sm:text-xl font-bold">Barang Stok Rendah</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setCurrentPage("items")} className="self-start sm:self-auto">
            Lihat Semua <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {lowStockItems.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 space-y-2 sm:space-y-0"
                >
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-red-800 truncate">{item.name}</p>
                      <p className="text-sm text-red-600">
                        Stok: {item.currentStock} {item.unit} (Min: {item.minStock})
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="self-start sm:self-auto">
                    Stok Rendah
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">Tidak ada barang dengan stok rendah.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
          <CardTitle className="text-lg sm:text-xl font-bold">Aktivitas Transaksi Terbaru</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage("borrowing")}
            className="self-start sm:self-auto"
          >
            Lihat Semua <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => {
                const item = items.find((i) => i.id === transaction.itemId)
                const transactionTypeLabel =
                  transaction.type === "in"
                    ? "Barang Masuk"
                    : transaction.type === "out"
                      ? "Barang Keluar"
                      : transaction.type === "borrow"
                        ? "Peminjaman"
                        : "Pengembalian"
                const statusVariant =
                  transaction.status === "completed"
                    ? "default"
                    : transaction.status === "pending"
                      ? "secondary"
                      : "destructive"
                return (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2 sm:space-y-0"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div
                        className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                          transaction.type === "in"
                            ? "bg-green-500"
                            : transaction.type === "out"
                              ? "bg-red-500"
                              : transaction.type === "borrow"
                                ? "bg-blue-500"
                                : "bg-purple-500"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{item?.name || "Barang Tidak Dikenal"}</p>
                        <p className="text-sm text-gray-600">
                          {transactionTypeLabel} - {transaction.quantity} {item?.unit || "unit"}
                        </p>
                        <p className="text-xs text-gray-500">{transaction.date}</p>
                      </div>
                    </div>
                    <Badge variant={statusVariant as any} className="self-start sm:self-auto">
                      {transaction.status === "completed"
                        ? "Selesai"
                        : transaction.status === "pending"
                          ? "Dipinjam"
                          : transaction.status}
                    </Badge>
                  </div>
                )
              })
            ) : (
              <p className="text-gray-600 text-center py-4">Tidak ada aktivitas transaksi terbaru.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Users Management
function UsersManagement({
  currentUser,
  users,
  refreshData,
  isLoading,
}: {
  currentUser: User
  users: User[]
  refreshData: () => void
  isLoading: boolean
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  useRealtimeData({
    table: "users",
    enabled: true,
    onInsert: () => refreshData(),
    onUpdate: () => refreshData(),
    onDelete: () => refreshData(),
  })

  const userRoles = ["all", "admin", "manager", "staff"]
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const handleAddUser = async (formData: FormData) => {
    const result = await createUser(formData)
    if (result.success) {
      setIsAddDialogOpen(false)
      toast({ title: "Pengguna Ditambahkan", description: result.message })
      await refreshData()
    } else {
      toast({ title: "Gagal Menambah Pengguna", description: result.message, variant: "destructive" })
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditDialogOpen(true)
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsViewDialogOpen(true)
  }

  const handleUpdateUser = async (formData: FormData) => {
    if (!selectedUser) return
    formData.append("id", selectedUser.id.toString())
    const result = await updateUser(formData)
    if (result.success) {
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      toast({ title: "Pengguna Diperbarui", description: result.message })
      await refreshData()
    } else {
      toast({ title: "Gagal Memperbarui Pengguna", description: result.message, variant: "destructive" })
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (id === currentUser.id) {
      toast({
        title: "Tidak Dapat Menghapus",
        description: "Anda tidak dapat menghapus akun Anda sendiri.",
        variant: "destructive",
      })
      return
    }
    const result = await deleteUser(id)
    if (result.success) {
      toast({ title: "Pengguna Dihapus", description: result.message, variant: "destructive" })
      await refreshData()
    } else {
      toast({ title: "Gagal Menghapus Pengguna", description: result.message, variant: "destructive" })
    }
  }

  const handleExportUsers = () => {
    const headers = ["id", "username", "name", "email", "role", "status", "lastLogin"]
    downloadCsv(users, "users_data.csv", headers, toast)
  }

  const getRoleBadgeVariant = (role: User["role"]) =>
    role === "admin" ? "destructive" : role === "manager" ? "default" : "secondary"
  const getStatusBadgeVariant = (status: User["status"]) => (status === "active" ? "default" : "secondary")

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Memuat data pengguna...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold">Data Pengguna</h2>
          <p className="text-sm sm:text-base text-gray-600">Kelola pengguna sistem inventaris</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleExportUsers} size="sm" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pengguna
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                <DialogDescription>Masukkan informasi pengguna baru</DialogDescription>
              </DialogHeader>
              <form action={handleAddUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari pengguna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            {userRoles.slice(1).map((role) => (
              <SelectItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avatar</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTerm || selectedRole !== "all"
                          ? "Tidak ada pengguna yang sesuai dengan pencarian"
                          : "Belum ada data pengguna. Tambahkan pengguna pertama Anda!"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-blue-600 text-white font-semibold">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role) as any}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={getStatusBadgeVariant(user.status) as any}>
                          {user.status === "active" ? "Aktif" : "Tidak Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-gray-500">{user.lastLogin}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          {user.id !== currentUser.id && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
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
      {selectedUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Pengguna</DialogTitle>
              <DialogDescription>Perbarui informasi pengguna</DialogDescription>
            </DialogHeader>
            <form action={handleUpdateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editUsername">Username</Label>
                <Input id="editUsername" name="username" required defaultValue={selectedUser.username} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editName">Nama Lengkap</Label>
                <Input id="editName" name="name" required defaultValue={selectedUser.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input id="editEmail" name="email" type="email" required defaultValue={selectedUser.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">Role</Label>
                <Select name="role" required defaultValue={selectedUser.role}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select name="status" required defaultValue={selectedUser.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
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

      {/* View Dialog */}
      {selectedUser && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Pengguna</DialogTitle>
              <DialogDescription>Informasi lengkap tentang pengguna ini</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-blue-600 text-white font-semibold text-lg">
                    {selectedUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500">@{selectedUser.username}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <strong className="text-sm">ID:</strong>
                  <p className="text-sm">{selectedUser.id}</p>
                </div>
                <div>
                  <strong className="text-sm">Username:</strong>
                  <p className="text-sm">{selectedUser.username}</p>
                </div>
                <div>
                  <strong className="text-sm">Nama Lengkap:</strong>
                  <p className="text-sm">{selectedUser.name}</p>
                </div>
                <div>
                  <strong className="text-sm">Email:</strong>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <strong className="text-sm">Role:</strong>
                  <Badge variant={getRoleBadgeVariant(selectedUser.role) as any} className="ml-2">
                    {selectedUser.role}
                  </Badge>
                </div>
                <div>
                  <strong className="text-sm">Status:</strong>
                  <Badge variant={getStatusBadgeVariant(selectedUser.status) as any} className="ml-2">
                    {selectedUser.status === "active" ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>
                <div>
                  <strong className="text-sm">Last Login:</strong>
                  <p className="text-sm">{selectedUser.lastLogin}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)} className="w-full">
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Items Management
function ItemsManagement({
  user,
  items,
  suppliers,
  refreshData,
  categories,
  setCurrentPage,
  isLoading,
}: {
  user: User
  items: Item[]
  suppliers: Supplier[]
  refreshData: () => void
  categories: Category[]
  setCurrentPage: (page: string) => void
  isLoading: boolean
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const { toast } = useToast()

  useRealtimeData({
    table: "items",
    enabled: true,
    onInsert: () => refreshData(),
    onUpdate: () => refreshData(),
    onDelete: () => refreshData(),
  })

  const itemCategories = [
    "all",
    ...Array.from(new Set(categories.filter((c) => c.status === "active").map((c) => c.name))),
  ]
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPreviewImageUrl(URL.createObjectURL(file))
    else setPreviewImageUrl(null)
  }

  const handleAddItem = async (formData: FormData) => {
    const result = await createItem(formData, previewImageUrl || undefined)
    if (result.success) {
      setIsAddDialogOpen(false)
      setPreviewImageUrl(null)
      toast({ title: "Barang Ditambahkan", description: result.message })
      await refreshData()
    } else {
      toast({ title: "Gagal Menambah Barang", description: result.message, variant: "destructive" })
    }
  }

  const handleEditItem = (item: Item) => {
    setSelectedItem(item)
    setPreviewImageUrl(item.imageUrl || null)
    setIsEditDialogOpen(true)
  }

  const handleViewItem = (item: Item) => {
    setSelectedItem(item)
    setIsViewDialogOpen(true)
  }

  const handleUpdateItem = async (formData: FormData) => {
    if (!selectedItem) return
    formData.append("id", selectedItem.id.toString())
    formData.append("createdAt", selectedItem.createdAt)
    const result = await updateItem(formData, previewImageUrl || undefined)
    if (result.success) {
      setIsEditDialogOpen(false)
      setSelectedItem(null)
      setPreviewImageUrl(null)
      toast({ title: "Barang Diperbarui", description: result.message })
      await refreshData()
    } else {
      toast({ title: "Gagal Memperbarui Barang", description: result.message, variant: "destructive" })
    }
  }

  const handleDeleteItem = async (id: number) => {
    const result = await deleteItem(id)
    if (result.success) {
      toast({ title: "Barang Dihapus", description: result.message, variant: "destructive" })
      await refreshData()
    } else {
      toast({ title: "Gagal Menghapus Barang", description: result.message, variant: "destructive" })
    }
  }

  const getStockStatus = (item: Item) =>
    item.currentStock <= item.minStock ? "low" : item.currentStock <= item.minStock * 1.5 ? "medium" : "high"

  const handleExportItems = () => {
    const headers = [
      "id",
      "code",
      "name",
      "category",
      "description",
      "unit",
      "minStock",
      "currentStock",
      "location",
      "supplierId",
      "price",
      "status",
      "createdAt",
      "updatedAt",
      "imageUrl",
    ]
    downloadCsv(items, "items_data.csv", headers, toast)
  }

  const handleImportItems = (event: React.ChangeEvent<HTMLInputElement>) => {
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
          formData.append("code", row.Code)
          formData.append("name", row.Name)
          formData.append("category", row.Category)
          formData.append("description", row.Description || "")
          formData.append("unit", row.Unit)
          formData.append("minStock", row.MinStock)
          formData.append("currentStock", row.CurrentStock)
          formData.append("location", row.Location)
          formData.append("supplierId", row.SupplierID)
          formData.append("price", row.Price)
          if (row.Status) formData.append("status", row.Status)
          if (row.CreatedAt) formData.append("createdAt", row.CreatedAt)
          if (row.UpdatedAt) formData.append("updatedAt", row.UpdatedAt)
          const imageUrl = row.ImageUrl || undefined
          const result = await createItem(formData, imageUrl)
          if (result.success) successCount++
          else {
            errorCount++
            toast({
              title: "Import Sebagian Gagal",
              description: `Gagal mengimpor baris untuk item ${row.Name}: ${result.message}`,
              variant: "destructive",
            })
          }
        }
        if (successCount > 0) {
          await refreshData()
          toast({
            title: "Import Selesai",
            description: `${successCount} barang berhasil diimpor, ${errorCount} gagal.`,
          })
        } else if (errorCount > 0) {
          toast({
            title: "Import Gagal Total",
            description: `Tidak ada barang yang berhasil diimpor.`,
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

  const getCategoryDisplayName = (categoryValue: string) => {
    const category = categories.find((cat) => cat.name === categoryValue || cat.id.toString() === categoryValue)
    return category ? category.name : categoryValue
  }

  const hasActiveCategories = categories.some((c) => c.status === "active")

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Memuat data barang...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold">Data Barang</h2>
          <p className="text-sm sm:text-base text-gray-600">Kelola inventaris barang hotel</p>
          {!hasActiveCategories && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    Belum ada kategori aktif. Silakan buat kategori terlebih dahulu di menu{" "}
                    <button
                      onClick={() => setCurrentPage("categories")}
                      className="font-medium underline hover:text-yellow-900"
                    >
                      Kategori Barang
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleExportItems} size="sm" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <input type="file" accept=".csv" onChange={handleImportItems} className="hidden" id="import-items-csv" />
          <Button
            onClick={() => document.getElementById("import-items-csv")?.click()}
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          {(user.role === "admin" || user.role === "manager") && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto" disabled={!hasActiveCategories}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Barang
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tambah Barang Baru</DialogTitle>
                  <DialogDescription>Masukkan informasi barang baru</DialogDescription>
                </DialogHeader>
                <form action={handleAddItem} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Kode Barang</Label>
                      <Input id="code" name="code" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Barang</Label>
                      <Input id="name" name="name" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Kategori</Label>
                      <Select name="category" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            .filter((c) => c.status === "active")
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((c) => (
                              <SelectItem key={c.id} value={c.name}>
                                {c.name} ({c.code})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Satuan</Label>
                      <Input id="unit" name="unit" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea id="description" name="description" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minStock">Stok Minimum</Label>
                      <Input id="minStock" name="minStock" type="number" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentStock">Stok Saat Ini</Label>
                      <Input id="currentStock" name="currentStock" type="number" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Harga</Label>
                      <Input id="price" name="price" type="number" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Lokasi</Label>
                      <Input id="location" name="location" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplierId">Supplier</Label>
                      <Select name="supplierId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers
                            .filter((s) => s.status === "active")
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((s) => (
                              <SelectItem key={s.id} value={s.id.toString()}>
                                {s.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemImage">Gambar Barang</Label>
                    <Input id="itemImage" type="file" accept="image/*" onChange={handleImageChange} />
                    {previewImageUrl && (
                      <img
                        src={previewImageUrl || "/placeholder.svg?height=80&width=80&query=item-preview"}
                        alt="Preview"
                        className="mt-2 h-20 w-20 object-cover rounded-md"
                      />
                    )}
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
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {itemCategories.slice(1).map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Gambar</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead className="hidden sm:table-cell">Kategori</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead className="hidden md:table-cell">Status Stok</TableHead>
                  <TableHead className="hidden lg:table-cell">Lokasi</TableHead>
                  <TableHead className="hidden lg:table-cell">Harga</TableHead>
                  <TableHead className="hidden xl:table-cell">Tgl Input</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTerm || selectedCategory !== "all"
                          ? "Tidak ada barang yang sesuai dengan pencarian"
                          : "Belum ada data barang. Tambahkan barang pertama Anda!"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const stockStatus = getStockStatus(item)
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl || "/placeholder.svg?height=48&width=48&query=item-image"}
                              alt={item.name}
                              className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs text-center p-1">
                              No Image
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{item.code}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500 truncate max-w-32">{item.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">{getCategoryDisplayName(item.category)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {item.currentStock} {item.unit}
                            </p>
                            <p className="text-sm text-gray-500">Min: {item.minStock}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant={
                              stockStatus === "low" ? "destructive" : stockStatus === "medium" ? "secondary" : "default"
                            }
                          >
                            {stockStatus === "low"
                              ? "Stok Rendah"
                              : stockStatus === "medium"
                                ? "Stok Sedang"
                                : "Stok Aman"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{item.location}</TableCell>
                        <TableCell className="hidden lg:table-cell">Rp {item.price.toLocaleString()}</TableCell>
                        <TableCell className="hidden xl:table-cell text-sm text-gray-500">{item.createdAt}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewItem(item)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {(user.role === "admin" || user.role === "manager") && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Item */}
      {selectedItem && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Barang</DialogTitle>
              <DialogDescription>Perbarui informasi barang</DialogDescription>
            </DialogHeader>
            <form action={handleUpdateItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCode">Kode Barang</Label>
                  <Input id="editCode" name="code" required defaultValue={selectedItem.code} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editName">Nama Barang</Label>
                  <Input id="editName" name="name" required defaultValue={selectedItem.name} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCategory">Kategori</Label>
                  <Select name="category" required defaultValue={selectedItem.category}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => c.status === "active")
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name} ({c.code})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editUnit">Satuan</Label>
                  <Input id="editUnit" name="unit" required defaultValue={selectedItem.unit} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDescription">Deskripsi</Label>
                <Textarea id="editDescription" name="description" defaultValue={selectedItem.description} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editMinStock">Stok Minimum</Label>
                  <Input
                    id="editMinStock"
                    name="minStock"
                    type="number"
                    required
                    defaultValue={selectedItem.minStock}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCurrentStock">Stok Saat Ini</Label>
                  <Input
                    id="editCurrentStock"
                    name="currentStock"
                    type="number"
                    required
                    defaultValue={selectedItem.currentStock}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPrice">Harga</Label>
                  <Input id="editPrice" name="price" type="number" required defaultValue={selectedItem.price} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editLocation">Lokasi</Label>
                  <Input id="editLocation" name="location" required defaultValue={selectedItem.location} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editSupplierId">Supplier</Label>
                  <Select name="supplierId" required defaultValue={selectedItem.supplierId.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers
                        .filter((s) => s.status === "active")
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select name="status" required defaultValue={selectedItem.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editItemImage">Gambar Barang</Label>
                <Input id="editItemImage" type="file" accept="image/*" onChange={handleImageChange} />
                {previewImageUrl && (
                  <img
                    src={previewImageUrl || "/placeholder.svg?height=80&width=80&query=item-preview"}
                    alt="Preview"
                    className="mt-2 h-20 w-20 object-cover rounded-md"
                  />
                )}
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

      {/* View Item */}
      {selectedItem && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Barang</DialogTitle>
              <DialogDescription>Informasi lengkap tentang barang ini</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedItem.imageUrl && (
                <img
                  src={selectedItem.imageUrl || "/placeholder.svg?height=200&width=400&query=item-image"}
                  alt={selectedItem.name}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
              )}
              <div className="space-y-3">
                <div>
                  <strong className="text-sm">Kode:</strong>
                  <p className="text-sm">{selectedItem.code}</p>
                </div>
                <div>
                  <strong className="text-sm">Nama:</strong>
                  <p className="text-sm">{selectedItem.name}</p>
                </div>
                <div>
                  <strong className="text-sm">Kategori:</strong>
                  <p className="text-sm">{getCategoryDisplayName(selectedItem.category)}</p>
                </div>
                <div>
                  <strong className="text-sm">Deskripsi:</strong>
                  <p className="text-sm">{selectedItem.description || "-"}</p>
                </div>
                <div>
                  <strong className="text-sm">Stok Saat Ini:</strong>
                  <p className="text-sm">
                    {selectedItem.currentStock} {selectedItem.unit}
                  </p>
                </div>
                <div>
                  <strong className="text-sm">Stok Minimum:</strong>
                  <p className="text-sm">
                    {selectedItem.minStock} {selectedItem.unit}
                  </p>
                </div>
                <div>
                  <strong className="text-sm">Lokasi:</strong>
                  <p className="text-sm">{selectedItem.location}</p>
                </div>
                <div>
                  <strong className="text-sm">Supplier:</strong>
                  <p className="text-sm">{suppliers.find((s) => s.id === selectedItem.supplierId)?.name || "N/A"}</p>
                </div>
                <div>
                  <strong className="text-sm">Harga:</strong>
                  <p className="text-sm">Rp {selectedItem.price.toLocaleString()}</p>
                </div>
                <div>
                  <strong className="text-sm">Status:</strong>
                  <Badge className="ml-2">{selectedItem.status}</Badge>
                </div>
                <div>
                  <strong className="text-sm">Tanggal Input:</strong>
                  <p className="text-sm">{selectedItem.createdAt}</p>
                </div>
                <div>
                  <strong className="text-sm">Terakhir Diperbarui:</strong>
                  <p className="text-sm">{selectedItem.updatedAt}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)} className="w-full">
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Settings
export function SettingsManagement({ currentUser, refreshData }: { currentUser: User; refreshData: () => void }) {
  const [username, setUsername] = useState(currentUser.username)
  const [name, setName] = useState(currentUser.name)
  const [email, setEmail] = useState(currentUser.email)
  const [role, setRole] = useState<User["role"]>(currentUser.role)
  const [status, setStatus] = useState<User["status"]>(currentUser.status)
  const { toast } = useToast()

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("id", currentUser.id.toString())
    formData.append("username", username)
    formData.append("name", name)
    formData.append("email", email)
    formData.append("role", role)
    formData.append("status", status)
    formData.append("lastLogin", currentUser.lastLogin)
    const result = await updateUser(formData)
    if (result.success && result.user) {
      toast({ title: "Profil Diperbarui", description: "Informasi profil Anda berhasil diperbarui." })
      await refreshData()
    } else {
      toast({ title: "Gagal Memperbarui Profil", description: result.message, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold">Pengaturan Akun</h2>
        <p className="text-sm sm:text-base text-gray-600">Kelola informasi profil Anda</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Profil</CardTitle>
          <CardDescription>Perbarui detail akun Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as User["role"])} disabled>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as User["status"])} disabled>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              Simpan Perubahan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Main App
export default function HotelInventorySystem() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const [users, setUsers] = useState<User[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [depreciations, setDepreciations] = useState<Depreciation[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [logEntries, setLogEntries] = useState<
    Array<{
      id: number
      date: string
      itemId: number
      outQuantity: number
      inQuantity: number
      pendingQuantity: number
      returnedQuantity: number
      returnedImageUrl?: string
      returnedDate?: string
    }>
  >([])
  const [notifications, setNotifications] = useState<
    Array<{
      id: number
      title: string
      message: string
      type: "info" | "warning" | "error" | "success"
      timestamp: string
      read: boolean
    }>
  >([])
  const [showNotifications, setShowNotifications] = useState(false)

  const { toast } = useToast()

  // Optimistic hooks
  const itemsOptimistic = useOptimisticUpdates<Item>()
  const usersOptimistic = useOptimisticUpdates<User>()
  const suppliersOptimistic = useOptimisticUpdates<Supplier>()
  const transactionsOptimistic = useOptimisticUpdates<Transaction>()
  const categoriesOptimistic = useOptimisticUpdates<Category>()

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user)
    try {
      localStorage.setItem("currentUser", JSON.stringify(user))
    } catch {}
  }

  const handleLogout = () => {
    setCurrentUser(null)
    try {
      localStorage.removeItem("currentUser")
    } catch {}
  }

  const refreshAllData = useCallback(async () => {
    if (!currentUser) return
    setIsLoading(true)
    try {
      const [
        fetchedUsers,
        fetchedItems,
        fetchedSuppliers,
        fetchedTransactions,
        fetchedDepreciations,
        fetchedCategories,
      ] = await Promise.all([
        fetchUsers(),
        fetchItems(),
        fetchSuppliers(),
        fetchTransactions(),
        fetchDepreciations(),
        fetchCategories(),
      ])
      setUsers(fetchedUsers)
      setItems(fetchedItems)
      setSuppliers(fetchedSuppliers)
      setTransactions(fetchedTransactions)
      setDepreciations(fetchedDepreciations)
      setCategories(fetchedCategories)
      // Removed router.refresh() to prevent client state reset after login
    } catch (error) {
      console.error("Failed to load data:", error)
      toast({
        title: "Gagal Memuat Data",
        description: "Terjadi kesalahan saat memuat data. Mencoba lagi...",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, toast])

  useDataSync({ refreshData: refreshAllData, intervalMs: 30000, enabled: isOnline && !!currentUser })

  useRealtimeData({
    table: "categories",
    enabled: isOnline && !!currentUser,
    onInsert: () => refreshAllData(),
    onUpdate: () => refreshAllData(),
    onDelete: () => refreshAllData(),
  })
  useRealtimeData({
    table: "suppliers",
    enabled: isOnline && !!currentUser,
    onInsert: () => refreshAllData(),
    onUpdate: () => refreshAllData(),
    onDelete: () => refreshAllData(),
  })
  useRealtimeData({
    table: "transactions",
    enabled: isOnline && !!currentUser,
    onInsert: () => refreshAllData(),
    onUpdate: () => refreshAllData(),
    onDelete: () => refreshAllData(),
  })
  useRealtimeData({
    table: "users",
    enabled: isOnline && !!currentUser && currentUser.role === "admin",
    onInsert: () => refreshAllData(),
    onUpdate: () => refreshAllData(),
    onDelete: () => refreshAllData(),
  })

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast({ title: "Koneksi Kembali", description: "Anda kembali online. Data akan disinkronkan." })
      refreshAllData()
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "Koneksi Terputus",
        description: "Anda sedang offline. Perubahan akan disimpan saat koneksi kembali.",
        variant: "destructive",
      })
    }
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    setIsOnline(navigator.onLine)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [refreshAllData, toast])

  useEffect(() => {
    if (currentUser) refreshAllData()
  }, [currentUser, refreshAllData])

  useEffect(() => {
    if (items.length > 0 && transactions.length > 0) {
      const newNotifications: typeof notifications = []
      let nid = 1
      const lowStockItems = items.filter((i) => i.currentStock <= i.minStock)
      lowStockItems.forEach((i) =>
        newNotifications.push({
          id: nid++,
          title: "Stok Rendah",
          message: `${i.name} memiliki stok rendah (${i.currentStock} ${i.unit})`,
          type: "warning",
          timestamp: new Date().toLocaleString(),
          read: false,
        }),
      )
      const overdueBorrowings = transactions.filter(
        (t) => t.type === "borrow" && t.status !== "completed" && t.dueDate && new Date(t.dueDate) < new Date(),
      )
      overdueBorrowings.forEach((t) => {
        const item = items.find((i) => i.id === t.itemId)
        newNotifications.push({
          id: nid++,
          title: "Peminjaman Terlambat",
          message: `${item?.name || "Barang"} dipinjam oleh ${t.borrowerId} sudah melewati batas waktu`,
          type: "error",
          timestamp: new Date().toLocaleString(),
          read: false,
        })
      })
      const pendingTransactions = transactions.filter((t) => t.status === "pending")
      if (pendingTransactions.length > 0)
        newNotifications.push({
          id: nid++,
          title: "Transaksi Pending",
          message: `Ada ${pendingTransactions.length} transaksi yang menunggu persetujuan`,
          type: "info",
          timestamp: new Date().toLocaleString(),
          read: false,
        })
      setNotifications(newNotifications)
    }
  }, [items, transactions])

  const markNotificationAsRead = (id: number) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  const markAllNotificationsAsRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element
      if (showNotifications && !target.closest(".relative")) setShowNotifications(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showNotifications])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("currentUser")
      if (raw) {
        const parsed = JSON.parse(raw) as User
        setCurrentUser(parsed)
      }
    } catch {}
  }, [])

  if (!currentUser) return <LoginForm onLogin={handleLoginSuccess} />

  const navigationItems = getNavigationItems(currentUser.role)
  const optimisticItems = itemsOptimistic.applyOptimisticUpdates(items)
  const optimisticUsers = usersOptimistic.applyOptimisticUpdates(users)
  const optimisticSuppliers = suppliersOptimistic.applyOptimisticUpdates(suppliers)
  const optimisticTransactions = transactionsOptimistic.applyOptimisticUpdates(transactions)
  const optimisticCategories = categoriesOptimistic.applyOptimisticUpdates(categories)

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            user={currentUser}
            items={optimisticItems}
            users={optimisticUsers}
            suppliers={optimisticSuppliers}
            transactions={optimisticTransactions}
            setCurrentPage={setCurrentPage}
            isOnline={isOnline}
            isLoading={isLoading}
          />
        )
      case "items":
        return (
          <ItemsManagement
            user={currentUser}
            items={optimisticItems}
            suppliers={optimisticSuppliers}
            refreshData={refreshAllData}
            categories={optimisticCategories}
            setCurrentPage={setCurrentPage}
            isLoading={isLoading}
          />
        )
      case "users":
        return (
          <UsersManagement
            currentUser={currentUser}
            users={optimisticUsers}
            refreshData={refreshAllData}
            isLoading={isLoading}
          />
        )
      case "categories":
        return (
          <CategoryManagement
            user={currentUser}
            categories={optimisticCategories}
            items={optimisticItems}
            refreshData={refreshAllData}
          />
        )
      case "loog-book":
        return (
          <LoogBookManagement
            user={currentUser}
            items={optimisticItems}
            logEntries={logEntries}
            setLogEntries={setLogEntries}
          />
        )
      case "cost-control":
        return <CostControlManagement user={currentUser} logBookEntries={logEntries} />
      case "invoice":
        return <InvoiceManagement user={currentUser} logEntries={logEntries} items={optimisticItems} />
      case "guest-laundry":
        return <GuestLaundryManagement user={currentUser} />
      case "items-in":
        return (
          <ItemsInManagement
            user={currentUser}
            items={optimisticItems}
            suppliers={optimisticSuppliers}
            transactions={optimisticTransactions}
            refreshData={refreshAllData}
          />
        )
      case "items-out":
        return (
          <ItemsOutManagement
            user={currentUser}
            items={optimisticItems}
            suppliers={optimisticSuppliers}
            transactions={optimisticTransactions}
            refreshData={refreshAllData}
          />
        )
      case "locations":
        return <LocationManagement user={currentUser} items={optimisticItems} refreshData={refreshAllData} />
      case "reports":
        return (
          <ReportsManagement
            user={currentUser}
            items={optimisticItems}
            transactions={optimisticTransactions}
            suppliers={optimisticSuppliers}
            categories={optimisticCategories}
          />
        )
      case "settings":
        return <SettingsManagement currentUser={currentUser} refreshData={refreshAllData} />
      default:
        return (
          <Dashboard
            user={currentUser}
            items={optimisticItems}
            users={optimisticUsers}
            suppliers={optimisticSuppliers}
            transactions={optimisticTransactions}
            setCurrentPage={setCurrentPage}
            isOnline={isOnline}
            isLoading={isLoading}
          />
        )
    }
  }

  const renderNavigationItems = (items: ReturnType<typeof getNavigationItems>) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.key}>
          {"children" in item && item.children ? (
            <Collapsible defaultOpen={currentPage.startsWith(item.key)} className="group/collapsible">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton isActive={currentPage.startsWith(item.key)}>
                  <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.children.map((subItem: any) => (
                    <SidebarMenuSubItem key={subItem.key}>
                      {"children" in subItem && subItem.children ? (
                        <Collapsible defaultOpen={currentPage.startsWith(subItem.key)} className="group/collapsible">
                          <CollapsibleTrigger asChild>
                            <SidebarMenuSubButton isActive={currentPage.startsWith(subItem.key)}>
                              {subItem.icon && <subItem.icon className="w-4 h-4 mr-2" />}
                              <span className="truncate">{subItem.title}</span>
                              <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuSubButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {subItem.children.map((nested: any) => (
                                <SidebarMenuSubItem key={nested.key}>
                                  <SidebarMenuSubButton
                                    onClick={() => setCurrentPage(nested.key)}
                                    isActive={currentPage === nested.key}
                                  >
                                    {nested.icon && <nested.icon className="w-4 h-4 mr-2" />}
                                    <span className="truncate">{nested.title}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <SidebarMenuSubButton
                          onClick={() => setCurrentPage(subItem.key)}
                          isActive={currentPage === subItem.key}
                        >
                          {subItem.icon && <subItem.icon className="w-4 h-4 mr-2" />}
                          <span className="truncate">{subItem.title}</span>
                        </SidebarMenuSubButton>
                      )}
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <SidebarMenuButton onClick={() => setCurrentPage(item.key)} isActive={currentPage === item.key}>
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="truncate">{item.title}</span>
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar collapsible="offcanvas" side="left" className="bg-gradient-to-b from-[#25282A] to-[#25282A]">
          <SidebarHeader>
            <div className="flex items-center space-x-3 w-full p-2">
              <div className="w-28 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden p-2 flex-shrink-0 shadow-sm">
                <img
                  src="/images/ramayana-hotel-logo.png"
                  alt="Ramayana Hotel Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white flex-1 leading-tight">
                INVENTARIS
                <br />
                HOUSEKEEPING
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>{renderNavigationItems(navigationItems)}</SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-blue-600 text-white font-semibold">
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
                  <p className="text-xs text-gray-400">{currentUser.role.toUpperCase()}</p>
                  {isOnline ? (
                    <Wifi className="w-3 h-3 text-green-500" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-red-500" />
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:bg-[#F0D58D] hover:text-[#25282A]"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              LOGOUT
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="lg:hidden" />
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate max-w-xs sm:max-w-none">
                      {navigationItems.find((i) => i.key === currentPage)?.title || "Dashboard"}
                    </h1>
                    {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Hotel Management System</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Search..." className="pl-10 w-40 lg:w-64" />
                </div>

                <Button variant="ghost" size="icon" onClick={refreshAllData} disabled={isLoading} title="Refresh Data">
                  <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
                </Button>

                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.filter((n) => !n.read).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notifications.filter((n) => !n.read).length}
                      </span>
                    )}
                  </Button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                        {notifications.filter((n) => !n.read).length > 0 && (
                          <Button variant="ghost" size="sm" onClick={markAllNotificationsAsRead} className="text-xs">
                            Tandai Semua Dibaca
                          </Button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>Tidak ada notifikasi</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!n.read ? "bg-blue-50" : ""}`}
                              onClick={() => markNotificationAsRead(n.id)}
                            >
                              <div className="flex items-start space-x-3">
                                <div
                                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                    n.type === "error"
                                      ? "bg-red-500"
                                      : n.type === "warning"
                                        ? "bg-yellow-500"
                                        : n.type === "success"
                                          ? "bg-green-500"
                                          : "bg-blue-500"
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className={`text-sm font-medium ${!n.read ? "text-gray-900" : "text-gray-600"}`}>
                                      {n.title}
                                    </p>
                                  </div>
                                  <p className={`text-sm mt-1 ${!n.read ? "text-gray-700" : "text-gray-500"}`}>
                                    {n.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">{n.timestamp}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => setShowNotifications(false)}
                          >
                            Tutup Notifikasi
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Badge variant="secondary" className="hidden sm:inline-flex bg-green-100 text-green-800">
                  {currentUser.role.toUpperCase()}
                </Badge>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6">{renderCurrentPage()}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

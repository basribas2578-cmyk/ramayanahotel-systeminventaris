"use client"
import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/app/page" // Import User type
import { updateUser } from "@/app/actions" // Import server action

export function SettingsManagement({
  currentUser,
  setUsers,
}: {
  currentUser: User
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
}) {
  const [username, setUsername] = useState(currentUser.username)
  const [name, setName] = useState(currentUser.name)
  const [email, setEmail] = useState(currentUser.email)
  const [role, setRole] = useState(currentUser.role)
  const [status, setStatus] = useState(currentUser.status)
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
    formData.append("lastLogin", currentUser.lastLogin) // Keep original lastLogin

    const result = await updateUser(formData)
    if (result.success && result.user) {
      setUsers((prevUsers) => prevUsers.map((u) => (u.id === result.user!.id ? result.user! : u)))
      toast({
        title: "Profil Diperbarui",
        description: "Informasi profil Anda berhasil diperbarui.",
      })
    } else {
      toast({
        title: "Gagal Memperbarui Profil",
        description: result.message,
        variant: "destructive",
      })
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
                <Select value={role} onValueChange={(value) => setRole(value as User["role"])} disabled>
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
                <Select value={status} onValueChange={(value) => setStatus(value as User["status"])} disabled>
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

      {/* Additional settings sections can be added here */}
      {/* Example: Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ubah Kata Sandi</CardTitle>
          <CardDescription>Perbarui kata sandi akun Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Kata Sandi Saat Ini</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Kata Sandi Baru</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi Baru</Label>
              <Input id="confirmPassword" type="password" />
            </div>
            <Button type="submit" variant="outline" className="w-full sm:w-auto bg-transparent">
              Ubah Kata Sandi
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

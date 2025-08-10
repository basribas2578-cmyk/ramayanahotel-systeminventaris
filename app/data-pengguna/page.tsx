"use client";

import { useState, useEffect } from "react";
import { updateUserPassword } from "../actions"; // pastikan path sesuai
import { supabase } from "../lib/supabaseClient"; // sesuaikan path supabase client

export default function DataPenggunaPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Ambil data user dari Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("users").select("*");
      if (error) console.error(error);
      else setUsers(data || []);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleUpdatePassword = async (userId: string) => {
    if (!newPassword) {
      alert("Password baru tidak boleh kosong");
      return;
    }
    const result = await updateUserPassword(userId, newPassword);
    if (result.success) {
      alert("Password berhasil diubah!");
      setSelectedUser(null);
      setNewPassword("");
    } else {
      alert("Gagal mengubah password: " + result.error);
    }
  };

  if (loading) return <p>Memuat data pengguna...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Data Pengguna</h1>
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Nama</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border p-2">{user.id}</td>
              <td className="border p-2">{user.name}</td>
              <td className="border p-2">{user.email}</td>
              <td className="border p-2">
                {selectedUser === user.id ? (
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Password baru"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="border p-1"
                    />
                    <button
                      onClick={() => handleUpdatePassword(user.id)}
                      className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Simpan
                    </button>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="bg-gray-500 text-white px-2 py-1 rounded"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedUser(user.id)}
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Ubah Password
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

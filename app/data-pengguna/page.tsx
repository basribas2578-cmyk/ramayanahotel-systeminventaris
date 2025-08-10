"use client";

import { useState, useEffect } from "react";
import { addOrUpdatePassword } from "../actions"; // pastikan path ini sesuai lokasi actions.ts

export default function DataPenggunaPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passwordModal, setPasswordModal] = useState({ open: false, userId: "", password: "" });

  // Ambil daftar user dari API Supabase atau backend-mu
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users"); // buat API route ini untuk ambil data user
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Gagal ambil user:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  async function handleSavePassword() {
    if (!passwordModal.password) return alert("Password tidak boleh kosong!");
    try {
      await addOrUpdatePassword(passwordModal.userId, passwordModal.password);
      alert("Password berhasil diperbarui!");
      setPasswordModal({ open: false, userId: "", password: "" });
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui password");
    }
  }

  if (loading) return <p>Memuat data pengguna...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Data Pengguna</h1>
      <table border={1} cellPadding={8} cellSpacing={0}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Nama</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.name}</td>
                <td>
                  <button
                    onClick={() =>
                      setPasswordModal({ open: true, userId: u.id, password: "" })
                    }
                  >
                    Ubah Password
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3}>Tidak ada data pengguna</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal Ubah Password */}
      {passwordModal.open && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0,
            width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.3)",
            display: "flex", justifyContent: "center", alignItems: "center"
          }}
        >
          <div style={{ background: "#fff", padding: 20, borderRadius: 8, width: 300 }}>
            <h3>Ubah Password</h3>
            <input
              type="password"
              placeholder="Password baru"
              value={passwordModal.password}
              onChange={(e) => setPasswordModal({ ...passwordModal, password: e.target.value })}
              style={{ width: "100%", marginBottom: 10 }}
            />
            <button onClick={handleSavePassword}>Simpan</button>
            <button onClick={() => setPasswordModal({ open: false, userId: "", password: "" })}>
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

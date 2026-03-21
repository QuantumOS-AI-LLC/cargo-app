"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  _count: { applications: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    const r = await fetch("/api/admin/users");
    const d = await r.json();
    setUsers(d.users || []);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`Change role to ${newRole}?`)) return;
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    loadUsers();
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Delete user ${email}? This will also delete all their applications.`)) return;
    await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
    loadUsers();
  }

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-page-title">Users</h1>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{users.length} total</span>
      </div>
      <div className="admin-body">
        <div className="data-table">
          <div className="table-header">
            <span className="table-title">All Users</span>
          </div>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p className="empty-text">No users yet.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name / Email</th>
                  <th>Role</th>
                  <th>Applications</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.name || "—"}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>{u.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === "ADMIN" ? "badge-approved" : "badge-pending"}`}>
                        {u.role.toLowerCase()}
                      </span>
                    </td>
                    <td>{u._count.applications}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className={`action-btn ${u.role === "ADMIN" ? "action-reject" : "action-promote"}`}
                        onClick={() => toggleRole(u.id, u.role)}
                      >
                        {u.role === "ADMIN" ? "Demote" : "Make Admin"}
                      </button>
                      <button
                        className="action-btn action-delete"
                        onClick={() => deleteUser(u.id, u.email)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

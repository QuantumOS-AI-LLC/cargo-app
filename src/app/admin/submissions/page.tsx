"use client";

import { useEffect, useState } from "react";

type Application = {
  id: string;
  company: string;
  fullName: string;
  email: string;
  startPort: string;
  endPort: string;
  cargoType: string;
  shippingMode: string;
  deductibleAmount: number;
  adminFee: number;
  isInternational: boolean;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  user: { name: string | null; email: string };
};

const STATUS_CLASS: Record<string, string> = {
  SUBMITTED: "badge badge-submitted",
  APPROVED: "badge badge-approved",
  REJECTED: "badge badge-rejected",
  PENDING: "badge badge-pending",
};

const FILTERS = ["ALL", "SUBMITTED", "PENDING", "APPROVED", "REJECTED"];

export default function AdminSubmissionsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function loadApps(status?: string) {
    const url = status && status !== "ALL" ? `/api/admin/submissions?status=${status}` : "/api/admin/submissions";
    const r = await fetch(url);
    const d = await r.json();
    setApplications(d.applications || []);
    setLoading(false);
  }

  useEffect(() => { loadApps(filter); }, [filter]);

  async function updateStatus(appId: string, status: string, adminNotes?: string) {
    await fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: appId, status, adminNotes: adminNotes ?? null }),
    });
    loadApps(filter);
  }

  async function deleteApp(appId: string) {
    if (!confirm("Delete this application?")) return;
    await fetch(`/api/admin/submissions?applicationId=${appId}`, { method: "DELETE" });
    loadApps(filter);
  }

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-page-title">Submissions</h1>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{applications.length} shown</span>
      </div>
      <div className="admin-body">
        <div className="data-table">
          <div className="table-filter">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`filter-btn${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p className="empty-text">No applications found.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Route</th>
                  <th>Deductible</th>
                  <th>Admin Fee</th>
                  <th>User</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{app.company}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{app.fullName}</div>
                    </td>
                    <td style={{ fontSize: "12px" }}>
                      <span style={{ color: "#3b82f6" }}>{app.startPort}</span>
                      <span style={{ color: "var(--text-muted)" }}> → </span>
                      <span style={{ color: "#3b82f6" }}>{app.endPort}</span>
                    </td>
                    <td>${app.deductibleAmount.toLocaleString()}</td>
                    <td>${app.adminFee.toFixed(2)}</td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{app.user?.email}</td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={STATUS_CLASS[app.status] || "badge"}>
                        {app.status.toLowerCase()}
                      </span>
                    </td>
                    <td>
                      <select
                        className="select-status"
                        value={app.status}
                        onChange={e => updateStatus(app.id, e.target.value)}
                      >
                        <option value="SUBMITTED">Submitted</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                      <br />
                      <button
                        className="action-btn action-delete"
                        style={{ marginTop: "6px" }}
                        onClick={() => deleteApp(app.id)}
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

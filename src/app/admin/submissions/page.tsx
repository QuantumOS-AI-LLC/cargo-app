"use client";

import { useEffect, useState } from "react";

type Application = {
  id: string;
  userId: string;
  company: string;
  fullName: string;
  email: string;
  phone: string;
  startPort: string;
  endPort: string;
  cargoType: string;
  shippingMode: string;
  cargoSize: string;
  cargoValue: number;
  containerGrade: string;
  isInternational: boolean;
  deductibleAmount: number;
  insurancePremium: number;
  deductible2: number | null;
  premium2: number | null;
  adminFee: number;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("APPROVED");
  const [viewingApp, setViewingApp] = useState<Application | null>(null);

  async function loadApps(statusFilter?: string) {
    setLoading(true);
    const url = statusFilter && statusFilter !== "ALL" ? `/api/admin/submissions?status=${statusFilter}` : "/api/admin/submissions";
    const r = await fetch(url);
    const d = await r.json();
    setApplications(d.applications || []);
    setSelectedIds(new Set()); // Reset selections on load

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

  /* --- BULK ACTIONS --- */
  function toggleSelectAll(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      setSelectedIds(new Set(applications.map(a => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function toggleSelectOne(appId: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(appId)) newSet.delete(appId);
    else newSet.add(appId);
    setSelectedIds(newSet);
  }

  async function performBulkAction(action: "DELETE" | "UPDATE_STATUS") {
    if (selectedIds.size === 0) return;
    if (action === "DELETE" && !confirm(`Delete ${selectedIds.size} applications permanently?`)) return;
    
    await fetch("/api/admin/submissions/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        applicationIds: Array.from(selectedIds),
        status: action === "UPDATE_STATUS" ? bulkStatus : undefined
      }),
    });
    loadApps(filter);
  }

  /* --- CSV EXPORT --- */
  function exportCSV(appsToExport: Application[], filenamePrefix: string) {
    if (appsToExport.length === 0) return alert("No applications to export.");
    
    const headers = [
      "ID", "Date Submitted", "Status", "Company", "Requester Name", "Requester Email", "Requester Phone",
      "Cargo Type", "Shipping Mode", "Cargo Size", "Cargo Value ($)", "International", "Start Port", "End Port",
      "Container Grade", "Insurance Premium ($)", "Deductible Amount ($)", 
      "Premium 2 ($)", "Deductible 2 ($)", "Admin Fee ($)", "Admin Notes", "User Account Email", "Last Updated"
    ];
    
    const rows = appsToExport.map(app => [
      `"${app.id}"`,
      `"${new Date(app.createdAt).toLocaleString()}"`,
      `"${app.status}"`,
      `"${app.company.replace(/"/g, '""')}"`,
      `"${app.fullName.replace(/"/g, '""')}"`,
      `"${app.email}"`,
      `"${app.phone}"`,
      `"${app.cargoType}"`,
      `"${app.shippingMode}"`,
      `"${app.cargoSize}"`,
      app.cargoValue,
      app.isInternational ? "Yes" : "No",
      `"${app.startPort.replace(/"/g, '""')}"`,
      `"${app.endPort.replace(/"/g, '""')}"`,
      `"${app.containerGrade}"`,
      app.insurancePremium,
      app.deductibleAmount,
      app.premium2 || "",
      app.deductible2 || "",
      app.adminFee,
      `"${(app.adminNotes || "").replace(/"/g, '""')}"`,
      `"${app.user?.email || ""}"`,
      `"${new Date(app.updatedAt).toLocaleString()}"`,
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `cargodeductible_${filenamePrefix}_${new Date().toISOString().split("T")[0]}.csv`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const selectedCount = selectedIds.size;
  const allSelected = applications.length > 0 && selectedCount === applications.length;

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1 className="admin-page-title">Submissions</h1>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{applications.length} total shown</span>
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          {selectedCount > 0 ? (
            <button 
              className="action-btn" 
              style={{ padding: "8px 16px", background: "white", border: "1px solid #d1d5db" }}
              onClick={() => exportCSV(applications.filter(a => selectedIds.has(a.id)), "selected")}
            >
              📥 Export Selected ({selectedCount})
            </button>
          ) : (
             <button 
              className="action-btn" 
              style={{ padding: "8px 16px", background: "white", border: "1px solid #d1d5db" }}
              onClick={() => exportCSV(applications, filter.toLowerCase())}
            >
              📥 Export All Shown
            </button>
          )}
        </div>
      </div>

      <div className="admin-body">
        <div className="data-table">
          <div className="table-filter" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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

            {selectedCount > 0 && (
              <div style={{ display: "flex", gap: "12px", alignItems: "center", background: "#f8fafc", padding: "6px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                  {selectedCount} selected:
                </span>
                <select 
                  className="select-status" 
                  style={{ padding: "4px 8px" }}
                  value={bulkStatus}
                  onChange={e => setBulkStatus(e.target.value)}
                >
                  <option value="SUBMITTED">Submitted</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <button 
                  className="btn-primary" 
                  style={{ padding: "4px 12px", fontSize: "12px" }}
                  onClick={() => performBulkAction("UPDATE_STATUS")}
                >
                  Apply Status
                </button>
                <button 
                  className="action-btn action-delete"
                  onClick={() => performBulkAction("DELETE")}
                  style={{ padding: "4px 12px", fontSize: "12px" }}
                >
                  Delete Selected
                </button>
              </div>
            )}
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
                  <th style={{ width: "40px" }}>
                    <input 
                      type="checkbox" 
                      style={{ cursor: "pointer", width: "16px", height: "16px" }}
                      checked={allSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
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
                  <tr 
                    key={app.id} 
                    className={selectedIds.has(app.id) ? "row-selected" : ""}
                    onClick={() => setViewingApp(app)}
                    style={{ cursor: "pointer" }}
                  >
                    <td onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        style={{ cursor: "pointer", width: "16px", height: "16px" }}
                        checked={selectedIds.has(app.id)}
                        onChange={() => toggleSelectOne(app.id)}
                      />
                    </td>
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
                    <td onClick={e => e.stopPropagation()}>
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

      {viewingApp && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }} onClick={() => setViewingApp(null)}>
          <div style={{
            background: "white", padding: "32px", borderRadius: "12px", width: "90%", maxWidth: "800px",
            maxHeight: "90vh", overflowY: "auto", position: "relative", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)"
          }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setViewingApp(null)}
              style={{ position: "absolute", top: "20px", right: "24px", fontSize: "24px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >×</button>
            <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #e2e8f0" }}>
              Application Details
            </h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "12px" }}>Applicant Info</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                  <div><span style={{ color: "var(--text-muted)" }}>Company:</span> <strong style={{color:"#0f172a"}}>{viewingApp.company}</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Name:</span> <strong style={{color:"#0f172a"}}>{viewingApp.fullName}</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Email:</span> <strong style={{color:"#0f172a"}}>{viewingApp.email}</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Phone:</span> <strong style={{color:"#0f172a"}}>{viewingApp.phone}</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>User Account:</span> <strong style={{color:"#0f172a"}}>{viewingApp.user?.email || "N/A"}</strong></div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "12px" }}>Shipment Info</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                  <div><span style={{ color: "var(--text-muted)" }}>Route:</span> <strong style={{color:"#0f172a"}}>{viewingApp.startPort} → {viewingApp.endPort}</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Type:</span> <strong style={{color:"#0f172a"}}>{viewingApp.isInternational ? "International" : "Domestic"}</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Mode:</span> <strong style={{color:"#0f172a"}}>{viewingApp.shippingMode}</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Cargo:</span> <strong style={{color:"#0f172a"}}>{viewingApp.cargoType}</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Container Grade:</span> <strong style={{color:"#0f172a"}}>{viewingApp.containerGrade}</strong></div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "12px" }}>Financials</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                  <div><span style={{ color: "var(--text-muted)" }}>Cargo Value:</span> <strong style={{color:"#0f172a"}}>${viewingApp.cargoValue?.toLocaleString()}</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Insurance Premium:</span> <strong style={{color:"#0f172a"}}>${viewingApp.insurancePremium?.toLocaleString()}</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Deductible Amount:</span> <strong style={{color:"#0f172a"}}>${viewingApp.deductibleAmount?.toLocaleString()}</strong></div>
                  {viewingApp.premium2 && viewingApp.deductible2 && (
                    <>
                      <div><span style={{ color: "var(--text-muted)" }}>Option 2 Premium:</span> <strong style={{color:"#0f172a"}}>${viewingApp.premium2?.toLocaleString()}</strong></div>
                      <div><span style={{ color: "var(--text-muted)" }}>Option 2 Deductible:</span> <strong style={{color:"#0f172a"}}>${viewingApp.deductible2?.toLocaleString()}</strong></div>
                    </>
                  )}
                  <div><span style={{ color: "var(--text-muted)" }}>Admin Fee:</span> <strong style={{color:"#0f172a"}}>${viewingApp.adminFee?.toFixed(2)}</strong></div>
                </div>
              </div>
              
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "12px" }}>Status & Admin</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                  <div><span style={{ color: "var(--text-muted)" }}>Status:</span> <span className={STATUS_CLASS[viewingApp.status] || "badge"} style={{ marginLeft: "8px" }}>{viewingApp.status}</span></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Date Submitted:</span> <strong style={{color:"#0f172a"}}>{new Date(viewingApp.createdAt).toLocaleString()}</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Last Updated:</span> <strong style={{color:"#0f172a"}}>{new Date(viewingApp.updatedAt).toLocaleString()}</strong></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Application ID:</span> <strong style={{color:"#0f172a", fontSize:"12px", fontFamily:"monospace"}}>{viewingApp.id}</strong></div>
                </div>
              </div>
            </div>

            {viewingApp.adminNotes && (
              <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #e2e8f0" }}>
                 <div>
                   <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Internal Admin Notes</h3>
                   <p style={{ fontSize: "14px", color: "#334155", background: "#fffbeb", border: "1px solid #fde68a", padding: "12px", borderRadius: "6px", whiteSpace: "pre-wrap" }}>{viewingApp.adminNotes}</p>
                 </div>
              </div>
            )}
            
            <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end" }}>
               <button className="btn-primary" onClick={() => setViewingApp(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

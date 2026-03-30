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
  isPaid: boolean;
  stripePaymentId: string | null;
  stripeChargeId: string | null;
  stripeReceiptUrl: string | null;
  stripeCardBrand: string | null;
  stripeCardLast4: string | null;
  paidAt: string | null;
  manualPaymentRef: string | null;
  manualPaymentNote: string | null;
  manualPaymentBy: string | null;
  createdAt: string;
  updatedAt: string;
  user: { name: string | null; email: string; affiliateId?: string | null };
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
  const [manualRef, setManualRef] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

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
      "Premium 2 ($)", "Deductible 2 ($)", "Admin Fee ($)", "Admin Notes", "User Account Email", "Affiliate ID", "Last Updated"
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
      `"${app.user?.affiliateId || ""}"`,
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
                  <th>Referred By</th>
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
                    <td style={{ fontSize: "12px" }}>
                       {app.user?.affiliateId ? (
                         <span style={{ fontFamily: "monospace", background: "var(--border-light)", padding: "2px 4px", borderRadius: "4px" }}>{app.user.affiliateId}</span>
                       ) : (
                         <span style={{ color: "var(--text-muted)" }}>Organic</span>
                       )}
                    </td>
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
                  <div><span style={{ color: "var(--text-muted)" }}>Affiliate ID:</span> <strong style={{color:"#0f172a"}}>{viewingApp.user?.affiliateId || "Organic"}</strong></div>
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

            {/* Payment Section */}
            <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "16px" }}>Payment</h3>
              
              {viewingApp.isPaid ? (
                /* Paid — Show receipt data */
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "16px" }}>✅</span>
                    <span style={{ fontWeight: 700, color: "#16a34a" }}>Payment Confirmed</span>
                    <span style={{ marginLeft: "auto", color: "#64748b", fontSize: "12px" }}>{viewingApp.paidAt ? new Date(viewingApp.paidAt).toLocaleString() : ""}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Method</span>
                    <strong>{viewingApp.manualPaymentRef ? "🏦 Manual / Offline" : `💳 ${viewingApp.stripeCardBrand ? viewingApp.stripeCardBrand.charAt(0).toUpperCase() + viewingApp.stripeCardBrand.slice(1) : "Card"} ···· ${viewingApp.stripeCardLast4 || "****"}`}</strong>
                  </div>
                  {viewingApp.stripePaymentId && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#64748b" }}>Payment Intent ID</span>
                      <code style={{ fontSize: "11px", background: "#eff6ff", padding: "2px 8px", borderRadius: "4px", color: "#1d4ed8" }}>{viewingApp.stripePaymentId}</code>
                    </div>
                  )}
                  {viewingApp.stripeChargeId && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#64748b" }}>Charge ID</span>
                      <code style={{ fontSize: "11px", background: "#eff6ff", padding: "2px 8px", borderRadius: "4px", color: "#1d4ed8" }}>{viewingApp.stripeChargeId}</code>
                    </div>
                  )}
                  {viewingApp.manualPaymentRef && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#64748b" }}>Transaction Ref</span>
                      <code style={{ fontSize: "11px", background: "#fefce8", padding: "2px 8px", borderRadius: "4px", color: "#92400e" }}>{viewingApp.manualPaymentRef}</code>
                    </div>
                  )}
                  {viewingApp.manualPaymentNote && (
                    <div style={{ color: "#64748b", fontStyle: "italic", fontSize: "12px" }}>{viewingApp.manualPaymentNote}</div>
                  )}
                  {viewingApp.manualPaymentBy && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748b" }}>Confirmed By</span>
                      <span style={{ fontWeight: 600 }}>{viewingApp.manualPaymentBy}</span>
                    </div>
                  )}
                  {viewingApp.stripeReceiptUrl && (
                    <a href={viewingApp.stripeReceiptUrl} target="_blank" rel="noopener noreferrer"
                      style={{ marginTop: "4px", textAlign: "center", display: "block", padding: "8px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", color: "#1d4ed8", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}
                    >
                      🧾 View Official Stripe Receipt ↗
                    </a>
                  )}
                </div>
              ) : (
                /* Unpaid — Show manual payment form */
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <p style={{ fontSize: "13px", color: "#92400e", margin: 0 }}>⚠️ No payment recorded. Mark as manually paid (wire transfer, check, etc.).</p>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "4px" }}>Transaction Reference *</label>
                    <input
                      type="text"
                      placeholder="e.g. Wire Ref #TXN-20240331"
                      value={manualRef}
                      onChange={e => setManualRef(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "4px" }}>Payment Note (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Paid via bank wire from ACME Corp on March 31"
                      value={manualNote}
                      onChange={e => setManualNote(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>
                  <button
                    disabled={!manualRef || manualLoading}
                    onClick={async () => {
                      if (!manualRef) return;
                      setManualLoading(true);
                      await fetch("/api/admin/submissions", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ applicationId: viewingApp.id, manualPayment: true, manualPaymentRef: manualRef, manualPaymentNote: manualNote }),
                      });
                      setManualLoading(false);
                      setManualRef("");
                      setManualNote("");
                      setViewingApp(null);
                      loadApps(filter);
                    }}
                    style={{ padding: "10px 20px", background: manualRef ? "#f59e0b" : "#e2e8f0", color: manualRef ? "white" : "#94a3b8", border: "none", borderRadius: "6px", fontWeight: 700, cursor: manualRef ? "pointer" : "not-allowed", fontSize: "13px" }}
                  >
                    {manualLoading ? "Processing..." : "✅ Mark as Manually Paid"}
                  </button>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end" }}>
               <button className="btn-primary" onClick={() => setViewingApp(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

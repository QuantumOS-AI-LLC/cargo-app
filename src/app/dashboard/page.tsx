"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

type Application = {
  id: string;
  company: string;
  startPort: string;
  endPort: string;
  deductibleAmount: number;
  adminFee: number;
  status: string;
  shippingMode: string;
  createdAt: string;
};

const STATUS_CLASS: Record<string, string> = {
  SUBMITTED: "badge badge-submitted",
  APPROVED: "badge badge-approved",
  REJECTED: "badge badge-rejected",
  PENDING: "badge badge-pending",
};

const SHIP_ICON: Record<string, string> = {
  SEA: "🚢",
  AIR: "✈️",
  LAND: "🚛",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatMoney(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/applications")
      .then(r => r.json())
      .then(d => { setApplications(d.applications || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-brand">
            <div className="brand-icon">C</div>
            CargoDeductible
          </Link>
          <div className="navbar-links">
            <Link href="/get-coverage" className="nav-link">Get Coverage</Link>
            <Link href="/dashboard" className="nav-link" style={{ color: "var(--navy)", fontWeight: 600 }}>Dashboard</Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)", fontFamily: "inherit", padding: "6px 12px" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main>
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Applications</h1>
            <p className="page-subtitle">Track your cargo deductible coverage applications.</p>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
              Loading applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p className="empty-text">No applications yet.</p>
              <br />
              <Link href="/get-coverage" className="nav-link-primary" style={{ display: "inline-block", marginTop: "12px" }}>
                Get Coverage →
              </Link>
            </div>
          ) : (
            <div className="card-list">
              {applications.map(app => (
                <div key={app.id} className="app-card">
                  <div className="app-card-header">
                    <div className="app-card-info">
                      <div className="app-icon">{SHIP_ICON[app.shippingMode] || "📦"}</div>
                      <div>
                        <div className="app-company">{app.company}</div>
                        <div className="app-route">{app.startPort} → {app.endPort}</div>
                      </div>
                    </div>
                    <span className={STATUS_CLASS[app.status] || "badge"}>
                      {app.status.toLowerCase()}
                    </span>
                  </div>
                  <div className="app-card-meta">
                    <div className="meta-item">
                      <span className="meta-icon">💲</span>
                      Deductible: {formatMoney(app.deductibleAmount)}
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">💲</span>
                      Admin Fee: {formatMoney(app.adminFee)}
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">🕐</span>
                      {formatDate(app.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        © 2026 <a href="https://CargoDecutible.com">CargoDeductible.com</a> — We cover your deductible so you don&apos;t have out-of-pocket costs.
      </footer>
    </div>
  );
}

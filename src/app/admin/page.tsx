"use client";

import { useEffect, useState } from "react";

type Stats = {
  totalUsers: number;
  totalApplications: number;
  submitted: number;
  approved: number;
  rejected: number;
  pending: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(d => { setStats(d.stats); setLoading(false); });
  }, []);

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-page-title">Overview</h1>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>
      </div>
      <div className="admin-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{loading ? "–" : stats?.totalUsers}</div>
            <div className="stat-sub">Registered accounts</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Applications</div>
            <div className="stat-value">{loading ? "–" : stats?.totalApplications}</div>
            <div className="stat-sub">All time submissions</div>
          </div>
          <div className="stat-card">
            <div className="stat-label" style={{ color: "var(--status-submitted-color)" }}>Submitted</div>
            <div className="stat-value">{loading ? "–" : stats?.submitted}</div>
            <div className="stat-sub">Awaiting review</div>
          </div>
          <div className="stat-card">
            <div className="stat-label" style={{ color: "var(--status-approved-color)" }}>Approved</div>
            <div className="stat-value">{loading ? "–" : stats?.approved}</div>
            <div className="stat-sub">Fully approved</div>
          </div>
          <div className="stat-card">
            <div className="stat-label" style={{ color: "var(--status-rejected-color)" }}>Rejected</div>
            <div className="stat-value">{loading ? "–" : stats?.rejected}</div>
            <div className="stat-sub">Declined applications</div>
          </div>
          <div className="stat-card">
            <div className="stat-label" style={{ color: "var(--status-pending-color)" }}>Pending</div>
            <div className="stat-value">{loading ? "–" : stats?.pending}</div>
            <div className="stat-sub">Under review</div>
          </div>
        </div>

        <div style={{ marginTop: "12px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Use the sidebar to manage <a href="/admin/users" style={{ color: "#3b82f6" }}>Users</a> and <a href="/admin/submissions" style={{ color: "#3b82f6" }}>Submissions</a>.
          </p>
        </div>
      </div>
    </>
  );
}

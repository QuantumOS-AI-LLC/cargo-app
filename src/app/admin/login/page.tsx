"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid credentials. Only admin users can access this panel.");
    } else {
      // After sign in, check role and redirect
      const res = await fetch("/api/admin/stats");
      if (res.status === 403) {
        setError("Access denied. You do not have admin privileges.");
      } else {
        router.push("/admin");
        router.refresh();
      }
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">🔐</div>
        <h1 className="auth-title">Admin Panel</h1>
        <p className="auth-subtitle">CargoDeductible Admin Access</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginTop: "8px" }}>
            <label className="form-label">Email</label>
            <div className="form-input-wrapper">
              <span className="input-icon">✉️</span>
              <input
                id="admin-email"
                type="email"
                className="form-input"
                placeholder="admin@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="form-input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                id="admin-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in to Admin"}
          </button>
        </form>

        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <Link href="/login" className="auth-link" style={{ fontSize: "12px" }}>← Back to user login</Link>
        </div>
      </div>
    </div>
  );
}

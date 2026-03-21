"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordForm({ token, email }: { token: string, email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to reset password. The link might be expired.");
    } else {
      router.push("/login?reset=success");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "24px" }}>
      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px", background: "var(--bg-secondary)", padding: "8px 12px", borderRadius: "6px" }}>
        Resetting password for: <strong>{email}</strong>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label className="form-label">New Password</label>
        <div className="form-input-wrapper">
          <span className="input-icon">🔒</span>
          <input
            type="password"
            className="form-input"
            placeholder="Min. 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoCapitalize="none"
            autoCorrect="off"
            autoFocus
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Confirm Password</label>
        <div className="form-input-wrapper">
          <span className="input-icon">🔒</span>
          <input
            type="password"
            className="form-input"
            placeholder="Re-enter password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>
      </div>

      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? "Resetting password..." : "Reset password"}
      </button>
    </form>
  );
}

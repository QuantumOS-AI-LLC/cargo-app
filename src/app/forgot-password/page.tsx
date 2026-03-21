"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setLoading(false);
      if (!res.ok) {
        setError("Failed to send reset link. Please try again.");
      } else {
        setSent(true);
      }
    } catch (err) {
      setLoading(false);
      setError("An unexpected error occurred.");
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <Link href="/login" className="auth-back">
          ← Back to sign in
        </Link>
        <h1 className="auth-title">Reset your password</h1>
        <p className="auth-subtitle" style={{ textAlign: "left", marginBottom: "24px" }}>
          Enter your email and we&apos;ll send you a link to reset your password
        </p>

        {sent ? (
          <div className="success-message">
            ✓ If an account exists for {email}, we&apos;ve sent a password reset link.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            <div className="form-group" style={{ marginTop: error ? "16px" : 0 }}>
              <label className="form-label" style={{ textAlign: "left" }}>Email</label>
              <div className="form-input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  id="reset-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

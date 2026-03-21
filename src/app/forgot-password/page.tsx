"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate sending reset link (no email service configured yet)
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
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
            <div className="form-group">
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

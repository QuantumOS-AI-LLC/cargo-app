"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

type CargoType = "HARD_DURABLE" | "CLOTHES_APPAREL";
type ShippingMode = "SEA" | "AIR" | "LAND";
type ContainerGrade = "NEW" | "ONE_TRIP" | "CARGO_WORTHY" | "WIND_WATER_TIGHT";

export default function GetCoveragePage() {
  const router = useRouter();
  const [cargoType, setCargoType] = useState<CargoType>("HARD_DURABLE");
  const [shippingMode, setShippingMode] = useState<ShippingMode>("SEA");
  const [containerGrade, setContainerGrade] = useState<ContainerGrade>("CARGO_WORTHY");
  const [isInternational, setIsInternational] = useState(false);
  const [showSecond, setShowSecond] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "", company: "", email: "", phone: "",
    cargoSize: "", cargoValue: "", startPort: "", endPort: "",
    deductibleAmount: "", insurancePremium: "", deductible2: "", premium2: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        cargoType, shippingMode, containerGrade, isInternational,
        cargoValue: parseFloat(form.cargoValue),
        deductibleAmount: parseFloat(form.deductibleAmount),
        insurancePremium: parseFloat(form.insurancePremium),
        deductible2: showSecond && form.deductible2 ? parseFloat(form.deductible2) : null,
        premium2: showSecond && form.premium2 ? parseFloat(form.premium2) : null,
      }),
    });
    setLoading(false);
    
    const d = await res.json();
    if (!res.ok) {
      setError(d.error || "Failed to submit application.");
    } else {
      try {
        if (typeof window !== "undefined" && (window as any).Refferq) {
          const promiseOrVoid = (window as any).Refferq.trackConversion({
            email: form.email,
            name: form.fullName,
            amount: Math.round((d.application?.adminFee || 0) * 100), // convert to cents
            currency: 'USD',
            orderId: d.application?.id // use application ID as orderId
          });
          if (promiseOrVoid instanceof Promise) {
            await promiseOrVoid;
          } else {
             await new Promise(r => setTimeout(r, 800)); // Give network time to send
          }
        }
      } catch (e) {
        console.error("Refferq tracking error:", e);
      }
      router.push("/dashboard");
    }
  }

  const feeRate = isInternational ? 3.25 : 2.5;

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
            <Link href="/get-coverage" className="nav-link" style={{ color: "var(--navy)", fontWeight: 600 }}>Get Coverage</Link>
            <Link href="/dashboard" className="nav-link">Dashboard</Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)", fontFamily: "inherit", padding: "6px 12px" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <div className="coverage-hero">
          <div className="coverage-icons">🚢 ✈️ 🚛</div>
          <h1 className="coverage-title">We cover your cargo<br />deductible.</h1>
          <p className="coverage-subtitle">
            No out-of-pocket costs on catastrophic claims. Just a small admin fee — so you <em>ship</em> with confidence.
          </p>
          <div className="coverage-rates">
            <span><span className="rate-dot" style={{ background: "#3b82f6" }}></span>{feeRate}% {isInternational ? "International" : "Domestic"}</span>
            <span><span className="rate-dot" style={{ background: "#8b5cf6" }}></span>2.5% Domestic · 3.25% International</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="coverage-form-card">
            {error && <div className="error-message" style={{ marginBottom: "20px" }}>{error}</div>}

            {/* Cargo Type */}
            <div className="form-section">
              <p className="form-section-title">Cargo Type</p>
              <div className="selection-grid selection-grid-2">
                <button type="button" className={`select-card ${cargoType === "HARD_DURABLE" ? "selected" : ""}`} onClick={() => setCargoType("HARD_DURABLE")}>
                  <span className="select-card-icon">📦</span>
                  <span className="select-card-label">Hard / Durable Goods</span>
                  <span className="select-card-desc">Non-electric durable goods</span>
                </button>
                <button type="button" className={`select-card ${cargoType === "CLOTHES_APPAREL" ? "selected" : ""}`} onClick={() => setCargoType("CLOTHES_APPAREL")}>
                  <span className="select-card-icon">👕</span>
                  <span className="select-card-label">Clothes & Apparel</span>
                  <span className="select-card-desc">Garments, textures & fashion</span>
                </button>
              </div>
            </div>

            {/* Shipping Mode */}
            <div className="form-section">
              <p className="form-section-title">Shipping Mode</p>
              <div className="selection-grid selection-grid-3">
                {(["SEA", "AIR", "LAND"] as ShippingMode[]).map(mode => (
                  <button type="button" key={mode} className={`select-card ${shippingMode === mode ? "selected" : ""}`} onClick={() => setShippingMode(mode)}>
                    <span className="select-card-icon">{mode === "SEA" ? "🚢" : mode === "AIR" ? "✈️" : "🚛"}</span>
                    <span className="select-card-label">{mode.charAt(0) + mode.slice(1).toLowerCase()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Applicant Information */}
            <div className="form-section">
              <p className="form-section-title">Applicant Information</p>
              <div className="input-grid-2" style={{ marginBottom: "12px" }}>
                <div className="inline-input-group">
                  <label className="inline-label">Full Name *</label>
                  <input type="text" name="fullName" className="field-input" placeholder="John Smith" value={form.fullName} onChange={handleChange} required />
                </div>
                <div className="inline-input-group">
                  <label className="inline-label">Company *</label>
                  <input type="text" name="company" className="field-input" placeholder="Acme Freight LLC" value={form.company} onChange={handleChange} required />
                </div>
              </div>
              <div className="input-grid-2">
                <div className="inline-input-group">
                  <label className="inline-label">Email</label>
                  <input type="email" name="email" className="field-input" placeholder="john@acmefreight.com" value={form.email} onChange={handleChange} required />
                </div>
                <div className="inline-input-group">
                  <label className="inline-label">Phone</label>
                  <input type="tel" name="phone" className="field-input" placeholder="+1 (555) 000-0000" value={form.phone} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Shipment Details */}
            <div className="form-section">
              <p className="form-section-title">Shipment Details</p>
              <div className="input-grid-2" style={{ marginBottom: "12px" }}>
                <div className="inline-input-group">
                  <label className="inline-label">Cargo Size / Dimensions *</label>
                  <input type="text" name="cargoSize" className="field-input" placeholder="e.g. 40ft container: 2 pallets" value={form.cargoSize} onChange={handleChange} required />
                </div>
                <div className="inline-input-group">
                  <label className="inline-label">Cargo Value *</label>
                  <div className="dollar-input-wrapper">
                    <span className="dollar-prefix">$</span>
                    <input type="number" name="cargoValue" className="field-input dollar-input" placeholder="150,000" value={form.cargoValue} onChange={handleChange} required min="0" />
                  </div>
                </div>
              </div>
              <div className="input-grid-2">
                <div className="inline-input-group">
                  <label className="inline-label">Starting Port / Location *</label>
                  <input type="text" name="startPort" className="field-input" placeholder="Port of Los Angeles" value={form.startPort} onChange={handleChange} required />
                </div>
                <div className="inline-input-group">
                  <label className="inline-label">Ending Port / Location *</label>
                  <input type="text" name="endPort" className="field-input" placeholder="Port of Rotterdam" value={form.endPort} onChange={handleChange} required />
                </div>
              </div>
            </div>

            {/* Container Grade */}
            <div className="form-section">
              <p className="form-section-title">Container Grade</p>
              <div className="selection-grid selection-grid-4">
                {[
                  { key: "NEW", label: "New", desc: "One-time-use, factory condition" },
                  { key: "ONE_TRIP", label: "One Trip", desc: "Used once, excellent condition" },
                  { key: "CARGO_WORTHY", label: "Cargo Worthy", desc: "Certified for international shipping" },
                  { key: "WIND_WATER_TIGHT", label: "Wind & Water Tight", desc: "Basic weatherproofed condition" },
                ] .map(g => (
                  <button type="button" key={g.key} className={`select-card ${containerGrade === g.key ? "selected" : ""}`} onClick={() => setContainerGrade(g.key as ContainerGrade)} style={{ textAlign: "left", alignItems: "flex-start" }}>
                    <span className="select-card-label" style={{ fontSize: "12px" }}>{g.label}</span>
                    <span className="select-card-desc">{g.desc}</span>
                  </button>
                ))}
              </div>

              {/* International Toggle */}
              <div className="toggle-row">
                <div>
                  <div className="toggle-label">International Shipment</div>
                  <div className="toggle-desc">3.25% admin fee applies</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={isInternational} onChange={e => setIsInternational(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            {/* Insurance Details */}
            <div className="form-section">
              <p className="form-section-title">Insurance Details</p>
              <div className="input-grid-2" style={{ marginBottom: "12px" }}>
                <div className="inline-input-group">
                  <label className="inline-label">Deductible Amount *</label>
                  <div className="dollar-input-wrapper">
                    <span className="dollar-prefix">$</span>
                    <input type="number" name="deductibleAmount" className="field-input dollar-input" placeholder="25,000" value={form.deductibleAmount} onChange={handleChange} required min="0" />
                  </div>
                </div>
                <div className="inline-input-group">
                  <label className="inline-label">Insurance Premium *</label>
                  <div className="dollar-input-wrapper">
                    <span className="dollar-prefix">$</span>
                    <input type="number" name="insurancePremium" className="field-input dollar-input" placeholder="5,000" value={form.insurancePremium} onChange={handleChange} required min="0" />
                  </div>
                </div>
              </div>

              {!showSecond ? (
                <span className="optional-link" onClick={() => setShowSecond(true)}>
                  + Have a second status title/premium option to compare? (Optional)
                </span>
              ) : (
                <div className="input-grid-2">
                  <div className="inline-input-group">
                    <label className="inline-label">Deductible #2</label>
                    <div className="dollar-input-wrapper">
                      <span className="dollar-prefix">$</span>
                      <input type="number" name="deductible2" className="field-input dollar-input" placeholder="10,000" value={form.deductible2} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="inline-input-group">
                    <label className="inline-label">Premium #2</label>
                    <div className="dollar-input-wrapper">
                      <span className="dollar-prefix">$</span>
                      <input type="number" name="premium2" className="field-input dollar-input" placeholder="4,000" value={form.premium2} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" className={`submit-btn ${form.fullName && form.deductibleAmount ? "ready" : ""}`} disabled={loading}>
              {loading ? "Submitting..." : "Submit Application →"}
            </button>
            <p className="submit-disclaimer">
              By submitting, you agree to our Terms of Service and acknowledge that CargoDeductible is not an insurance provider. Admin fees are non-refundable.
            </p>
          </div>
        </form>
      </main>

      <footer className="footer">
        © 2026 <a href={process.env.NEXT_PUBLIC_APP_URL || "/"}>CargoDeductible</a> — We cover your deductible so you don&apos;t have out-of-pocket costs.
      </footer>
    </div>
  );
}

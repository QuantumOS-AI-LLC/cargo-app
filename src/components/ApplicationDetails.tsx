"use client";

import { useState } from "react";

type Application = {
  id: string;
  fullName: string;
  company: string;
  startPort: string;
  endPort: string;
  deductibleAmount: number;
  insurancePremium: number;
  deductible2?: number | null;
  premium2?: number | null;
  adminFee: number;
  isPaid: boolean;
  status: string;
  isInternational: boolean;
  // Stripe receipt data
  stripePaymentId?: string | null;
  stripeChargeId?: string | null;
  stripeReceiptUrl?: string | null;
  stripeCardBrand?: string | null;
  stripeCardLast4?: string | null;
  paidAt?: string | null;
  // Manual payment data
  manualPaymentRef?: string | null;
  manualPaymentNote?: string | null;
  manualPaymentBy?: string | null;
};

function formatMoney(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatMoneyCents(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ApplicationDetails({ application }: { application: Application }) {
  const [openAccordion, setOpenAccordion] = useState<string | null>("policy");
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to initiate payment.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const toggle = (id: string) => setOpenAccordion(openAccordion === id ? null : id);

  return (
    <div className="details-container">
      {/* Quote Summary */}
      <div className="quote-card">
        <div className="quote-header">
          <span>ⓘ</span> QUOTE SUMMARY
        </div>
        
        <div className="quote-row">
          <span className="quote-label">Deductible Amount</span>
          <span className="quote-value">{formatMoney(application.deductibleAmount)}</span>
        </div>
        <div className="quote-row">
          <span className="quote-label">Insurance Premium</span>
          <span className="quote-value">{formatMoney(application.insurancePremium)}</span>
        </div>
        
        {application.deductible2 && (
          <div className="quote-row">
            <span className="quote-label">Deductible #2</span>
            <span className="quote-value">{formatMoney(application.deductible2)}</span>
          </div>
        )}
        {application.premium2 && (
          <div className="quote-row">
            <span className="quote-label">Premium #2</span>
            <span className="quote-value">{formatMoney(application.premium2)}</span>
          </div>
        )}

        <div className="quote-row">
          <span className="quote-label">Route Type</span>
          <span className="quote-value" style={{ color: "#60a5fa" }}>
            {application.isInternational ? "International" : "Domestic"}
          </span>
        </div>
        <div className="quote-row">
          <span className="quote-label">Admin Fee Rate</span>
          <span className="quote-value" style={{ color: "#60a5fa" }}>
            {application.isInternational ? "3.25%" : "2.5%"} <span style={{fontSize: "12px", color: "rgba(255,255,255,0.4)"}}>+ 0.1% per 1,000km</span>
          </span>
        </div>

        <div style={{ marginTop: "16px", padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", fontSize: "11px", color: "rgba(255,255,255,0.5)", lineHeight: "1.5" }}>
          ⓘ Final rate = {application.isInternational ? "3.25%" : "2.5%"} + 0.1% per 1,000km port-to-port. Exact rate determined after route confirmation.
        </div>

        <div className="quote-row total">
          <div>
            <div className="quote-total-label">Your Admin Fee</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
              {application.isInternational ? "3.25%" : "2.5%"} of {formatMoney(application.deductibleAmount)} deductible
            </div>
          </div>
          <div className="quote-total-value">{formatMoneyCents(application.adminFee)}</div>
        </div>

        {application.premium2 && application.insurancePremium > application.premium2 && (
          <div className="savings-banner">
            <div className="savings-icon">📉</div>
            <div>
              <div className="savings-text">Net savings with Option 2: {formatMoneyCents(application.insurancePremium - application.premium2 - application.adminFee)}</div>
              <div className="savings-sub">Lower premium saving ({formatMoney(application.insurancePremium - application.premium2)}) minus admin fee ({formatMoneyCents(application.adminFee)})</div>
            </div>
          </div>
        )}
      </div>

      {/* Pay Button (if not paid) */}
      {!application.isPaid ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
          <button className="checkout-btn" onClick={handlePay} disabled={loading} style={{ margin: 0 }}>
            <span>💳</span> {loading ? "Connecting to Stripe..." : `Get CargoDeductible Plan — ${formatMoneyCents(application.adminFee)}`}
          </button>
          
          {application.status !== "APPROVED" && application.status !== "REJECTED" && (
             <a 
               href={`/get-coverage?edit=${application.id}`}
               className="action-btn"
               style={{ 
                 margin: 0, display: "block", textAlign: "center", textDecoration: "none", 
                 background: "rgba(255,255,255,0.05)", color: "white", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" 
               }}
             >
               ✏️ Edit Application Specs
             </a>
          )}
        </div>
      ) : (
        /* Payment Receipt Card */
        <div style={{ marginTop: "24px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "16px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: "20px" }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, color: "#10b981", fontSize: "15px" }}>Payment Confirmed</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                {application.paidAt ? new Date(application.paidAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }) : ""}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
            {/* Payment Method */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)" }}>Payment Method</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                {application.manualPaymentRef
                  ? "🏦 Manual / Offline"
                  : `💳 ${application.stripeCardBrand ? application.stripeCardBrand.charAt(0).toUpperCase() + application.stripeCardBrand.slice(1) : "Card"} ···· ${application.stripeCardLast4 || "****"}`}
              </span>
            </div>

            {/* Payment Intent ID (Stripe only) */}
            {application.stripePaymentId && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ color: "var(--text-secondary)" }}>Payment Intent ID</span>
                <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#2563eb", background: "#eff6ff", padding: "3px 8px", borderRadius: "6px", wordBreak: "break-all" }}>
                  {application.stripePaymentId}
                </span>
              </div>
            )}

            {/* Charge ID (Stripe only) */}
            {application.stripeChargeId && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ color: "var(--text-secondary)" }}>Charge ID</span>
                <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#2563eb", background: "#eff6ff", padding: "3px 8px", borderRadius: "6px", wordBreak: "break-all" }}>
                  {application.stripeChargeId}
                </span>
              </div>
            )}

            {/* Manual Payment Ref */}
            {application.manualPaymentRef && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Transaction Ref</span>
                <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#92400e", background: "#fef3c7", padding: "3px 8px", borderRadius: "6px" }}>
                  {application.manualPaymentRef}
                </span>
              </div>
            )}

            {/* Manual Payment Note */}
            {application.manualPaymentNote && (
              <div style={{ marginTop: "4px", padding: "10px", background: "var(--border-light)", borderRadius: "8px", fontSize: "12px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                {application.manualPaymentNote}
              </div>
            )}

            {/* Amount */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text-secondary)" }}>Amount Paid</span>
              <span style={{ fontWeight: 700, color: "#10b981", fontSize: "16px" }}>{formatMoneyCents(application.adminFee)}</span>
            </div>

            {/* View Stripe Receipt Button */}
            {application.stripeReceiptUrl && (
              <a
                href={application.stripeReceiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: "8px", display: "block", textAlign: "center", padding: "10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", color: "#1d4ed8", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}
              >
                🧾 View Official Stripe Receipt ↗
              </a>
            )}
          </div>
        </div>
      )}

      {/* Accordions */}
      <div className="accordion">
        {/* Policy */}
        <div className="accordion-item">
          <button className="accordion-trigger" onClick={() => toggle("policy")}>
            <div className="accordion-title-group">
              <div className="accordion-icon">📄</div>
              <span className="accordion-title">Your Coverage Policy</span>
            </div>
            <span>{openAccordion === "policy" ? "▴" : "▾"}</span>
          </button>
          {openAccordion === "policy" && (
            <div className="accordion-content">
              <p>CargoDeductible provides coverage for your cargo insurance deductible in the event of a catastrophic claim. Upon approval of your application and payment of the admin fee, your deductible is covered for the duration of your cargo insurance policy term.</p>
              <p>Coverage applies to the specific shipment detailed in your application. The maximum coverage amount equals your stated deductible amount. Coverage begins once payment is confirmed and remains active for the policy term associated with your cargo insurance.</p>
              <p>This is not an insurance product. CargoDeductible is a deductible reimbursement program that covers your out-of-pocket deductible expense when a qualifying claim is filed and approved by your primary cargo insurer.</p>
            </div>
          )}
        </div>

        {/* Claim */}
        <div className="accordion-item">
          <button className="accordion-trigger" onClick={() => toggle("claim")}>
            <div className="accordion-title-group">
              <div className="accordion-icon">⚠️</div>
              <span className="accordion-title">How to File a Claim</span>
            </div>
            <span>{openAccordion === "claim" ? "▴" : "▾"}</span>
          </button>
          {openAccordion === "claim" && (
            <div className="accordion-content">
              <p>To file a claim for deductible reimbursement, please follow these steps:</p>
              <ol>
                <li>File your primary claim with your cargo insurer immediately.</li>
                <li>Once your primary claim is settled and the deductible is applied, notify CargoDeductible via your dashboard.</li>
                <li>Upload the Settlement Letter from your primary insurer.</li>
                <li>Our team will review the documents and process your reimbursement within 5-7 business days.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="accordion-item">
          <button className="accordion-trigger" onClick={() => toggle("terms")}>
            <div className="accordion-title-group">
              <div className="accordion-icon">🛡️</div>
              <span className="accordion-title">Terms & Disclaimers</span>
            </div>
            <span>{openAccordion === "terms" ? "▴" : "▾"}</span>
          </button>
          {openAccordion === "terms" && (
            <div className="accordion-content">
              <p>CargoDeductible is NOT an insurance company and does not sell insurance products. We provide a deductible reimbursement program.</p>
              <p>Coverage is limited to the deductible amount stated in your application. CargoDeductible is not responsible for any amounts exceeding the stated deductible.</p>
              <strong>Exclusions:</strong>
              <ul>
                <li>Perishable goods are not eligible for coverage</li>
                <li>Electronic goods are not eligible for coverage</li>
                <li>Claims resulting from fraud, intentional damage, or negligence</li>
                <li>Shipments not properly documented or insured</li>
                <li>Claims filed more than 30 days after primary insurer approval</li>
              </ul>
              <p>Admin fees are non-refundable once payment is processed. CargoDeductible reserves the right to deny coverage if application information is found to be inaccurate or fraudulent.</p>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ textAlign: "center", marginTop: "32px", paddingBottom: "40px" }}>
        <a href="/get-coverage" style={{ color: "var(--text-secondary)", fontSize: "12px", textDecoration: "none" }}>Submit Another Application</a>
      </div>
    </div>
  );
}

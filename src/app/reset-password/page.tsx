import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ResetPasswordForm from "./reset-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token;

  if (!token) {
    return <InvalidTokenMessage message="Invalid or missing reset token." />;
  }

  // Find token in DB
  const dbToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!dbToken) {
    return <InvalidTokenMessage message="Invalid or unrecognized reset token." />;
  }

  // Check if token is expired
  if (dbToken.expires < new Date()) {
    // Optionally delete the expired token
    await prisma.verificationToken.delete({ where: { token } });
    return <InvalidTokenMessage message="This password reset link has expired." />;
  }

  // Valid token! Render the client form
  return (
    <div className="auth-bg">
      <div className="auth-card">
        <h1 className="auth-title">Create new password</h1>
        <p className="auth-subtitle" style={{ marginTop: "8px" }}>
          Please enter your new password below.
        </p>

        <ResetPasswordForm token={token} email={dbToken.identifier} />
      </div>
    </div>
  );
}

function InvalidTokenMessage({ message }: { message: string }) {
  return (
    <div className="auth-bg">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
        <h1 className="auth-title">Invalid Link</h1>
        <p className="auth-subtitle" style={{ marginTop: "12px", marginBottom: "24px" }}>
          {message}
        </p>
        <Link href="/forgot-password" className="btn-primary" style={{ display: "inline-block", textDecoration: "none", width: "100%" }}>
          Request a new link
        </Link>
        <div style={{ marginTop: "16px" }}>
          <Link href="/login" className="auth-link">Return to sign in</Link>
        </div>
      </div>
    </div>
  );
}

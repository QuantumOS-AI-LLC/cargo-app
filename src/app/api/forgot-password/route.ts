import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return 200 even if user not found to prevent email scanning/enumeration
      return NextResponse.json({ message: "If an account exists, a reset link has been sent." });
    }

    // Generate unique token and set expiration to 10 minutes from now
    const token = uuidv4();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    // Save token to database (overwriting any existing token for this email)
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Reset Your Password</h2>
        <p>You requested a password reset for your CargoDeductible account.</p>
        <p>Click the button below to reset your password. This link is valid for <strong>10 minutes</strong>.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
        <p style="color: #666; font-size: 12px; margin-top: 40px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          ${resetUrl}
        </p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Reset your CargoDeductible password",
      html,
    });

    return NextResponse.json({ message: "If an account exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

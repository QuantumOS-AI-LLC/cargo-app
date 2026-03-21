import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password too short" }, { status: 400 });
    }

    // 1. Verify token exists and is valid
    const dbToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!dbToken) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    if (dbToken.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Update User password
    await prisma.user.update({
      where: { email: dbToken.identifier },
      data: { password: hashedPassword },
    });

    // 4. Delete the used token
    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

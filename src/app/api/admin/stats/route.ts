import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [totalUsers, totalApplications, submitted, approved, rejected, pending] =
    await Promise.all([
      prisma.user.count(),
      prisma.application.count(),
      prisma.application.count({ where: { status: "SUBMITTED" } }),
      prisma.application.count({ where: { status: "APPROVED" } }),
      prisma.application.count({ where: { status: "REJECTED" } }),
      prisma.application.count({ where: { status: "PENDING" } }),
    ]);

  return NextResponse.json({
    stats: { totalUsers, totalApplications, submitted, approved, rejected, pending },
  });
}

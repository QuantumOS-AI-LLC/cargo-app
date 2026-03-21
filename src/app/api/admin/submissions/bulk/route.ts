import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { action, applicationIds, status } = await req.json();

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json({ error: "No applications selected" }, { status: 400 });
    }

    if (action === "DELETE") {
      await prisma.application.deleteMany({
        where: { id: { in: applicationIds } },
      });
      return NextResponse.json({ success: true, count: applicationIds.length });
    }

    if (action === "UPDATE_STATUS") {
      if (!status) return NextResponse.json({ error: "Status required" }, { status: 400 });
      await prisma.application.updateMany({
        where: { id: { in: applicationIds } },
        data: { status },
      });
      return NextResponse.json({ success: true, count: applicationIds.length });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Bulk action error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

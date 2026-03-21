import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const applications = await prisma.application.findMany({
    where: status ? { status: status as any } : {},
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { applicationId, status, adminNotes } = await req.json();

  const application = await prisma.application.update({
    where: { id: applicationId },
    data: { status, adminNotes },
  });

  return NextResponse.json({ application });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const applicationId = searchParams.get("applicationId");
  if (!applicationId) return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });

  await prisma.application.delete({ where: { id: applicationId } });
  return NextResponse.json({ success: true });
}

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
    include: { user: { select: { name: true, email: true, affiliateId: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { applicationId, status, adminNotes, manualPayment, manualPaymentRef, manualPaymentNote } = body;

  const updateData: any = {};

  // Standard status/notes update
  if (status !== undefined) updateData.status = status;
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

  // Manual payment override
  if (manualPayment === true) {
    updateData.isPaid = true;
    updateData.paidAt = new Date();
    updateData.manualPaymentRef = manualPaymentRef || null;
    updateData.manualPaymentNote = manualPaymentNote || null;
    updateData.manualPaymentBy = (session.user as any).email || (session.user as any).name || "Admin";
    // Also approve if marking as paid
    if (!body.status) updateData.status = "APPROVED";
  }

  const application = await prisma.application.update({
    where: { id: applicationId },
    data: updateData,
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

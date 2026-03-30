import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ application });
  } catch (err) {
    console.error("Error fetching application:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (application.isPaid) {
      return NextResponse.json({ error: "Cannot edit an already paid application" }, { status: 400 });
    }

    if (application.status === "APPROVED" || application.status === "REJECTED") {
      return NextResponse.json({ error: "Cannot edit this application because it has been processed." }, { status: 400 });
    }

    const body = await req.json();

    const baseRate = body.isInternational ? 0.0325 : 0.025;
    const adminFee = body.deductibleAmount * baseRate;

    const updated = await prisma.application.update({
      where: { id },
      data: {
        fullName: body.fullName,
        company: body.company,
        email: body.email,
        phone: body.phone,
        cargoType: body.cargoType,
        shippingMode: body.shippingMode,
        cargoSize: body.cargoSize,
        cargoValue: body.cargoValue,
        startPort: body.startPort,
        endPort: body.endPort,
        containerGrade: body.containerGrade,
        isInternational: body.isInternational,
        deductibleAmount: body.deductibleAmount,
        insurancePremium: body.insurancePremium,
        deductible2: body.deductible2,
        premium2: body.premium2,
        adminFee,
      },
    });

    return NextResponse.json({ application: updated });
  } catch (err) {
    console.error("Error updating application:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

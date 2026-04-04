import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const {
      fullName, company, email, phone,
      cargoType, shippingMode, cargoSize, cargoValue,
      startPort, endPort, containerGrade, isInternational,
      deductibleAmount, insurancePremium, deductible2, premium2,
    } = body;

    // Calculate admin fee: 2.5% domestic, 3.25% international
    const feeRate = isInternational ? 0.0325 : 0.025;
    const adminFee = deductibleAmount * feeRate;

    const cookieStore = await cookies();
    const referralId = cookieStore.get("refref-refcode")?.value || null;

    const application = await prisma.application.create({
      data: {
        userId,
        fullName,
        company,
        email,
        phone,
        cargoType,
        shippingMode,
        cargoSize,
        cargoValue: Number(cargoValue),
        startPort,
        endPort,
        containerGrade: containerGrade || "CARGO_WORTHY",
        isInternational: Boolean(isInternational),
        deductibleAmount: Number(deductibleAmount),
        insurancePremium: Number(insurancePremium),
        deductible2: deductible2 ? Number(deductible2) : null,
        premium2: premium2 ? Number(premium2) : null,
        adminFee,
        status: "SUBMITTED",
        referred_by: referralId,
      },
    });

    // Fire webhook for new application submission (full record)
    import("@/lib/webhook").then(({ sendWebhook }) => {
      sendWebhook("application.submitted", application);
    });

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error) {
    console.error("Application error:", error);
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const applications = await prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Get applications error:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

import { buffer } from "node:stream/consumers";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  const session = event.data.object as any;

  if (event.type === "checkout.session.completed") {
    const applicationId = session.metadata.applicationId;

    if (!applicationId) {
      console.error("No applicationId in session metadata");
      return NextResponse.json({ error: "No applicationId in session metadata" }, { status: 400 });
    }

    // Update application as paid
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        isPaid: true,
        stripePaymentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
        paidAt: new Date(),
        status: "APPROVED", // Automatically approve if paid? (User preference)
      },
    });

    console.log(`Application ${applicationId} marked as paid.`);
  }

  return NextResponse.json({ received: true });
}

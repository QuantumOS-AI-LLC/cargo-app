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

    // Retrieve full payment intent with charge details
    let stripeChargeId: string | null = null;
    let stripeReceiptUrl: string | null = null;
    let stripeCardBrand: string | null = null;
    let stripeCardLast4: string | null = null;
    const stripePaymentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

    try {
      if (stripePaymentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentId, {
          expand: ["latest_charge"],
        });
        const charge = paymentIntent.latest_charge as any;
        if (charge) {
          stripeChargeId = charge.id ?? null;
          stripeReceiptUrl = charge.receipt_url ?? null;
          stripeCardBrand = charge.payment_method_details?.card?.brand ?? null;
          stripeCardLast4 = charge.payment_method_details?.card?.last4 ?? null;
        }
      }
    } catch (err) {
      console.error("Failed to retrieve charge details:", err);
    }

    // Update application as paid with full receipt data
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        isPaid: true,
        stripePaymentId,
        stripeChargeId,
        stripeReceiptUrl,
        stripeCardBrand,
        stripeCardLast4,
        paidAt: new Date(),
        status: "APPROVED",
      },
    });

    console.log(`Application ${applicationId} marked as paid (Charge: ${stripeChargeId}).`);
  }

  return NextResponse.json({ received: true });
}

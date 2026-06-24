import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
// مهم: نحتاج الجسم الخام (raw body) للتحقق من توقيع Stripe.
export const dynamic = "force-dynamic";

export async function POST(request) {
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET غير معرّف.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event;
  try {
    const stripe = getStripe();
    // نقرأ الجسم كنص خام للتحقق من التوقيع.
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("فشل التحقق من توقيع Webhook:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;

        // نحدّد الطلب عبر orderId (الأساس) أو عبر معرّف الجلسة (احتياط).
        const where = orderId ? { id: orderId } : { stripeSessionId: session.id };

        await prisma.order.updateMany({
          where,
          data: {
            status: "paid",
            stripeSessionId: session.id,
          },
        });
        break;
      }

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        const where = orderId ? { id: orderId } : { stripeSessionId: session.id };
        await prisma.order.updateMany({
          where,
          data: { status: "failed" },
        });
        break;
      }

      default:
        // نتجاهل بقية الأحداث.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("خطأ في معالجة حدث Webhook:", e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

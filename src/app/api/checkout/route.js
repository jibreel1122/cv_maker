import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getStripe, getPriceInCents } from "@/lib/stripe";
import { extractCustomer } from "@/lib/cvDefaults";
import { TEMPLATES } from "@/lib/cvTemplates";

export const runtime = "nodejs";

// ينشئ جلسة Stripe Checkout ويخزّن طلبًا بحالة pending مع كامل بيانات السيرة.
export async function POST(request) {
  try {
    const body = await request.json();
    const { cvData, templateId, language } = body || {};

    // تحقق أساسي من المدخلات
    if (!cvData || typeof cvData !== "object") {
      return NextResponse.json({ error: "بيانات السيرة الذاتية مفقودة." }, { status: 400 });
    }
    const validTemplate = TEMPLATES.some((t) => t.id === templateId);
    const tpl = validTemplate ? templateId : "classic";
    const lang = language === "en" ? "en" : "ar";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const amount = getPriceInCents();
    const currency = (process.env.PRODUCT_CURRENCY || "usd").toLowerCase();
    const { customerName, customerEmail } = extractCustomer(cvData);

    // 1) ننشئ الطلب أولًا بمعرّف جلسة مؤقّت (سيُستبدل بمعرّف Stripe الفعلي).
    const order = await prisma.order.create({
      data: {
        stripeSessionId: `temp_${crypto.randomUUID()}`,
        status: "pending",
        amount,
        currency,
        templateId: tpl,
        language: lang,
        cvData: JSON.stringify(cvData),
        customerName,
        customerEmail,
      },
    });

    // 2) ننشئ جلسة Stripe ونضع orderId في metadata (مصدر الحقيقة في الـ webhook).
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: "سيرة ذاتية احترافية (PDF) — سيرتي",
              description: "ملف PDF نهائي متوافق مع ATS",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/build?canceled=1`,
      client_reference_id: order.id,
      metadata: { orderId: order.id },
    });

    // 3) نربط معرّف جلسة Stripe الفعلي بالطلب.
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (e) {
    console.error("checkout error:", e);
    return NextResponse.json(
      { error: e.message || "حدث خطأ أثناء إنشاء جلسة الدفع." },
      { status: 500 }
    );
  }
}

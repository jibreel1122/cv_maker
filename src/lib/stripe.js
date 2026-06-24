import Stripe from "stripe";

// عميل Stripe يُنشأ فقط على السيرفر. لا تستورد هذا الملف في كود العميل.
let stripeClient = null;

export function getStripe() {
  if (stripeClient) return stripeClient;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY غير معرّف. أضِفه في .env.local قبل تشغيل الدفع."
    );
  }

  stripeClient = new Stripe(key, {
    apiVersion: "2024-06-20",
  });
  return stripeClient;
}

// سعر المنتج بالسنت (من متغير البيئة، الافتراضي 5 دولار).
export function getPriceInCents() {
  const usd = parseFloat(process.env.PRODUCT_PRICE_USD || "5");
  return Math.round(usd * 100);
}

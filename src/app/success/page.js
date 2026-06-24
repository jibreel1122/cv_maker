"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Download, AlertTriangle, Sparkles } from "lucide-react";

function SuccessInner() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  const [state, setState] = useState("loading"); // loading | paid | pending | error
  const [orderId, setOrderId] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setState("error");
      return;
    }

    let attempts = 0;
    let timer;
    let cancelled = false;

    // نتحقق من حالة الطلب من قاعدة البيانات (مصدر الحقيقة = الـ webhook).
    // الـ webhook قد يتأخّر جزء ثانية، لذا نعيد المحاولة كل ثانيتين لبضع مرات.
    async function check() {
      try {
        const res = await fetch(`/api/order-status?session_id=${encodeURIComponent(sessionId)}`);
        const json = await res.json();
        if (cancelled) return;

        if (json.status === "paid") {
          setOrderId(json.orderId);
          setState("paid");
          return;
        }

        setOrderId(json.orderId || null);
        attempts += 1;
        if (attempts >= 8) {
          setState("pending");
          return;
        }
        setState("pending");
        timer = setTimeout(check, 2000);
      } catch {
        if (cancelled) return;
        attempts += 1;
        if (attempts >= 8) {
          setState("error");
          return;
        }
        timer = setTimeout(check, 2000);
      }
    }

    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sessionId]);

  async function handleDownload() {
    if (!orderId) return;
    setDownloading(true);
    try {
      // نفتح المسار مباشرة ليبدأ التحميل.
      window.location.href = `/api/generate-pdf?orderId=${encodeURIComponent(orderId)}`;
    } finally {
      setTimeout(() => setDownloading(false), 4000);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-midnight-deep px-6">
      <div className="card w-full max-w-lg text-center">
        <Link href="/" className="mb-6 inline-flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-gold" />
          <span className="font-display text-2xl font-extrabold text-cream">سيرتي</span>
        </Link>

        {state === "loading" || (state === "pending" && !orderId) ? (
          <div className="py-8">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-gold" />
            <h1 className="mt-5 font-display text-2xl font-bold text-cream">
              جاري تأكيد الدفع...
            </h1>
            <p className="mt-2 text-cream/70">لحظة من فضلك، نتحقق من عملية الدفع.</p>
          </div>
        ) : state === "pending" ? (
          <div className="py-8">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-gold" />
            <h1 className="mt-5 font-display text-2xl font-bold text-cream">
              جاري تأكيد الدفع...
            </h1>
            <p className="mt-2 text-cream/70">
              قد يستغرق التأكيد بضع ثوانٍ. إن طالت المدة، حدّث الصفحة بعد قليل.
            </p>
          </div>
        ) : state === "paid" ? (
          <div className="py-6">
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-400" />
            <h1 className="mt-5 font-display text-3xl font-black text-cream">
              تم الدفع بنجاح!
            </h1>
            <p className="mt-3 text-cream/80">
              سيرتك الذاتية جاهزة. اضغط الزر أدناه لتحميل ملف الـ PDF النهائي.
            </p>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn-gold mt-7 w-full text-lg"
            >
              {downloading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              {downloading ? "جاري تجهيز الملف..." : "تحميل PDF"}
            </button>
            <p className="mt-3 text-xs text-cream/50">
              قد يستغرق توليد الملف بضع ثوانٍ في المرة الأولى.
            </p>
          </div>
        ) : (
          <div className="py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
            <h1 className="mt-5 font-display text-2xl font-bold text-cream">
              تعذّر تأكيد الدفع
            </h1>
            <p className="mt-2 text-cream/70">
              لم نتمكّن من العثور على الطلب أو تأكيد الدفع. إذا تم خصم المبلغ تواصل معنا.
            </p>
            <Link href="/build" className="btn-outline mt-6">
              العودة لبناء السيرة
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  );
}

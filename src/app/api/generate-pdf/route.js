import { prisma } from "@/lib/prisma";
import { buildCvHtml } from "@/lib/cvTemplates";
import { htmlToPdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// توليد PDF عبر Chrome قد يستغرق بضع ثوانٍ.
export const maxDuration = 60;

// يولّد PDF لطلب مدفوع فقط. لا يُسمح بتوليد PDF لطلب غير مدفوع تحت أي ظرف.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return new Response(JSON.stringify({ error: "orderId مفقود." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    return new Response(JSON.stringify({ error: "الطلب غير موجود." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // بوابة الأمان: نتحقق من حالة الطلب من قاعدة البيانات حصرًا.
  if (order.status !== "paid") {
    return new Response(
      JSON.stringify({ error: "هذا الطلب غير مدفوع. لا يمكن توليد الـ PDF." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  let cvData;
  try {
    cvData = JSON.parse(order.cvData);
  } catch {
    return new Response(JSON.stringify({ error: "بيانات السيرة تالفة." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const html = buildCvHtml(cvData, order.templateId, order.language);
    const pdf = await htmlToPdf(html);

    // اسم الملف: نسخة ASCII آمنة للترويسة (filename) + نسخة Unicode مرمّزة
    // وفق RFC 5987 (filename*) ليظهر الاسم العربي/غير اللاتيني بشكل صحيح.
    const rawName = (order.customerName || "cv").slice(0, 40);
    const asciiName =
      rawName.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "cv";
    const utf8Name = encodeURIComponent(`${rawName}.pdf`);
    const disposition = `attachment; filename="${asciiName}.pdf"; filename*=UTF-8''${utf8Name}`;

    return new Response(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("PDF generation error:", e);
    return new Response(
      JSON.stringify({ error: "تعذّر توليد ملف الـ PDF." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

# سيرتي (CVerti) — منشئ سير ذاتية متوافقة مع ATS

منصة ويب تتيح للمستخدم إدخال بياناته عبر فورم متعدّد الخطوات، ومشاهدة **معاينة مباشرة** لسيرته الذاتية وهو يكتب، واختيار قالب احترافي متوافق مع أنظمة **ATS**، ثم الدفع لمرة واحدة عبر **Stripe** والحصول فورًا على ملف **PDF** نهائي بنص عربي/إنجليزي سليم.

تتضمّن المنصة **لوحة تحكم أدمن** لمتابعة الطلبات والإيرادات والإحصائيات.

---

## المزايا

- فورم بناء متعدّد الخطوات مع معاينة لحظية (Live Preview).
- دعم كامل للعربية (RTL) والإنجليزية (LTR).
- ٣ قوالب محافظة ومتوافقة مع ATS (عمود واحد، بلا صور/أيقونات/أعمدة معقدة).
- توليد PDF عبر **Puppeteer** (Chrome حقيقي) لضمان تشكيل الحروف العربية بشكل صحيح.
- دفع عبر **Stripe Checkout** المستضاف، وتأكيد الدفع عبر **Webhook** (مصدر الحقيقة).
- لوحة أدمن: بطاقات إحصائية + رسم إيرادات ٣٠ يومًا + جدول طلبات بفلترة وبحث.

---

## الـ Stack التقني

| المكوّن | التقنية |
|---|---|
| الإطار | Next.js 14 (App Router) — JavaScript |
| التنسيق | Tailwind CSS |
| قاعدة البيانات | Prisma ORM + SQLite (تطوير) / PostgreSQL (إنتاج) |
| الدفع | Stripe Checkout (Hosted) |
| توليد PDF | Puppeteer (headless Chrome) |
| الرسوم البيانية | recharts |
| الأيقونات | lucide-react |
| مصادقة الأدمن | كوكي جلسة موقّعة (HMAC-SHA256) بكلمة سر من متغيّر بيئة |

---

## التشغيل المحلي

### ١) تثبيت الحزم

```bash
npm install
```

> **ملاحظة Puppeteer:** يحتاج Puppeteer إلى متصفّح Chrome. في معظم البيئات يُنزَّل
> تلقائيًا أثناء التثبيت. إذا فشل التنزيل (شبكة/بروكسي)، ثبّته يدويًا:
> ```bash
> npx puppeteer browsers install chrome
> ```

### ٢) متغيّرات البيئة

انسخ `.env.example` إلى `.env.local` واملأ القيم:

```bash
cp .env.example .env.local
```

```
STRIPE_SECRET_KEY=            # من Stripe Dashboard (وضع Test)
STRIPE_WEBHOOK_SECRET=        # من أمر stripe listen (انظر أدناه)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD=               # كلمة سر لوحة الأدمن
SESSION_SECRET=               # سلسلة عشوائية طويلة لتوقيع الكوكي
NEXT_PUBLIC_APP_URL=http://localhost:3000
PRODUCT_PRICE_USD=5
```

> **مهم:** أداة Prisma CLI تقرأ ملف `.env` (وليس `.env.local`). لذلك أنشئ أيضًا ملف
> `.env` يحوي على الأقل `DATABASE_URL` لتعمل أوامر `prisma`:
> ```bash
> echo 'DATABASE_URL="file:./dev.db"' > .env
> ```

### ٣) تهيئة قاعدة البيانات

```bash
npx prisma generate
npx prisma db push        # ينشئ جداول SQLite
# (لاحقًا للهجرات الرسمية: npx prisma migrate dev)
```

### ٤) التشغيل

```bash
npm run dev
```

ثم افتح [http://localhost:3000](http://localhost:3000).

---

## مفاتيح Stripe التجريبية

1. أنشئ حسابًا على [stripe.com](https://stripe.com) وفعّل **Test mode**.
2. من **Developers → API keys** انسخ:
   - `Secret key` → `STRIPE_SECRET_KEY`
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. بطاقة الاختبار: `4242 4242 4242 4242`، أي تاريخ مستقبلي، أي CVC.

### محاكاة الـ Webhook محليًا

ثبّت [Stripe CLI](https://stripe.com/docs/stripe-cli)، ثم:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

سيطبع الأمر سر التوقيع (`whsec_...`) — ضعه في `STRIPE_WEBHOOK_SECRET` ثم أعد تشغيل
خادم التطوير. أبقِ هذا الأمر يعمل أثناء اختبار الدفع.

---

## تدفّق الدفع

1. المستخدم يكمل الفورم ويضغط **الدفع والتحميل**.
2. `POST /api/checkout` يخزّن `Order` بحالة `pending` (مع بيانات السيرة JSON) وينشئ
   جلسة Stripe Checkout مع `metadata.orderId`.
3. المستخدم يدفع على صفحة Stripe المستضافة.
4. **مصدر الحقيقة = الـ Webhook**: عند `checkout.session.completed` يُتحقق من التوقيع
   وتُحدَّث حالة الطلب إلى `paid`.
5. صفحة `/success` تستعلم عن حالة الطلب (لا تفترض النجاح) وتعيد المحاولة كل ثانيتين
   حتى يصل تأكيد الـ webhook، ثم تُظهر زر **تحميل PDF**.
6. `GET /api/generate-pdf?orderId=...` يولّد الـ PDF **فقط** إذا كانت الحالة `paid`.

---

## الأمان

- التحقق من توقيع Stripe webhook عبر `stripe.webhooks.constructEvent`.
- لا يُولَّد PDF إطلاقًا إلا لطلب حالته `paid` مؤكَّدة من قاعدة البيانات.
- مسارات `/admin/*` (عدا `/admin/login`) محمية بـ middleware يتحقق من كوكي جلسة
  موقّعة (HttpOnly).
- كلمة سر الأدمن وسر التوقيع في متغيّرات البيئة فقط — لا في الكود.

---

## لوحة الأدمن

- الرابط: `/admin` (يعيد التوجيه لـ `/admin/login` إن لم تكن مسجّلًا).
- سجّل الدخول بكلمة السر المحدّدة في `ADMIN_PASSWORD`.
- تعرض: إجمالي الطلبات، الإيرادات، طلبات اليوم، نسبة التحويل، رسم الإيرادات اليومية،
  وجدول الطلبات مع فلترة بالحالة وبحث بالاسم/الإيميل.

---

## القوالب وتوافق ATS

ملف القوالب الوحيد هو [`src/lib/cvTemplates.js`](src/lib/cvTemplates.js)، ويُستخدم
نفس مخرجه في المعاينة المباشرة وفي توليد الـ PDF (ضمان التطابق).

> ⚠️ **أي تعديل تصميمي مستقبلي على القوالب يجب أن يحافظ على التوافق مع ATS:** عمود
> واحد، ألوان محايدة + لون تمييزي خافت واحد للعناوين، خط واحد، بلا أيقونات/صور/جداول
> معقدة، وترتيب أقسام ثابت. التفاصيل في تعليق أعلى الملف.

---

## النشر على Vercel

> **مهم جدًا:** منصات serverless مثل Vercel **لا تحافظ على ملف SQLite** بين الطلبات.
> يجب تبديل قاعدة البيانات إلى **PostgreSQL** قبل النشر الفعلي.

### ١) قاعدة بيانات Postgres

أنشئ قاعدة على [Neon](https://neon.tech) أو [Supabase](https://supabase.com)، ثم في
`prisma/schema.prisma` بدّل:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

وحدّث `DATABASE_URL` إلى رابط Postgres، ثم:

```bash
npx prisma migrate deploy   # أو prisma db push
```

### ٢) Puppeteer على Vercel

حزمة `puppeteer` الكاملة كبيرة على الدوال الخادمة. للنشر استبدلها بـ:

```bash
npm install puppeteer-core @sparticuz/chromium
```

وفي [`src/lib/pdf.js`](src/lib/pdf.js) استخدم `puppeteer-core` مع
`@sparticuz/chromium` لتحديد `executablePath`. (الكود الحالي يستخدم `puppeteer`
الكامل المناسب للتطوير المحلي.)

### ٣) متغيّرات البيئة على Vercel

أضِف كل متغيّرات `.env.example` في إعدادات المشروع على Vercel، واضبط
`NEXT_PUBLIC_APP_URL` على دومين الإنتاج.

### ٤) Webhook الإنتاج

من **Stripe Dashboard → Developers → Webhooks** أضِف Endpoint جديدًا:
`https://your-domain.com/api/webhook/stripe` للحدث `checkout.session.completed`،
وانسخ سر التوقيع إلى `STRIPE_WEBHOOK_SECRET` على Vercel.

---

## هيكل المشروع

```
src/
├── app/
│   ├── page.js                  # اللاندنج بيج
│   ├── build/page.js            # فورم البناء + المعاينة
│   ├── success/page.js          # ما بعد الدفع + زر التحميل
│   ├── admin/
│   │   ├── page.js              # لوحة التحكم
│   │   └── login/page.js        # دخول الأدمن
│   └── api/
│       ├── checkout/route.js
│       ├── webhook/stripe/route.js
│       ├── order-status/route.js
│       ├── generate-pdf/route.js
│       └── admin/{login,logout,stats}/route.js
├── components/
│   ├── CVPreview.js             # معاينة iframe بنفس HTML الـ PDF
│   ├── landing/HeroPreview.js
│   └── build/{BuildWizard,fields}.js
├── lib/
│   ├── prisma.js · stripe.js · auth.js
│   ├── cvTemplates.js           # مولّد HTML للقوالب (مصدر الحقيقة)
│   ├── cvDefaults.js · pdf.js
└── middleware.js                # حماية /admin
```

---

## أوامر مفيدة

```bash
npm run dev          # تشغيل تطوير
npm run build        # بناء إنتاج (يشمل prisma generate)
npm run start        # تشغيل بناء الإنتاج
npm run db:push      # مزامنة المخطط مع القاعدة
npm run db:studio    # واجهة Prisma Studio
```

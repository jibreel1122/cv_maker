import "./globals.css";

export const metadata = {
  title: "سيرتي | منشئ سير ذاتية متوافقة مع ATS",
  description:
    "أنشئ سيرة ذاتية احترافية متوافقة مع أنظمة ATS بصيغة PDF خلال دقائق — بالعربية والإنجليزية.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "CV Maker | Free professional CV builder",
  description:
    "Build a clean, ATS-friendly CV in minutes — free. Sign in with your email and download a polished PDF accepted in Palestine and worldwide.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

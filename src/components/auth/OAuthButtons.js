"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

// Renders Google / Apple sign-in buttons only for providers that are actually
// configured (via environment variables) on the server.
export default function OAuthButtons({ callbackUrl = "/dashboard" }) {
  const [providers, setProviders] = useState(null);

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  if (!providers) return null;

  const hasGoogle = !!providers.google;
  const hasApple = !!providers.apple;
  if (!hasGoogle && !hasApple) {
    return (
      <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
        Google &amp; Apple sign-in activate automatically once their keys are
        configured.
      </p>
    );
  }

  return (
    <div className="grid gap-2.5">
      {hasGoogle && (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-ink transition hover:bg-slate-50"
        >
          <GoogleIcon /> Continue with Google
        </button>
      )}
      {hasApple && (
        <button
          type="button"
          onClick={() => signIn("apple", { callbackUrl })}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-black px-4 py-2.5 font-semibold text-white transition hover:bg-black/90"
        >
          <AppleIcon /> Continue with Apple
        </button>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.36 12.78c.02 2.46 2.16 3.28 2.18 3.29-.02.06-.34 1.17-1.12 2.32-.68.99-1.38 1.98-2.49 2-1.09.02-1.44-.64-2.68-.64-1.25 0-1.63.62-2.66.66-1.07.04-1.88-1.07-2.57-2.06-1.4-2.03-2.47-5.74-1.03-8.25.71-1.24 1.99-2.03 3.37-2.05 1.05-.02 2.05.71 2.69.71.64 0 1.85-.88 3.12-.75.53.02 2.02.21 2.98 1.62-.08.05-1.78 1.04-1.76 3.1ZM14.3 4.9c.57-.69.95-1.65.85-2.6-.82.03-1.81.55-2.4 1.24-.53.61-.99 1.58-.86 2.51.91.07 1.84-.46 2.41-1.15Z" />
    </svg>
  );
}

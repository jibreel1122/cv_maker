"use client";

// Root error boundary — catches errors thrown in the root layout itself.
// Must render its own <html>/<body>. Kept dependency-free and inline-styled
// since global styles may not be available at this level.

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4faf7",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          color: "#0f172a",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 32,
            textAlign: "center",
            boxShadow: "0 10px 30px -18px rgba(15,23,42,0.25)",
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#475569", margin: "0 0 24px" }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#059669",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

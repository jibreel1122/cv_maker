"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildCvHtml } from "@/lib/cvTemplates";
import ErrorBoundary from "@/components/ErrorBoundary";

// A4 dimensions in pixels at 96dpi
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

// Returns `value`, but only after it has stopped changing for `delay` ms.
// A delay of 0 passes the value straight through (no extra render).
function useDebounced(value, delay) {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    if (!delay) return;
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return delay ? settled : value;
}

function PreviewFrame({ cvData, templateId }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const html = useMemo(() => buildCvHtml(cvData, templateId), [cvData, templateId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const width = el.clientWidth;
      setScale(Math.min(1, width / A4_WIDTH));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <div style={{ height: A4_HEIGHT * scale, position: "relative", width: "100%" }}>
        <iframe
          title="CV preview"
          srcDoc={html}
          // No sandbox permissions at all: the document is inert HTML with no
          // scripts, so it needs neither script execution nor the parent origin.
          sandbox=""
          style={{
            width: A4_WIDTH,
            height: A4_HEIGHT,
            border: "none",
            background: "#fff",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            boxShadow: "0 10px 40px rgba(15,23,42,0.18)",
          }}
        />
      </div>
    </div>
  );
}

// Live preview: renders the exact HTML used to generate the PDF inside an
// iframe, auto-scaled to fit the container width — so what the user sees matches
// the downloaded file.
//
// `debounceMs` delays rebuilding the document while the user is still typing.
// Rebuilding replaces the iframe's srcDoc, which forces a full document reload,
// so doing it on every keystroke is both wasteful and visibly flickery.
export default function CVPreview({ cvData, templateId, debounceMs = 0 }) {
  const settledData = useDebounced(cvData, debounceMs);

  return (
    <ErrorBoundary
      resetKey={settledData}
      title="Preview unavailable"
      message="This CV contains data that could not be rendered. Editing the affected fields usually fixes it."
    >
      <PreviewFrame cvData={settledData} templateId={templateId} />
    </ErrorBoundary>
  );
}

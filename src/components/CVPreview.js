"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildCvHtml } from "@/lib/cvTemplates";
import { fontFaceCssForPreview } from "@/lib/cvFonts";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useLocale } from "@/components/i18n/LocaleProvider";

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

function PreviewFrame({ cvData, templateId, showPageBreaks, onPageCount }) {
  const { t, rtl } = useLocale();
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(A4_HEIGHT);

  const html = useMemo(
    () => buildCvHtml(cvData, templateId, { fontFaceCss: fontFaceCssForPreview() }),
    [cvData, templateId]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / A4_WIDTH));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Measures how tall the rendered CV actually is, which is what tells the user
  // how many pages they are about to get. Runs after each document load.
  const measure = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc?.body) return;
    // Fonts change metrics, so wait for them before trusting a measurement.
    const settle = () => {
      // Measure `.page`, not `<body>`. The iframe is sized *from* this number,
      // and the body stretches to fill the iframe — so measuring the body feeds
      // the previous result back in and the height can never shrink again.
      // `.page` is laid out by its own content plus a one-page min-height, which
      // is independent of the frame it sits in.
      const pageEl = doc.querySelector(".page");
      const h = Math.max(pageEl?.scrollHeight || 0, A4_HEIGHT);
      setContentHeight(h);
      onPageCount?.(Math.max(1, Math.ceil(h / A4_HEIGHT)));
    };
    if (doc.fonts?.ready) doc.fonts.ready.then(settle).catch(settle);
    else settle();
  }, [onPageCount]);

  useEffect(() => {
    // srcDoc replaces the document, so re-measure whenever the HTML changes.
    const id = setTimeout(measure, 60);
    return () => clearTimeout(id);
  }, [html, measure]);

  const pages = Math.max(1, Math.ceil(contentHeight / A4_HEIGHT));
  const boxHeight = Math.max(contentHeight, A4_HEIGHT) * scale;

  return (
    <div ref={containerRef} className="w-full">
      <div style={{ height: boxHeight, position: "relative", width: "100%" }}>
        <iframe
          ref={frameRef}
          title="CV preview"
          srcDoc={html}
          onLoad={measure}
          // `allow-same-origin` without `allow-scripts`: the CV document is
          // inert HTML with no scripts, so it cannot act on the origin it is
          // granted — but the parent needs same-origin access to measure the
          // rendered height, which is what drives the page count and the page
          // break markers below.
          sandbox="allow-same-origin"
          scrolling="no"
          style={{
            width: A4_WIDTH,
            height: Math.max(contentHeight, A4_HEIGHT),
            border: "none",
            background: "#fff",
            // The iframe is a fixed 794px wide and scaled down to fit. Both the
            // anchor and the origin have to follow the interface direction: with
            // a physical "top left" origin, an RTL container lays the frame out
            // from the right edge and the scaled result hangs off the page.
            position: "absolute",
            top: 0,
            [rtl ? "right" : "left"]: 0,
            transform: `scale(${scale})`,
            transformOrigin: rtl ? "top right" : "top left",
            boxShadow: "0 10px 40px rgba(15,23,42,0.18)",
          }}
        />

        {/* Page-break markers: where the printer will actually cut the page. */}
        {showPageBreaks &&
          pages > 1 &&
          Array.from({ length: pages - 1 }, (_, i) => {
            const top = A4_HEIGHT * (i + 1) * scale;
            return (
              <div
                key={i}
                className="pointer-events-none absolute inset-x-0 z-10"
                style={{ top }}
                aria-hidden="true"
              >
                <div className="border-t-2 border-dashed border-red-400/70" />
                <span className="absolute end-1 -top-2.5 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                  {t("builder.pageBreak", { n: i + 1 })}
                </span>
              </div>
            );
          })}
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
export default function CVPreview({
  cvData,
  templateId,
  debounceMs = 0,
  showPageBreaks = false,
  onPageCount,
}) {
  const { t } = useLocale();
  const settledData = useDebounced(cvData, debounceMs);

  return (
    <ErrorBoundary
      resetKey={settledData}
      title={t("preview.unavailable")}
      message={t("preview.unavailableBody")}
    >
      <PreviewFrame
        cvData={settledData}
        templateId={templateId}
        showPageBreaks={showPageBreaks}
        onPageCount={onPageCount}
      />
    </ErrorBoundary>
  );
}

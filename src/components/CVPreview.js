"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildCvHtml } from "@/lib/cvTemplates";

// A4 dimensions in pixels at 96dpi
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

// Live preview: renders the exact HTML used to generate the PDF inside an
// iframe, auto-scaled to fit the container width — so what the user sees
// matches the downloaded file.
export default function CVPreview({ cvData, templateId }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const html = useMemo(
    () => buildCvHtml(cvData, templateId),
    [cvData, templateId]
  );

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
      <div
        style={{
          height: A4_HEIGHT * scale,
          position: "relative",
          width: "100%",
        }}
      >
        <iframe
          title="CV preview"
          srcDoc={html}
          sandbox="allow-same-origin"
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

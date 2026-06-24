"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildCvHtml } from "@/lib/cvTemplates";

// أبعاد A4 بوحدة البكسل عند 96dpi
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

// معاينة مباشرة: تعرض نفس HTML الذي يُستخدم لتوليد الـ PDF داخل iframe
// مع تحجيم تلقائي ليتناسب مع عرض الحاوية — فيتطابق ما يراه المستخدم مع الناتج.
export default function CVPreview({ cvData, templateId, language }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const html = useMemo(
    () => buildCvHtml(cvData, templateId, language),
    [cvData, templateId, language]
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
          title="معاينة السيرة الذاتية"
          srcDoc={html}
          sandbox="allow-same-origin"
          style={{
            width: A4_WIDTH,
            height: A4_HEIGHT,
            border: "none",
            background: "#fff",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
          }}
        />
      </div>
    </div>
  );
}

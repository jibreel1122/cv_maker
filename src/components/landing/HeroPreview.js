"use client";

import { useEffect, useState } from "react";
import CVPreview from "@/components/CVPreview";
import { sampleCvDataAr } from "@/lib/cvDefaults";

// يبني نسخة جزئية من بيانات العيّنة حسب نسبة التقدّم لمحاكاة الكتابة الحية.
function partial(progress) {
  const s = sampleCvDataAr;
  const data = {
    personal: { ...s.personal },
    summary: "",
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
  };

  // 0 → 1: اكتب الاسم/المسمى أولًا، ثم الملخص، ثم الأقسام تباعًا
  if (progress < 0.15) {
    const reveal = Math.floor((s.personal.fullName.length * progress) / 0.15);
    data.personal.fullName = s.personal.fullName.slice(0, reveal);
    data.personal.jobTitle = "";
    return data;
  }
  data.personal.jobTitle = s.personal.jobTitle;

  if (progress < 0.45) {
    const p = (progress - 0.15) / 0.3;
    data.summary = s.summary.slice(0, Math.floor(s.summary.length * p));
    return data;
  }
  data.summary = s.summary;

  if (progress < 0.7) {
    const p = (progress - 0.45) / 0.25;
    const count = Math.ceil(s.experiences.length * p);
    data.experiences = s.experiences.slice(0, count);
    return data;
  }
  data.experiences = s.experiences;

  if (progress < 0.85) {
    data.education = s.education;
    return data;
  }
  data.education = s.education;
  data.skills = s.skills;

  if (progress >= 0.95) {
    data.languages = s.languages;
    data.certifications = s.certifications;
  }
  return data;
}

export default function HeroPreview() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf;
    let start = null;
    const DURATION = 6000;
    const PAUSE = 2200;

    const tick = (ts) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      if (elapsed < DURATION) {
        setProgress(elapsed / DURATION);
        raf = requestAnimationFrame(tick);
      } else if (elapsed < DURATION + PAUSE) {
        setProgress(1);
        raf = requestAnimationFrame(tick);
      } else {
        start = ts;
        setProgress(0);
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const data = partial(progress);

  return (
    <div className="card p-3 sm:p-4">
      <div className="mb-2 flex items-center gap-1.5 px-1">
        <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
        <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
        <span className="mr-auto text-xs text-slateblue">معاينة حية</span>
      </div>
      <CVPreview cvData={data} templateId="classic" language="ar" />
    </div>
  );
}

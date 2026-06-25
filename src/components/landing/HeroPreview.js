"use client";

import { useEffect, useState } from "react";
import CVPreview from "@/components/CVPreview";
import { sampleCvData } from "@/lib/cvDefaults";

// Builds a partial copy of the sample data based on progress to mimic live typing.
function partial(progress) {
  const s = sampleCvData;
  const data = {
    personal: { ...s.personal },
    summary: "",
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
  };

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
  const done = progress >= 1;

  return (
    <div className="relative">
      <div className="card p-3 sm:p-4">
        <div className="mb-2 flex items-center gap-1.5 px-1">
          <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
          <span className="ml-auto text-xs text-slate-400">
            {done ? "Ready to download" : "Building your CV…"}
          </span>
        </div>
        <CVPreview cvData={data} templateId="modern" />
      </div>

      {/* Signature: the approval stamp presses in once the CV is complete. */}
      {done && (
        <div
          key={progress}
          className="pointer-events-none absolute -right-3 top-16 sm:-right-6 sm:top-20"
          aria-hidden="true"
        >
          <span className="stamp stamp-in">
            <span className="stamp-main">Accepted</span>
            <span className="stamp-sub">ATS · Ready</span>
          </span>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import CVPreview from "@/components/CVPreview";
import { sampleCvData } from "@/lib/cvDefaults";

// The animation advances in discrete steps rather than on every animation
// frame. Each step rebuilds the CV HTML and reloads the preview iframe's
// document, so running it at 60fps pinned a CPU core for as long as the landing
// page stayed open. At 10fps the typing still reads as continuous and the work
// drops by 6x.
const STEPS = 60; // discrete frames across one full cycle
const STEP_MS = 100; // 10fps
const HOLD_STEPS = 22; // ~2.2s pause on the finished CV before looping

// Builds a partial copy of the sample data based on progress to mimic live typing.
function partial(progress) {
  const s = sampleCvData;
  const data = {
    personal: { ...s.personal },
    sectionTitles: s.sectionTitles,
    summary: "",
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
    customSections: [],
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
    data.experiences = s.experiences.slice(0, Math.ceil(s.experiences.length * p));
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
    data.customSections = s.customSections;
  }
  return data;
}

export default function HeroPreview() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Respect the OS "reduce motion" setting — hold the finished CV instead of
    // looping an animation the user has asked not to see.
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setStep(STEPS);
      return;
    }

    let cancelled = false;
    let timer;

    const tick = () => {
      if (cancelled) return;
      setStep((prev) => (prev >= STEPS + HOLD_STEPS ? 0 : prev + 1));
      timer = setTimeout(tick, STEP_MS);
    };
    timer = setTimeout(tick, STEP_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // Memoising on the clamped integer frame — not on an object — means the CV
  // HTML is rebuilt once per visible frame rather than once per React render.
  // During the hold at the end of a cycle `frame` stops changing, so the data
  // object keeps its identity and nothing is rebuilt at all.
  const frame = Math.min(step, STEPS);
  const data = useMemo(() => partial(frame / STEPS), [frame]);

  return (
    <div className="card p-3 sm:p-4">
      <div className="mb-2 flex items-center gap-1.5 px-1">
        <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
        <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
        <span className="ms-auto text-xs text-slate-400">Live preview</span>
      </div>
      <CVPreview cvData={data} templateId="modern-professional" />
    </div>
  );
}

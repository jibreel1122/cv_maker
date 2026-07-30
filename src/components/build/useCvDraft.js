"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Local draft persistence for the CV builder.
//
// The wizard asks for a full employment history across nine steps; losing that
// to a closed tab or an accidental back-navigation is the worst thing the app
// can do to someone. Everything typed is mirrored into localStorage, and a
// draft found on the next visit is offered back rather than silently applied —
// silently overwriting what a user opened is its own kind of data loss.

const BASE_KEY = "cv_draft_data";
const SAVE_DEBOUNCE_MS = 500;
// Drafts older than this are ignored — restoring a half-finished CV from months
// ago is more confusing than helpful.
const MAX_DRAFT_AGE_MS = 14 * 24 * 60 * 60 * 1000;

// New CVs use the bare key; edits are namespaced per CV so a draft of one never
// leaks into another.
export function draftKey(editId) {
  return editId ? `${BASE_KEY}:${editId}` : BASE_KEY;
}

function readDraft(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.data) return null;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > MAX_DRAFT_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft(editId) {
  try {
    window.localStorage.removeItem(draftKey(editId));
  } catch {
    /* storage unavailable (private mode, quota) — nothing to clean up */
  }
}

/**
 * @param editId    id of the CV being edited, or null when creating a new one
 * @param data      current CV data object
 * @param templateId current template selection
 * @param enabled   gate persistence until the wizard has finished loading and
 *                  the user has answered any restore prompt
 */
export function useCvDraft({ editId, data, templateId, enabled }) {
  const key = draftKey(editId);
  const [pendingDraft, setPendingDraft] = useState(null);
  const checked = useRef(false);

  // Look for an existing draft once, on mount.
  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    const found = readDraft(key);
    if (found) setPendingDraft(found);
  }, [key]);

  // Mirror changes into storage, debounced so a fast typist does not hit
  // localStorage on every keypress.
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(
          key,
          JSON.stringify({ data, templateId, savedAt: Date.now() })
        );
      } catch {
        /* quota exceeded or storage disabled — the draft is a convenience, not
           a guarantee, so failing here must not interrupt editing */
      }
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [key, data, templateId, enabled]);

  const dismissDraft = useCallback(() => setPendingDraft(null), []);

  const discardDraft = useCallback(() => {
    setPendingDraft(null);
    clearDraft(editId);
  }, [editId]);

  const clear = useCallback(() => clearDraft(editId), [editId]);

  return { pendingDraft, dismissDraft, discardDraft, clearDraft: clear };
}

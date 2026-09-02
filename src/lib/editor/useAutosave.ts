"use client";

import { useEffect, useRef } from "react";
import { useResumeEditorStore } from "./store";
import { api } from "@/lib/api/client";

const DEBOUNCE_MS = 1200;

/**
 * Debounced autosave: any change to content/style/name/targetRole schedules
 * a PATCH a little while after the user stops typing/editing, so a fast
 * typist doesn't fire a request per keystroke. Mount this once per editor
 * session (see resume/[id]/page.tsx).
 */
export function useAutosave(resumeId: string | null) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);

  const content = useResumeEditorStore((s) => s.content);
  const style = useResumeEditorStore((s) => s.style);
  const name = useResumeEditorStore((s) => s.name);
  const targetRole = useResumeEditorStore((s) => s.targetRole);
  const setSaveStatus = useResumeEditorStore((s) => s.setSaveStatus);

  const isFirstRun = useRef(true);

  useEffect(() => {
    if (!resumeId) return;
    if (isFirstRun.current) {
      // Skip the save triggered by the initial hydrate() on mount.
      isFirstRun.current = false;
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSaveStatus("idle");

    timeoutRef.current = setTimeout(async () => {
      const save = async () => {
        inFlightRef.current = true;
        setSaveStatus("saving");
        try {
          await api.updateResume(resumeId, { name, targetRole, content, style });
          setSaveStatus("saved");
        } catch {
          setSaveStatus("error");
        } finally {
          inFlightRef.current = false;
          if (pendingRef.current) {
            pendingRef.current = false;
            save();
          }
        }
      };

      if (inFlightRef.current) {
        pendingRef.current = true;
      } else {
        save();
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, style, name, targetRole, resumeId]);
}

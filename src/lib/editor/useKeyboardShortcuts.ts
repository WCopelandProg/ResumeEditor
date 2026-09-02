"use client";

import { useEffect } from "react";
import { useResumeEditorStore } from "./store";
import { api } from "@/lib/api/client";

/** Global editor shortcuts: Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z / Cmd/Ctrl+Y redo, Cmd/Ctrl+S save now. */
export function useKeyboardShortcuts(resumeId: string | null) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      const target = e.target as HTMLElement | null;
      const isEditableField = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        if (isEditableField) return; // let native text-field undo work
        e.preventDefault();
        useResumeEditorStore.getState().undo();
      } else if ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y") {
        if (isEditableField) return;
        e.preventDefault();
        useResumeEditorStore.getState().redo();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!resumeId) return;
        const { content, style, name, targetRole, setSaveStatus } = useResumeEditorStore.getState();
        setSaveStatus("saving");
        api
          .updateResume(resumeId, { name, targetRole, content, style })
          .then(() => setSaveStatus("saved"))
          .catch(() => setSaveStatus("error"));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resumeId]);
}

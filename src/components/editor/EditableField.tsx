"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface EditableInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

/** Borderless input that looks like part of the document until focused/hovered. */
export function EditableInput({ value, onChange, className, placeholder, ...props }: EditableInputProps) {
  return (
    <input
      {...props}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full appearance-none rounded-sm border-0 bg-transparent px-1 py-0.5 outline-none ring-1 ring-transparent transition-colors placeholder:text-muted-foreground/60 hover:ring-border focus:bg-accent/30 focus:ring-ring/40",
        className
      )}
    />
  );
}

interface EditableTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

/** Auto-growing borderless textarea for bullets/paragraphs. */
export function EditableTextarea({ value, onChange, className, placeholder, ...props }: EditableTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      {...props}
      ref={ref}
      value={value}
      placeholder={placeholder}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full resize-none overflow-hidden appearance-none rounded-sm border-0 bg-transparent px-1 py-0.5 leading-snug outline-none ring-1 ring-transparent transition-colors placeholder:text-muted-foreground/60 hover:ring-border focus:bg-accent/30 focus:ring-ring/40",
        className
      )}
    />
  );
}

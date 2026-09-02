"use client";

import { EditableInput } from "./EditableField";
import { useResumeEditorStore } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

interface Props {
  accentColor: string;
  nameAlign: "left" | "center";
  banner?: boolean;
}

export function PersonalInfoHeader({ accentColor, nameAlign, banner = false }: Props) {
  const personalInfo = useResumeEditorStore((s) => s.content.personalInfo);
  const updatePersonalInfo = useResumeEditorStore((s) => s.updatePersonalInfo);

  const alignClass = nameAlign === "center" ? "text-center" : "text-left";
  const linkColor = banner ? "#ffffff" : accentColor;

  return (
    <div className={alignClass}>
      <EditableInput
        value={personalInfo.fullName}
        onChange={(v) => updatePersonalInfo({ fullName: v })}
        placeholder="Your Name"
        className={cn("text-2xl font-bold", alignClass, banner && "text-white placeholder:text-white/50")}
      />
      <EditableInput
        value={personalInfo.headline ?? ""}
        onChange={(v) => updatePersonalInfo({ headline: v })}
        placeholder="Professional headline (optional)"
        className={cn("mt-0.5", alignClass, banner ? "text-white/85 placeholder:text-white/50" : "text-muted-foreground")}
      />
      <div className={`mt-1.5 flex flex-wrap gap-x-1 gap-y-1 text-sm ${nameAlign === "center" ? "justify-center" : "justify-start"}`}>
        <EditableInput
          value={personalInfo.email ?? ""}
          onChange={(v) => updatePersonalInfo({ email: v })}
          placeholder="email@example.com"
          className={cn("w-44", banner && "placeholder:text-white/50")}
          style={{ color: linkColor }}
        />
        <EditableInput
          value={personalInfo.phone ?? ""}
          onChange={(v) => updatePersonalInfo({ phone: v })}
          placeholder="Phone"
          className={cn("w-32", banner && "text-white/85 placeholder:text-white/50")}
        />
        <EditableInput
          value={personalInfo.location ?? ""}
          onChange={(v) => updatePersonalInfo({ location: v })}
          placeholder="Location"
          className={cn("w-36", banner && "text-white/85 placeholder:text-white/50")}
        />
        <EditableInput
          value={personalInfo.linkedin ?? ""}
          onChange={(v) => updatePersonalInfo({ linkedin: v })}
          placeholder="LinkedIn URL"
          className={cn("w-44", banner && "placeholder:text-white/50")}
          style={{ color: linkColor }}
        />
        <EditableInput
          value={personalInfo.github ?? ""}
          onChange={(v) => updatePersonalInfo({ github: v })}
          placeholder="GitHub URL"
          className={cn("w-40", banner && "placeholder:text-white/50")}
          style={{ color: linkColor }}
        />
        <EditableInput
          value={personalInfo.website ?? ""}
          onChange={(v) => updatePersonalInfo({ website: v })}
          placeholder="Portfolio URL"
          className={cn("w-40", banner && "placeholder:text-white/50")}
          style={{ color: linkColor }}
        />
      </div>
    </div>
  );
}

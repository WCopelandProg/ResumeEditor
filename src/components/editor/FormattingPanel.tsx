"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useResumeEditorStore } from "@/lib/editor/store";
import { STYLE_BOUNDS } from "@/lib/resume/types";
import { FONT_FAMILY_OPTIONS } from "@/lib/pdf/fonts";

const ACCENT_PRESETS = ["#1d4ed8", "#0f766e", "#7c3aed", "#be123c", "#b45309", "#334155"];

export function FormattingPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const style = useResumeEditorStore((s) => s.style);
  const setStyle = useResumeEditorStore((s) => s.setStyle);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Formatting</DialogTitle>
          <DialogDescription>Fine-tune typography and spacing. Bounds keep your resume looking professional.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label>Font</Label>
            <Select value={style.fontFamily} onValueChange={(v) => setStyle({ fontFamily: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILY_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SliderField
            label="Font size"
            value={style.fontSizePt}
            bounds={STYLE_BOUNDS.fontSizePt}
            unit="pt"
            onChange={(v) => setStyle({ fontSizePt: v })}
          />
          <SliderField
            label="Line spacing"
            value={style.lineSpacing}
            bounds={STYLE_BOUNDS.lineSpacing}
            onChange={(v) => setStyle({ lineSpacing: v })}
          />
          <SliderField
            label="Section spacing"
            value={style.sectionSpacingPt}
            bounds={STYLE_BOUNDS.sectionSpacingPt}
            unit="pt"
            onChange={(v) => setStyle({ sectionSpacingPt: v })}
          />
          <SliderField
            label="Bullet spacing"
            value={style.bulletSpacingPt}
            bounds={STYLE_BOUNDS.bulletSpacingPt}
            unit="pt"
            onChange={(v) => setStyle({ bulletSpacingPt: v })}
          />
          <SliderField
            label="Margins"
            value={style.marginTopIn}
            bounds={STYLE_BOUNDS.margins}
            unit="in"
            onChange={(v) => setStyle({ marginTopIn: v, marginRightIn: v, marginBottomIn: v, marginLeftIn: v })}
          />

          <div className="space-y-1.5">
            <Label>Alignment</Label>
            <Select value={style.alignment} onValueChange={(v) => setStyle({ alignment: v as "left" | "justified" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left-aligned</SelectItem>
                <SelectItem value="justified">Justified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Layout</Label>
            <Select value={String(style.columns)} onValueChange={(v) => setStyle({ columns: Number(v) as 1 | 2 })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">One column</SelectItem>
                <SelectItem value="2">Two columns (sidebar)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="dividers">Section divider lines</Label>
            <Switch id="dividers" checked={style.showDividers} onCheckedChange={(c) => setStyle({ showDividers: c })} />
          </div>

          <div className="space-y-1.5">
            <Label>Accent color</Label>
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map((color) => (
                <button
                  key={color}
                  aria-label={`Use accent color ${color}`}
                  onClick={() => setStyle({ accentColor: color })}
                  className="h-7 w-7 rounded-full ring-offset-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2"
                  style={{ backgroundColor: color, outlineColor: color, boxShadow: style.accentColor === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : undefined }}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SliderField({
  label,
  value,
  bounds,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  bounds: { min: number; max: number; step: number };
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        min={bounds.min}
        max={bounds.max}
        step={bounds.step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

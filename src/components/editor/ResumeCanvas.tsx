"use client";

import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PersonalInfoHeader } from "./PersonalInfoHeader";
import { SectionBlock } from "./SectionBlock";
import { SortableList } from "./SortableList";
import { useResumeEditorStore } from "@/lib/editor/store";
import { getTemplateSkin, isSidebarSection } from "@/lib/pdf/templateSkins";
import { SECTION_TYPES, SECTION_TYPE_LABELS } from "@/lib/resume/types";
import { estimatePageLength } from "@/lib/resume/helpers";

export function ResumeCanvas({ resumeId }: { resumeId: string }) {
  const content = useResumeEditorStore((s) => s.content);
  const style = useResumeEditorStore((s) => s.style);
  const addSection = useResumeEditorStore((s) => s.addSection);
  const removeSection = useResumeEditorStore((s) => s.removeSection);
  const reorderSections = useResumeEditorStore((s) => s.reorderSections);

  const skin = getTemplateSkin(style.templateId);
  const pageLength = estimatePageLength(content, style);

  const useColumns = style.columns === 2;
  const sideSections = useColumns ? content.sections.filter((s) => isSidebarSection(s.type)) : [];
  const mainSections = useColumns ? content.sections.filter((s) => !isSidebarSection(s.type)) : content.sections;

  function renderSectionList(sections: typeof content.sections) {
    return (
      <SortableList
        items={sections}
        onReorder={(orderedIds) => {
          // Reorders within this visual group only; merge back with the other group's order preserved.
          const otherIds = content.sections.filter((s) => !orderedIds.includes(s.id)).map((s) => s.id);
          reorderSections(useColumns ? mergeKeepingGroups(orderedIds, otherIds, sections === mainSections) : orderedIds);
        }}
        className="space-y-4"
        renderItem={(section, handle) => (
          <SectionBlock
            resumeId={resumeId}
            section={section}
            dragHandle={handle}
            onRemove={() => removeSection(section.id)}
            accentColor={style.accentColor}
            skin={skin}
          />
        )}
      />
    );
  }

  function mergeKeepingGroups(reorderedGroup: string[], otherGroup: string[], reorderedIsMain: boolean) {
    return reorderedIsMain ? [...reorderedGroup, ...otherGroup] : [...otherGroup, ...reorderedGroup];
  }

  return (
    <div className="flex flex-col items-center py-8">
      <div
        className="resume-page w-full max-w-[8.5in] shadow-lg"
        style={{
          fontFamily: style.fontFamily === "Courier New" ? "'Courier New', monospace" : style.fontFamily === "Georgia" ? "Georgia, serif" : "var(--font-inter), sans-serif",
          fontSize: `${style.fontSizePt}pt`,
          lineHeight: style.lineSpacing,
          padding: `${style.marginTopIn}in ${style.marginRightIn}in ${style.marginBottomIn}in ${style.marginLeftIn}in`,
          minHeight: "11in",
        }}
      >
        <div
          style={
            skin.nameBanner
              ? {
                  background: style.accentColor,
                  margin: `-${style.marginTopIn}in -${style.marginRightIn}in 16px -${style.marginLeftIn}in`,
                  padding: `${style.marginTopIn}in ${style.marginRightIn}in 16px ${style.marginLeftIn}in`,
                }
              : undefined
          }
        >
          <PersonalInfoHeader accentColor={style.accentColor} nameAlign={skin.nameAlign} banner={skin.nameBanner} />
        </div>

        <div className="mt-4" style={{ display: useColumns ? "grid" : "block", gridTemplateColumns: useColumns ? "1fr 220px" : undefined, gap: useColumns ? "24px" : undefined }}>
          <div className="space-y-4">{renderSectionList(mainSections)}</div>
          {useColumns ? <div className="space-y-4">{renderSectionList(sideSections)}</div> : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="mt-4 text-muted-foreground">
              <Plus className="h-4 w-4" /> Add section
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {SECTION_TYPES.map((type) => (
              <DropdownMenuItem key={type} onClick={() => addSection(type)}>
                {SECTION_TYPE_LABELS[type]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Estimated length: {pageLength.toFixed(2)} page{pageLength >= 1.05 || pageLength < 0.95 ? "s" : ""}
        {pageLength > 1.05 ? " — consider tightening spacing or trimming a bullet." : ""}
      </p>
    </div>
  );
}

import { Document, Page, View, Text, Link, StyleSheet } from "@react-pdf/renderer";
import type { Entry, ResumeStyle, Section, StructuredResume } from "@/lib/resume/types";
import { boldVariant, resolvePdfFont } from "./fonts";
import { getTemplateSkin, isSidebarSection } from "./templateSkins";

const IN_TO_PT = 72;

function dateRangeOf(entry: Entry): string {
  return [entry.startDate, entry.isCurrent ? "Present" : entry.endDate].filter(Boolean).join(" – ");
}

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function withHref(url: string): string {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

interface DocProps {
  resume: StructuredResume;
  style: ResumeStyle;
}

/**
 * Single parametrized document renderer used by every template. Templates
 * differ only in the "skin" (see templateSkins.ts) — fonts, dividers,
 * heading treatment, accent usage — never in the underlying structure. This
 * avoids six near-duplicate layout implementations while still producing
 * six genuinely distinct-looking resumes.
 *
 * Pagination quality: every entry (header + bullets) is wrapped in a
 * `wrap={false}` View so react-pdf never splits a job's header from its
 * bullets across a page boundary, and a section's heading is grouped with
 * its first entry so a heading never ends up alone at the bottom of a page.
 */
export function ResumeDocument({ resume, style }: DocProps) {
  const skin = getTemplateSkin(style.templateId);
  const bodyFont = resolvePdfFont(style.fontFamily);
  const headingFontFamily = skin.serifHeadings ? "Times-Roman" : bodyFont;
  const bold = boldVariant(bodyFont);

  const s = StyleSheet.create({
    page: {
      paddingTop: style.marginTopIn * IN_TO_PT,
      paddingBottom: style.marginBottomIn * IN_TO_PT,
      paddingLeft: style.marginLeftIn * IN_TO_PT,
      paddingRight: style.marginRightIn * IN_TO_PT,
      fontFamily: bodyFont,
      fontSize: style.fontSizePt,
      lineHeight: style.lineSpacing,
      color: "#18181b",
    },
    nameBanner: {
      backgroundColor: skin.nameBanner ? style.accentColor : undefined,
      marginHorizontal: skin.nameBanner ? -style.marginLeftIn * IN_TO_PT : 0,
      marginTop: skin.nameBanner ? -style.marginTopIn * IN_TO_PT : 0,
      paddingHorizontal: skin.nameBanner ? style.marginLeftIn * IN_TO_PT : 0,
      paddingVertical: skin.nameBanner ? 20 : 0,
      marginBottom: skin.nameBanner ? style.sectionSpacingPt : 0,
    },
    name: {
      fontFamily: headingFontFamily,
      fontWeight: 700,
      fontSize: style.fontSizePt * (1.9 * style.headingScale),
      lineHeight: 1.3,
      color: skin.nameBanner ? "#ffffff" : "#0f0f12",
      textAlign: skin.nameAlign,
    },
    headline: {
      fontSize: style.fontSizePt * 1.05,
      lineHeight: 1.3,
      color: skin.nameBanner ? "#f4f4f5" : "#52525b",
      marginTop: 4,
      textAlign: skin.nameAlign,
    },
    contactRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 6,
      justifyContent: skin.nameAlign === "center" ? "center" : "flex-start",
      gap: 4,
    },
    contactItem: {
      fontSize: style.fontSizePt * 0.85,
      color: skin.nameBanner ? "#f4f4f5" : "#3f3f46",
    },
    contactSep: {
      fontSize: style.fontSizePt * 0.85,
      color: skin.nameBanner ? "#f4f4f5" : "#a1a1aa",
      marginHorizontal: 2,
    },
    body: { marginTop: style.sectionSpacingPt },
    columns: { flexDirection: "row", gap: 24 },
    colMain: { flexGrow: 1, flexBasis: 0 },
    colSide: { width: style.columns === 2 ? 165 : undefined },
    section: { marginBottom: style.sectionSpacingPt },
    heading: {
      fontFamily: headingFontFamily,
      fontSize: style.fontSizePt * 1.08 * style.headingScale,
      fontWeight: 700,
      color: skin.headingColor === "ink" ? "#27272a" : style.accentColor,
      textTransform: skin.headingCase === "upper" ? "uppercase" : "capitalize",
      letterSpacing: skin.headingLetterSpacing,
      marginBottom: 6,
      paddingBottom: skin.headingStyle === "underline" ? 3 : 0,
      borderBottomWidth: skin.headingStyle === "underline" && style.showDividers ? 0.75 : 0,
      borderBottomColor: "#d4d4d8",
    },
    headingBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 6,
    },
    headingBarAccent: {
      width: 3,
      height: style.fontSizePt * 1.08 * style.headingScale,
      backgroundColor: style.accentColor,
    },
    sectionText: { fontSize: style.fontSizePt, marginBottom: 4 },
    entry: { marginBottom: style.sectionSpacingPt * 0.55 },
    entryHeaderRow: { flexDirection: "row", alignItems: "flex-start" },
    entryTitle: { fontFamily: bold, fontSize: style.fontSizePt, color: "#18181b", width: "74%" },
    entryDate: { fontSize: style.fontSizePt * 0.92, color: "#52525b", width: "26%", textAlign: "right" },
    entryLocation: { fontSize: style.fontSizePt * 0.92, color: "#71717a", marginTop: 1 },
    entryDescription: { fontSize: style.fontSizePt, marginTop: 3 },
    bulletRow: {
      flexDirection: "row",
      marginTop: style.bulletSpacingPt,
      paddingLeft: 2,
    },
    bulletGlyph: { width: 10, fontSize: style.fontSizePt },
    bulletText: { flex: 1, fontSize: style.fontSizePt, textAlign: style.alignment === "justified" ? "justify" : "left" },
    skillLine: { fontSize: style.fontSizePt, marginBottom: 4 },
    skillCategory: { fontFamily: bold },
    link: { color: style.accentColor, textDecoration: "none" },
    contactLink: {
      color: skin.nameBanner ? "#ffffff" : style.accentColor,
      textDecoration: "none",
    },
  });

  const contactParts: { label: string; href?: string }[] = [];
  const p = resume.personalInfo;
  if (p.email) contactParts.push({ label: p.email, href: `mailto:${p.email}` });
  if (p.phone) contactParts.push({ label: p.phone });
  if (p.location) contactParts.push({ label: p.location });
  if (p.linkedin) contactParts.push({ label: displayUrl(p.linkedin), href: withHref(p.linkedin) });
  if (p.github) contactParts.push({ label: displayUrl(p.github), href: withHref(p.github) });
  if (p.website) contactParts.push({ label: displayUrl(p.website), href: withHref(p.website) });

  function renderHeading(title: string) {
    if (skin.headingStyle === "bar") {
      return (
        <View style={s.headingBar}>
          <View style={s.headingBarAccent} />
          <Text style={[s.heading, { marginBottom: 0, borderBottomWidth: 0 }]}>{title}</Text>
        </View>
      );
    }
    return <Text style={s.heading}>{title}</Text>;
  }

  function renderEntry(entry: Entry, key: string, narrow = false) {
    const dates = dateRangeOf(entry);
    const titleLine = [entry.title, entry.organization].filter(Boolean).join(entry.title && entry.organization ? " — " : "");
    return (
      <View style={s.entry} key={key} wrap={false}>
        {narrow ? (
          <>
            <Text style={s.entryTitle}>{titleLine || entry.description}</Text>
            {dates ? <Text style={[s.entryDate, { marginTop: 1, width: "100%", textAlign: "left" }]}>{dates}</Text> : null}
          </>
        ) : (
          <View style={s.entryHeaderRow}>
            <Text style={s.entryTitle}>{titleLine || entry.description}</Text>
            {dates ? <Text style={s.entryDate}>{dates}</Text> : null}
          </View>
        )}
        {entry.location ? <Text style={s.entryLocation}>{entry.location}</Text> : null}
        {entry.description && titleLine ? <Text style={s.entryDescription}>{entry.description}</Text> : null}
        {entry.bullets.map((b) => (
          <View style={s.bulletRow} key={b.id} wrap={false}>
            <Text style={s.bulletGlyph}>{"•"}</Text>
            <Text style={s.bulletText}>{b.text}</Text>
          </View>
        ))}
        {entry.links.length > 0 && (
          <View style={s.contactRow}>
            {entry.links.map((l, i) => (
              <Link key={i} src={withHref(l.url)} style={s.link}>
                {l.label || displayUrl(l.url)}
              </Link>
            ))}
          </View>
        )}
      </View>
    );
  }

  function renderSkillEntry(entry: Entry, key: string) {
    return (
      <Text style={s.skillLine} key={key}>
        {entry.title ? <Text style={s.skillCategory}>{entry.title}: </Text> : null}
        {entry.description}
      </Text>
    );
  }

  function renderSection(section: Section, narrow = false) {
    const isSkills = section.type === "SKILLS";
    return (
      <View style={s.section} key={section.id}>
        <View wrap={false}>
          {renderHeading(section.title)}
          {section.text ? <Text style={s.sectionText}>{section.text}</Text> : null}
          {section.entries[0] &&
            (isSkills ? renderSkillEntry(section.entries[0], "e0") : renderEntry(section.entries[0], "e0", narrow))}
        </View>
        {section.entries.slice(1).map((entry, i) =>
          isSkills ? renderSkillEntry(entry, `e${i + 1}`) : renderEntry(entry, `e${i + 1}`, narrow)
        )}
      </View>
    );
  }

  const orderedSections = [...resume.sections].sort((a, b) => a.order - b.order);
  const useColumns = style.columns === 2;
  const sideSections = useColumns ? orderedSections.filter((s2) => isSidebarSection(s2.type)) : [];
  const mainSections = useColumns ? orderedSections.filter((s2) => !isSidebarSection(s2.type)) : orderedSections;

  return (
    <Document title={p.fullName ? `${p.fullName} — Resume` : "Resume"}>
      <Page size="LETTER" style={s.page} wrap>
        <View style={s.nameBanner}>
          <Text style={s.name}>{p.fullName || "Your Name"}</Text>
          {p.headline ? <Text style={s.headline}>{p.headline}</Text> : null}
          <View style={s.contactRow}>
            {contactParts.map((c, i) => (
              <View key={i} style={{ flexDirection: "row" }}>
                {i > 0 ? <Text style={s.contactSep}>{"·"}</Text> : null}
                {c.href ? (
                  <Link src={c.href} style={[s.contactItem, s.contactLink]}>
                    {c.label}
                  </Link>
                ) : (
                  <Text style={s.contactItem}>{c.label}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={s.body}>
          {useColumns ? (
            <View style={s.columns}>
              <View style={s.colMain}>{mainSections.map((sec) => renderSection(sec, false))}</View>
              <View style={s.colSide}>{sideSections.map((sec) => renderSection(sec, true))}</View>
            </View>
          ) : (
            mainSections.map((sec) => renderSection(sec, false))
          )}
        </View>
      </Page>
    </Document>
  );
}

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

/**
 * Builds a small, realistic single-column resume PDF entirely in memory, so
 * the parser test suite has no dependency on a committed binary fixture.
 * Mirrors common resume conventions: name/headline/contact block, ALL CAPS
 * section headings, bold company+dates header lines, and bullet points.
 */
export async function buildTestResumePdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 740;
  const left = 54;

  function line(text: string, opts: { size?: number; f?: PDFFont; gap?: number } = {}) {
    const { size = 10, f = font, gap = 14 } = opts;
    page.drawText(text, { x: left, y, size, font: f, color: rgb(0.1, 0.1, 0.12) });
    y -= gap;
  }

  line("Jordan Rivera", { size: 20, f: bold, gap: 24 });
  line("Software Engineer", { size: 12, gap: 16 });
  line("jordan.rivera@email.com | (555) 123-4567 | San Francisco, CA | linkedin.com/in/jordanrivera", {
    size: 9.5,
    gap: 22,
  });

  line("SUMMARY", { size: 12, f: bold, gap: 16 });
  line("Software engineer with experience building web applications and internal tools.", { gap: 20 });

  line("EXPERIENCE", { size: 12, f: bold, gap: 16 });
  line("Acme Corporation — San Francisco, CA", { size: 10.5, f: bold, gap: 13 });
  line("Software Engineer                                            Jun 2022 - Present", { gap: 15 });
  line("• Worked on data analysis for company reports.", { gap: 13 });
  line("• Built dashboards for sales team.", { gap: 13 });
  line("• Helped improve application performance.", { gap: 20 });

  line("Beta Startup Inc — Remote", { size: 10.5, f: bold, gap: 13 });
  line("Software Engineering Intern                                  Jun 2021 - Aug 2021", { gap: 15 });
  line("• Built a Python ETL pipeline processing 2M records daily.", { gap: 13 });
  line("• Collaborated with 4 engineers to ship a customer-facing feature.", { gap: 20 });

  line("EDUCATION", { size: 12, f: bold, gap: 16 });
  line("Stanford University", { size: 10.5, f: bold, gap: 13 });
  line("B.S. in Computer Science                                     Aug 2018 - May 2022", { gap: 20 });

  line("SKILLS", { size: 12, f: bold, gap: 16 });
  line("Languages: Python, JavaScript, TypeScript, SQL", { gap: 13 });
  line("Tools: React, Node.js, Docker, AWS", { gap: 13 });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

/** A single blank page with zero text — simulates a scanned/image-only PDF. */
export async function buildBlankPdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

import type { StructuredResume } from "@/lib/resume/types";
import { newBulletId, newEntryId, newSectionId } from "@/lib/resume/ids";

/** A small but representative resume used across render/segmentation tests. */
export function buildSampleResume(): StructuredResume {
  return {
    personalInfo: {
      fullName: "Jordan Rivera",
      headline: "Software Engineer",
      email: "jordan.rivera@email.com",
      phone: "(555) 123-4567",
      location: "San Francisco, CA",
      linkedin: "https://linkedin.com/in/jordanrivera",
      github: "https://github.com/jordanrivera",
    },
    sections: [
      {
        id: newSectionId(),
        type: "SUMMARY",
        title: "Summary",
        order: 0,
        text: "Software engineer with 3 years of experience building web applications and internal tools.",
        entries: [],
      },
      {
        id: newSectionId(),
        type: "EXPERIENCE",
        title: "Experience",
        order: 1,
        entries: [
          {
            id: newEntryId(),
            order: 0,
            organization: "Acme Corporation",
            title: "Software Engineer",
            location: "San Francisco, CA",
            startDate: "Jun 2022",
            isCurrent: true,
            bullets: [
              { id: newBulletId(), order: 0, text: "Worked on data analysis for company reports." },
              { id: newBulletId(), order: 1, text: "Built dashboards for the sales team." },
            ],
            links: [],
            meta: {},
          },
        ],
      },
      {
        id: newSectionId(),
        type: "EDUCATION",
        title: "Education",
        order: 2,
        entries: [
          {
            id: newEntryId(),
            order: 0,
            organization: "Stanford University",
            title: "B.S. in Computer Science",
            startDate: "Aug 2018",
            endDate: "May 2022",
            bullets: [],
            links: [],
            meta: {},
          },
        ],
      },
      {
        id: newSectionId(),
        type: "SKILLS",
        title: "Skills",
        order: 3,
        entries: [
          { id: newEntryId(), order: 0, title: "Languages", description: "Python, JavaScript, TypeScript, SQL", bullets: [], links: [], meta: {} },
          { id: newEntryId(), order: 1, title: "Tools", description: "React, Node.js, Docker, AWS", bullets: [], links: [], meta: {} },
        ],
      },
    ],
  };
}

import type { StructuredResume } from "./types";
import { newBulletId, newEntryId, newSectionId } from "./ids";

/**
 * Realistic demo content for the "Load Demo Resume" flow, so the product
 * can be explored end-to-end (parsing skipped) without requiring a PDF
 * upload. Deliberately mixes weak bullets (vague, no metrics, responsibility
 * framing, repeated verbs) with a few strong ones, so the AI Resume Coach
 * has real, varied material to react to instead of a uniformly polished
 * sample that would make the coach look inert.
 */
export const DEMO_RESUME_NAME = "Alex Morgan — Software Engineering Resume";
export const DEMO_TARGET_ROLE = "Software Engineer (New Grad)";

export function demoStructuredResume(): StructuredResume {
  return {
    personalInfo: {
      fullName: "Alex Morgan",
      headline: "Computer Science Student",
      email: "alex.morgan@example.com",
      phone: "(415) 555-0182",
      location: "Berkeley, CA",
      linkedin: "https://linkedin.com/in/alexmorgan",
      github: "https://github.com/alexmorgan",
      website: "https://alexmorgan.dev",
    },
    sections: [
      {
        id: newSectionId(),
        type: "SUMMARY",
        title: "Summary",
        order: 0,
        text: "Computer science student who worked on some data and software projects. Interested in software engineering roles and looking for an opportunity to use my skills.",
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
            organization: "Northstar Analytics",
            title: "Data Analyst Intern",
            location: "San Francisco, CA",
            startDate: "Jun 2025",
            endDate: "Aug 2025",
            bullets: [
              { id: newBulletId(), order: 0, text: "Worked on data analysis for company reports." },
              { id: newBulletId(), order: 1, text: "Helped build dashboards for the sales team." },
              {
                id: newBulletId(),
                order: 2,
                text: "Wrote Python scripts to clean and process a 250K-row customer transactions dataset, cutting the team's weekly reporting time from 6 hours to under 1.",
              },
              { id: newBulletId(), order: 3, text: "Was responsible for updating the internal wiki." },
            ],
            links: [],
            meta: {},
          },
          {
            id: newEntryId(),
            order: 1,
            organization: "UC Berkeley, Dept. of EECS",
            title: "Undergraduate Teaching Assistant — Data Structures",
            location: "Berkeley, CA",
            startDate: "Jan 2025",
            isCurrent: true,
            bullets: [
              {
                id: newBulletId(),
                order: 0,
                text: "Led weekly discussion sections and office hours for 45 students, and graded assignments for a 200-student data structures course.",
              },
              { id: newBulletId(), order: 1, text: "Helped students with their homework and answered questions." },
              { id: newBulletId(), order: 2, text: "Worked with two other TAs on grading." },
            ],
            links: [],
            meta: {},
          },
        ],
      },
      {
        id: newSectionId(),
        type: "PROJECTS",
        title: "Projects",
        order: 2,
        entries: [
          {
            id: newEntryId(),
            order: 0,
            title: "PantryPal — Recipe Recommendation App",
            description: "",
            startDate: "Sep 2024",
            endDate: "Dec 2024",
            bullets: [
              {
                id: newBulletId(),
                order: 0,
                text: "Built a full-stack web app (React, Node.js, PostgreSQL) that recommends recipes from a user's on-hand ingredients; used by 300+ students during a campus hackathon demo weekend.",
              },
              {
                id: newBulletId(),
                order: 1,
                text: "Implemented a matching algorithm to rank recipes by ingredient overlap and dietary filters.",
              },
              { id: newBulletId(), order: 2, text: "Made the frontend using React." },
            ],
            links: [{ label: "GitHub", url: "https://github.com/alexmorgan/pantrypal" }],
            meta: {},
          },
          {
            id: newEntryId(),
            order: 1,
            title: "Course Project: Distributed Key-Value Store",
            bullets: [
              { id: newBulletId(), order: 0, text: "Worked on a project for my systems class about distributed systems." },
              { id: newBulletId(), order: 1, text: "Used Go to build the thing with some classmates." },
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
        order: 3,
        entries: [
          {
            id: newEntryId(),
            order: 0,
            organization: "University of California, Berkeley",
            title: "B.S. in Computer Science",
            startDate: "Aug 2022",
            endDate: "May 2026",
            bullets: [],
            links: [],
            meta: { gpa: "3.7 / 4.0", coursework: "Data Structures, Algorithms, Databases, Operating Systems, ML" },
          },
        ],
      },
      {
        id: newSectionId(),
        type: "SKILLS",
        title: "Skills",
        order: 4,
        entries: [
          { id: newEntryId(), order: 0, title: "Languages", description: "Python, JavaScript, TypeScript, Go, SQL", bullets: [], links: [], meta: {} },
          { id: newEntryId(), order: 1, title: "Frameworks & Tools", description: "React, Node.js, PostgreSQL, Docker, Git", bullets: [], links: [], meta: {} },
        ],
      },
      {
        id: newSectionId(),
        type: "LEADERSHIP",
        title: "Leadership & Activities",
        order: 5,
        entries: [
          {
            id: newEntryId(),
            order: 0,
            organization: "Berkeley Computer Science Mentorship Program",
            title: "Peer Mentor",
            startDate: "Sep 2023",
            isCurrent: true,
            bullets: [{ id: newBulletId(), order: 0, text: "Mentor first-year students interested in computer science." }],
            links: [],
            meta: {},
          },
        ],
      },
    ],
  };
}

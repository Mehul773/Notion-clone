/* Built-in page templates (Notion-marketplace style). Each template is plain
 * Markdown fed through the import pipeline, so tables become real databases
 * with typed columns. */

export type Template = {
  id: string;
  name: string;
  icon: string;
  description: string;
  markdown: string;
};

export const TEMPLATES: Template[] = [
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    icon: "🤝",
    description: "Agenda, decisions, and action items for any meeting.",
    markdown: `---
title: Meeting Notes
icon: 🤝
---

## Details

- **Date:**
- **Attendees:**
- **Goal:**

## Agenda

1. Topic one
2. Topic two
3. Open questions

## Notes

Write discussion notes here…

## Decisions

> Record each decision and who owns it.

## Action items

- [ ] First action — owner, due date
- [ ] Second action — owner, due date
`,
  },
  {
    id: "project-tracker",
    name: "Project Tracker",
    icon: "🚀",
    description: "Task database with status, owner, and due dates.",
    markdown: `---
title: Project Tracker
icon: 🚀
---

A single home for this project: goals, links, and the task board below.

## Goals

- Ship on time with clear owners
- Review progress every Monday

## Tasks

| Task | Status | Owner | Due | Done |
|------|--------|-------|-----|------|
| Define scope | Done | | 2026-06-15 | true |
| Draft design | In progress | | 2026-06-22 | false |
| Build first version | Not started | | 2026-07-06 | false |
| Internal review | Not started | | 2026-07-13 | false |
| Launch | Not started | | 2026-07-20 | false |
`,
  },
  {
    id: "hiring-pipeline",
    name: "Hiring Pipeline",
    icon: "🎯",
    description: "Candidate tracker with stages, scores, and interviews.",
    markdown: `---
title: Hiring Pipeline
icon: 🎯
---

Track every candidate from screen to offer.

## Process

1. Resume screen
2. Phone screen
3. Onsite loop
4. Offer & close

## Candidates

| Candidate | Role | Stage | Score | Interview | Profile |
|-----------|------|-------|-------|-----------|---------|
| Example Person | Engineer | Screen | 7 | 2026-06-20 | https://linkedin.com/in/example |
| Another Person | Engineer | Onsite | 9 | 2026-06-18 | https://linkedin.com/in/another |
| Third Person | Designer | Offer | 8 | 2026-06-16 | https://linkedin.com/in/third |

## Interview questions

- [ ] Walk me through a project you're proud of
- [ ] How do you handle disagreement on a team?
- [ ] What would you build in your first 90 days?
`,
  },
  {
    id: "weekly-planner",
    name: "Weekly Planner",
    icon: "🗓️",
    description: "Priorities, schedule, and a Friday review.",
    markdown: `---
title: Weekly Planner
icon: 🗓️
---

## Top 3 priorities

- [ ] Priority one
- [ ] Priority two
- [ ] Priority three

## Schedule

| Day | Focus | Notes |
|-----|-------|-------|
| Monday | | |
| Tuesday | | |
| Wednesday | | |
| Thursday | | |
| Friday | | |

## Friday review

> What worked? What didn't? What changes next week?
`,
  },
  {
    id: "onboarding-plan",
    name: "30-60-90 Onboarding",
    icon: "🧭",
    description: "Ramp-up plan for a new hire's first three months.",
    markdown: `---
title: 30-60-90 Onboarding Plan
icon: 🧭
---

A clear ramp for the first three months. Check items off as you go.

## First 30 days — learn

- [ ] Meet the team and key partners
- [ ] Set up tools and access
- [ ] Read the core docs and past decisions
- [ ] Ship one small change end-to-end

## Days 31-60 — contribute

- [ ] Own a well-scoped project
- [ ] Run a team meeting or demo
- [ ] Collect feedback from your manager

## Days 61-90 — own

- [ ] Lead a project with a visible outcome
- [ ] Write down one process improvement
- [ ] Set goals for the next quarter

> Tip: review this page with your manager every two weeks.
`,
  },
  {
    id: "content-calendar",
    name: "Content Calendar",
    icon: "✍️",
    description: "Plan posts across channels with status and dates.",
    markdown: `---
title: Content Calendar
icon: ✍️
---

Plan, draft, and publish — everything in one table.

## Pipeline

| Title | Channel | Status | Publish date | Published |
|-------|---------|--------|--------------|-----------|
| Launch announcement | Blog | Draft | 2026-06-25 | false |
| Behind the scenes | LinkedIn | Idea | 2026-06-27 | false |
| Feature deep-dive | Blog | Idea | 2026-07-02 | false |
| Customer story | LinkedIn | Draft | 2026-07-09 | false |

## Ideas backlog

- Idea one
- Idea two
- Idea three
`,
  },
];

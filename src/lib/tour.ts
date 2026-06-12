import { driver } from "driver.js";
import "driver.js/dist/driver.css";

/* Guided onboarding tour (driver.js). Auto-runs on first launch, can be
 * replayed any time from the "Tutorial" button in the sidebar. */

export const TOUR_DONE_KEY = "slate:tourDone";

export function startTour(options?: { onFinish?: () => void }) {
  const steps = [
      {
        popover: {
          title: "👋 Welcome to Slate",
          description:
            "Your Notion-style workspace: pages, databases, drawings, and notes — all stored locally on your machine. This quick tour shows you around (you can replay it any time from <b>Tutorial</b> at the bottom of the sidebar).",
        },
      },
      {
        element: '[data-tour="new-page"]',
        popover: {
          title: "Create pages",
          description:
            "Click here (or press <b>Ctrl+N</b>) to create a page. Inside a page, type <b>/</b> to insert anything: headings, to-dos, tables, databases, drawings, PDFs, YouTube embeds…",
        },
      },
      {
        element: '[data-tour="templates"]',
        popover: {
          title: "Start from a template",
          description:
            "Six ready-made pages — Meeting Notes, Project Tracker, Hiring Pipeline and more. One click and the page appears with a real database inside.",
        },
      },
      {
        element: '[data-tour="today"]',
        popover: {
          title: "Daily notes",
          description:
            "One click opens today's journal page — auto-created under a 📓 Journal section, one per day. Perfect for quick notes and daily to-dos.",
        },
      },
      {
        element: '[data-tour="import"]',
        popover: {
          title: "Import Markdown",
          description:
            "Paste any Markdown (or drop a .md file) and it becomes a formatted page. Tables turn into real databases. There's even a copy-paste prompt so an AI can write the file for you.",
        },
      },
      {
        element: '[data-tour="ai"]',
        popover: {
          title: "AI workspace",
          description:
            "Describe a project and Claude builds a full starter workspace — pages, sub-pages, and seeded databases. Needs an Anthropic API key (optional).",
        },
      },
      {
        element: '[data-tour="search"]',
        popover: {
          title: "Find anything",
          description:
            "<b>Ctrl+K</b> searches page titles <i>and</i> everything written inside pages, with a snippet of the match.",
        },
      },
      {
        element: '[data-tour="recent"]',
        popover: {
          title: "Recent pages",
          description:
            "Your latest-edited pages stay up here so you never lose track. Brand-new pages get a <b>NEW</b> tag for a few minutes.",
        },
      },
      {
        element: '[data-tour="trash"]',
        popover: {
          title: "Nothing is lost",
          description:
            "Deleted pages go to Trash and can be restored. And that's the tour — click <b>Finish</b> and we'll create a sample page for you to play with!",
        },
      },
  ].filter(
    (step) =>
      !step.element || document.querySelector(step.element as string) !== null
  );
  const tour = driver({
    showProgress: true,
    allowClose: true,
    overlayOpacity: 0.6,
    nextBtnText: "Next →",
    prevBtnText: "← Back",
    doneBtnText: "Finish",
    // All destroy paths (Finish, ×, overlay click) come through here. Read
    // the state before destroy() tears it down; only a full run-through
    // earns the sample page.
    onDestroyStarted: () => {
      const finished = tour.isLastStep();
      localStorage.setItem(TOUR_DONE_KEY, "1");
      tour.destroy();
      if (finished) options?.onFinish?.();
    },
    steps,
  });
  tour.drive();
}

export const SAMPLE_PAGE_MARKDOWN = `---
title: Getting started with Slate
icon: 👋
---

Welcome! This page was created by the tutorial so you can try things immediately.

## Try these

- [ ] Type **/** on an empty line to see every block type
- [ ] Drag this checklist item using the ⋮⋮ handle on its left
- [ ] Press **Ctrl+K** and search for "getting started"
- [ ] Press **Ctrl+Shift+F** for distraction-free focus mode
- [ ] Hover the title above and change the icon or cover

## A real database

The table below is a live database — click a tag to change it, drag column edges to resize, or add rows.

| Idea | Status | Priority |
|------|--------|----------|
| Plan my week | In progress | 2 |
| Read a book | Not started | 3 |
| Ship something cool | In progress | 1 |

> Tip: delete this page from its ⋯ menu whenever you're done exploring.
`;

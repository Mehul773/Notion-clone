import { driver } from "driver.js";
import "driver.js/dist/driver.css";

/* Guided onboarding tour (driver.js). Auto-runs on first launch, replayable
 * from the "Tutorial" button. Clean, text-only steps. */

export const TOUR_DONE_KEY = "slate:tourDone";

/** Wrap a step's body text. */
function body(text: string) {
  return `<div class="tour-text">${text}</div>`;
}

export function startTour(options?: { onFinish?: () => void }) {
  const steps = [
    {
      popover: {
        title: "👋 Welcome to Slate",
        description: body(
          "Pages, databases, drawings — all local. Quick tour. Replay via <b>Tutorial</b> anytime."
        ),
      },
    },
    {
      element: '[data-tour="new-page"]',
      popover: {
        title: "Create pages",
        description: body("<b>Ctrl+N</b>. Inside, type <b>/</b> for every block."),
      },
    },
    {
      element: '[data-tour="templates"]',
      popover: {
        title: "Templates",
        description: body("One click → ready page with live database."),
      },
    },
    {
      element: '[data-tour="today"]',
      popover: {
        title: "Daily notes",
        description: body("Today's journal, one click. One per day."),
      },
    },
    {
      element: '[data-tour="import"]',
      popover: {
        title: "Import Markdown",
        description: body("Paste .md → formatted page. Tables become databases."),
      },
    },
    {
      element: '[data-tour="ai"]',
      popover: {
        title: "AI workspace",
        description: body("Describe project → Claude builds it. (Optional API key.)"),
      },
    },
    {
      element: '[data-tour="search"]',
      popover: {
        title: "Find anything",
        description: body("<b>Ctrl+K</b> — titles <i>and</i> page content."),
      },
    },
    {
      element: '[data-tour="recent"]',
      popover: {
        title: "Recent",
        description: body("Latest edits on top. <b>NEW</b> tag on fresh pages. Hover row → ⋯ menu and +."),
      },
    },
    {
      element: '[data-tour="favorites"]',
      popover: {
        title: "Favorites",
        description: body("Star any page (topbar ★ or ⋯ menu) → pinned here."),
      },
    },
    {
      element: '[data-tour="theme"]',
      popover: {
        title: "Dark / light",
        description: body("One click. Your eyes, your rules."),
      },
    },
    {
      element: '[data-tour="font"]',
      popover: {
        title: "Fonts & more",
        description: body(
          "Font size, family (serif/mono/Google Fonts), <b>Simple mode</b> — all here."
        ),
      },
    },
    {
      element: '[data-tour="focus"]',
      popover: {
        title: "Focus mode",
        description: body("<b>Ctrl+Shift+F</b> — everything vanishes but your words."),
      },
    },
    {
      element: '[data-tour="page-options"]',
      popover: {
        title: "Page options",
        description: body(
          "Export MD/HTML, duplicate, <b>save as template</b>, word count."
        ),
      },
    },
    {
      element: ".page-head",
      popover: {
        title: "Make it yours",
        description: body(
          "Hover title → add <b>icon</b> + <b>cover</b>. Cover picker has a GIF tab too."
        ),
      },
    },
    {
      element: '[data-tour="trash"]',
      popover: {
        title: "Nothing is lost",
        description: body(
          "Everything restorable. <b>Finish</b> → we build a demo page showing ALL features!"
        ),
      },
    },
    {
      popover: {
        title: "🎉 You made it",
        description: body("Tour done. Demo page incoming…"),
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

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

/* Guided onboarding tour (driver.js). Auto-runs on first launch, replayable
 * from the "Tutorial" button. Each step shows a random meme GIF from a
 * hardcoded pool (direct GIPHY CDN URLs — zero API calls, no rate limits)
 * and a 🎲 button swaps in another one. */

export const TOUR_DONE_KEY = "slate:tourDone";

const gif = (id: string) => `https://media.giphy.com/media/${id}/giphy.gif`;

const MEME_POOLS: Record<string, string[]> = {
  welcome: [gif("qt73FYHjuXqAj241m8"), gif("jv0TnQE80z8wU"), gif("IrM6xt2L9LQElwXorI")],
  newpage: [gif("BWDcL7fstaBkoibm6O"), gif("4JVP2YSZSaq4crXDlq"), gif("4YoeMxU9qpV1F0H8Eg"), gif("uMueJhzK6SmOpKOTiZ")],
  templates: [gif("yoJC2k4dPDRSInYfjq"), gif("TzHZgZdgfrz1j5kMRk")],
  daily: [gif("vtFZ8O85q8g3MmXK51"), gif("tFe0pdN5Afhj2Si4eP"), gif("czGZb6t3huLMBcX7Mz")],
  importmd: [gif("kjpKQ8wXVVocN5IIyK"), gif("l2QDVUsAgCoYUhxsY"), gif("A8M4dzTtXIUtG"), gif("Na33dsU2umStO"), gif("oYtVHSxngR3lC")],
  ai: [gif("NxJZnWD1RiWOCCwKgE"), gif("5VKbvrjxpVJCM"), gif("lxxOGaDRk4f7R5TkBd")],
  search: [gif("xGdvlOVSWaDvi"), gif("nCEye0ARmq4MOnmzz2"), gif("3zDdFSPALuCe6C43nM"), gif("W8W3UlMaQ4lL8gt2jG")],
  recent: [gif("wpgYasZ0tBrP4lCgS3"), gif("Sqfu14lSonVN219Zb6"), gif("0tONCfOdU9SW4YTtCk")],
  favorites: [gif("5qTSz4kGQ7LDa"), gif("Ipv5HMq79nrV5j9s7W"), gif("MPdhAWm4invQrUwaG3"), gif("pULj9CGmIcfuzXTPfp")],
  personalize: [gif("84BjZMVEX3aRG"), gif("uiUm7hG26a6bAGppO6"), gif("xlGYf1RUbYYes"), gif("frkzjDlJ8PcYLbqmSl"), gif("3ohs81rDuEz9ioJzAA")],
  focus: [gif("Rf4WPLXF1seO2oTkTX"), gif("14afmHqKZ3ctsk"), gif("J82gnViB2YLVIbfvZo")],
  options: [gif("ToMjGpmGUC7axrjBAmQ"), gif("vtf0uP1bwXBg4"), gif("1CaX61s7um4ax5vlUW"), gif("Ta7lq6ZMBOqzu"), gif("iGwFCTl8eeX7KCyLUw")],
  trash: [gif("ktcUyw6mBlMVa"), gif("gecNxHaA7NbCU"), gif("xsFjLwT7NPfH2"), gif("jmnczdzxZl3FXIABFs"), gif("BxLh9rb38cWBO8UUwW")],
  finale: [gif("tlawNnswcTAmGjKRHQ"), gif("W6Lwg2xvTr6tJpuSTd"), gif("5UAofAl6g5t1GL5nO8"), gif("t3sZxY5zS5B0z5zMIz"), gif("dMsh6gRYJDymXSIatd"), gif("artj92V8o75VPL7AeQ")],
};

function pickRandom(pool: string, not?: string) {
  const list = MEME_POOLS[pool] ?? [];
  const candidates = list.length > 1 ? list.filter((u) => u !== not) : list;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? "";
}

declare global {
  interface Window {
    __slateNextMeme?: () => void;
  }
}

/** Swap the visible tour GIF for another random one from the same pool. */
window.__slateNextMeme = () => {
  const img = document.querySelector<HTMLImageElement>(".driver-popover .tour-gif");
  if (!img) return;
  const pool = img.dataset.pool ?? "";
  img.src = pickRandom(pool, img.src);
};

function memeStep(pool: string, text: string) {
  return (
    `<img class="tour-gif" data-pool="${pool}" src="${pickRandom(pool)}" alt="meme">` +
    `<div class="tour-text">${text}</div>` +
    `<button class="tour-gif-btn" onclick="window.__slateNextMeme()">🎲 another meme</button>`
  );
}

export function startTour(options?: { onFinish?: () => void }) {
  const steps = [
    {
      popover: {
        title: "👋 Welcome to Slate",
        description: memeStep(
          "welcome",
          "Pages, databases, drawings — all local. Quick tour. Replay via <b>Tutorial</b> anytime."
        ),
      },
    },
    {
      element: '[data-tour="new-page"]',
      popover: {
        title: "Create pages",
        description: memeStep("newpage", "<b>Ctrl+N</b>. Inside, type <b>/</b> for every block."),
      },
    },
    {
      element: '[data-tour="templates"]',
      popover: {
        title: "Templates",
        description: memeStep("templates", "One click → ready page with live database."),
      },
    },
    {
      element: '[data-tour="today"]',
      popover: {
        title: "Daily notes",
        description: memeStep("daily", "Today's journal, one click. One per day."),
      },
    },
    {
      element: '[data-tour="import"]',
      popover: {
        title: "Import Markdown",
        description: memeStep("importmd", "Paste .md → formatted page. Tables become databases."),
      },
    },
    {
      element: '[data-tour="ai"]',
      popover: {
        title: "AI workspace",
        description: memeStep("ai", "Describe project → Claude builds it. (Optional API key.)"),
      },
    },
    {
      element: '[data-tour="search"]',
      popover: {
        title: "Find anything",
        description: memeStep("search", "<b>Ctrl+K</b> — titles <i>and</i> page content."),
      },
    },
    {
      element: '[data-tour="recent"]',
      popover: {
        title: "Recent",
        description: memeStep("recent", "Latest edits on top. <b>NEW</b> tag on fresh pages. Hover row → ⋯ menu and +."),
      },
    },
    {
      element: '[data-tour="favorites"]',
      popover: {
        title: "Favorites",
        description: memeStep("favorites", "Star any page (topbar ★ or ⋯ menu) → pinned here."),
      },
    },
    {
      element: '[data-tour="theme"]',
      popover: {
        title: "Dark / light",
        description: memeStep("personalize", "One click. Your eyes, your rules."),
      },
    },
    {
      element: '[data-tour="font"]',
      popover: {
        title: "Fonts & more",
        description: memeStep(
          "personalize",
          "Font size, family (serif/mono/Google Fonts), <b>Simple mode</b> — all here."
        ),
      },
    },
    {
      element: '[data-tour="focus"]',
      popover: {
        title: "Focus mode",
        description: memeStep("focus", "<b>Ctrl+Shift+F</b> — everything vanishes but your words."),
      },
    },
    {
      element: '[data-tour="page-options"]',
      popover: {
        title: "Page options",
        description: memeStep(
          "options",
          "Export MD/HTML, duplicate, <b>save as template</b>, word count."
        ),
      },
    },
    {
      element: ".page-head",
      popover: {
        title: "Make it yours",
        description: memeStep(
          "personalize",
          "Hover title → add <b>icon</b> + <b>cover</b>. Cover picker has a GIF tab 😏."
        ),
      },
    },
    {
      element: '[data-tour="trash"]',
      popover: {
        title: "Nothing is lost",
        description: memeStep(
          "trash",
          "Everything restorable. <b>Finish</b> → we build a demo page showing ALL features!"
        ),
      },
    },
    {
      popover: {
        title: "🎉 You made it",
        description: memeStep("finale", "Tour done. Demo page incoming…"),
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

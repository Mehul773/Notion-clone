import { useSyncExternalStore } from "react";

/* Reads the app theme from <html data-theme>, staying reactive to changes.
 * Used by components rendered inside the editor that can't receive props
 * from App (custom blocks). */

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): "light" | "dark" {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function useAppTheme() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

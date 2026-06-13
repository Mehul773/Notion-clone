import { Id } from "../../convex/_generated/dataModel";

/* Bridge so custom blocks / inline content rendered deep inside the editor
 * can ask App to navigate to a page, without prop drilling. */

export function navigateToPage(pageId: Id<"pages">) {
  window.dispatchEvent(
    new CustomEvent("slate:navigate", { detail: { pageId } })
  );
}

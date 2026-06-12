import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { importMarkdownPage } from "./markdownImport";

/* Logseq/Obsidian-style daily notes: one click opens today's page,
 * auto-created under a "Journal" parent. */

export function todayTitle() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function openDailyNote(
  convex: ConvexReactClient,
  pages: Doc<"pages">[]
): Promise<Id<"pages">> {
  const title = todayTitle();
  let journalId = pages.find((p) => !p.parentId && p.title === "Journal")?._id;
  if (!journalId) {
    journalId = await convex.mutation(api.pages.create, { title: "Journal" });
    await convex.mutation(api.pages.setIcon, {
      pageId: journalId,
      icon: "📓",
    });
  }
  const existing = pages.find(
    (p) => p.parentId === journalId && p.title === title
  );
  if (existing) return existing._id;
  const markdown = `---
title: ${title}
icon: 📅
---

## Today

- [ ] First thing to do

## Notes

`;
  return await importMarkdownPage(convex, markdown, {
    convertTables: false,
    parentId: journalId,
  });
}

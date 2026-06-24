<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

## Slate maintenance rules (caveman style — keep it)

When you add/change a feature, update ALL the touchpoints:

1. **Onboarding tour** (`src/lib/tour.ts`) — new step if feature is user-facing + worth showing. Short caveman text. Meme GIF pool per step (hardcoded GIPHY CDN URLs only — NEVER API calls in tour).
2. **Showcase page** (`src/lib/showcase.ts`) — "Getting started with Slate" demo page = feature catalog. New feature → new section/bullet there.
3. **README.md** — caveman-lite voice (no filler, full sentences, tight). Feature list + recruiter section.
4. **WISHLIST.md** — move shipped items to Done w/ file pointers. New ideas → right bucket (easy/medium/big/not-feasible).
5. **Default templates** (`src/lib/templates.ts`) — if new feature helps a template (e.g. formula columns in Habit Tracker), weave it in. Templates must stay award-winning quality.
6. **AI import prompt** (`AI_MARKDOWN_PROMPT` in `src/lib/markdownImport.ts`) — update if importable syntax changed.
7. **Shortcuts modal** (`src/components/ShortcutsModal.tsx`) — new keybinding → new row.

Working style:
- **Use `/caveman ultra` every session** — terse, actionable reviews. No fluff.
- **Use codegraph / code-review-graph MCP first** to explore — cheaper than Grep/Read. Graph queries before file reads.
- Be creative. Think like a daily Notion power-user: what would they miss? what annoys them? Ship that.
- Caveman mode for commit messages and summaries. Test in preview before commit. Commit + push after testing.

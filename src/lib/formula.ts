import { Parser } from "expr-eval";
import { Doc } from "../../convex/_generated/dataModel";

/* Spreadsheet-style formula columns. Formulas reference sibling columns by
 * name in square brackets, e.g. `[Price] * (1 - [Discount])`. Evaluation is
 * client-side and read-only. */

const parser = new Parser();

export function evaluateFormula(
  formula: string,
  row: Doc<"dbRows">,
  columns: Doc<"dbColumns">[]
): string {
  if (!formula.trim()) return "";
  try {
    const expr = formula.replace(/\[([^\]]+)\]/g, (_, name: string) => {
      const col = columns.find(
        (c) => c.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (!col) return "0";
      const raw = row.cells[col._id];
      if (typeof raw === "number") return String(raw);
      if (typeof raw === "boolean") return raw ? "1" : "0";
      const n = parseFloat(String(raw ?? ""));
      return isNaN(n) ? "0" : String(n);
    });
    const result = parser.evaluate(expr);
    if (typeof result === "number") {
      return Number.isInteger(result)
        ? String(result)
        : result.toFixed(2).replace(/\.?0+$/, "");
    }
    return String(result);
  } catch {
    return "#ERR";
  }
}

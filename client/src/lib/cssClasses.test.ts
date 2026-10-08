import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards against a class being used in a component while its CSS no longer
 * exists. That failure is silent — the element simply renders with no styling —
 * so nothing in the build or the typecheck catches it.
 */
const root = path.resolve(__dirname, "../..");
const css = fs.readFileSync(path.join(root, "src/index.css"), "utf8");

/** Classes defined by this project (everything else comes from Tailwind). */
const OWN_CLASSES = [
  "text-gold",
  "text-logo",
  "script",
  "eyebrow",
  "holo-rule",
  "holo-border",
  "strain-pill",
  "btn",
  "btn-gold",
  "btn-accent",
  "btn-ghost",
  "btn-sm",
  "card",
  "field",
  "bg-sunset",
  "glow",
  "sun",
  "marquee",
  "rise",
  "sway",
  "drawer-in",
  "no-scrollbar",
  "text-balance",
  "admin",
];

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

const sources = sourceFiles(path.join(root, "src"))
  .map(file => fs.readFileSync(file, "utf8"))
  .join("\n");

const used = OWN_CLASSES.filter(cls =>
  new RegExp(`(^|["'\`\\s])${cls}(["'\`\\s]|$)`, "m").test(sources)
);

describe("custom classes referenced by components exist in the stylesheet", () => {
  it("finds project classes in use, so the check below is not vacuous", () => {
    expect(used.length).toBeGreaterThan(10);
  });

  it.each(used)("%s is defined", cls => {
    expect(css).toMatch(new RegExp(`\\.${cls}[\\s,:{>]`));
  });
});

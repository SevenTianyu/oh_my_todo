const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const css = fs.readFileSync(path.resolve(__dirname, "app.css"), "utf8");

function getRule(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, "m"));
  assert.ok(match, `Expected ${selector} rule to exist`);
  return match[1];
}

test("company judgment preview text wraps inside the card", () => {
  const summaryTextRule = getRule(".company-card__summary-item p");

  assert.match(summaryTextRule, /overflow-wrap:\s*anywhere/);
  assert.match(summaryTextRule, /word-break:\s*break-word/);
});

test("company judgment grid wrappers can shrink instead of forcing horizontal overflow", () => {
  const summaryLinesRule = getRule(".company-card__summary-lines");
  const summaryItemRule = getRule(".company-card__summary-item");

  assert.match(summaryLinesRule, /min-width:\s*0/);
  assert.match(summaryItemRule, /min-width:\s*0/);
});

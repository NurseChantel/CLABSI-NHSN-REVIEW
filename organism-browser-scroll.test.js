import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");

function functionBody(name, nextName) {
  const start = app.indexOf(`function ${name}(`);
  const end = app.indexOf(`function ${nextName}(`, start);
  assert.notEqual(start, -1, `Expected ${name} to exist`);
  assert.notEqual(end, -1, `Expected ${nextName} to follow ${name}`);
  return app.slice(start, end);
}

test("organism selection preserves page position, checklist position, and focus", () => {
  const sync = functionBody("syncOrganismSelection", "renderSelectedOrganismDetails");

  assert.match(sync, /const pageScrollX = window\.scrollX;/);
  assert.match(sync, /const pageScrollY = window\.scrollY;/);
  assert.match(sync, /const checklistScrollTop = checklist\?\.scrollTop \?\? 0;/);
  assert.match(sync, /activeChecklistControl\.focus\(\{ preventScroll: true \}\)/);
  assert.match(sync, /window\.scrollTo\(pageScrollX, pageScrollY\);/);
  assert.match(sync, /updateAll\(\);\s+restoreOrganismBrowserPosition\(\);\s+requestAnimationFrame\(restoreOrganismBrowserPosition\);/);
});

test("organism browser buttons cannot implicitly submit a form", () => {
  const browserMarkup = html.slice(
    html.indexOf('<div class="organism-search">'),
    html.indexOf('<select id="organismName"')
  );
  const checklistBuilder = functionBody("buildOrganismChecklist", "syncOrganismSelection");

  for (const match of browserMarkup.matchAll(/<button\b[^>]*>/g)) {
    assert.match(match[0], /type="button"/);
  }
  for (const match of checklistBuilder.matchAll(/<button\b[\s\S]*?>/g)) {
    assert.match(match[0], /type="button"/);
  }
});

test("checkbox changes do not navigate or explicitly scroll another section", () => {
  const checklistBuilder = functionBody("buildOrganismChecklist", "syncOrganismSelection");
  const changeHandler = checklistBuilder.slice(checklistBuilder.indexOf('checkbox.addEventListener("change"'));

  assert.doesNotMatch(changeHandler, /scrollIntoView|location\.hash|\.focus\(/);
  assert.match(changeHandler, /syncOrganismSelection\(\);/);
});

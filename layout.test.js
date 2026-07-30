import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");

function region(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);

  assert.notEqual(start, -1, `Expected to find ${startMarker}`);
  assert.notEqual(end, -1, `Expected to find ${endMarker} after ${startMarker}`);
  return html.slice(start, end);
}

test("Secondary BSI remains a complete primary workflow step in the required sequence", () => {
  const primaryWorkflow = region(
    'data-layout-region="primary-workflow"',
    '<aside id="reviewCalculator"'
  );
  const culture = primaryWorkflow.indexOf('id="culture"');
  const organism = primaryWorkflow.indexOf('id="organism"');
  const secondary = primaryWorkflow.indexOf('id="secondary"');
  const centralLine = primaryWorkflow.indexOf('id="line"');

  assert.ok(culture < organism && organism < secondary && secondary < centralLine);

  const secondaryCard = region(
    '<section class="review-card secondary-card" id="secondary">',
    '<section class="review-card" id="line">'
  );
  for (const workflowElement of [
    'id="siteButtons"',
    'id="siteGuidance"',
    'class="attribution-panel"',
    'id="secondaryConclusion"'
  ]) {
    assert.ok(
      secondaryCard.includes(workflowElement),
      `Expected the Secondary BSI card to contain ${workflowElement}`
    );
  }
});

test("the persistent sidebar contains summary widgets, not primary workflow cards", () => {
  const sidebar = region(
    '<aside id="reviewCalculator"',
    '</aside>'
  );

  assert.match(sidebar, /id="calculatorProgress"/);
  assert.match(sidebar, /id="calculatorOutcome"/);
  assert.match(sidebar, /id="calculatorNextSteps"/);
  for (const primaryCard of ["culture", "organism", "secondary", "line", "mbi", "result"]) {
    assert.doesNotMatch(sidebar, new RegExp(`id="${primaryCard}"`));
  }
});

test("all workflow sections stay inside the primary column", () => {
  const layout = region(
    '<div class="calculator-layout">',
    '<section class="reference-tabs"'
  );
  const tags = layout.matchAll(/<\/?(div|section|aside)\b[^>]*>/g);
  const stack = [];
  const workflowSections = new Set([
    "culture",
    "organism",
    "secondary",
    "line",
    "mbi",
    "result"
  ]);

  for (const match of tags) {
    const tag = match[0];
    const tagName = match[1];

    if (tag.startsWith("</")) {
      assert.equal(stack.pop()?.tagName, tagName, `Unexpected closing tag: ${tag}`);
      continue;
    }

    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    if (workflowSections.has(id)) {
      assert.ok(
        stack.some(({ tag }) => tag.includes('data-layout-region="primary-workflow"')),
        `Expected #${id} to remain inside the primary workflow column`
      );
    }

    if (tagName === "aside") {
      assert.ok(
        !stack.some(({ tag }) => tag.includes('data-layout-region="primary-workflow"')),
        "Expected the classification calculator to be beside the primary workflow"
      );
    }

    stack.push({ tagName, tag });
  }

  assert.deepEqual(stack, []);
});

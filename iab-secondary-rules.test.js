import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCompactMenEvidence } from "./secondary-evidence-ui.js";
import { evaluateSecondarySite, iabDefinition, implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary-rules.js";

const site = { "iab-eligible-anatomical-site": "met" };
const findings = { "iab-fever": "met", "iab-abdominal-pain-tenderness": "met" };
const evaluate = (evidence, extra = {}) => evaluateSecondarySite({ siteCode: "IAB", evidence, ...extra });

const branchEvidence = {
  "IAB-1": { ...site, "iab-abscess-purulent-material-organism": "met" },
  "IAB-2a": { ...site, "iab-gross-or-histopathologic-evidence": "met" },
  "IAB-2b": { ...site, "iab-gross-or-histopathologic-evidence": "met", "iab-blood-mbi-organism": "met", "iab-histopathology-blood-match-if-organism-seen": "met" },
  "IAB-3a": { ...site, ...findings, "iab-site-organism": "met" },
  "IAB-3b": { ...site, ...findings, "iab-blood-mbi-organism": "met", "iab-definitive-imaging": "met" }
};

test("every NHSN IAB branch qualifies independently", () => {
  for (const [criterion, evidence] of Object.entries(branchEvidence)) assert.equal(evaluate(evidence).metCriterion, criterion);
});

test("IAB 3a accepts either eligible site microbiology alternative", () => {
  assert.equal(evaluate({ ...site, ...findings, "iab-site-organism": "met" }).metCriterion, "IAB-3a");
  assert.equal(evaluate({ ...site, ...findings, "iab-site-gram-stain-organism": "met" }).metCriterion, "IAB-3a");
  assert.equal(evaluate({ ...site, ...findings }).siteDefinitionMet, false);
});

test("IAB 3b requires two findings, an MBI blood organism, and definitive or clinically correlated equivocal imaging", () => {
  const base = { ...site, ...findings, "iab-blood-mbi-organism": "met" };
  assert.equal(evaluate({ ...base, "iab-definitive-imaging": "met" }).metCriterion, "IAB-3b");
  assert.equal(evaluate({ ...base, "iab-equivocal-imaging-with-treatment": "met" }).metCriterion, "IAB-3b");
  assert.equal(evaluate(base).siteDefinitionMet, false);
  assert.equal(evaluate({ ...site, "iab-fever": "met", "iab-blood-mbi-organism": "met", "iab-definitive-imaging": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...site, ...findings, "iab-definitive-imaging": "met" }).siteDefinitionMet, false);
});

test("operative or pathology evidence qualifies 2a while 2b retains its blood and histopathology-match safeguards", () => {
  assert.equal(evaluate(branchEvidence["IAB-2a"]).metCriterion, "IAB-2a");
  assert.equal(evaluate({ ...branchEvidence["IAB-2b"], "iab-histopathology-blood-match-if-organism-seen": "notMet" }).metCriterion, "IAB-2a");
  assert.equal(evaluate(branchEvidence["IAB-2b"]).metCriterion, "IAB-2b");
});

test("eligible anatomy is required and GIT evidence cannot cross-qualify IAB", () => {
  assert.deepEqual(iabDefinition.notes[0].text.includes("gastrointestinal tract evidence does not satisfy IAB"), true);
  for (const siteName of ["gallbladder", "bile ducts", "liver", "spleen", "pancreas", "peritoneum", "retroperitoneal", "subphrenic", "subdiaphragmatic", "other intraabdominal tissue or area not specified elsewhere"]) {
    assert.match(iabDefinition.siteName.toLowerCase(), new RegExp(siteName));
  }
  assert.equal(evaluate({ "iab-abscess-purulent-material-organism": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ "git-tissue-organism": "met", "git-abdominal-pain": "met", "git-definitive-imaging": "met" }).siteDefinitionMet, false);
});

test("viral hepatitis and noninfectious pancreatitis block IAB and are routed away from this not-specified-elsewhere pathway", () => {
  for (const exclusion of ["iab-viral-hepatitis", "iab-noninfectious-pancreatitis"]) {
    const result = evaluate({ ...branchEvidence["IAB-1"], [exclusion]: "met" });
    assert.equal(result.siteDefinitionMet, false);
    assert.equal(result.status, "exclusionApplies");
  }
  assert.match(iabDefinition.reportingInstructions.at(-1).text, /another specified NHSN anatomical site/);
});

test("asterisked symptoms require no other recognized cause without invalidating fever or hypotension", () => {
  assert.equal(evaluate({ ...site, ...findings, "iab-other-recognized-cause": "met", "iab-site-organism": "met" }).siteDefinitionMet, false);
  assert.equal(evaluate({ ...site, "iab-fever": "met", "iab-hypotension": "met", "iab-other-recognized-cause": "met", "iab-site-organism": "met" }).metCriterion, "IAB-3a");
});

test("meeting IAB never automatically establishes Secondary BSI attribution", () => {
  const evidence = branchEvidence["IAB-1"];
  assert.equal(evaluate(evidence).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { attributionTiming: "yes" }).secondaryAttributionMet, false);
  assert.equal(evaluate(evidence, { organismRelationship: "yes", attributionTiming: "yes" }).secondaryAttributionMet, true);
});

test("IAB source metadata covers criteria, instructions, and Secondary BSI requirements", () => {
  assert.deepEqual({ document: iabDefinition.source.document, printedPage: iabDefinition.source.printedPage, pdfPage: iabDefinition.source.pdfPage, sectionHeading: iabDefinition.source.sectionHeading }, {
    document: "Secondary BSI Chapter.pdf", printedPage: "17-21–17-22", pdfPage: "22–23", sectionHeading: "IAB — Intraabdominal infection, not specified elsewhere"
  });
  assert.deepEqual(iabDefinition.criteria.map(({ id }) => id), ["IAB-1", "IAB-2b", "IAB-2a", "IAB-3a", "IAB-3b"]);
  assert.ok(iabDefinition.criteria.every(({ source }) => source.sourceDataId === "IAB"));
  assert.equal(iabDefinition.secondaryBsi.source.sourceDataId, "IAB.secondary-bsi");
});

test("IAB uses the existing renderer and shared UI files remain untouched", () => {
  const evidence = branchEvidence["IAB-3b"];
  const html = renderCompactMenEvidence({ definition: iabDefinition, evaluation: evaluate(evidence), patientAge: "adult", evidence }).replaceAll("MEN Site Definition", "IAB Site Definition");
  assert.match(html, /🟢 IAB Site Definition Met/);
  assert.match(html, /data-men-renderer="compact-v3"/);
  assert.ok(implementedSecondaryPathways.includes("IAB"));
  assert.equal(secondarySiteDefinitions.IAB, iabDefinition);
  for (const file of ["app.js", "secondary-evidence-ui.js", "style.css", "index.html"]) assert.equal(readFileSync(new URL(`./${file}`, import.meta.url), "utf8").includes("IAB-3b"), false);
});

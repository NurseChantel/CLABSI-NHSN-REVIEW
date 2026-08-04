import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

import {
  ageAtEvent,
  compareMeasurement,
  createCalendarWindow,
  createInfectionWindow,
  createRepeatInfectionTimeframe,
  evaluateAgeApplicability,
  evaluateExpression,
  evaluateMicrobiologyThreshold,
  evaluateOrganismPredicate,
  evaluateProtocol,
  evaluateSecondaryBsiAttribution,
  evaluateSerialImaging,
  evaluateSpecimenEligibility,
  evaluateVentilatorAssociation,
  selectDateOfEvent,
  validatePatientContext
} from "./protocol/index.js";
import { evaluateSecondarySite } from "./secondary/evaluator.js";
import { implementedSecondaryPathways, secondarySiteDefinitions } from "./secondary/registry.js";

const source = Object.freeze({
  document: "NHSN pneumonia.pdf",
  section: "Architecture derived from Chapter 6 criteria and footnotes",
  printedPage: "6-3–6-16",
  sourceId: "PNEU.architecture"
});

const node = (type, id, extra = {}) => ({ type, id, failureMessage: `${id} is required`, source, ...extra });
const evidence = id => node("evidence", id, { evidenceId: id });

const patientContext = Object.freeze({
  dateOfBirth: "2024-01-15",
  hostStatus: Object.freeze({ status: "notMet", reasons: Object.freeze([]) }),
  ventilator: Object.freeze({ inPlace: false, periods: Object.freeze([]) })
});

const microbiology = (overrides = {}) => ({
  id: "culture-1",
  specimenType: "bal",
  collectionDate: "2026-01-10",
  testMethod: "culture",
  organism: { id: "organism-a", tags: ["eligible"] },
  resultType: "quantitative",
  value: 10000,
  unit: "CFU/ml",
  contaminated: false,
  excluded: false,
  ...overrides
});

test("recursive expressions support nested AND, OR, and sourced failures", () => {
  const expression = node("allOf", "root", { children: [
    evidence("a"),
    node("anyOf", "choice", { children: [evidence("b"), node("allOf", "nested", { children: [evidence("c"), evidence("d")] })] })
  ] });
  assert.equal(evaluateExpression(expression, { evidence: { a: "met", c: "met", d: "met" } }).value.met, true);
  const incomplete = evaluateExpression(expression, { evidence: { a: "met", c: "met" } });
  assert.equal(incomplete.value.met, false);
  assert.equal(incomplete.value.remaining[0].source.sourceId, "PNEU.architecture");
});

test("minimum-count expressions count children rather than atoms inside a child", () => {
  const expression = node("atLeast", "three-findings", { minimum: 2, children: [evidence("a"), evidence("b"), evidence("c")] });
  assert.equal(evaluateExpression(expression, { evidence: { a: "met", c: "met" } }).value.met, true);
  assert.equal(evaluateExpression(expression, { evidence: { a: "met" } }).value.met, false);
});

test("conditional requirements select then, otherwise, or no additional requirement", () => {
  const conditional = node("conditional", "conditional", {
    when: evidence("host"),
    then: evidence("serial-imaging"),
    otherwise: evidence("single-imaging")
  });
  assert.equal(evaluateExpression(conditional, { evidence: { host: "met", "serial-imaging": "met" } }).value.met, true);
  assert.equal(evaluateExpression(conditional, { evidence: { "single-imaging": "met" } }).value.met, true);
  assert.equal(evaluateExpression({ ...conditional, otherwise: undefined }, { evidence: {} }).value.met, true);
});

test("typed age uses exact inclusive boundaries without ambiguous conversion", () => {
  assert.deepEqual(ageAtEvent(patientContext, "2025-01-14", "years"), { ok: true, value: 0 });
  assert.equal(evaluateAgeApplicability(patientContext, "2025-01-15", { unit: "years", operator: "lte", value: 1 }).value.met, true);
  assert.equal(evaluateAgeApplicability(patientContext, "2026-01-15", { unit: "years", operator: "lte", value: 1 }).value.met, false);
  const exact = { ...patientContext, dateOfBirth: undefined, exactAge: { value: 12, unit: "months" } };
  assert.equal(ageAtEvent(exact, "2026-01-15", "years").status, "validationError");
});

test("patient host reasons are sourced and immunocompromised status is explicit", () => {
  const context = {
    ...patientContext,
    hostStatus: { status: "met", reasons: [{ id: "sourced-host-reason", status: "met", source }] }
  };
  assert.equal(validatePatientContext(context).ok, true);
  assert.equal(validatePatientContext({ ...context, hostStatus: { status: "met", reasons: [{ id: "unsourced", status: "met" }] } }).status, "validationError");
});

test("ventilator context retains invasive periods and evaluates configurable association boundaries", () => {
  const context = {
    ...patientContext,
    ventilator: { inPlace: true, periods: [{ start: "2026-01-08", end: null, artificialAirway: true }] }
  };
  const rule = { minimumConsecutiveCalendarDays: 3, requireArtificialAirway: true };
  assert.equal(evaluateVentilatorAssociation(context, "2026-01-10", rule).value.met, true);
  assert.equal(evaluateVentilatorAssociation(context, "2026-01-09", rule).value.met, false);
  assert.equal(evaluateVentilatorAssociation({ ...context, ventilator: { inPlace: true, periods: [{ start: "2026-01-08", end: null, artificialAirway: false }] } }, "2026-01-10", rule).value.met, false);
});

test("calendar windows, DOE selection, and 14-day RIT use inclusive calendar days", () => {
  const iwp = createInfectionWindow("2026-01-10", source).value;
  assert.deepEqual({ start: iwp.start, end: iwp.end }, { start: "2026-01-07", end: "2026-01-13" });
  const doe = selectDateOfEvent([
    { id: "late", date: "2026-01-12" },
    { id: "outside", date: "2026-01-06" },
    { id: "first", date: "2026-01-08" }
  ], iwp);
  assert.equal(doe.value.id, "first");
  const rit = createRepeatInfectionTimeframe(doe.value.date, source).value;
  assert.deepEqual({ start: rit.start, end: rit.end }, { start: "2026-01-08", end: "2026-01-21" });
});

test("serial imaging validates persistence, progression, cavitation, and distinct studies", () => {
  const studies = [
    { id: "image-1", date: "2026-01-10", modality: "chest-xray", findings: ["cavitation"], interpretation: "definitive", attributedToOtherCondition: false },
    { id: "image-2", date: "2026-01-17", modality: "ct", findings: ["cavitation"], interpretation: "definitive", attributedToOtherCondition: false }
  ];
  const persistent = evaluateSerialImaging({ studies, relationship: { fromStudyId: "image-1", toStudyId: "image-2", type: "persistent" }, eligibleFindings: ["cavitation"], maximumCalendarDays: 7 });
  assert.equal(persistent.value.met, true);
  const progressive = evaluateSerialImaging({ studies: [{ ...studies[0], findings: ["infiltrate"] }, studies[1]], relationship: { fromStudyId: "image-1", toStudyId: "image-2", type: "progressive" }, eligibleFindings: ["infiltrate", "cavitation"], maximumCalendarDays: 7 });
  assert.equal(progressive.value.met, true);
  assert.equal(evaluateSerialImaging({ studies, relationship: { fromStudyId: "image-1", toStudyId: "image-1", type: "persistent" }, eligibleFindings: ["cavitation"], maximumCalendarDays: 7 }).status, "validationError");
});

test("typed temperature and laboratory measurements reject implicit unit conversion", () => {
  const temperature = { id: "temperature-1", kind: "temperature", value: 38, unit: "C", date: "2026-01-10" };
  assert.equal(compareMeasurement(temperature, { comparator: "gt", value: 38, unit: "C" }).value.met, false);
  assert.equal(compareMeasurement({ ...temperature, value: 38.1 }, { comparator: "gt", value: 38, unit: "C" }).value.met, true);
  assert.equal(compareMeasurement(temperature, { comparator: "gt", value: 100.4, unit: "F" }).status, "validationError");
});

test("microbiology supports specimen restrictions and quantitative and semiquantitative thresholds", () => {
  assert.equal(evaluateSpecimenEligibility(microbiology(), { allowedSpecimenTypes: ["bal"] }).value.met, true);
  assert.equal(evaluateSpecimenEligibility(microbiology({ specimenType: "sputum" }), { allowedSpecimenTypes: ["bal"] }).value.met, false);
  assert.equal(evaluateMicrobiologyThreshold(microbiology(), { quantitativeValue: 10000, unit: "CFU/ml" }).value.met, true);
  assert.equal(evaluateMicrobiologyThreshold(microbiology({ value: 9999 }), { quantitativeValue: 10000, unit: "CFU/ml" }).value.met, false);
  const semiquantitative = microbiology({ resultType: "semiquantitative", value: undefined, unit: undefined, category: "moderate" });
  assert.equal(evaluateMicrobiologyThreshold(semiquantitative, { acceptedCategories: ["moderate", "heavy"] }).value.met, true);
});

test("organism predicates apply explicit inclusions and exclusions", () => {
  const organism = { id: "organism-a", tags: ["fungus", "excluded-community"] };
  assert.equal(evaluateOrganismPredicate(organism, { includeTags: ["fungus"] }).value.met, true);
  const excluded = evaluateOrganismPredicate(organism, { includeTags: ["fungus"], excludeTags: ["excluded-community"] });
  assert.equal(excluded.value.met, false);
  assert.equal(excluded.value.excluded, true);
});

test("protocol evaluator enforces event-family separation and subtype hierarchy order", () => {
  const definition = {
    eventFamily: "TEST-PNEU-FAMILY",
    siteCode: "TEST-PNEU-SITE",
    source,
    subtypes: [
      { id: "higher", expression: evidence("higher") },
      { id: "lower", expression: evidence("lower") }
    ]
  };
  const input = {
    eventFamily: "TEST-PNEU-FAMILY",
    siteCode: "TEST-PNEU-SITE",
    patientContext,
    timeline: { admissionDate: "2026-01-01", dateOfEventCandidate: "2026-01-10" },
    evidence: { higher: "met", lower: "met" }
  };
  assert.equal(evaluateProtocol(definition, input).value.subtype, "higher");
  assert.equal(evaluateProtocol(definition, { ...input, eventFamily: "LRI" }).status, "validationError");
  assert.equal(evaluateProtocol(definition, { ...input, siteCode: "LUNG" }).status, "validationError");
});

test("Secondary BSI attribution evaluates organism relationship and inclusive timing", () => {
  const period = createCalendarWindow("2026-01-10", 3, 10, source).value;
  const siteResult = microbiology({ id: "site", collectionDate: "2026-01-10" });
  const atEnd = microbiology({ id: "blood", specimenType: "blood", collectionDate: period.end });
  const met = evaluateSecondaryBsiAttribution({ siteQualified: true, siteResults: [siteResult], bloodResult: atEnd, attributionPeriod: period, relationshipRule: {} });
  assert.equal(met.value.met, true);
  assert.equal(met.value.matchingSiteResultIds[0], "site");
  const outside = evaluateSecondaryBsiAttribution({ siteQualified: true, siteResults: [siteResult], bloodResult: { ...atEnd, collectionDate: "2026-01-21" }, attributionPeriod: period, relationshipRule: {} });
  assert.equal(outside.value.timingMet, false);
  const mismatch = evaluateSecondaryBsiAttribution({ siteQualified: true, siteResults: [siteResult], bloodResult: { ...atEnd, organism: { id: "different", tags: [] } }, attributionPeriod: period, relationshipRule: {} });
  assert.equal(mismatch.value.organismRelationshipMet, false);
});

test("malformed protocol data returns controlled validation errors", () => {
  assert.equal(evaluateExpression({ type: "allOf", children: [] }).status, "validationError");
  assert.equal(evaluateSerialImaging({ studies: "not-an-array" }).status, "validationError");
  assert.equal(evaluateSpecimenEligibility({}, { allowedSpecimenTypes: [] }).status, "validationError");
  assert.equal(validatePatientContext(null).status, "validationError");
  assert.equal(createInfectionWindow("2026-02-30", source).status, "validationError");
});

function collectEvidence(definition) {
  const ids = new Set();
  for (const criterion of definition.criteria) {
    for (const branch of [criterion, ...(criterion.alternatives || [])]) {
      for (const atom of branch.allOf) ids.add(atom.id);
      for (const group of branch.groups || []) for (const entry of group.anyOf) {
        if (entry.anyOf) for (const atom of entry.anyOf) ids.add(atom.id);
        else ids.add(entry.id);
      }
    }
  }
  return Object.fromEntries([...ids].map(id => [id, "met"]));
}

test("every implemented Chapter 17 evaluator snapshot is identical to the pre-architecture baseline", () => {
  const fixture = JSON.parse(fs.readFileSync(new URL("./test-fixtures-chapter17-evaluator-snapshots.json", import.meta.url)));
  assert.deepEqual(Object.keys(fixture.sha256BySite), [...implementedSecondaryPathways]);
  for (const siteCode of implementedSecondaryPathways) {
    const definition = secondarySiteDefinitions[siteCode];
    const cases = [
      { siteCode },
      { siteCode, evidence: collectEvidence(definition), organismRelationship: "yes", attributionTiming: "yes", patientAge: "infant" },
      { siteCode, evidence: collectEvidence(definition), organismRelationship: "no", attributionTiming: "no", patientAge: "adult" }
    ];
    const normalized = cases.map(input => {
      const result = evaluateSecondarySite(input);
      return {
        status: result.status,
        siteDefinitionMet: result.siteDefinitionMet,
        secondaryAttributionMet: result.secondaryAttributionMet,
        metCriterion: result.metCriterion ?? null,
        branchMissingCounts: (result.branches ?? []).map(branch => [branch.id, branch.missing.length]),
        attributionMissing: result.attributionMissing ?? []
      };
    });
    const digest = crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
    assert.equal(digest, fixture.sha256BySite[siteCode], `${siteCode} evaluator snapshot changed from ${fixture.baselineCommit}`);
  }
});

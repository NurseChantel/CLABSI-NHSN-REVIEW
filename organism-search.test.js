import test from "node:test";
import assert from "node:assert/strict";
import { normalizeOrganismText, prepareNhsnOrganisms, searchOrganisms } from "./organism-search.js";

const source = { organisms: [{
  displayName: "Staphylococcus, aureus.", normalizedDisplayName: "staphylococcus aureus",
  snomedPreferredTerm: "Staphylococcus aureus (organism)", nhsnCode: "SA",
  snomedCode: 3092008, isCommonCommensal: false, isMbiOrganism: true,
  isUtiBacterium: false, pathogenClassification: "recognized_pathogen_candidate"
}] };
const organisms = prepareNhsnOrganisms(source);

test("normalization ignores case, punctuation, periods, and extra spaces", () => {
  assert.equal(normalizeOrganismText("  STAPHYLOCOCCUS...  aureus! "), "staphylococcus aureus");
});

test("searches every required NHSN field and returns the full organism", () => {
  for (const query of ["staphylococcus aureus", "Staphylococcus aureus organism", "SA"]) {
    assert.equal(searchOrganisms(query, organisms)[0].organism.nhsnCode, "SA");
  }
  assert.deepEqual(Object.fromEntries([
    "displayName", "nhsnCode", "snomedCode", "isCommonCommensal", "isMbiOrganism",
    "isUtiBacterium", "pathogenClassification"
  ].map((key) => [key, organisms[0][key]])), {
    displayName: "Staphylococcus, aureus.", nhsnCode: "SA", snomedCode: "3092008",
    isCommonCommensal: false, isMbiOrganism: true, isUtiBacterium: false,
    pathogenClassification: "recognized_pathogen_candidate"
  });
  assert.equal(organisms[0].organismType, "Recognized Pathogen");
});

test("classification derives only from common commensal flag", () => {
  const [commensal] = prepareNhsnOrganisms({ organisms: [{ ...source.organisms[0], isCommonCommensal: true }] });
  assert.equal(commensal.organismType, "Common Commensal");
});

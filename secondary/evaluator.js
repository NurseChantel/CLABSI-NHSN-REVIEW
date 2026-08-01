import { secondarySiteDefinitions } from "./registry.js";
import { warning } from "./source.js";

const answer = (evidence, id) => evidence?.[id] || "unknown";
function atomMet(atom, evidence) { return answer(evidence, atom.id) === "met" && (!atom.exclusionId || answer(evidence, atom.exclusionId) !== "met"); }
function groupMet(group, evidence) { return group.anyOf.filter(entry => entry.anyOf ? entry.anyOf.some(atom => atomMet(atom, evidence)) : atomMet(entry, evidence)).length >= group.minimumRequiredCount; }
function criterionMet(criterion, evidence) { return criterion.allOf.every(atom => atomMet(atom, evidence)) && (criterion.groups || []).every(group => groupMet(group, evidence)); }
function requiredMessages(criterion, evidence) {
  const missing = criterion.allOf.filter(atom => !atomMet(atom, evidence)).map(atom => `${atom.label}: ${answer(evidence, atom.id) === "notMet" ? "not met" : "unknown or not documented"}`);
  for (const group of criterion.groups || []) if (!groupMet(group, evidence)) missing.push(`${group.label}: ${group.minimumRequiredCount} required; current qualifying groups do not meet the minimum`);
  return missing;
}
export function evaluateSecondarySite({ siteCode = "", evidence = {}, organismRelationship = "", attributionTiming = "", patientAge = "" } = {}) {
  const definition = secondarySiteDefinitions[siteCode];
  if (!definition) return { status: "siteNotSelected", siteDefinitionMet: false, secondaryAttributionMet: false };
  const schemaIsRenderable = Array.isArray(definition.criteria) && Array.isArray(definition.exclusions) && Array.isArray(definition.notes)
    && definition.criteria.every(criterion => Array.isArray(criterion.allOf) && (!criterion.groups || criterion.groups.every(group => Array.isArray(group.anyOf) && Number.isFinite(group.minimumRequiredCount))));
  if (definition.implementationStatus !== "validated" || !schemaIsRenderable) return { status: "siteNotValidated", siteDefinitionMet: false, secondaryAttributionMet: false, definition, message: warning };
  const started = Object.values(evidence).some(Boolean);
  if (definition.patientAgeApplicability === "infant" && patientAge !== "infant") return { status: started ? "exclusionApplies" : "notStarted", siteDefinitionMet: false, secondaryAttributionMet: false, definition, message: "This definition is restricted to patients ≤1 year of age." };
  const hardExclusionApplies = definition.exclusions.some(item => (item.disqualifiesSite || item.blocksPathway) && answer(evidence, item.id) === "met")
    || (definition.hardExclusionIds || []).some(id => answer(evidence, id) === "met");
  const metCriterion = hardExclusionApplies ? undefined : definition.criteria.find(criterion => criterionMet(criterion, evidence));
  const exclusionApplies = definition.exclusions.some(item => answer(evidence, item.id) === "met");
  if (!metCriterion) return { status: exclusionApplies || hardExclusionApplies ? "exclusionApplies" : started ? "siteDefinitionIncomplete" : "notStarted", siteDefinitionMet: false, secondaryAttributionMet: false, definition, branches: definition.criteria.map(criterion => ({ id: criterion.id, missing: requiredMessages(criterion, evidence) })) };
  const secondaryAttributionMet = organismRelationship === "yes" && attributionTiming === "yes";
  return { status: secondaryAttributionMet ? "secondaryAttributionMet" : "siteDefinitionMet", siteDefinitionMet: true, secondaryAttributionMet, metCriterion: metCriterion.id, definition, attributionMissing: [!organismRelationship && "Organism/specimen relationship is unknown", organismRelationship === "no" && "Organism/specimen relationship is not met", !attributionTiming && "Attribution timing is unknown", attributionTiming === "no" && "Attribution timing is not met"].filter(Boolean) };
}
export function selectSecondarySite(state, siteCode) { if (state.siteCode === siteCode) return state; return { ...state, siteCode, evidence: {}, organismRelationship: "", attributionTiming: "" }; }

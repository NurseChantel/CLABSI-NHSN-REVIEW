import { secondarySiteDefinitions } from "./registry.js";
import { warning } from "./source.js";
import { evaluateSecondaryBsiGuide } from "./secondary-bsi-guide.js";

const answer = (evidence, id) => evidence?.[id] || "unknown";
function atomMet(atom, evidence) { return answer(evidence, atom.id) === "met" && (!atom.exclusionId || answer(evidence, atom.exclusionId) !== "met"); }
function groupMet(group, evidence) { return group.anyOf.filter(entry => entry.anyOf ? entry.anyOf.some(atom => atomMet(atom, evidence)) : atomMet(entry, evidence)).length >= group.minimumRequiredCount; }
function branchMet(branch, evidence) { return branch.allOf.every(atom => atomMet(atom, evidence)) && (branch.groups || []).every(group => groupMet(group, evidence)); }
function criterionMet(criterion, evidence) { return branchMet(criterion, evidence) && (!(criterion.alternatives?.length) || criterion.alternatives.some(alternative => branchMet(alternative, evidence))); }
function requiredMessagesForBranch(branch, evidence) {
  const missing = branch.allOf.filter(atom => !atomMet(atom, evidence)).map(atom => `${atom.label}: ${answer(evidence, atom.id) === "notMet" ? "not met" : "unknown or not documented"}`);
  for (const group of branch.groups || []) if (!groupMet(group, evidence)) missing.push(`${group.label}: ${group.minimumRequiredCount} required; current qualifying groups do not meet the minimum`);
  return missing;
}
function requiredMessages(criterion, evidence) {
  const baseMissing = requiredMessagesForBranch(criterion, evidence);
  if (!criterion.alternatives?.length) return baseMissing;
  if (baseMissing.length) return baseMissing;
  const alternativeMessages = criterion.alternatives.map(alternative => requiredMessagesForBranch(alternative, evidence));
  return alternativeMessages.some(messages => messages.length === 0) ? [] : [`At least one criterion alternative required: ${alternativeMessages.map(messages => messages.join("; ")).join(" OR ")}`];
}
export function evaluateSecondarySite({ siteCode = "", evidence = {}, organismRelationship = "", attributionTiming = "", patientAge = "" } = {}) {
  const definition = secondarySiteDefinitions[siteCode];
  if (!definition) return { status: "siteNotSelected", siteDefinitionMet: false, secondaryAttributionMet: false };
  const schemaIsRenderable = Array.isArray(definition.criteria) && Array.isArray(definition.exclusions) && Array.isArray(definition.notes)
    && definition.criteria.every(criterion => Array.isArray(criterion.allOf) && (!criterion.groups || criterion.groups.every(group => Array.isArray(group.anyOf) && Number.isFinite(group.minimumRequiredCount))) && (!criterion.alternatives || criterion.alternatives.every(alternative => Array.isArray(alternative.allOf) && (!alternative.groups || alternative.groups.every(group => Array.isArray(group.anyOf) && Number.isFinite(group.minimumRequiredCount))))));
  if (definition.implementationStatus !== "validated" || !schemaIsRenderable) return { status: "siteNotValidated", siteDefinitionMet: false, secondaryAttributionMet: false, definition, message: warning };
  const started = Object.values(evidence).some(Boolean);
  if (definition.patientAgeApplicability === "infant" && patientAge !== "infant") return { status: started ? "exclusionApplies" : "notStarted", siteDefinitionMet: false, secondaryAttributionMet: false, definition, message: "This definition is restricted to patients ≤1 year of age." };
  const hardExclusionApplies = definition.exclusions.some(item => (item.disqualifiesSite || item.blocksPathway) && answer(evidence, item.id) === "met")
    || (definition.hardExclusionIds || []).some(id => answer(evidence, id) === "met");
  const metCriterion = hardExclusionApplies ? undefined : definition.criteria.find(criterion => criterionMet(criterion, evidence));
  const exclusionApplies = definition.exclusions.some(item => answer(evidence, item.id) === "met");
  if (!metCriterion) return { status: exclusionApplies || hardExclusionApplies ? "exclusionApplies" : started ? "siteDefinitionIncomplete" : "notStarted", siteDefinitionMet: false, secondaryAttributionMet: false, definition, branches: definition.criteria.map(criterion => ({ id: criterion.id, missing: requiredMessages(criterion, evidence) })) };
  // Chapter 4, Appendix: Secondary BSI Guide. Meeting a site definition is not sufficient:
  // page 4-35 prohibits a secondary BSI for some sites outright, and Table B1 (4-34) names
  // the specific criterion that may carry one, by scenario.
  const guide = evaluateSecondaryBsiGuide({ siteCode, metCriterion: metCriterion.id, evidence });
  const base = { siteDefinitionMet: true, metCriterion: metCriterion.id, definition, secondaryBsiGuide: guide };

  if (definition.secondaryBsi?.reportable === false || guide.prohibited) {
    return { ...base, status: "secondaryAttributionNotPermitted", secondaryAttributionMet: false, message: guide.prohibited?.message || definition.secondaryBsi.message, attributionMissing: [] };
  }
  if (guide.listedInTableB1 && !guide.eligible) {
    return {
      ...base, status: "secondaryAttributionCriterionNotEligible", secondaryAttributionMet: false,
      message: `NHSN Table B1 does not list ${metCriterion.id} as a criterion that can carry a secondary BSI for ${siteCode}. Eligible criteria: ${guide.siteEntries.map(item => `${item.label} (Scenario ${item.scenario})`).join("; ")}.`,
      attributionMissing: []
    };
  }

  const secondaryAttributionMet = organismRelationship === "yes" && attributionTiming === "yes";
  return { ...base, status: secondaryAttributionMet ? "secondaryAttributionMet" : "siteDefinitionMet", secondaryAttributionMet, attributionMissing: [!organismRelationship && "Organism/specimen relationship is unknown", organismRelationship === "no" && "Organism/specimen relationship is not met", !attributionTiming && "Attribution timing is unknown", attributionTiming === "no" && "Attribution timing is not met"].filter(Boolean) };
}
export function selectSecondarySite(state, siteCode) { if (state.siteCode === siteCode) return state; return { ...state, siteCode, evidence: {}, organismRelationship: "", attributionTiming: "" }; }

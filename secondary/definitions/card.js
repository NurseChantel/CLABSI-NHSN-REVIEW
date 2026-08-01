import { cardCriterionSource, cardAttributionSource } from "../source.js";

const cardItem = (id, label, options = {}) => Object.freeze({ id, label, source: cardCriterionSource, ...options });
const cardFindings = Object.freeze([
  cardItem("card-fever", "Fever (>38.0°C)"),
  cardItem("card-chest-pain", "Chest pain, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  cardItem("card-paradoxical-pulse", "Paradoxical pulse, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  cardItem("card-increased-heart-size", "Increased heart size, with no other recognized cause", { exclusionId: "other-recognized-cause" })
]);
const cardInfantFindings = Object.freeze([
  cardItem("card-fever", "Fever (>38.0°C)"),
  cardItem("card-hypothermia", "Hypothermia (<36.0°C)"),
  cardItem("card-apnea", "Apnea, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  cardItem("card-bradycardia", "Bradycardia, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  cardItem("card-paradoxical-pulse", "Paradoxical pulse, with no other recognized cause", { exclusionId: "other-recognized-cause" }),
  cardItem("card-increased-heart-size", "Increased heart size, with no other recognized cause", { exclusionId: "other-recognized-cause" })
]);
const cardSupport = Object.freeze([
  cardItem("card-abnormal-ekg", "Abnormal EKG consistent with myocarditis or pericarditis"),
  cardItem("card-histologic-heart-tissue", "Histologic examination of heart tissue shows evidence of myocarditis or pericarditis"),
  cardItem("card-igg-rise", "4-fold rise in paired sera from IgG antibody titer"),
  cardItem("card-pericardial-effusion", "Pericardial effusion identified by echocardiogram, CT scan, MRI, or angiography")
]);
const cardGroup = (id, label, minimumRequiredCount, anyOf) => Object.freeze({ id, label, minimumRequiredCount, anyOf });

export const cardDefinition = Object.freeze({
  majorCategoryCode: "CVS", majorCategoryName: "Cardiovascular System Infection", siteCode: "CARD", siteName: "Myocarditis or pericarditis",
  source: cardCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "CARD-1", label: "Criterion 1 — organism from pericardial tissue or fluid", source: cardCriterionSource, allOf: Object.freeze([
      cardItem("card-pericardial-organism", "Organism(s) identified from pericardial tissue or fluid by a culture or non-culture based microbiologic testing method performed for purposes of clinical diagnosis or treatment (not ASC/AST)")
    ]) }),
    Object.freeze({ id: "CARD-2", label: "Criterion 2 — findings and supporting evidence", source: cardCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([
      cardGroup("CARD-2-findings", "At least two signs or symptoms", 2, cardFindings),
      cardGroup("CARD-2-support", "At least one supporting test", 1, cardSupport)
    ]) }),
    Object.freeze({ id: "CARD-3", label: "Criterion 3 — patient ≤1 year of age", source: cardCriterionSource, allOf: Object.freeze([
      cardItem("card-age-one-or-younger", "Patient ≤1 year of age")
    ]), groups: Object.freeze([
      cardGroup("CARD-3-findings", "At least two age-specific signs or symptoms", 2, cardInfantFindings),
      cardGroup("CARD-3-support", "At least one supporting test", 1, cardSupport)
    ]) })
  ]),
  exclusions: Object.freeze([cardItem("other-recognized-cause", "Another recognized cause applies to a sign or symptom marked by NHSN with an asterisk", { type: "exclusion" })]),
  notes: Object.freeze([
    Object.freeze({ id: "CARD-note-asterisk", text: "Chest pain, paradoxical pulse, increased heart size, apnea, and bradycardia qualify only when there is no other recognized cause.", source: cardCriterionSource })
  ]),
  reportingInstructions: Object.freeze([]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: cardAttributionSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete CARD definition is met", source: cardAttributionSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism is an eligible matching organism from the site specimen, or the blood organism is used as an element of the CARD criterion", source: cardAttributionSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the CARD secondary BSI attribution period (or in the infection window when used as a criterion element)", source: cardAttributionSource })
  ]) })
});

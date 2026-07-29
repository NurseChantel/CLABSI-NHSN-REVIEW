/**
 * Declarative representation of the site-specific combinations already used by
 * the review tool. These are screening prompts; the current NHSN definition is
 * authoritative and each selected item still requires clinical validation.
 */
const req = (id, label, anyOf) => ({ id, label, anyOf });
const route = (id, label, requirements) => ({ id, label, requirements });

export const secondaryPathwayRules = {
  pneu: [route("pneu-screen", "Imaging, clinical, and laboratory criterion", [
    req("pneu-imaging", "Qualifying imaging evidence", ["newInfiltrate", "consolidation", "cavitation", "pneumatoceles"]),
    req("pneu-systemic", "A qualifying systemic finding", ["fever", "wbc", "mentalStatus"]),
    req("pneu-respiratory", "A qualifying respiratory finding", ["sputum", "cough", "dyspnea", "breathSounds", "gasExchange"]),
    req("pneu-lab", "Qualifying laboratory or microbiology evidence", ["respSpecimen", "pleuralFluid", "lungTissue", "cultureAllowed", "viralEvidence"])
  ])],
  uti: [route("uti-screen", "Urinary signs, culture, and eligibility criterion", [
    req("uti-culture", "An eligible urine culture", ["urineCulture"]),
    req("uti-catheter", "Catheter and timing eligibility", ["catheterTiming"]),
    req("uti-symptom", "One qualifying urinary sign or symptom", ["fever", "suprapubic", "cva", "urgency", "frequency", "dysuria"]),
    req("uti-organism", "An eligible organism relationship or criterion element", ["cultureMatch", "cultureAsElement"])
  ])],
  ssi: [
    ...["purulence", "opened", "imaging", "diagnosis"].map((item, index) => route(`ssi-${item}`, `SSI qualifying evidence route ${index + 1}`, [
      req("ssi-procedure", "Eligible NHSN operative procedure", ["procedure"]), req("ssi-surveillance", "Applicable surveillance timing", ["surveillance"]), req("ssi-level", "Eligible tissue level", ["level"]), req(`ssi-${item}-evidence`, "Qualifying SSI evidence", [item]), { ...req("ssi-conditional-match", "Organism relationship required when a site organism is used", ["cultureMatch"]), appliesWhen: "siteOrganism" }
    ])),
    route("ssi-specimen", "Site-specimen SSI route", [req("ssi-procedure", "Eligible NHSN operative procedure", ["procedure"]), req("ssi-surveillance", "Applicable surveillance timing", ["surveillance"]), req("ssi-level", "Eligible tissue level", ["level"]), req("ssi-site-organism", "Eligible site specimen organism", ["siteOrganism"]), req("ssi-organism-match", "Required organism relationship", ["cultureMatch"])])
  ],
  gi: [
    route("gi-operative", "Operative/anatomic criterion", [req("gi-operative-evidence", "Operative, gross anatomic, or histopathologic evidence", ["operative"]), req("gi-relationship", "Eligible blood-to-site relationship", ["cultureMatch", "cultureElement"])]),
    ...["siteSpecimen", "imaging"].map(item => route(`gi-${item}`, item === "imaging" ? "Imaging-supported criterion" : "Site-specimen criterion", [req(`gi-${item}-evidence`, item === "imaging" ? "Qualifying imaging evidence" : "Eligible site-specific specimen", [item]), req("gi-clinical", "Qualifying clinical findings", ["symptoms"]), req("gi-relationship", "Eligible blood-to-site relationship", ["cultureMatch", "cultureElement"])]))
  ],
  skin: [
    route("skin-purulence", "Purulence criterion", [req("skin-purulence-evidence", "Purulent drainage or material", ["purulence"]), { ...req("skin-conditional-match", "Organism match required when a site culture is used", ["cultureMatch"]), appliesWhen: "siteCulture" }]),
    route("skin-imaging", "Local-findings and imaging criterion", [req("skin-local", "Required local findings", ["localFindings"]), req("skin-imaging-evidence", "Qualifying imaging or anatomic evidence", ["imaging"]), { ...req("skin-conditional-match", "Organism match required when a site culture is used", ["cultureMatch"]), appliesWhen: "siteCulture" }]),
    route("skin-specimen", "Local-findings and specimen criterion", [req("skin-local", "Required local findings", ["localFindings"]), req("skin-specimen-evidence", "Eligible site specimen", ["siteCulture"]), req("skin-match", "Required organism match", ["cultureMatch"])])
  ],
  boneJoint: [
    ...["operative", "histology", "siteCulture"].map(item => route(`bone-${item}`, `${item === "siteCulture" ? "Site-specimen" : item[0].toUpperCase() + item.slice(1)} criterion`, [req(`bone-${item}-evidence`, "Qualifying site evidence", [item]), req("bone-match", "Blood-to-site organism relationship", ["cultureMatch"])])),
    route("bone-imaging", "Imaging-supported criterion", [req("bone-imaging-evidence", "Qualifying imaging", ["imaging"]), req("bone-clinical", "Qualifying clinical finding", ["pain"]), req("bone-match", "Blood-to-site organism relationship", ["cultureMatch"])])
  ],
  cardiovascular: [
    route("cardio-specimen", "Site-specimen criterion", [req("cardio-culture", "Required culture pattern and organism eligibility", ["culturePattern"]), req("cardio-specimen-evidence", "Eligible cardiovascular site specimen", ["siteSpecimen"])]),
    route("cardio-imaging", "Imaging-supported cardiovascular criterion", [req("cardio-culture", "Required culture pattern and organism eligibility", ["culturePattern"]), req("cardio-imaging-evidence", "Echocardiogram or qualifying imaging evidence", ["echo"]), req("cardio-clinical", "Required clinical findings", ["clinical"])])
  ],
  cns: [
    ...["operative", "csf"].map(item => route(`cns-${item}`, item === "csf" ? "CSF criterion" : "Operative/anatomic criterion", [req(`cns-${item}-evidence`, item === "csf" ? "Eligible CSF evidence" : "Operative, anatomic, or histopathologic evidence", [item]), req("cns-relationship", "Eligible blood-culture relationship", ["cultureRelationship"])])),
    route("cns-imaging", "Imaging-supported CNS criterion", [req("cns-imaging-evidence", "Qualifying neuroimaging", ["imaging"]), req("cns-symptoms", "Required CNS symptoms", ["symptoms"]), req("cns-relationship", "Eligible blood-culture relationship", ["cultureRelationship"])])
  ],
  other: [route("other-exact", "Exact NHSN site-specific definition", [req("other-definition", "Exact NHSN definition identified", ["definition"]), req("other-elements", "Every required definition element", ["elements"]), req("other-specimen", "Specimen and organism relationship review", ["siteSpecimen"]), req("other-timing", "Infection-window and attribution timing review", ["timing"])])]
};

export function evaluateSecondaryPathway({ pathway, evidence = new Set(), organismRelationship = "", attributionTiming = "" }) {
  const routes = secondaryPathwayRules[pathway] || [];
  const candidateRoutes = routes.map(candidate => {
    const requirements = candidate.requirements.filter(requirement => !requirement.appliesWhen || evidence.has(requirement.appliesWhen)).map(requirement => ({ ...requirement, satisfied: requirement.anyOf.some(item => evidence.has(item)) }));
    return { ...candidate, requirements, complete: requirements.every(item => item.satisfied), missingCount: requirements.filter(item => !item.satisfied).length };
  }).sort((a, b) => a.missingCount - b.missingCount || b.requirements.filter(item => item.satisfied).length - a.requirements.filter(item => item.satisfied).length);
  const satisfiedCriteria = candidateRoutes.filter(candidate => candidate.complete);
  const siteDefinitionComplete = satisfiedCriteria.length > 0;
  const reviewComplete = evidence.has("reviewComplete");
  const remainingAttributionChecks = [];
  if (organismRelationship !== "yes") remainingAttributionChecks.push(organismRelationship === "no" ? "Blood-to-site organism relationship is answered No" : "Confirm the blood-to-site organism relationship");
  if (attributionTiming !== "yes") remainingAttributionChecks.push(attributionTiming === "no" ? "Secondary-BSI attribution timing is answered No" : "Confirm secondary-BSI attribution timing and any required infection-window timing");
  if (!reviewComplete) remainingAttributionChecks.push("Confirm evidence-review completion");
  const selectedCount = [...evidence].filter(item => item !== "reviewComplete").length;
  const complete = siteDefinitionComplete && remainingAttributionChecks.length === 0;
  return {
    status: complete ? "complete" : siteDefinitionComplete ? "site-definition-complete" : selectedCount ? "possible" : "incomplete",
    satisfiedCriteria: satisfiedCriteria.map(item => item.id), candidateRoutes,
    satisfiedRequirements: [...new Set(candidateRoutes.flatMap(routeItem => routeItem.requirements.filter(item => item.satisfied).map(item => item.label)))],
    missingRequirements: candidateRoutes[0]?.requirements.filter(item => !item.satisfied).map(item => item.label) || [],
    remainingAttributionChecks, siteDefinitionComplete, reviewComplete, complete,
    guidanceMessage: !selectedCount ? "Review the evidence combinations below. Select documented findings to see what additional information is required." : siteDefinitionComplete ? `Site-specific evidence combination appears complete under ${satisfiedCriteria[0].label}.` : `${candidateRoutes[0]?.label || "Selected pathway"} is closest to completion.`
  };
}

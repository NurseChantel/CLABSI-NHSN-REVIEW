import { endoTimingSource, endoCriterionSource, endoFootnoteSource } from "../source.js";

const endoItem = (id, label, options = {}) => Object.freeze({ id, label, source: endoCriterionSource, ...options });
const endoGroup = (id, label, minimumRequiredCount, anyOf) => Object.freeze({ id, label, minimumRequiredCount, anyOf: Object.freeze(anyOf) });
const endoImaging = Object.freeze([
  endoItem("endo-echo-ct-vegetation", "Echocardiography or cardiac CT: vegetation on cardiac valve or supporting structures"),
  endoItem("endo-echo-ct-perforation", "Echocardiography or cardiac CT: valvular/leaflet perforation"),
  endoItem("endo-echo-ct-aneurysm", "Echocardiography or cardiac CT: valvular/leaflet aneurysm"),
  endoItem("endo-echo-ct-abscess", "Echocardiography or cardiac CT: perivalvular or peri-graft abscess"),
  endoItem("endo-echo-ct-pseudoaneurysm", "Echocardiography or cardiac CT: pseudoaneurysm"),
  endoItem("endo-echo-ct-fistula", "Echocardiography or cardiac CT: intracardiac fistula"),
  endoItem("endo-echo-new-regurgitation", "Echocardiography: significant new (moderate or severe), valve-specific valvular regurgitation compared with previous imaging; worsening of pre-existing regurgitation is not eligible"),
  endoItem("endo-echo-ct-dehiscence", "Echocardiography or cardiac CT: new partial dehiscence of prosthetic valve compared with previous imaging"),
  endoItem("endo-pet-late-activity", "FDG PET/CT: abnormal metabolic activity involving a native or prosthetic valve, ascending aortic graft with valve involvement, intracardiac device leads, or other intracardiac prosthetic material more than 3 months after cardiac surgery"),
  endoItem("endo-pet-early-activity", "FDG PET/CT: abnormal metabolic activity within 3 months after implantation of a prosthetic valve, ascending aortic graft with valve involvement, intracardiac device leads, or other intracardiac prosthetic material")
]);
// Manual 17-30 (ENDO 4a–f) and 17-31 (ENDO 5a–f). Collection counts are ">=2 matching"
// for a and b and ">=3 matching" for c. The Bartonella IgG titre differs between the two
// criteria: ENDO 4e reads ">= 1:800", ENDO 5e reads "> 1:800", so it is built per criterion.
const endoMajorMicrobiology = (bartonella) => Object.freeze([
  endoItem("endo-major-typical", "Typical infectious endocarditis organism(s) (Staphylococcus aureus, Staphylococcus lugdunensis, Enterococcus faecalis, all streptococcal species except Streptococcus pneumoniae and Streptococcus pyogenes, Granulicatella spp., Abiotrophia spp., Gemella spp., or HACEK group microorganisms) identified from 2 or more matching blood collections drawn on separate occasions with no more than 1 calendar day between specimen collections"),
  endoItem("endo-major-prosthetic-typical", "In the presence of prosthetic material, coagulase-negative Staphylococci, Corynebacterium striatum, Corynebacterium jeikeium, Serratia marcescens, Pseudomonas aeruginosa, Cutibacterium acnes, non-tuberculous mycobacteria, or Candida spp. identified from 2 or more matching blood collections drawn on separate occasions with no more than 1 calendar day between specimen collections"),
  endoItem("endo-major-nontypical", "A non-typical infectious endocarditis organism identified from 3 or more matching blood collections drawn on separate occasions with no more than 1 calendar day between specimen collections"),
  endoItem("endo-coxiella", "Coxiella burnetii identified by anti-phase I IgG antibody titer >1:800 or identified from a single blood specimen by an eligible culture or non-culture based microbiologic testing method"),
  bartonella,
  endoItem("endo-special-pcr", "Coxiella burnetii, Bartonella species, or Tropheryma whipplei identified in blood by PCR or another non-culture-based testing method")
]);
const endoBartonellaAtLeast = endoItem("endo-bartonella-serology-at-least", "Indirect immunofluorescence assay for IgM and IgG antibodies to Bartonella henselae or Bartonella quintana with IgG titer ≥1:800");
const endoBartonellaGreaterThan = endoItem("endo-bartonella-serology-greater-than", "Indirect immunofluorescence assay for IgM and IgG antibodies to Bartonella henselae or Bartonella quintana with IgG titer >1:800");
const endoMajorMicrobiologyCriterion4 = endoMajorMicrobiology(endoBartonellaAtLeast);
const endoMajorMicrobiologyCriterion5 = endoMajorMicrobiology(endoBartonellaGreaterThan);
const endoRisk = endoItem("endo-risk", "Prior endocarditis, prosthetic valve, previous valve repair, CIED, uncorrected congenital heart disease, more than mild valvular regurgitation or stenosis, hypertrophic obstructive cardiomyopathy, or known IV drug use (may be documented during the current admission outside the infection window, but must not set the date of event)");
const endoFever = endoItem("endo-fever", "Fever (>38.0°C)");
const endoNewRegurgitation = endoItem("endo-auscultation-regurgitation", "New valvular regurgitation on auscultation when an echocardiogram is not available");
const endoVascular = endoItem("endo-vascular", "Vascular phenomenon: major arterial embolus, septic pulmonary infarct, mycotic aneurysm, intracranial hemorrhage, conjunctival hemorrhage, or documented Janeway lesion");
const endoImmune = endoItem("endo-immunologic", "Immunologic phenomenon: Osler's node, Roth's spot, positive rheumatoid factor, or documented immune complex-mediated glomerulonephritis (qualifying renal biopsy, or unexplained acute kidney injury/acute-on-chronic kidney injury plus two of hematuria, proteinuria, cellular casts, hypocomplementemia, cryoglobulinemia, or circulating immune complexes)");
const endoMinorMicro = Object.freeze({ id: "endo-minor-micro", label: "Blood microbiology", anyOf: Object.freeze([
  endoItem("endo-minor-recognized", "Recognized pathogen identified from blood by an eligible culture or non-culture based microbiologic testing method"),
  endoItem("endo-minor-commensal", "Same common commensal identified from 2 or more blood collections on separate occasions on the same or consecutive days by an eligible culture or non-culture based microbiologic testing method")
]) });
const endoClinicalElements = Object.freeze([
  Object.freeze({ id: "endo-risk-element", label: "Predisposition", anyOf: Object.freeze([endoRisk]) }),
  Object.freeze({ id: "endo-fever-element", label: "Fever", anyOf: Object.freeze([endoFever]) }),
  Object.freeze({ id: "endo-regurgitation-element", label: "New auscultated regurgitation", anyOf: Object.freeze([endoNewRegurgitation]) }),
  Object.freeze({ id: "endo-vascular-element", label: "Vascular phenomena", anyOf: Object.freeze([endoVascular]) }),
  Object.freeze({ id: "endo-immunologic-element", label: "Immunologic phenomena", anyOf: Object.freeze([endoImmune]) })
]);

export const endoDefinition = Object.freeze({
  majorCategoryCode: "CVS", majorCategoryName: "Cardiovascular System Infection", siteCode: "ENDO", siteName: "Endocarditis",
  source: endoCriterionSource, implementationStatus: "validated", logic: "anyOf", minimumRequiredCount: 1,
  criteria: Object.freeze([
    Object.freeze({ id: "ENDO-1", label: "Criterion 1 — organism from eligible cardiac or embolic specimen", source: endoCriterionSource, allOf: Object.freeze([endoItem("endo-site-organism", "Organism(s) identified by an eligible culture or non-culture method from cardiac vegetation, cardiac tissue, explanted prosthetic valve or sewing ring, ascending aortic graft with valve involvement, endovascular CIED, arterial embolus, or eligible pacemaker/defibrillator lead or intracardiac VAD component")]) }),
    Object.freeze({ id: "ENDO-2", label: "Criterion 2 — histopathologic endocarditis", source: endoCriterionSource, allOf: Object.freeze([endoItem("endo-histopathology", "Endocarditis seen on histopathologic examination of cardiac vegetation, cardiac tissue, explanted prosthetic valve or sewing ring, ascending aortic graft with valve involvement, endovascular CIED, or embolus")]) }),
    Object.freeze({ id: "ENDO-3", label: "Criterion 3 — intraoperative gross anatomic evidence", source: endoCriterionSource, allOf: Object.freeze([endoItem("endo-operative", "Intraoperative evidence of endocarditis on gross anatomic examination during a cardiac operative procedure")]) }),
    Object.freeze({ id: "ENDO-4", label: "Criterion 4 — imaging and major microbiology", source: endoCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([endoGroup("ENDO-4-imaging", "At least one qualifying imaging finding; equivocal evidence also requires physician or physician-designee documentation of antimicrobial treatment for endocarditis", 1, endoImaging), endoGroup("ENDO-4-microbiology", "At least one qualifying major microbiology pathway", 1, endoMajorMicrobiologyCriterion4)]) }),
    Object.freeze({ id: "ENDO-5", label: "Criterion 5 — three clinical elements and major microbiology", source: endoCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([endoGroup("ENDO-5-clinical", "At least three different clinical elements (only one condition within each element)", 3, endoClinicalElements), endoGroup("ENDO-5-microbiology", "At least one qualifying major microbiology pathway", 1, endoMajorMicrobiologyCriterion5)]) }),
    Object.freeze({ id: "ENDO-6", label: "Criterion 6 — imaging and three minor elements", source: endoCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([endoGroup("ENDO-6-imaging", "At least one qualifying imaging finding; equivocal evidence also requires physician or physician-designee documentation of antimicrobial treatment for endocarditis", 1, endoImaging), endoGroup("ENDO-6-elements", "At least three different elements (only one condition within each element)", 3, [endoClinicalElements[0], endoClinicalElements[1], endoClinicalElements[3], endoClinicalElements[4], endoMinorMicro])]) }),
    Object.freeze({ id: "ENDO-7", label: "Criterion 7 — one condition from each of six elements", source: endoCriterionSource, allOf: Object.freeze([]), groups: Object.freeze([endoGroup("ENDO-7-elements", "All six distinct elements are required", 6, [...endoClinicalElements, endoMinorMicro])]) })
  ]),
  exclusions: Object.freeze([]),
  notes: Object.freeze([
    Object.freeze({ id: "ENDO-note-equivocal", text: "Equivocal echocardiographic, cardiac CT, or FDG PET/CT evidence qualifies only with physician or physician-designee documentation of antimicrobial treatment for endocarditis.", source: endoFootnoteSource }),
    Object.freeze({ id: "ENDO-note-risk-timing", text: "Predisposition elements documented during the current admission may be outside the ENDO infection window or SSI surveillance period and must not set the ENDO date of event.", source: endoFootnoteSource }),
    Object.freeze({ id: "ENDO-note-window", text: "The ENDO infection window is 21 days: the first positive diagnostic test used as an element, 10 calendar days before, and 10 calendar days after; the RIT extends through the remainder of the current admission.", source: endoTimingSource })
  ]),
  reportingInstructions: Object.freeze([]),
  secondaryBsi: Object.freeze({ lockedUntilSiteDefinitionMet: true, source: endoTimingSource, requirements: Object.freeze([
    Object.freeze({ id: "site-definition", label: "A complete ENDO definition is met", source: endoTimingSource }),
    Object.freeze({ id: "organism-relationship", label: "The blood organism matches the organism used to meet ENDO, unless that blood specimen itself can be used to meet the ENDO criterion", source: endoTimingSource }),
    Object.freeze({ id: "attribution-timing", label: "The blood specimen is collected in the 21-day ENDO infection window or on a subsequent day of the same current admission", source: endoTimingSource })
  ]) })
});

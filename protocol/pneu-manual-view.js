// Manual-faithful presentation of the NHSN PNEU algorithms.
//
// Source: NHSN pneumonia.pdf (Chapter 6, Device-associated Module — PNEU)
//   Table 1 — Clinically Defined Pneumonia (PNU1) ................ printed page 6-6
//   Table 2 — Common bacterial / filamentous fungal (PNU2) ....... printed page 6-7
//   Table 3 — Viral, Legionella, other bacterial (PNU2) .......... printed page 6-8
//   Table 4 — Immunocompromised patients (PNU3) .................. printed page 6-9
//   Footnotes 1-13 ............................................... printed pages 6-12 – 6-16
//
// Bullet text below is transcribed from those tables. Every bullet carries a checkbox and
// every pathway shown in the manual is rendered, including the ones the patient's age does
// not activate — the manual prints all of them in one cell and reviewers cross-check
// against the printed page.

export const FOOTNOTE_TEXT = Object.freeze({
  1: "Imaging – Persistence. Multiple imaging results spanning several calendar days must be considered. Pneumonia does not resolve quickly; rapid resolution suggests a non-infectious process. In a patient without underlying pulmonary or cardiac disease with only one imaging test available, an eligible definitive finding meets the imaging requirement. Where more than one study is available, serial results within a 7-day timeframe must demonstrate persistence.",
  2: "Imaging – Alternative Descriptors. Wordings such as “air-space disease”, “focal opacification”, or “patchy areas of increased density” are eligible when not documented as attributed to another issue.",
  3: "New onset of purulent sputum. Secretions from the lungs, bronchi, or trachea containing ≥ 25 neutrophils and ≤ 10 squamous epithelial cells per low power field (x100). Laboratory confirmation is required.",
  4: "Change in character of sputum. Refers to the color, consistency, odor, and quantity of sputum.",
  5: "Tachypnea. Adults > 25; children > 1 year old > 30; children 2–12 months > 50; infants < 2 months > 60; premature infants born at < 37 weeks gestation and until the 40th week > 75 breaths per minute.",
  6: "Rales. May also be described as “crackles”.",
  7: "PaO₂/FiO₂ ≤ 240. The ratio of arterial tension (PaO₂) to the inspiratory fraction of oxygen (FiO₂).",
  8: "Organism identified from blood. Coagulase-negative Staphylococcus, Enterococcus species, and Candida species or yeast not otherwise specified identified from blood cannot be deemed secondary to a PNEU event unless also identified from lung tissue or eligible pleural fluid.",
  9: "Organism identified from minimally contaminated LRT specimens, pleural fluid, and lung tissue. See Table 5 thresholds. A specimen not obtained through an artificial airway from a ventilated patient is not minimally contaminated.",
  10: "Immunocompromised patients include only those with neutropenia (ANC or total WBC < 500/mm³); leukemia, lymphoma, or HIV positive with CD4 < 200 cells/mm³; splenectomy; history of solid organ or hematopoietic stem cell transplant; cytotoxic chemotherapy; or enteral or parenteral steroids daily for > 14 consecutive days on the date of event.",
  11: "Matching Candida spp. from blood and respiratory specimens for PNU3. Sputum obtained by any method is acceptable. Any quantity of organism is acceptable.",
  12: "Identification of organism by a culture or non-culture based microbiologic testing method performed for purposes of clinical diagnosis or treatment (for example, not ASC/AST).",
  13: "Imaging – Equivocal Results. If equivocal, first check whether subsequent imaging is definitive. Absent a clarifying study, an equivocal imaging test is eligible where there is clinical correlation."
});

// Table 5 — Threshold values for cultured specimens, printed page 6-15.
export const SPECIMEN_THRESHOLDS = Object.freeze({
  "lung-tissue": "≥ 10⁴ CFU/g tissue",
  "bronchoscopic-bal": "≥ 10⁴ CFU/ml",
  "protected-bal": "≥ 10⁴ CFU/ml",
  "protected-specimen-brushing": "≥ 10³ CFU/ml",
  "nonbronchoscopic-bal": "≥ 10⁴ CFU/ml",
  "nonbronchoscopic-protected-specimen-brushing": "≥ 10³ CFU/ml",
  "endotracheal-aspirate": "≥ 10⁵ CFU/ml"
});

const finding = (id, text, kinds, options = {}) => Object.freeze({ id, text, kinds: Object.freeze(kinds), ...options });
const gauge = (id, text, kind, defaults, options = {}) => Object.freeze({ id, text, kind, defaults: Object.freeze(defaults), ...options });

// ---------------------------------------------------------------- shared bullets

const FEVER = gauge("fever", "Fever (> 38.0°C or > 100.4°F)", "temperature", { value: 38.5, unit: "C" });
const LEUKO_ADULT = gauge("wbc-adult", "Leukopenia (≤ 4000 WBC/mm³) or leukocytosis (≥ 12,000 WBC/mm³)", "wbc", { value: 3000, unit: "cells/mm3" });
const LEUKO_PEDIATRIC = gauge("wbc-pediatric", "Leukopenia (≤ 4000 WBC/mm³) or leukocytosis (≥ 15,000 WBC/mm³)", "wbc", { value: 3000, unit: "cells/mm3" });
const ALTERED_MENTAL = finding("altered-mental-status", "For adults ≥ 70 years old, altered mental status with no other recognized cause", ["altered-mental-status-no-other-cause"], { minimumAgeYears: 70 });

const SPUTUM = finding("sputum", "New onset of purulent sputum ⁽³⁾ or change in character of sputum ⁽⁴⁾, or increased respiratory secretions, or increased suctioning requirements", ["sputum-change", "secretions-change", "increased-suctioning"], { footnotes: [3, 4] });
const RALES = finding("rales", "Rales ⁽⁶⁾ or bronchial breath sounds", ["rales", "crackles", "bronchial-breath-sounds"], { footnotes: [6] });
const GAS_PAO2 = finding("gas-exchange", "Worsening gas exchange (for example, O₂ desaturations [for example, PaO₂/FiO₂ ≤ 240] ⁽⁷⁾, increased oxygen requirements, or increased ventilator demand)", ["worsening-gas-exchange"], { footnotes: [7] });
const GAS_PULSE_OX = finding("gas-exchange", "Worsening gas exchange (for example, O₂ desaturations [for example, pulse oximetry < 94%], increased oxygen requirements, or increased ventilator demand)", ["worsening-gas-exchange"]);
const DYSPNEA_ADULT = finding("dyspnea", "Dyspnea, or tachypnea ⁽⁵⁾, or new onset or worsening cough", ["dyspnea", "new-or-worsening-cough"], { tachypnea: true, footnotes: [5] });

// ---------------------------------------------------------------- Table 1 (PNU1)

const PNU1_ANY = Object.freeze({
  id: "PNU1-any-patient",
  band: "For ANY PATIENT",
  heading: "PNU1 — Any patient",
  blocks: Object.freeze([
    Object.freeze({ id: "systemic", lead: "For <b>ANY PATIENT</b>, at least <u>one</u> of the following:", required: 1, bullets: Object.freeze([FEVER, LEUKO_ADULT, ALTERED_MENTAL]) }),
    Object.freeze({ id: "respiratory", lead: "And at least <u>two</u> of the following (from separate bullets):", required: 2, bullets: Object.freeze([SPUTUM, DYSPNEA_ADULT, RALES, GAS_PAO2]) })
  ])
});

const PNU1_INFANT = Object.freeze({
  id: "PNU1-infant",
  band: "ALTERNATE CRITERIA, for infants ≤ 1 year old",
  heading: "PNU1 — Infant ≤1 year",
  blocks: Object.freeze([
    // The manual states this line on its own, with no "at least one of" lead-in.
    Object.freeze({ id: "prerequisite", lead: "", required: 1, bullets: Object.freeze([GAS_PULSE_OX]) }),
    Object.freeze({ id: "findings", lead: "And at least <u>three</u> of the following (from separate bullets):", required: 3, bullets: Object.freeze([
      finding("temperature-instability", "Temperature instability", ["temperature-instability"]),
      gauge("wbc-infant", "Leukopenia (≤ 4000 WBC/mm³) or leukocytosis (≥ 15,000 WBC/mm³) and left shift (≥ 10% band forms)", "wbc", { value: 3000, unit: "cells/mm3" }, { companion: gauge("bands", "Band forms (%)", "bands", { value: 12, unit: "percent" }) }),
      SPUTUM,
      finding("apnea", "Apnea, tachypnea ⁽⁵⁾, nasal flaring with retraction of chest wall, or nasal flaring with grunting", ["apnea", "nasal-flaring"], { tachypnea: true, footnotes: [5] }),
      finding("wheezing", "Wheezing, rales ⁽⁶⁾, or rhonchi", ["wheezing", "rales", "crackles", "rhonchi"], { footnotes: [6] }),
      finding("cough", "Cough", ["cough"]),
      gauge("heart-rate", "Bradycardia (&lt; 100 beats/min) or tachycardia (&gt; 170 beats/min)", "heart-rate", { value: 180, unit: "beats/min" })
    ]) })
  ])
});

const PNU1_CHILD = Object.freeze({
  id: "PNU1-child",
  band: "ALTERNATE CRITERIA, for child > 1 year old or ≤ 12 years old",
  heading: "PNU1 — Child >1 through ≤12 years",
  blocks: Object.freeze([
    Object.freeze({ id: "findings", lead: "At least <u>three</u> of the following (from separate bullets):", required: 3, bullets: Object.freeze([
      gauge("temperature-child", "Fever (&gt; 38.0°C or &gt; 100.4°F) or hypothermia (&lt; 36.0°C or &lt; 96.8°F)", "temperature", { value: 38.5, unit: "C" }),
      LEUKO_PEDIATRIC,
      SPUTUM,
      finding("dyspnea-child", "Dyspnea, or apnea, or tachypnea ⁽⁵⁾, or new onset or worsening cough", ["dyspnea", "apnea", "new-or-worsening-cough"], { tachypnea: true, footnotes: [5] }),
      RALES,
      GAS_PULSE_OX
    ]) })
  ])
});

// ---------------------------------------------------------------- Tables 2-4 signs

const PNU2_SIGNS = Object.freeze({
  id: "PNU2-signs",
  blocks: Object.freeze([
    Object.freeze({ id: "systemic", lead: "At least <u>one</u> of the following:", required: 1, bullets: Object.freeze([FEVER, LEUKO_ADULT, ALTERED_MENTAL]) }),
    Object.freeze({ id: "respiratory", lead: "And at least <u>one</u> of the following:", required: 1, bullets: Object.freeze([SPUTUM, DYSPNEA_ADULT, RALES, GAS_PAO2]) })
  ])
});

const PNU3_SIGNS = Object.freeze({
  id: "PNU3-signs",
  blocks: Object.freeze([
    Object.freeze({ id: "clinical", lead: "Patient who is immunocompromised (see definition in footnote 10) has at least <u>one</u> of the following:", required: 1, bullets: Object.freeze([
      FEVER, ALTERED_MENTAL, SPUTUM, DYSPNEA_ADULT, RALES, GAS_PAO2,
      finding("hemoptysis", "Hemoptysis", ["hemoptysis"]),
      finding("pleuritic-chest-pain", "Pleuritic chest pain", ["pleuritic-chest-pain"])
    ]) })
  ])
});

export const PNU1_PATHWAYS = Object.freeze([PNU1_ANY, PNU1_INFANT, PNU1_CHILD]);
export const PNU2_SIGN_PATHWAY = PNU2_SIGNS;
export const PNU3_SIGN_PATHWAY = PNU3_SIGNS;

// ---------------------------------------------------------------- imaging cell

export const IMAGING_CELL = Object.freeze({
  lead: "Two or more serial chest imaging test results with at least one of the following ⁽¹⁾⁽²⁾⁽¹³⁾:",
  patterns: Object.freeze(["New and persistent", "Progressive and persistent"]),
  findings: Object.freeze([
    Object.freeze({ id: "infiltrate", text: "Infiltrate" }),
    Object.freeze({ id: "consolidation", text: "Consolidation" }),
    Object.freeze({ id: "cavitation", text: "Cavitation" }),
    Object.freeze({ id: "pneumatoceles", text: "Pneumatoceles, in infants ≤1 year old", infantOnly: true })
  ]),
  alternativeDescriptors: Object.freeze([
    Object.freeze({ id: "air-space-disease", text: "air-space disease" }),
    Object.freeze({ id: "focal-opacification", text: "focal opacification" }),
    Object.freeze({ id: "patchy-increased-density", text: "patchy areas of increased density" })
  ]),
  note: "Note: In patients <i>without</i> underlying pulmonary or cardiac disease (such as respiratory distress syndrome, bronchopulmonary dysplasia, pulmonary edema, or chronic obstructive pulmonary disease), at least one <u>definitive</u> imaging test result is acceptable. ⁽¹⁾"
});

// ---------------------------------------------------------------- laboratory cells

export const PNU2_COMMON_LAB = Object.freeze({
  id: "common",
  tableTitle: "Table 2: Specific Site Algorithm for Pneumonia with Common Bacterial or Filamentous Fungal Pathogens and Specific Laboratory Findings (PNU2)",
  lead: "At least <u>one</u> of the following:",
  options: Object.freeze([
    Object.freeze({ id: "blood", text: "Organism identified from blood ⁽⁸⁾⁽¹²⁾" }),
    Object.freeze({ id: "pleural-fluid", text: "Organism identified from pleural fluid ⁽⁹⁾⁽¹²⁾" }),
    Object.freeze({ id: "lrt", text: "Positive quantitative culture or corresponding semi-quantitative culture result ⁽⁹⁾ from minimally contaminated LRT specimen (specifically, BAL, protected specimen brushing, or endotracheal aspirate)" }),
    Object.freeze({ id: "lung-tissue", text: "Positive quantitative culture or corresponding semi-quantitative culture result ⁽⁹⁾ of lung tissue" }),
    Object.freeze({ id: "bal-intracellular-bacteria", text: "≥ 5% BAL-obtained cells contain intracellular bacteria on direct microscopic exam (for example, Gram stain)" }),
    Object.freeze({ id: "histopathology", text: "Histopathologic exam shows at least one of the following evidences of pneumonia: abscess formation or foci of consolidation with intense PMN accumulation in bronchioles and alveoli; or evidence of lung parenchyma invasion by fungal hyphae or pseudohyphae" })
  ])
});

export const PNU2_DEFINITIVE_LAB = Object.freeze({
  id: "definitive",
  tableTitle: "Table 3: Specific Site Algorithm for Viral, Legionella, and other Bacterial Pneumonias with Definitive Laboratory Findings (PNU2)",
  lead: "At least <u>one</u> of the following:",
  options: Object.freeze([
    Object.freeze({ id: "respiratory-or-tissue-identification", text: "Virus, Bordetella, Legionella, Chlamydia, or Mycoplasma identified from respiratory secretions or tissue by a culture or non-culture based microbiologic testing method which is performed for purposes of clinical diagnosis or treatment (for example, not Active Surveillance Culture/Testing (ASC/AST))" }),
    Object.freeze({ id: "paired-sera-fourfold-igg", text: "Fourfold rise in paired sera (IgG) for pathogen (for example, influenza viruses, Chlamydia)" }),
    Object.freeze({ id: "legionella-paired-sera-ifa", text: "Fourfold rise in Legionella pneumophila serogroup 1 antibody titer to ≥ 1:128 in paired acute and convalescent sera by indirect IFA" }),
    Object.freeze({ id: "legionella-urine-antigen", text: "Detection of Legionella pneumophila serogroup 1 antigens in urine by RIA or EIA" })
  ])
});

export const PNU3_LAB = Object.freeze({
  id: "pnu3",
  lead: "At least <u>one</u> of the following:",
  options: Object.freeze([
    Object.freeze({ id: "pnu3-candida", text: "Identification of matching Candida spp. from blood and one of the following respiratory specimens: sputum, endotracheal aspirate, BAL, or protected specimen brushing ⁽¹¹⁾⁽¹²⁾; blood specimen and respiratory specimen must have collection dates that occur within the same IWP" }),
    Object.freeze({ id: "pnu3-fungus", text: "Evidence of fungi (excluding any Candida and yeast not otherwise specified) from minimally contaminated LRT specimen (specifically BAL, protected specimen brushing or endotracheal aspirate) from one of the following: direct microscopic exam, positive culture of fungi, or non-culture diagnostic laboratory test" })
  ]),
  // Table 4 closes with "OR / Any of the following from: LABORATORY CRITERIA DEFINED UNDER
  // PNU2". PNU2 laboratory criteria are Table 2 *and* Table 3, so both are offered.
  pnu2Tables: Object.freeze([PNU2_COMMON_LAB, PNU2_DEFINITIVE_LAB])
});

// ---------------------------------------------------------------- selection state

export function bulletSelected(input, bullet, tachypneaThreshold) {
  if (bullet.kinds) {
    if (input.clinicalFindings.some(item => bullet.kinds.includes(item.kind))) return true;
    return Boolean(bullet.tachypnea) && input.measurements.some(item => item.kind === "respiratory-rate");
  }
  return input.measurements.some(item => item.kind === bullet.kind);
}

export function blockStatus(input, block, age) {
  const applicable = block.bullets.filter(bullet => bullet.minimumAgeYears === undefined || (age !== null && age >= bullet.minimumAgeYears));
  const selected = applicable.filter(bullet => bulletSelected(input, bullet));
  return { required: block.required, selectedCount: selected.length, met: selected.length >= block.required, remaining: Math.max(0, block.required - selected.length), applicable, selected };
}

export function pathwayStatus(input, pathway, age) {
  const blocks = pathway.blocks.map(block => ({ block, status: blockStatus(input, block, age) }));
  return { met: blocks.every(entry => entry.status.met), blocks };
}

export function pathwayApplicable(pathwayId, age) {
  if (age === null) return pathwayId === "PNU1-any-patient";
  if (pathwayId === "PNU1-infant") return age <= 1;
  if (pathwayId === "PNU1-child") return age > 1 && age <= 12;
  return true;
}

import { evaluatePnu1 } from "./pnu1.js";
import { renderPnu1Safely } from "./pnu1-renderer.js";
import { evaluatePnu2 } from "./pnu2.js";
import { renderPnu2Safely } from "./pnu2-renderer.js";

const baseInput = () => ({
  patientContext: {
    dateOfBirth: "1980-01-01",
    hostStatus: { status: "notMet", reasons: [] },
    ventilator: { inPlace: false, periods: [] }
  },
  admissionDate: "2026-01-01",
  underlyingPulmonaryOrCardiacDisease: false,
  soleAvailableImage: true,
  imagingStudies: [{
    id: "image-1",
    date: "2026-01-10",
    modality: "chest-xray",
    findings: [],
    interpretation: "definitive",
    attributedToOtherCondition: false
  }],
  imagingRelationships: [],
  measurements: [],
  clinicalFindings: []
});

export const PNEU_UI_REGISTRY = Object.freeze({
  PNU1: Object.freeze({ label: "PNU1", implemented: true, evaluate: evaluatePnu1, render: renderPnu1Safely }),
  PNU2: Object.freeze({ label: "PNU2", implemented: true, evaluate: evaluatePnu2, render: renderPnu2Safely }),
  PNU3: Object.freeze({ label: "PNU3 — Not yet implemented", implemented: false })
});

export function createPneuState() {
  return {
    selectedSubtype: "",
    inputs: {
      PNU1: baseInput(),
      PNU2: { ...baseInput(), microbiologyResults: [], histopathologyResults: [], bloodResults: [] }
    },
    drafts: { PNU1: "", PNU2: "" }
  };
}

export function evaluatePneuSubtype(subtype, input) {
  const entry = PNEU_UI_REGISTRY[subtype];
  if (!entry?.implemented) return { ok: false, error: "This PNEU subtype is not yet implemented." };
  const result = entry.evaluate(input);
  if (!result.ok) return { ok: false, errors: result.errors };
  return { ok: true, evaluation: result.value, html: entry.render({ evaluation: result.value, patientContext: input.patientContext }) };
}

export function getVisibleMenCriteria(criteria, patientAge) {
  return criteria.filter((criterion) => {
    if (criterion.id === "MEN-2") return patientAge !== "infant";
    if (criterion.id === "MEN-3") return patientAge === "infant";
    return true;
  });
}

export function checkboxEvidenceValue(checked) {
  return checked ? "met" : "notMet";
}

export function getMenProgress(evaluation, criteria, evidence) {
  const evidenceIds = new Set();
  const collect = (item) => {
    if (item.id && !item.anyOf) evidenceIds.add(item.id);
    (item.allOf || []).forEach(collect);
    (item.groups || []).forEach(collect);
    (item.anyOf || []).forEach(collect);
  };
  criteria.forEach(collect);
  const completed = [...evidenceIds].filter((id) => evidence[id] === "met").length;
  const missing = evaluation.branches
    ? evaluation.branches.filter((branch) => criteria.some((criterion) => criterion.id === branch.id)).reduce((least, branch) => Math.min(least, branch.missing.length), Infinity)
    : 0;
  return { completed, missing: Number.isFinite(missing) ? missing : 0, met: evaluation.siteDefinitionMet };
}

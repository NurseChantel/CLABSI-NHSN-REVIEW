import { loadNhsnOrganisms, searchOrganisms } from "./organism-search.js";
import { evaluateSecondarySite, placeholderWarning, secondarySiteCategories, secondarySiteDefinitions } from "./secondary-rules.js";
import { checkboxEvidenceValue, COMPACT_MEN_RENDERER_VERSION, renderSecondaryEvidenceSafely as renderCompactMenEvidence } from "./secondary-evidence-ui.js?v=5";
import { addLabAlternative, addPneuRecord, applyPneuControl, createPneuState, PNEU_UI_REGISTRY, removePneuRecord, renderPneuAbstraction, selectLabAlternative, setLabOrganism, toggleClinicalFinding, toggleImageFinding } from "./protocol/pneu-ui.js";

"use strict";

let organismDatabase = [];
let organismDatabaseAvailable = false;

const state = {
  admitDate: "",
  cultureOrganismDate: "",
  patientAge: "adult",
  organismNames: [],
  selectedOrganisms: [],
  organismSnomedCodes: {},
  organismCategory: "unresolved",
  commensalMatch: "",
  separateOccasions: "",
  symptoms: new Set(),
  selectedMajorCategory: "",
  selectedSite: "",
  siteEvidence: {},
  reviewFamily: "chapter17",
  pneu: createPneuState(),
  openMenCriterion: "",
  openBjCriteria: undefined,
  organismRelationship: "",
  attributionTiming: "",
  centralDefinition: "",
  centralAccessed: "",
  centralDay3: "",
  lineOnDoe: "",
  mbi: {
    neutropenia: false,
    transplant: false,
    gvhd: false,
    diarrhea: false,
    mbiOrganisms: false,
    vgsRothia: false
  },
  exclusions: new Set(),
  exclusionSupport: new Set()
};

const exclusionRequirements = {
  "ECMO/ECLS": "Confirm the device was present for more than 2 consecutive calendar days and was present on the LCBI date of event or the day before.",
  VAD: "Confirm the ventricular assist device was present for more than 2 consecutive calendar days and was present on the LCBI date of event or the day before.",
  "Total artificial heart": "Confirm the artificial heart was present for more than 2 consecutive calendar days and was present on the LCBI date of event or the day before.",
  "Patient injection": "Confirm documented observation or clinical suspicion of injection into the line during the BSI infection window period.",
  "Epidermolysis bullosa": "Confirm the epidermolysis bullosa diagnosis and all NHSN organism and documentation requirements.",
  "Factitious disorder imposed on another": "Confirm documented or clinically supported line manipulation during the BSI infection window period.",
  "Other vascular access site": "Confirm pus at an eligible alternate access site, matching blood/site organisms, and required timing."
};

const suggestionCategoryMap = Object.freeze({ pneu: "LRI", uti: "USI", gi: "GI", skin: "SST", boneJoint: "BJ", cardiovascular: "CVS", cns: "CNS", ssi: "", other: "" });
const siteLibrary = Object.freeze(Object.fromEntries(secondarySiteCategories.map(category => [category.majorCategoryCode, { label: `${category.majorCategoryCode} / ${category.majorCategoryName}` }])));

const NO_PATHWAY_GUIDANCE =
  "No organism-specific starting pathway is assigned. Review all clinically plausible NHSN infection sites.";

/*
 * This is the single organism data source used by category derivation, MBI
 * flags, validation, and secondary-BSI suggestions. Every option in the
 * organism picker is validated against this table during initialization.
 */
const organismRecordDefinitions = {
  "Acinetobacter species": record("acinetobacter-species", "recognized-pathogen", ["pneu", "uti", "skin"]),
  "Bacteroides species": record("bacteroides-species", "recognized-pathogen", ["gi", "skin"], { mbiEligible: true }),
  "Candida species": record("candida-species", "recognized-pathogen", ["gi", "uti"], { mbiEligible: true }),
  "Candida albicans": record("candida-albicans", "recognized-pathogen", ["gi", "uti"], { mbiEligible: true }),
  "Candida auris": record("candida-auris", "recognized-pathogen", ["gi", "uti"], { mbiEligible: true }),
  "Candida glabrata": record("candida-glabrata", "recognized-pathogen", ["gi", "uti"], { mbiEligible: true }),
  "Candida parapsilosis": record("candida-parapsilosis", "recognized-pathogen", ["gi", "uti"], { mbiEligible: true }),
  "Candida tropicalis": record("candida-tropicalis", "recognized-pathogen", ["gi", "uti"], { mbiEligible: true }),
  "Enterobacter species": record("enterobacter-species", "recognized-pathogen", ["uti", "gi", "pneu"], { mbiEligible: true }),
  "Enterococcus species": record("enterococcus-species", "recognized-pathogen", ["uti", "gi", "skin", "cardiovascular"], { mbiEligible: true }),
  "Enterococcus faecalis": record("enterococcus-faecalis", "recognized-pathogen", ["uti", "gi", "skin", "cardiovascular"], { mbiEligible: true }),
  "Enterococcus faecium": record("enterococcus-faecium", "recognized-pathogen", ["uti", "gi", "skin", "cardiovascular"], { mbiEligible: true }),
  "Escherichia coli": record("escherichia-coli", "recognized-pathogen", ["uti", "gi"], { mbiEligible: true }),
  "Klebsiella species": record("klebsiella-species", "recognized-pathogen", ["uti", "pneu", "gi"], { mbiEligible: true }),
  "Klebsiella pneumoniae": record("klebsiella-pneumoniae", "recognized-pathogen", ["uti", "pneu", "gi"], { mbiEligible: true }),
  "Proteus mirabilis": record("proteus-mirabilis", "recognized-pathogen", ["uti", "gi"], { mbiEligible: true }),
  "Pseudomonas aeruginosa": record("pseudomonas-aeruginosa", "recognized-pathogen", ["pneu", "uti", "skin", "gi"]),
  "Serratia marcescens": record("serratia-marcescens", "recognized-pathogen", ["uti", "pneu", "gi"], { mbiEligible: true }),
  "Staphylococcus aureus": record("staphylococcus-aureus", "recognized-pathogen", ["skin", "ssi", "boneJoint", "cardiovascular", "pneu"]),
  "Stenotrophomonas maltophilia": record("stenotrophomonas-maltophilia", "recognized-pathogen", ["pneu", "uti"]),
  "Streptococcus agalactiae": record("streptococcus-agalactiae", "recognized-pathogen", ["skin", "cns"]),
  "Streptococcus pneumoniae": record("streptococcus-pneumoniae", "recognized-pathogen", ["pneu", "cns"]),
  "Aerococcus species": record("aerococcus-species", "common-commensal", ["uti"]),
  "Bacillus species (not B. anthracis)": record("bacillus-species-non-anthracis", "common-commensal", []),
  "Corynebacterium species": record("corynebacterium-species", "common-commensal", ["skin", "cardiovascular"]),
  "Cutibacterium species": record("cutibacterium-species", "common-commensal", ["skin", "boneJoint"]),
  "Micrococcus species": record("micrococcus-species", "common-commensal", []),
  "Rhodococcus species": record("rhodococcus-species", "common-commensal", ["pneu"]),
  "Staphylococcus, coagulase negative": record("coagulase-negative-staphylococcus", "common-commensal", ["skin", "cardiovascular"]),
  "Viridans group streptococci": record("viridans-group-streptococci", "common-commensal", ["cardiovascular", "other"], { mbiEligible: true, vgsRothia: true, specialRule: "VGS may qualify for the special MBI-LCBI 2/3 organism pathway when all NHSN requirements are met." })
};

let organismRecords = Object.fromEntries(
  Object.entries(organismRecordDefinitions).map(([displayName, item]) => [
    displayName,
    { ...item, displayName }
  ])
);

function record(id, classification, suggestedPathways, flags = {}) {
  return { id, classification, suggestedPathways, priorityPathways: suggestedPathways, guidance: suggestedPathways.length ? "Review the highlighted organism-associated starting pathways and every other clinically plausible site." : NO_PATHWAY_GUIDANCE, mbiEligible: false, vgsRothia: false, specialRule: "", ...flags };
}

function makeCalculatorOrganismRecord(organism) {
  const existing = organismRecordDefinitions[organism.displayName];
  const priorityPathways = existing?.priorityPathways || (organism.isUtiBacterium ? ["uti"] : []);
  return {
    ...(existing || record(`nhsn-${organism.nhsnCode}`, organism.isCommonCommensal ? "common-commensal" : "recognized-pathogen", priorityPathways)),
    ...organism,
    id: `nhsn-${organism.nhsnCode}`,
    classification: organism.isCommonCommensal ? "common-commensal" : "recognized-pathogen",
    mbiEligible: organism.isMbiOrganism,
    priorityPathways,
    suggestedPathways: priorityPathways
  };
}

function installNhsnOrganismRecords(organisms) {
  organismRecords = Object.fromEntries(organisms.map((organism) => [
    organism.displayName,
    makeCalculatorOrganismRecord(organism)
  ]));

  const select = document.getElementById("organismName");
  select.replaceChildren();
  [
    ["Recognized pathogens", false],
    ["Common Commensals", true]
  ].forEach(([label, isCommonCommensal]) => {
    const group = document.createElement("optgroup");
    group.label = label;
    organisms.filter((organism) => organism.isCommonCommensal === isCommonCommensal).forEach((organism) => {
      const option = document.createElement("option");
      option.value = organism.displayName;
      option.textContent = organism.displayName;
      group.appendChild(option);
    });
    select.appendChild(group);
  });
  buildOrganismChecklist();
}

const coagulaseNegativeStaphylococciDefinition =
  "Coagulase-negative Staphylococcus species include: S. arlettae, S. auricularis, S. capitis, S. caprae, S. carnosus, S. chromogenes, S. cohnii, S. condimenti, S. epidermidis, S. equorum, S. felis, S. haemolyticus, S. hominis, S. kloosii, S. lentus, S. lugdunensis, S. pasteuri, S. pettenkoferi, S. piscifermentans, S. saccharolyticus, S. saprophyticus, S. schleiferi, S. sciuri, S. simulans, S. succinus, S. vitulinus, S. warneri, and S. xylosus. Confirm the laboratory identification and current NHSN Terminology Browser classification when reporting.";

document.addEventListener("DOMContentLoaded", init);

function init() {
  validateOrganismRecords();
  buildSiteButtons();
  bindPneuNavigation();
  renderSymptoms();
  bindChoiceGroups();
  bindInputs();
  bindOrganismSearch();
  bindCheckboxes();
  bindSectionResets();
  bindManualDialogs();
  setupResponsiveBookTitles();
  bindReferenceTabs();
  bindReferenceGuideMinimize();
  setupTooltips();
  updateAll();
  initializeOrganismDatabase();
}

function setupResponsiveBookTitles() {
  const titles = Array.from(document.querySelectorAll(".manual-book-title"));

  const fitAllTitles = () => {
    titles.forEach((title) => fitBookTitle(title));
  };

  fitAllTitles();

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(fitAllTitles);
    titles.forEach((title) => observer.observe(title.closest(".manual-book-cover") || title));
  } else {
    window.addEventListener("resize", fitAllTitles);
  }

  document.fonts?.ready.then(fitAllTitles);
}

function fitBookTitle(title) {
  const text = title.firstElementChild || title;
  text.style.fontSize = "";

  const maximumSize = Number.parseFloat(getComputedStyle(text).fontSize);
  let smallestSize = 1;
  let largestSize = maximumSize;

  const fits = (size) => {
    text.style.fontSize = `${size}px`;
    const lineHeight = Number.parseFloat(getComputedStyle(text).lineHeight);
    const lineCount = Math.ceil((text.scrollHeight - 0.5) / lineHeight);

    return text.scrollWidth <= title.clientWidth + 0.5 &&
      text.scrollHeight <= title.clientHeight + 0.5 &&
      lineCount <= 3;
  };

  if (fits(largestSize)) {
    return;
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = (smallestSize + largestSize) / 2;
    if (fits(candidate)) {
      smallestSize = candidate;
    } else {
      largestSize = candidate;
    }
  }

  text.style.fontSize = `${Math.floor(smallestSize * 10) / 10}px`;
}

async function initializeOrganismDatabase() {
  const status = document.getElementById("organismSearchStatus");
  status.textContent = "Loading NHSN organism names…";
  status.classList.add("loading");

  try {
    organismDatabase = await loadNhsnOrganisms("./nhsn-organisms.json");
    installNhsnOrganismRecords(organismDatabase);
    organismDatabaseAvailable = true;
    status.textContent = `${organismDatabase.length} NHSN organism records available.`;
    status.classList.remove("loading", "warning");
  } catch (error) {
    organismDatabaseAvailable = false;
    status.textContent = "Organism search could not be loaded. You may still use the existing calculator list.";
    status.classList.remove("loading");
    status.classList.add("warning");
    console.error("NHSN organism database failed to load:", error);
  }
}

function bindManualDialogs() {
  [
    ["openManual", "manualDialog", "closeManual"],
    ["openSecondaryGuide", "secondaryGuideDialog", "closeSecondaryGuide"]
  ].forEach(([openId, dialogId, closeId]) => {
    const openButton = document.getElementById(openId);
    const dialog = document.getElementById(dialogId);
    const closeButton = document.getElementById(closeId);

    if (!openButton || !dialog || !closeButton) {
      return;
    }

    openButton.addEventListener("click", () => dialog.showModal());
    closeButton.addEventListener("click", () => dialog.close());

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  });
}

function bindReferenceGuideMinimize() {
  const guide = document.querySelector(".reference-tabs");
  const button = document.getElementById("minimizeReferenceGuide");
  const content = document.getElementById("referenceGuideContent");

  if (!guide || !button || !content) {
    return;
  }

  button.addEventListener("click", () => {
    const isMinimized = guide.classList.toggle("is-minimized");

    content.hidden = isMinimized;
    button.setAttribute("aria-expanded", String(!isMinimized));
    button.querySelector(".minimize-guide__icon").textContent = isMinimized
      ? "+"
      : "−";
    button.querySelector(".minimize-guide__label").textContent = isMinimized
      ? "Expand"
      : "Minimize";
  });
}

function bindReferenceTabs() {
  const tabs = Array.from(document.querySelectorAll(".tab-button"));

  if (!tabs.length) {
    return;
  }

  const selectTab = (selectedTab) => {
    tabs.forEach((tab) => {
      const isSelected = tab === selectedTab;
      const panel = document.getElementById(tab.getAttribute("aria-controls"));

      tab.classList.toggle("is-active", isSelected);
      tab.setAttribute("aria-selected", String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;

      if (panel) {
        panel.hidden = !isSelected;
      }
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));

    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        return;
      }

      event.preventDefault();
      let nextIndex = index;

      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else {
        nextIndex = tabs.length - 1;
      }

      tabs[nextIndex].focus();
      selectTab(tabs[nextIndex]);
    });
  });
}

function bindChoiceGroups() {
  document.querySelectorAll(".compact-choice").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-value]");

      if (!button || group.dataset.name === "organismCategory") {
        return;
      }

      group
        .querySelectorAll("button[data-value]")
        .forEach((item) => item.classList.remove("selected"));

      button.classList.add("selected");
      group.querySelectorAll("button[data-value]").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });

      const name = group.dataset.name;
      state[name] = button.dataset.value;

      if (name === "organismCategory") {
        document
          .getElementById("commensalQuestions")
          .classList.toggle(
            "hidden",
            state.organismCategory !== "commensal"
          );
      }

      if (name === "patientAge") {
        state.symptoms.clear();
        state.siteEvidence = {};
        state.openMenCriterion = "";
        state.openBjCriteria = undefined;
        renderSymptoms();
      }

      updateAll();
    });
  });
}

function bindInputs() {
  document
    .getElementById("admitDate")
    .addEventListener("change", (event) => {
      state.admitDate = event.target.value;
    });

  document
    .getElementById("cultureOrganismDate")
    .addEventListener("change", (event) => {
      state.cultureOrganismDate = event.target.value;
      renderSurveillanceWindow();
    });

  buildOrganismChecklist();
  bindOrganismBrowse();
}

function bindOrganismBrowse() {
  const button = document.getElementById("toggleOrganismBrowse");
  const panel = document.getElementById("organismBrowsePanel");
  const checklist = document.getElementById("organismChecklist");

  button.addEventListener("click", () => {
    const opening = panel.hidden;
    panel.hidden = !opening;
    button.setAttribute("aria-expanded", String(opening));
    button.textContent = opening ? "Hide organism browser" : "Browse all organisms";
    if (!opening) return;

    const options = Array.from(document.getElementById("organismName").options);
    options.forEach((option) => {
      const checkbox = Array.from(checklist.querySelectorAll("input")).find(
        (input) => input.value === option.value
      );
      if (checkbox) checkbox.checked = option.selected;
    });

    const searchedSelections = Array.from(
      checklist.querySelectorAll('.organism-checklist-option[data-selected-via-search="true"]')
    );
    searchedSelections.forEach((label) => label.classList.add("organism-search-selection-highlight"));
    const firstSelection = searchedSelections[0] || checklist.querySelector("input:checked")?.closest("label");
    if (firstSelection) {
      requestAnimationFrame(() => firstSelection.scrollIntoView({ block: "center" }));
    } else {
      checklist.scrollTop = 0;
    }
  });
}

function buildOrganismChecklist() {
  const select = document.getElementById("organismName");
  const checklist = document.getElementById("organismChecklist");
  checklist.replaceChildren();

  Array.from(select.children).forEach((group) => {
    const section = document.createElement("div");
    section.className = "organism-checklist-group";
    section.dataset.group = group.label;

    const heading = document.createElement("div");
    heading.className = "organism-checklist-group-title";
    heading.textContent = group.label;
    section.appendChild(heading);

    Array.from(group.children).forEach((option) => {
      const organism = organismRecords[option.value];
      option.dataset.organismId = organism?.id || "missing-record";
      const label = document.createElement("label");
      label.className = "organism-checklist-option";
      label.dataset.searchText = option.text.toLowerCase();
      const isCoagulaseNegativeStaphylococcus =
        option.value === "Staphylococcus, coagulase negative";
      label.innerHTML = `
        <input type="checkbox" value="${escapeHtml(option.value)}" aria-label="${escapeHtml(option.text)}">
        <span class="organism-checkmark" aria-hidden="true">✓</span>
        <span class="organism-option-name">${escapeHtml(option.text)}</span>
        ${isCoagulaseNegativeStaphylococcus ? `
          <button
            class="definition organism-definition"
            type="button"
            data-tooltip="${escapeHtml(coagulaseNegativeStaphylococciDefinition)}"
            aria-label="Coagulase-negative Staphylococcus species definition"
          >i</button>
        ` : ""}
      `;

      const checkbox = label.querySelector("input");
      checkbox.checked = option.selected;
      label.dataset.selectedViaSearch = option.dataset.selectedViaSearch || "false";
      checkbox.addEventListener("change", (event) => {
        option.selected = event.target.checked;
        if (!event.target.checked) {
          delete option.dataset.selectedViaSearch;
          label.dataset.selectedViaSearch = "false";
          label.classList.remove("organism-search-selection-highlight");
        }
        syncOrganismSelection();
      });
      section.appendChild(label);
    });

    checklist.appendChild(section);
  });
}

function syncOrganismSelection() {
  const select = document.getElementById("organismName");
  const selected = document.getElementById("selectedOrganisms");
  const count = document.getElementById("organismSelectionCount");
  const checklist = document.getElementById("organismChecklist");
  const activeChecklistControl = checklist?.contains(document.activeElement)
    ? document.activeElement
    : null;
  const pageScrollX = window.scrollX;
  const pageScrollY = window.scrollY;
  const checklistScrollTop = checklist?.scrollTop ?? 0;

  const restoreOrganismBrowserPosition = () => {
    if (checklist) checklist.scrollTop = checklistScrollTop;
    if (
      activeChecklistControl?.isConnected &&
      document.activeElement !== activeChecklistControl
    ) {
      activeChecklistControl.focus({ preventScroll: true });
    }
    window.scrollTo(pageScrollX, pageScrollY);
  };

  state.organismNames = Array.from(select.selectedOptions).map((option) => option.value);
  state.selectedOrganisms = state.organismNames.map((name) => organismRecords[name]).filter(Boolean);
  Object.keys(state.organismSnomedCodes).forEach((name) => {
    if (!state.organismNames.includes(name)) delete state.organismSnomedCodes[name];
  });
  document.getElementById("selectedOrganismSnomedCodes").value = JSON.stringify(
    state.organismNames
      .filter((name) => state.organismSnomedCodes[name])
      .map((name) => ({ preferredTerm: name, snomedCode: state.organismSnomedCodes[name] }))
  );
  state.organismCategory = deriveOrganismCategory(state.organismNames);
  applyKnownMbiEligibility();
  renderDerivedOrganismCategory();
  count.textContent = `${state.organismNames.length} selected`;

  if (!state.organismNames.length) {
    selected.innerHTML = '<span class="selected-organisms-empty">No organisms selected</span>';
  } else {
    selected.innerHTML = state.organismNames.map((organism) => `
      <span class="selected-organism-chip">
        ${escapeHtml(organism)}
        <button type="button" data-remove-organism="${escapeHtml(organism)}" aria-label="Remove ${escapeHtml(organism)}">×</button>
      </span>
    `).join("");

    selected.querySelectorAll("[data-remove-organism]").forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.dataset.removeOrganism;
        const option = Array.from(select.options).find((item) => item.value === value);
        const checkbox = Array.from(document.querySelectorAll("#organismChecklist input")).find((input) => input.value === value);
        option.selected = false;
        if (checkbox) {
          checkbox.checked = false;
          checkbox.closest("label").classList.remove("organism-search-selection-highlight");
          checkbox.closest("label").dataset.selectedViaSearch = "false";
        }
        delete option.dataset.selectedViaSearch;
        syncOrganismSelection();
      });
    });
  }

  renderSelectedOrganismDetails();

  updateAll();
  restoreOrganismBrowserPosition();
  requestAnimationFrame(restoreOrganismBrowserPosition);
}

function renderSelectedOrganismDetails() {
  const container = document.getElementById("selectedOrganismDetails");
  if (!container) return;
  const records = state.organismNames.map((name) => organismRecords[name]).filter(Boolean);
  container.hidden = records.length === 0;
  container.innerHTML = records.map((organism) => `
    <dl class="organism-detail-card">
      <div><dt>Organism</dt><dd>${escapeHtml(organism.displayName)}</dd></div>
      <div><dt>Common Commensal</dt><dd>${organism.isCommonCommensal ? "Yes" : "No"}</dd></div>
      <div><dt>Recognized Pathogen</dt><dd>${organism.isCommonCommensal ? "No" : "Yes"}</dd></div>
      <div><dt>MBI Organism</dt><dd>${organism.isMbiOrganism ? "Yes" : "No"}</dd></div>
      <div><dt>UTI Organism</dt><dd>${organism.isUtiBacterium ? "Yes" : "No"}</dd></div>
    </dl>
  `).join("");
}

function applyKnownMbiEligibility() {
  const records = state.organismNames.map((name) => organismRecords[name]).filter(Boolean);
  const allKnownEligible = records.length > 0 && records.every((item) => item.mbiEligible);
  state.mbi.vgsRothia = allKnownEligible && records.every((item) => item.vgsRothia);
  state.mbi.mbiOrganisms = allKnownEligible && records.every((item) => !item.vgsRothia);

  const mbiInput = document.querySelector('[data-state="mbiOrganisms"]');
  const vgsInput = document.querySelector('[data-state="vgsRothia"]');
  if (mbiInput) mbiInput.checked = state.mbi.mbiOrganisms;
  if (vgsInput) vgsInput.checked = state.mbi.vgsRothia;
}

function deriveOrganismCategory(names) {
  if (!names.length) return "unresolved";
  const records = names.map((name) => organismRecords[name]);
  if (records.some((item) => !item || item.classification === "unresolved")) return "unresolved";
  const categories = new Set(records.map((item) => item.classification));
  if (categories.size > 1) return "mixed";
  if (records.some((item) => item.specialRule)) return "special-rule";
  return categories.values().next().value;
}

function renderDerivedOrganismCategory() {
  const group = document.querySelector('[data-name="organismCategory"]');
  const status = document.getElementById("organismCategoryStatus");
  const activeValue = state.organismCategory === "recognized-pathogen"
    ? "recognized-pathogen"
    : ["common-commensal", "special-rule"].includes(state.organismCategory)
      ? "common-commensal"
      : "";
  group.querySelectorAll("button[data-value]").forEach((button) => {
    const selected = button.dataset.value === activeValue;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.getElementById("commensalQuestions").classList.toggle("hidden", !["common-commensal", "special-rule"].includes(state.organismCategory));
  const specialRules = state.organismNames
    .map((name) => organismRecords[name]?.specialRule)
    .filter(Boolean);
  const messages = {
    "recognized-pathogen": "Derived category: Recognized pathogen.",
    "common-commensal": "Derived category: Common commensal.",
    mixed: "Mixed organism categories selected. Resolve the recognized-pathogen and common-commensal results under the applicable NHSN criteria; the tool will not silently choose one.",
    "special-rule": `Derived category: Common commensal. Special NHSN handling: ${[...new Set(specialRules)].join(" ")}`,
    unresolved: state.organismNames.length
      ? "Organism classification is not established by the database. Manual NHSN review required."
      : "Select an organism to derive its category."
  };
  status.textContent = messages[state.organismCategory];
  status.className = `organism-category-status ${state.organismCategory}`;
}

function validateOrganismRecords() {
  const optionNames = Array.from(document.querySelectorAll("#organismName option"), (option) => option.value);
  const missing = optionNames.filter((name) => !organismRecords[name]);
  const invalid = Object.entries(organismRecords).filter(([, item]) => !item.id || !item.classification || !Array.isArray(item.suggestedPathways) || !item.guidance);
  if (missing.length || invalid.length) console.error("Organism data validation failed", { missing, invalid });
}

function bindOrganismSearch() {
  const search = document.getElementById("organismSearch");
  const select = document.getElementById("organismName");
  const status = document.getElementById("organismSearchStatus");
  const results = document.getElementById("organismSearchResults");

  if (!search || !select || !status || !results) {
    return;
  }

  let matches = [];
  let activeIndex = -1;

  const closeResults = () => {
    results.hidden = true;
    results.replaceChildren();
    search.setAttribute("aria-expanded", "false");
    search.removeAttribute("aria-activedescendant");
    activeIndex = -1;
  };

  const setActive = (index) => {
    const options = Array.from(results.querySelectorAll('[role="option"]'));
    if (!options.length) return;
    activeIndex = (index + options.length) % options.length;
    options.forEach((option, optionIndex) => {
      const active = optionIndex === activeIndex;
      option.classList.toggle("active", active);
      option.setAttribute("aria-selected", String(active));
    });
    options[activeIndex].scrollIntoView({ block: "nearest" });
    search.setAttribute("aria-activedescendant", options[activeIndex].id);
  };

  const selectMatch = (organism) => {
    const name = organism.displayName;
    let option = Array.from(select.options).find((item) => item.value === name);
    if (!option) {
      let group = select.querySelector('optgroup[label="NHSN organism dataset"]');
      if (!group) {
        group = document.createElement("optgroup");
        group.label = "NHSN organism dataset";
        select.appendChild(group);
      }
      option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      group.appendChild(option);
      organismRecords[name] = makeCalculatorOrganismRecord(organism);
      buildOrganismChecklist();
    }
    option.selected = true;
    option.dataset.selectedViaSearch = "true";
    state.organismSnomedCodes[name] = String(organism.snomedCode);
    const checkbox = Array.from(document.querySelectorAll("#organismChecklist input"))
      .find((input) => input.value === name);
    if (checkbox) {
      checkbox.checked = true;
      checkbox.closest("label").dataset.selectedViaSearch = "true";
    }
    search.value = "";
    closeResults();
    syncOrganismSelection();
    search.dispatchEvent(new CustomEvent("organismselected", {
      bubbles: true,
      detail: organism
    }));
    status.textContent = `${name}, SNOMED ${organism.snomedCode}, selected.`;
    status.classList.remove("warning");
  };

  const renderResults = () => {
    const query = search.value.trim();
    if (!query || !organismDatabaseAvailable) {
      closeResults();
      return;
    }
    matches = searchOrganisms(query, organismDatabase, { limit: 15 });
    results.replaceChildren(...matches.map(({ organism }, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.id = `organism-result-${index}`;
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", "false");
      button.innerHTML = `<strong>${escapeHtml(organism.displayName)}</strong><span>NHSN ${escapeHtml(organism.nhsnCode)} · SNOMED ${escapeHtml(organism.snomedCode)}</span>`;
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => selectMatch(organism));
      return button;
    }));
    results.hidden = !matches.length;
    search.setAttribute("aria-expanded", String(matches.length > 0));
    activeIndex = -1;
    search.removeAttribute("aria-activedescendant");
    status.textContent = matches.length
      ? `${matches.length} organism suggestion${matches.length === 1 ? "" : "s"} available.`
      : "Organism not found in NHSN organism database.";
    status.classList.toggle("warning", !matches.length);
  };

  search.addEventListener("input", renderResults);
  search.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" && matches.length) {
      event.preventDefault();
      setActive(activeIndex + 1);
    } else if (event.key === "ArrowUp" && matches.length) {
      event.preventDefault();
      setActive(activeIndex < 0 ? matches.length - 1 : activeIndex - 1);
    } else if (event.key === "Enter" && matches.length) {
      event.preventDefault();
      selectMatch(matches[activeIndex < 0 ? 0 : activeIndex].organism);
    } else if (event.key === "Escape") {
      closeResults();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".organism-search")) closeResults();
  });
}

function bindCheckboxes() {
  document.querySelectorAll("[data-state]").forEach((input) => {
    input.addEventListener("change", () => {
      state.mbi[input.dataset.state] = input.checked;
      updateAll();
    });
  });

  document.querySelectorAll("[data-exclusion]").forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        state.exclusions.add(input.dataset.exclusion);
      } else {
        state.exclusions.delete(input.dataset.exclusion);
        state.exclusionSupport.delete(input.dataset.exclusion);
      }

      updateAll();
    });
  });

  document
    .getElementById("copySummary")
    .addEventListener("click", copySummary);

  document
    .getElementById("clearReview")
    .addEventListener("click", () => {
      window.location.reload();
    });
}

function bindSectionResets() {
  document.querySelectorAll("[data-reset-section]").forEach((button) => {
    button.addEventListener("click", () => {
      resetSection(button.dataset.resetSection);
    });
  });
}

function resetSection(section) {
  const resets = {
    intro: resetIntroSection,
    blood: resetBloodSection,
    organism: resetOrganismSection,
    secondary: resetSecondarySection,
    lcbi: resetLcbiInputs,
    line: resetLineSection,
    mbi: resetMbiSection,
    result: resetEntireReview
  };

  const reset = resets[section];
  if (reset) {
    reset();
  }
}

function resetIntroSection() {
  state.admitDate = "";
  document.getElementById("admitDate").value = "";
  state.cultureOrganismDate = "";
  document.getElementById("cultureOrganismDate").value = "";
  renderSurveillanceWindow();
}

function resetBloodSection() {
  state.patientAge = "adult";
  state.organismNames = [];
  state.selectedOrganisms = [];
  state.organismSnomedCodes = {};
  document.getElementById("selectedOrganismSnomedCodes").value = "";
  state.symptoms.clear();
  document.getElementById("organismName").selectedIndex = -1;
  Array.from(document.getElementById("organismName").options).forEach((option) => {
    delete option.dataset.selectedViaSearch;
  });
  document.querySelectorAll("#organismChecklist input").forEach((input) => {
    input.checked = false;
    input.closest("label").dataset.selectedViaSearch = "false";
    input.closest("label").classList.remove("organism-search-selection-highlight");
  });
  document.getElementById("organismSearch").value = "";
  document.getElementById("organismSearchStatus").textContent = "";
  document.querySelectorAll(".organism-checklist-option, .organism-checklist-group").forEach((item) => {
    item.hidden = false;
  });
  syncOrganismSelection();
  setChoiceValue("patientAge", "adult");
  renderSymptoms();
  updateAll();
}

function resetOrganismSection() {
  state.organismCategory = deriveOrganismCategory(state.organismNames);
  state.commensalMatch = "";
  state.separateOccasions = "";
  state.symptoms.clear();
  renderDerivedOrganismCategory();
  setChoiceValue("commensalMatch", "");
  setChoiceValue("separateOccasions", "");
  renderSymptoms();
  updateAll();
}

function resetSecondarySection() {
  state.selectedMajorCategory = "";
  state.selectedSite = "";
  state.siteEvidence = {};
  state.reviewFamily = "chapter17";
  state.pneu = createPneuState();
  state.openMenCriterion = "";
  state.openBjCriteria = undefined;
  state.organismRelationship = "";
  state.attributionTiming = "";
  setChoiceValue("organismRelationship", "");
  setChoiceValue("attributionTiming", "");
  renderSiteGuide();
  renderPneuReview();
  updateAll();
}

function resetLcbiInputs() {
  resetBloodSection();
  resetOrganismSection();
}

function resetLineSection() {
  ["centralDefinition", "centralAccessed", "centralDay3", "lineOnDoe"].forEach((name) => {
    state[name] = "";
    setChoiceValue(name, "");
  });
  updateAll();
}

function resetMbiSection() {
  Object.keys(state.mbi).forEach((key) => {
    state.mbi[key] = false;
  });
  state.exclusions.clear();
  state.exclusionSupport.clear();
  document.querySelectorAll("[data-state], [data-exclusion]").forEach((input) => {
    input.checked = false;
  });
  updateAll();
}

function resetEntireReview() {
  window.location.reload();
}

function setChoiceValue(name, value) {
  document.querySelectorAll(`[data-name="${name}"] button[data-value]`).forEach((button) => {
    const isSelected = button.dataset.value === value;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function renderSymptoms() {
  const container = document.getElementById("symptomChoices");

  container.innerHTML = "";

  const choices =
    state.patientAge === "infant"
      ? [
          ["fever", "Fever above 38°C"],
          ["hypothermia", "Hypothermia below 36°C"],
          ["apnea", "Apnea"],
          ["bradycardia", "Bradycardia"]
        ]
      : [
          [
            "fever",
            "Fever above 38°C",
            "Confirm the finding occurred within the applicable BSI infection window period."
          ],
          [
            "chills",
            "Chills",
            'If the medical record documents "chills," "rigors," or similar terminology, the criterion is met.'
          ],
          [
            "hypotension",
            "Hypotension",
            'SBP <90 mmHg or MAP <65 mmHg, or provider documentation such as "patient is hypotensive" also satisfies the criterion.'
          ]
        ];

  choices.forEach(([value, label, definition]) => {
    const row = document.createElement("label");

    row.innerHTML = `
      <input type="checkbox" value="${value}">
      <span>${label}</span>
      <span
        class="inline-info"
        tabindex="0"
      >
        i
      </span>
    `;

    row.querySelector(".inline-info").dataset.tooltip =
      definition ||
      "Confirm the finding occurred within the applicable BSI infection window period.";

    row
      .querySelector("input")
      .addEventListener("change", (event) => {
        if (event.target.checked) {
          state.symptoms.add(value);
        } else {
          state.symptoms.delete(value);
        }

        updateAll();
      });

    container.appendChild(row);
  });

  setupTooltips();
}

function buildSiteButtons() {
 const container = document.getElementById("siteButtons");
 container.innerHTML = secondarySiteCategories.map(category => `<button type="button" data-category="${category.majorCategoryCode}" aria-pressed="false">${escapeHtml(category.majorCategoryCode)} / ${escapeHtml(category.majorCategoryName)}</button>`).join("");
 container.querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => { state.selectedMajorCategory = button.dataset.category; state.selectedSite = ""; state.siteEvidence = {}; state.organismRelationship = ""; state.attributionTiming = ""; setChoiceValue("organismRelationship", ""); setChoiceValue("attributionTiming", ""); container.querySelectorAll("button").forEach(item => { item.classList.toggle("selected", item === button); item.setAttribute("aria-pressed", String(item === button)); }); updateAll(); }));
}

function bindPneuNavigation() {
  document.querySelectorAll("[data-review-family]").forEach(button => button.addEventListener("click", () => {
    state.reviewFamily = button.dataset.reviewFamily;
    updateAll();
  }));
  document.querySelectorAll("[data-pneu-subtype]").forEach(button => button.addEventListener("click", () => {
    if (!PNEU_UI_REGISTRY[button.dataset.pneuSubtype]?.implemented) return;
    state.pneu.selectedSubtype = button.dataset.pneuSubtype;
    updateAll();
  }));
}

function renderPneuReview() {
  const isPneu = state.reviewFamily === "pneu";
  document.getElementById("chapter17Pathways").hidden = isPneu;
  document.getElementById("siteGuidance").hidden = isPneu;
  document.getElementById("chapter17AttributionPanel").hidden = isPneu;
  document.getElementById("pneuReview").hidden = !isPneu;
  document.querySelectorAll("[data-review-family]").forEach(button => {
    const selected = button.dataset.reviewFamily === state.reviewFamily;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.querySelectorAll("[data-pneu-subtype]").forEach(button => {
    const selected = PNEU_UI_REGISTRY[button.dataset.pneuSubtype]?.implemented && button.dataset.pneuSubtype === state.pneu.selectedSubtype;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  if (!isPneu) return;

  const container = document.getElementById("pneuProtocolReview");
  const subtype = state.pneu.selectedSubtype;
  const entry = PNEU_UI_REGISTRY[subtype];
  if (!entry) {
    container.innerHTML = '<div class="secondary-guidance"><strong>Select PNU1 or PNU2 to begin a PNEU review.</strong></div>';
    return;
  }
  if (!entry.implemented) {
    container.innerHTML = '<div class="secondary-guidance warning" role="status"><strong>PNU3 — Not yet implemented</strong><p>This subtype has not been integrated or validated for use in this review.</p></div>';
    return;
  }

  container.innerHTML = renderPneuAbstraction(state.pneu, subtype);
  container.querySelector(".pneu-form").addEventListener("change", event => {
    const input = state.pneu.inputs[subtype]; const target = event.target;
    if (target.dataset.clinicalFinding) toggleClinicalFinding(input, target.dataset.clinicalFinding, target.checked);
    else if (target.dataset.imageFinding) toggleImageFinding(input, Number(target.dataset.index), target.dataset.imageFinding, target.checked);
    else if (target.dataset.imageSelect !== undefined) toggleImageFinding(input, Number(target.dataset.index), target.value, Boolean(target.value));
    else if (target.dataset.labAlternative) selectLabAlternative(state.pneu, input, target.dataset.algorithm, target.dataset.labAlternative);
    else if (target.dataset.labOrganism !== undefined) setLabOrganism(input, Number(target.dataset.index), target.value);
    else if (target.dataset.uiOnly !== undefined || target.dataset.measurementConfirm !== undefined) return;
    else applyPneuControl(input, target);
    renderPneuReview();
  });
  container.querySelector(".pneu-form").addEventListener("click", event => {
    const button = event.target.closest("button"); if (!button) return; const input = state.pneu.inputs[subtype];
    if (button.dataset.pneuAdd) addPneuRecord(input, button.dataset.pneuAdd);
    else if (button.dataset.pneuRemove) removePneuRecord(input, button.dataset.pneuRemove, Number(button.dataset.index));
    else if (button.dataset.addLabAlternative) addLabAlternative(input, button.dataset.addLabAlternative);
    else if (button.dataset.addHistopathology !== undefined) input.histopathologyResults.push({ id: `histopathology-${Date.now()}`, date: "", finding: "abscess-or-consolidation-with-intense-pmn" });
    else if (button.dataset.pneuReset !== undefined) state.pneu.inputs[subtype] = createPneuState().inputs[subtype];
    else return;
    renderPneuReview();
  });
}

function renderOrganismSuggestions() {
  const box = document.getElementById("organismSuggestions");
  const organisms = state.organismNames;
  const records = organisms.map((name) => organismRecords[name]).filter(Boolean);
  const suggestedSiteKeys = new Set(records.flatMap((entry) => entry.priorityPathways).map(key => suggestionCategoryMap[key]).filter(Boolean));

  renderSuggestedSiteButtons(suggestedSiteKeys);

  if (!organisms.length) {
    box.textContent =
      "Enter a culture organism above to see suggested body systems to review.";

    return;
  }

  if (!suggestedSiteKeys.size) {
    box.innerHTML = `
      <strong>Source review:</strong>
      No targeted suggestion is available for the selected organism(s).
      Review the chart for any NHSN-defined site-specific infection.
    `;

    return;
  }

  const labels = Array.from(suggestedSiteKeys).map(
    (key) => siteLibrary[key].label
  );

  const notes = [...new Set(records.map((entry) => entry.guidance))];

  box.innerHTML = `
    <strong>
      Suggested chart-review starting points for selected organism(s):
    </strong>

    <ul>
      ${labels
        .map((label) => `<li>${escapeHtml(label)}</li>`)
        .join("")}
    </ul>

    <p class="suggestion-rationale">
      ${notes.map((note) => escapeHtml(note)).join(" ")}
    </p>

  `;
}

function renderSuggestedSiteButtons(suggestedSiteKeys) {
  const buttons = document.querySelectorAll("#siteButtons button");
  const count = document.getElementById("pathwayCount");
  const help = document.getElementById("sourceReviewHelp");
  const hasSelection = state.organismNames.length > 0;
  const hasSuggestions = suggestedSiteKeys.size > 0;

  buttons.forEach((button) => {
    const isSuggested = hasSuggestions && suggestedSiteKeys.has(button.dataset.category);
    button.classList.toggle("suggested", isSuggested);
    button.classList.toggle("not-suggested", hasSuggestions && !isSuggested);
    button.setAttribute("data-suggested", String(isSuggested));
  });

  if (!hasSelection) {
    count.textContent = "All pathways";
    help.textContent = "Select an organism to highlight the body-system pathways worth checking first.";
  } else if (hasSuggestions) {
    count.textContent = `${suggestedSiteKeys.size} suggested`;
    help.textContent = "Highlighted pathways are organism-informed starting points. You can still review any clinically plausible source.";
  } else {
    count.textContent = "No targeted pathway";
    help.textContent = "No organism-specific starting point is available; review every clinically plausible NHSN-defined site.";
  }
}

function renderSiteGuide() {
 const container = document.getElementById("siteGuidance"); const category = secondarySiteCategories.find(item => item.majorCategoryCode === state.selectedMajorCategory);
 if (!category) { container.innerHTML = ""; return; }
 const definition = secondarySiteDefinitions[state.selectedSite];
 const usesEvidenceReview = definition?.implementationStatus === "validated";
 const usesCriterionCenteredBjReview = definition?.majorCategoryCode === "BJ" && ["BONE", "DISC", "JNT", "PJI"].includes(definition.siteCode);
 const evaluation = usesEvidenceReview ? getSecondaryEvaluation() : null;
 if (usesEvidenceReview) console.info(COMPACT_MEN_RENDERER_VERSION);
 const review = usesEvidenceReview ? renderCompactMenEvidence({ definition, evaluation, patientAge: state.patientAge, evidence: state.siteEvidence, openCriterion: state.openMenCriterion, openCriteria: usesCriterionCenteredBjReview ? state.openBjCriteria : undefined }) : definition ? `<div class="secondary-guidance warning" role="status"><strong>${escapeHtml(placeholderWarning)}</strong><div class="citation-display"><span>NHSN site code: ${definition.siteCode}</span><span>Site: ${escapeHtml(definition.siteName)}</span><span>Source: ${escapeHtml(definition.source.document)}</span><span>Printed page: ${definition.source.printedPage}</span><span>PDF page: ${definition.source.pdfPage}</span></div></div><div class="evidence-group"><h4>Evidence review</h4><p>No clinical criteria are available until this site definition is validated.</p></div>` : "";
 container.innerHTML = `<div class="site-guide"><h3>${escapeHtml(category.majorCategoryCode)} / ${escapeHtml(category.majorCategoryName)}</h3><p class="guide-intro">This grouped category is navigation only and cannot qualify as a site definition.</p><div class="site-button-grid">${category.siteCodes.map(code => { const site = secondarySiteDefinitions[code]; return `<button type="button" data-site-code="${code}" class="${code === state.selectedSite ? "selected" : ""}" aria-pressed="${code === state.selectedSite}"><strong>${code}</strong><span>${escapeHtml(site.siteName)}</span></button>`; }).join("")}</div>${review}</div>`;
 container.querySelectorAll("[data-site-code]").forEach(button => button.addEventListener("click", () => { if (state.selectedSite !== button.dataset.siteCode) { state.siteEvidence = {}; state.openMenCriterion = ""; state.openBjCriteria = undefined; } state.selectedSite = button.dataset.siteCode; state.organismRelationship = ""; state.attributionTiming = ""; setChoiceValue("organismRelationship", ""); setChoiceValue("attributionTiming", ""); updateAll(); }));
 container.querySelectorAll("input[data-evidence-id]").forEach(input => input.addEventListener("change", () => { state.siteEvidence[input.dataset.evidenceId] = checkboxEvidenceValue(input.checked); updateAll(); }));
 container.querySelectorAll("[data-men-note-button]").forEach(button => button.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); const note = document.getElementById(button.dataset.menNoteButton); const expanded = button.getAttribute("aria-expanded") === "true"; button.setAttribute("aria-expanded", String(!expanded)); note.hidden = expanded; }));
 container.querySelectorAll("details[data-men-criterion]").forEach(details => details.addEventListener("toggle", () => { if (usesCriterionCenteredBjReview) { const open = new Set(state.openBjCriteria || [...container.querySelectorAll("details[data-men-criterion][open]")].map((item) => item.dataset.menCriterion)); details.open ? open.add(details.dataset.menCriterion) : open.delete(details.dataset.menCriterion); state.openBjCriteria = [...open]; } else if (details.open) state.openMenCriterion = details.dataset.menCriterion; else if (state.openMenCriterion === details.dataset.menCriterion) state.openMenCriterion = ""; }));
}
function determineLcbi() {
  if (state.organismCategory === "recognized-pathogen") {
    return {
      met: true,
      criterion: "LCBI 1",
      label: "LCBI 1 screen met",
      reason:
        "A recognized pathogen was selected. Secondary attribution must still be excluded."
    };
  }

  if (["common-commensal", "special-rule"].includes(state.organismCategory)) {
    if (state.commensalMatch !== "yes") {
      return {
        met: false,
        criterion: "",
        label: "LCBI not met",
        reason:
          "The same common commensal has not been confirmed in at least two culture specimens."
      };
    }

    if (state.separateOccasions !== "yes") {
      return {
        met: false,
        criterion: "",
        label: "LCBI not met",
        reason:
          "The common-commensal culture specimens have not been confirmed as collected on separate occasions."
      };
    }

    if (!state.patientAge) {
      return {
        met: false,
        criterion: "",
        label: "LCBI review incomplete",
        reason:
          "Select the patient age group to determine whether LCBI 2 or LCBI 3 applies."
      };
    }

    if (state.symptoms.size === 0) {
      return {
        met: false,
        criterion: "",
        label: "LCBI not met",
        reason:
          "At least one qualifying sign or symptom has not been selected."
      };
    }

    if (state.patientAge === "infant") {
      return {
        met: true,
        criterion: "LCBI 3",
        label: "LCBI 3 screen met",
        reason:
          "Matching common commensals, separate collection occasions, and at least one qualifying infant sign or symptom were selected."
      };
    }

    return {
      met: true,
      criterion: "LCBI 2",
      label: "LCBI 2 screen met",
      reason:
        "Matching common commensals, separate collection occasions, and at least one qualifying sign or symptom were selected."
    };
  }

  return {
    met: false,
    criterion: "",
    label: "Incomplete LCBI review",
    reason:
      state.organismCategory === "mixed"
        ? "Mixed recognized-pathogen and common-commensal selections require separate NHSN criterion resolution."
        : state.organismCategory === "special-rule"
          ? "A selected organism has special NHSN handling that must be resolved before the preliminary LCBI screen can be completed."
          : "Select an organism to derive its NHSN organism category."
  };
}

function getSecondaryEvaluation() { return evaluateSecondarySite({ siteCode: state.selectedSite, evidence: state.siteEvidence, organismRelationship: state.organismRelationship, attributionTiming: state.attributionTiming, patientAge: state.patientAge }); }
function getSiteSpecificDefinitionStatus() { const evaluation = getSecondaryEvaluation(); if (evaluation.status === "siteNotSelected") return { status: "incomplete", met: false, label: "Site-specific definition incomplete", reason: state.selectedMajorCategory ? "Select a specific NHSN site code; the major category cannot qualify." : "Select a major category and then a specific NHSN site code." }; if (evaluation.status === "siteNotValidated") return { status: "incomplete", met: false, label: "Source validation required", reason: placeholderWarning }; if (evaluation.siteDefinitionMet) return { status: "met", met: true, label: `${state.selectedSite} site definition met`, reason: `${evaluation.metCriterion} is completely satisfied.` }; return { status: "incomplete", met: false, label: evaluation.status === "exclusionApplies" ? "Cannot qualify because an exclusion applies" : evaluation.status === "notStarted" ? "Not started" : "Incomplete", reason: evaluation.status === "exclusionApplies" ? "A documented other recognized cause prevents an asterisked finding from qualifying." : ["BONE", "DISC", "PJI", "SA", "USI"].includes(state.selectedSite) ? `Complete one ${state.selectedSite} criterion branch without combining NHSN branches.` : "Complete one MEN criterion branch without combining incompatible finding groups." }; }
function determineSecondaryStatus() { const evaluation = getSecondaryEvaluation(); return { met: evaluation.secondaryAttributionMet, status: evaluation.secondaryAttributionMet ? "met" : evaluation.siteDefinitionMet && evaluation.attributionMissing?.some(item => item.includes("not met")) ? "notMet" : "incomplete", architectureStatus: evaluation.status, label: evaluation.secondaryAttributionMet ? "Secondary BSI attribution met" : "Secondary BSI review incomplete", reason: evaluation.secondaryAttributionMet ? `${state.selectedSite} and both authorized attribution requirements are met.` : evaluation.siteDefinitionMet ? evaluation.attributionMissing.join("; ") : getSiteSpecificDefinitionStatus().reason }; }

function determineCentralLineStatus() {
  const values = [
    state.centralDefinition,
    state.centralAccessed,
    state.centralDay3,
    state.lineOnDoe
  ];

  const allYes = values.every((value) => value === "yes");
  const anyNo = values.some((value) => value === "no");
  const incomplete = values.some((value) => !value);

  if (allYes) {
    return {
      eligible: true,
      status: "complete",
      label: "Central-line association established",
      reason:
        "The selected device meets the central-line definition, was placed or accessed during the admission, was eligible by day count, and was present on the date of event or previous day."
    };
  }

  if (incomplete) {
    return {
      eligible: false,
      status: "incomplete",
      label: "Central-line review incomplete",
      reason:
        "Complete all central-line association questions."
    };
  }

  if (anyNo) {
    return {
      eligible: false,
      status: "notMet",
      label: "Central-line association not established",
      reason:
        "At least one required central-line association element was answered No."
    };
  }

  return {
    eligible: false,
    status: "incomplete",
    label: "Central-line review incomplete",
    reason:
      "Complete the central-line review."
  };
}

function determineMbiStatus(lcbiResult) {
  if (!lcbiResult.met) {
    return {
      met: false,
      status: "incomplete",
      label: "MBI-LCBI review incomplete",
      reason:
        "A qualifying LCBI screen has not been met."
    };
  }

  const neutropeniaPathway =
    state.mbi.neutropenia === true;

  const transplantPathway =
    state.mbi.transplant === true &&
    (
      state.mbi.gvhd === true ||
      state.mbi.diarrhea === true
    );

  const hostPathwayMet =
    neutropeniaPathway || transplantPathway;

  if (!hostPathwayMet) {
    const partialTransplant = state.mbi.transplant || state.mbi.gvhd || state.mbi.diarrhea;
    return {
      met: false,
      status: partialTransplant ? "incomplete" : "not-met",
      label: partialTransplant ? "MBI-LCBI review incomplete" : "MBI-LCBI criteria not met",
      reason:
        partialTransplant ? "The HSCT pathway requires allogeneic HSCT within 365 days plus Grade III/IV GI GVHD or qualifying diarrhea." : "Neither qualifying neutropenia nor a complete allogeneic-HSCT gastrointestinal host pathway is documented."
    };
  }

  if (
    lcbiResult.criterion === "LCBI 1" &&
    state.mbi.mbiOrganisms === true
  ) {
    return {
      met: true,
      status: "met",
      label: "MBI-LCBI criteria met",
      reason:
        "An LCBI 1 screen, qualifying host pathway, and eligible MBI organism pattern were selected."
    };
  }

  if (
    lcbiResult.criterion === "LCBI 2" &&
    state.mbi.vgsRothia === true
  ) {
    return {
      met: true,
      status: "met",
      label: "MBI-LCBI criteria met",
      reason:
        "An LCBI 2 screen, qualifying host pathway, and VGS and/or Rothia-only pathway were selected."
    };
  }

  if (
    lcbiResult.criterion === "LCBI 3" &&
    state.mbi.vgsRothia === true
  ) {
    return {
      met: true,
      status: "met",
      label: "MBI-LCBI criteria met",
      reason:
        "An LCBI 3 screen, qualifying host pathway, and VGS and/or Rothia-only pathway were selected."
    };
  }

  return {
    met: false,
    status: "incomplete",
    label: "MBI-LCBI review incomplete",
    reason:
      `The ${lcbiResult.criterion} pathway still requires ${lcbiResult.criterion === "LCBI 1" ? "an MBI-eligible-only organism pattern" : "a VGS and/or Rothia-only organism pattern"}.`
  };
}

function determineExclusionStatus() {
  if (!state.exclusions.size) return { status: "not-met", applicableExclusion: null, label: "No CLABSI exclusion applies", reason: "No exclusion pathway is selected." };
  const complete = Array.from(state.exclusions).find((id) => state.exclusionSupport.has(id));
  if (complete) return { status: "met", applicableExclusion: complete, label: "CLABSI exclusion criteria met", reason: `${complete} exclusion applies.` };
  const selected = Array.from(state.exclusions)[0];
  return { status: "incomplete", applicableExclusion: null, label: "CLABSI exclusion review incomplete", reason: `${selected}: ${exclusionRequirements[selected]}` };
}

function renderCalculatedStatuses() {
  const site = getSiteSpecificDefinitionStatus();
  const mbi = determineMbiStatus(determineLcbi());
  const exclusion = determineExclusionStatus();
  setResult(document.getElementById("siteDefinitionStatus"), site.met ? "success" : "neutral", `${site.label}. ${site.reason}`);
  const attributionUnlocked = !["BONE", "DISC", "ENDO", "MED", "MEN", "SA"].includes(state.selectedSite) || site.met;
  document.querySelectorAll('[data-name="organismRelationship"] button, [data-name="attributionTiming"] button').forEach(button => { button.disabled = !attributionUnlocked; });
  setResult(document.getElementById("mbiStatus"), mbi.met ? "success" : mbi.status === "incomplete" ? "neutral" : "warning", `${mbi.label}. ${mbi.reason}`);
  setResult(document.getElementById("exclusionStatus"), exclusion.status === "met" ? "warning" : "neutral", `${exclusion.label}. ${exclusion.reason}`);
}

function renderExclusionFollowups() {
  const container = document.getElementById("exclusionFollowups");
  if (!container) return;
  container.innerHTML = Array.from(state.exclusions).map((id) => `<label class="exclusion-followup"><input type="checkbox" data-exclusion-support="${escapeHtml(id)}" ${state.exclusionSupport.has(id) ? "checked" : ""}> ${escapeHtml(exclusionRequirements[id])}</label>`).join("");
  container.querySelectorAll("[data-exclusion-support]").forEach((input) => input.addEventListener("change", () => {
    if (input.checked) state.exclusionSupport.add(input.dataset.exclusionSupport);
    else state.exclusionSupport.delete(input.dataset.exclusionSupport);
    updateAll();
  }));
}

function getSiteEvidenceSummary() { const site = secondarySiteDefinitions[state.selectedSite]; return site ? { selected: true, label: `${site.siteCode} — ${site.siteName}`, checkedCount: 0, totalCount: 0 } : { selected: false, label: "No suspected source selected", checkedCount: 0, totalCount: 0 }; }

function renderSecondaryConclusion() {
  const result =
    determineSecondaryStatus();

  const box =
    document.getElementById("secondaryConclusion");

  if (!box) {
    return;
  }

  if (result.met) {
    setResult(
      box,
      "success",
      `${result.label}. ${result.reason} Do not classify this event as a primary LCBI or CLABSI.`
    );

    return;
  }

  if (result.status === "unresolved") {
    setResult(
      box,
      "warning",
      `${result.label}. ${result.reason} Continue the site-specific review before assigning a final classification.`
    );

    return;
  }

  if (result.status === "incomplete") {
    setResult(
      box,
      "neutral",
      `${result.label}. ${result.reason}`
    );

    return;
  }

  setResult(
    box,
    "neutral",
    `${result.label}. ${result.reason}`
  );
}

function renderLcbiResult() {
  const result = determineLcbi();
  const box = document.getElementById("lcbiResult");

  if (!box) {
    return;
  }

  if (result.met) {
    setResult(
      box,
      "success",
      `${result.label}: ${result.reason}`
    );

    return;
  }

  if (
    result.label === "Incomplete LCBI review" ||
    result.label === "LCBI review incomplete"
  ) {
    setResult(
      box,
      "neutral",
      `${result.label}: ${result.reason}`
    );

    return;
  }

  setResult(
    box,
    "warning",
    `${result.label}: ${result.reason}`
  );
}

function buildFinalDetermination() {
  const lcbi = determineLcbi();
  const secondary = determineSecondaryStatus();
  const centralLine = determineCentralLineStatus();
  const mbi = determineMbiStatus(lcbi);
  const exclusion = determineExclusionStatus();
  const siteEvidence = getSiteEvidenceSummary();

  const details = [];

  const hasLcbiSelection = Boolean(
    state.organismNames.length ||
    state.commensalMatch ||
    state.separateOccasions ||
    state.symptoms.size
  );

  if (hasLcbiSelection) {
    details.push({
      label: "LCBI review",
      text: `${lcbi.label}. ${lcbi.reason}`
    });
  }

  if (siteEvidence.selected) {
    details.push({
      label: "Selected suspected source",
      text:
        `${siteEvidence.label}; ` +
        `${siteEvidence.checkedCount} of ` +
        `${siteEvidence.totalCount} directional evidence prompts checked.`
    });
  }

  if (siteEvidence.selected || state.organismRelationship || state.attributionTiming) {
    details.push({
      label: "Secondary BSI review",
      text:
        `${secondary.label}. ${secondary.reason}`
    });
  }

  if (state.centralDefinition || state.centralAccessed || state.centralDay3 || state.lineOnDoe) {
    details.push({
      label: "Central-line review",
      text:
        `${centralLine.label}. ${centralLine.reason}`
    });
  }

  if (Object.values(state.mbi).some(Boolean)) {
    details.push({
      label: "MBI-LCBI review",
      text:
        `${mbi.label}. ${mbi.reason}`
    });
  }

  if (state.exclusions.size > 0) {
    details.push({
      label: "Selected exclusion fields",
      text:
        `${exclusion.label}. ${exclusion.reason}`
    });
  }

  if (!lcbi.met) {
    return {
      status: "warning",
      title:
        "A preliminary LCBI criterion is not currently established.",
      details
    };
  }

  if (secondary.met) {
    return {
      status: "success",
      title:
        "Preliminary secondary BSI — do not classify as a primary LCBI or CLABSI.",
      details
    };
  }

  if (
    secondary.status === "unresolved" ||
    secondary.status === "incomplete"
  ) {
    return {
      status: "warning",
      title:
        "Hold classification: the secondary BSI review is incomplete or unresolved.",
      details
    };
  }

  if (!centralLine.eligible) {
    if (
      centralLine.status === "unresolved" ||
      centralLine.status === "incomplete"
    ) {
      return {
        status: "warning",
        title:
          `${lcbi.criterion} is preliminarily met, but central-line association remains incomplete or unresolved.`,
        details
      };
    }

    return {
      status: "warning",
      title:
        `${lcbi.criterion} is preliminarily met, but central-line association is not established.`,
      details
    };
  }

  if (exclusion.status === "met") {
    return {
      status: "warning",
      title: `Not reportable as CLABSI: ${exclusion.reason}`,
      details
    };
  }

  if (exclusion.status === "incomplete") return { status: "warning", title: "Hold classification: selected CLABSI exclusion review is incomplete.", details };

  if (mbi.met) {
    return {
      status: "success",
      title:
        `${mbi.label} with central-line association.`,
      details
    };
  }

  return {
    status: "success",
    title:
      `Preliminary ${lcbi.criterion} CLABSI.`,
    details
  };
}

function renderFinalResult() {
  const result = buildFinalDetermination();

  const finalBox =
    document.getElementById("finalResult");

  const detailsBox =
    document.getElementById("resultDetails");

  if (!finalBox || !detailsBox) {
    return;
  }

  setResult(
    finalBox,
    result.status,
    result.title
  );

  detailsBox.innerHTML = result.details.length ? `
    <ul>
      ${result.details
        .map(
          (item) => `
            <li>
              <strong>${escapeHtml(item.label)}:</strong>
              ${escapeHtml(item.text)}
            </li>
          `
        )
        .join("")}
    </ul>
  ` : "";
}

function buildCalculatorModel() {
  const lcbi = determineLcbi();
  const secondary = determineSecondaryStatus();
  const central = determineCentralLineStatus();
  const siteDefinition = getSiteSpecificDefinitionStatus();
  const mbi = determineMbiStatus(lcbi);
  const exclusion = determineExclusionStatus();
  const hasSource = Boolean(state.selectedSite);
  const secondaryComplete = [
    getSecondaryEvaluation().reviewComplete,
    siteDefinition.status !== "incomplete",
    state.organismRelationship,
    state.attributionTiming
  ].every(Boolean);

  const steps = [
    [state.organismNames.length > 0, "Culture organism selected"],
    [hasSource, "Plausible secondary source reviewed"],
    [secondaryComplete, "Secondary attribution checks completed"],
    [lcbi.met, "LCBI criterion met"],
    [central.status !== "incomplete", "Central-line review completed"],
    [mbi.status !== "incomplete", "MBI-LCBI review resolved"],
    [exclusion.status !== "incomplete", "CLABSI exclusion review resolved"]
  ];

  let status = "neutral";
  let title = "Continue the review";
  let summary = "Complete the items below to calculate a preliminary classification.";
  const missing = [];

  if (!hasSource) missing.push("Select the most plausible site-specific infection pathway.");
  if (siteDefinition.status === "incomplete") missing.push(siteDefinition.reason);
  if (!state.organismRelationship) missing.push("Confirm the culture-to-site organism relationship.");
  if (!state.attributionTiming) missing.push("Confirm the required secondary attribution timing.");

  if (secondary.met) {
    status = "secondary";
    title = "Secondary BSI criteria met";
    summary = "All three required attribution elements are Yes. Do not classify this event as a primary LCBI or CLABSI.";
  } else if (secondaryComplete && secondary.status === "notMet") {
    if (!lcbi.met) {
      status = "warning";
      title = "Secondary BSI not met — LCBI incomplete";
      summary = "A secondary source is not established, but the selected culture information does not yet meet an LCBI criterion.";
      missing.push(lcbi.reason);
    } else if (central.eligible && exclusion.status === "not-met") {
      status = "clabsi";
      title = mbi.met ? `${mbi.label} — not a reportable CLABSI` : `Preliminary ${lcbi.criterion} CLABSI`;
      summary = mbi.met ? mbi.reason : "LCBI and central-line association are met, secondary BSI is not established, and no CLABSI exclusion applies.";
    } else if (central.status === "incomplete") {
      status = "warning";
      title = `${lcbi.criterion} met — CLABSI pending`;
      summary = "Secondary BSI is not established. Complete the central-line questions to determine CLABSI association.";
      [
        [state.centralDefinition, "Confirm the device meets the NHSN central-line definition."],
        [state.centralAccessed, "Confirm placement or access during this admission."],
        [state.centralDay3, "Confirm the event is on or after central-line day 3."],
        [state.lineOnDoe, "Confirm an eligible line was present on the DOE or day before."]
      ].forEach(([answer, text]) => { if (!answer) missing.push(text); });
    } else {
      status = "warning";
      title = `${lcbi.criterion} met — not a reportable CLABSI`;
      summary = exclusion.status === "met"
        ? `Not reportable as CLABSI: ${exclusion.reason}`
        : "One or more required central-line association elements is No.";
    }
  }

  if (!secondary.met && lcbi.met && central.eligible && exclusion.status === "met") {
    status = "warning";
    title = `Not reportable as CLABSI: ${exclusion.reason}`;
    summary = "An eligible LCBI is present, but the completed exclusion prevents CLABSI classification.";
  } else if (!secondary.met && lcbi.met && central.eligible && exclusion.status === "incomplete") {
    status = "warning";
    title = "CLABSI classification on hold — exclusion review incomplete";
    summary = exclusion.reason;
    missing.push(exclusion.reason);
  }

  if (mbi.status === "incomplete") missing.push(mbi.reason);

  return { steps, status, title, summary, missing: [...new Set(missing)] };
}

function renderCalculator() {
  const progress = document.getElementById("calculatorProgress");
  const outcome = document.getElementById("calculatorOutcome");
  const nextSteps = document.getElementById("calculatorNextSteps");
  if (!progress || !outcome || !nextSteps) return;

  const model = buildCalculatorModel();
  const completed = model.steps.filter(([done]) => done).length;
  progress.innerHTML = `
    <strong>${completed} of ${model.steps.length} review items completed</strong>
    <ul>${model.steps.map(([done, label]) => `
      <li class="${done ? "done" : "pending"}"><span aria-hidden="true"></span>${escapeHtml(label)}</li>
    `).join("")}</ul>`;

  outcome.className = `calculator-outcome ${model.status}`;
  outcome.innerHTML = `<strong>${escapeHtml(model.title)}</strong><p>${escapeHtml(model.summary)}</p>`;
  nextSteps.innerHTML = model.missing.length
    ? `<h3>What is still needed</h3><ul>${model.missing.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p class="calculator-complete">All required calculator inputs for this determination are complete.</p>`;
}

function updateAll() {
  renderSurveillanceWindow();
  renderMbiOrganismPrompt();
  renderOrganismSuggestions();
  renderSiteGuide();
  renderPneuReview();
  renderSecondaryConclusion();
  renderExclusionFollowups();
  renderCalculatedStatuses();
  renderLcbiResult();
  renderFinalResult();
  renderCalculator();
}

function renderMbiOrganismPrompt() {
  const records = state.organismNames.map((name) => organismRecords[name]).filter(Boolean);
  const prompts = [
    [document.getElementById("mbiOrganismsPrompt"), records.some((record) => record.mbiEligible && !record.vgsRothia)],
    [document.getElementById("vgsRothiaPrompt"), records.some((record) => record.vgsRothia)]
  ];

  prompts.forEach(([prompt, shouldHighlight]) => {
    if (!prompt) return;
    prompt.classList.toggle("mbi-review-needed", shouldHighlight);
  });
}

function renderSurveillanceWindow() {
  const cultureDateLabel = document.getElementById("surveillancecultureDate");
  const dateRangeLabel = document.getElementById("surveillanceDateRange");

  if (!cultureDateLabel || !dateRangeLabel) {
    return;
  }

  if (!state.cultureOrganismDate) {
    cultureDateLabel.textContent = "Not selected";
    dateRangeLabel.textContent = "Select a date to calculate";
    return;
  }

  const cultureDate = new Date(`${state.cultureOrganismDate}T00:00:00`);

  if (Number.isNaN(cultureDate.getTime())) {
    cultureDateLabel.textContent = "Invalid date";
    dateRangeLabel.textContent = "Enter a valid date to calculate";
    return;
  }

  const windowStart = new Date(cultureDate);
  const windowEnd = new Date(cultureDate);

  windowStart.setDate(windowStart.getDate() - 3);
  windowEnd.setDate(windowEnd.getDate() + 3);

  const formatDate = (date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);

  cultureDateLabel.textContent = formatDate(cultureDate);
  dateRangeLabel.textContent = `${formatDate(windowStart)} - ${formatDate(windowEnd)}`;
}

function setResult(element, status, text) {
  if (!element) {
    return;
  }

  const baseClass = element.classList.contains("final-result")
    ? "final-result"
    : "mini-result";

  element.className = `${baseClass} ${status}`;
  element.textContent = text;
}

function copySummary() {
  const result = buildFinalDetermination();

  const lines = [
    "NHSN CLABSI REVIEW SUMMARY",
    "==========================",
    "",
    result.title,
    ""
  ];

  result.details.forEach((item) => {
    lines.push(`${item.label}: ${item.text}`);
  });

  const summary = lines.join("\n");

  if (
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    navigator.clipboard
      .writeText(summary)
      .then(() => {
        showCopyConfirmation();
      })
      .catch(() => {
        fallbackCopyText(summary);
      });

    return;
  }

  fallbackCopyText(summary);
}

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";

  document.body.appendChild(textarea);

  textarea.focus();
  textarea.select();

  try {
    document.execCommand("copy");
    showCopyConfirmation();
  } catch (error) {
    window.prompt(
      "Copy the summary below:",
      text
    );
  }

  document.body.removeChild(textarea);
}

function showCopyConfirmation() {
  const button =
    document.getElementById("copySummary");

  if (!button) {
    return;
  }

  const originalText =
    button.dataset.originalText ||
    button.textContent;

  button.dataset.originalText = originalText;
  button.textContent = "Copied";

  window.setTimeout(() => {
    button.textContent = originalText;
  }, 1400);
}

function setupTooltips() {
  const tooltip =
    document.getElementById("tooltip");

  if (!tooltip) {
    return;
  }

  document
    .querySelectorAll("[data-tooltip]")
    .forEach((target) => {
      if (
        target.dataset.tooltipBound === "true"
      ) {
        return;
      }

      target.dataset.tooltipBound = "true";

      if (
        !target.hasAttribute("tabindex") &&
        !["BUTTON", "INPUT", "SELECT", "A"].includes(
          target.tagName
        )
      ) {
        target.setAttribute("tabindex", "0");
      }

      const showTooltip = () => {
        const text = target.dataset.tooltip;

        if (!text) {
          return;
        }

        tooltip.textContent = text;
        tooltip.hidden = false;

        positionTooltip(target, tooltip);
      };

      const hideTooltip = () => {
        tooltip.hidden = true;
        tooltip.textContent = "";
      };

      target.addEventListener(
        "mouseenter",
        showTooltip
      );

      target.addEventListener(
        "mouseleave",
        hideTooltip
      );

      target.addEventListener(
        "focus",
        showTooltip
      );

      target.addEventListener(
        "blur",
        hideTooltip
      );

      target.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key === "Escape"
          ) {
            hideTooltip();
            target.blur();
          }
        }
      );

      target.addEventListener(
        "click",
        (event) => {
          const isDefinitionControl =
            target.classList.contains(
              "definition"
            ) ||
            target.classList.contains(
              "button-help"
            ) ||
            target.classList.contains(
              "inline-info"
            );

          if (!isDefinitionControl) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          if (tooltip.hidden) {
            showTooltip();
          } else {
            hideTooltip();
          }
        }
      );
    });

  document.addEventListener(
    "click",
    (event) => {
      if (
        !event.target.closest(
          "[data-tooltip]"
        )
      ) {
        tooltip.hidden = true;
      }
    }
  );

  window.addEventListener(
    "scroll",
    () => {
      tooltip.hidden = true;
    },
    {
      passive: true
    }
  );

  window.addEventListener(
    "resize",
    () => {
      tooltip.hidden = true;
    }
  );
}

function positionTooltip(
  target,
  tooltip
) {
  const targetRect =
    target.getBoundingClientRect();

  const viewportPadding = 10;
  const spacing = 8;

  tooltip.style.left = "0px";
  tooltip.style.top = "0px";

  const tooltipRect =
    tooltip.getBoundingClientRect();

  let left =
    targetRect.left +
    targetRect.width / 2 -
    tooltipRect.width / 2;

  let top =
    targetRect.top -
    tooltipRect.height -
    spacing;

  if (
    left < viewportPadding
  ) {
    left = viewportPadding;
  }

  if (
    left +
      tooltipRect.width >
    window.innerWidth -
      viewportPadding
  ) {
    left =
      window.innerWidth -
      tooltipRect.width -
      viewportPadding;
  }

  if (
    top < viewportPadding
  ) {
    top =
      targetRect.bottom +
      spacing;
  }

  if (
    top +
      tooltipRect.height >
    window.innerHeight -
      viewportPadding
  ) {
    top =
      Math.max(
        viewportPadding,
        window.innerHeight -
          tooltipRect.height -
          viewportPadding
      );
  }

  tooltip.style.left =
    `${Math.round(left)}px`;

  tooltip.style.top =
    `${Math.round(top)}px`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

"use strict";

const state = {
  cultureOrganismDate: "",
  patientAge: "adult",
  culturePositive: "",
  organismNames: [],
  organismCategory: "",
  commensalMatch: "",
  separateOccasions: "",
  symptoms: new Set(),
  selectedSite: "",
  siteEvidence: {},
  siteDefinitionMet: "",
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
  exclusions: new Set()
};

const siteLibrary = {
  pneu: {
    label: "Pneumonia / respiratory",
    intro:
      "Use these prompts to direct review of the current NHSN PNEU chapter. A provider diagnosis alone is not enough.",
    groups: [
      {
        title: "Chest imaging",
        items: [
          [
            "serialImaging",
            "If underlying pulmonary or cardiac disease is present, look for the required serial chest-imaging results."
          ],
          [
            "newInfiltrate",
            "New and persistent or progressive and persistent infiltrate."
          ],
          ["consolidation", "Consolidation."],
          ["cavitation", "Cavitation."],
          ["pneumatoceles", "Pneumatoceles in an eligible infant."]
        ]
      },
      {
        title: "Systemic findings",
        items: [
          ["fever", "Fever above the applicable threshold."],
          ["wbc", "Leukopenia or leukocytosis meeting the criterion."],
          [
            "mentalStatus",
            "Eligible new altered mental status in an older adult."
          ]
        ]
      },
      {
        title: "Respiratory findings",
        items: [
          [
            "sputum",
            "New purulent sputum, change in sputum, increased secretions, or increased suctioning."
          ],
          ["cough", "New or worsening cough."],
          ["dyspnea", "Dyspnea or tachypnea."],
          ["breathSounds", "Rales or bronchial breath sounds."],
          [
            "gasExchange",
            "Worsening gas exchange, oxygenation, or ventilatory demand."
          ]
        ]
      },
      {
        title: "Microbiology or other criterion evidence",
        items: [
          [
            "respSpecimen",
            "Eligible lower-respiratory specimen result."
          ],
          [
            "pleuralFluid",
            "Eligible pleural-fluid organism."
          ],
          [
            "lungTissue",
            "Eligible lung-tissue or histopathologic evidence."
          ],
          [
            "cultureAllowed",
            "culture organism is permitted for the selected PNEU pathway."
          ],
          [
            "viralEvidence",
            "Eligible viral, fungal, or other required laboratory evidence."
          ]
        ]
      }
    ]
  },

  uti: {
    label: "Urinary tract",
    intro:
      "Review the current UTI chapter and determine whether SUTI or another eligible UTI definition is fully met.",
    groups: [
      {
        title: "Urinary signs and symptoms",
        items: [
          [
            "fever",
            "Fever meeting the applicable age and device pathway."
          ],
          ["suprapubic", "Suprapubic tenderness."],
          [
            "cva",
            "Costovertebral-angle pain or tenderness."
          ],
          ["urgency", "Urinary urgency."],
          ["frequency", "Urinary frequency."],
          ["dysuria", "Dysuria."]
        ]
      },
      {
        title: "Urine culture and attribution",
        items: [
          [
            "urineCulture",
            "Eligible urine culture with required organism count and number of species."
          ],
          [
            "catheterTiming",
            "Urinary-catheter presence and timing reviewed."
          ],
          [
            "cultureMatch",
            "At least one culture organism matches an eligible urine organism when required."
          ],
          [
            "cultureAsElement",
            "culture organism may be used as an allowed criterion element for the selected UTI pathway."
          ]
        ]
      }
    ]
  },

  ssi: {
    label: "Surgical site",
    intro:
      "Confirm an eligible NHSN procedure, surveillance period, tissue level, and complete SSI criterion.",
    groups: [
      {
        title: "Procedure and timing",
        items: [
          [
            "procedure",
            "Eligible NHSN operative procedure identified."
          ],
          [
            "surveillance",
            "Date of event falls within the applicable surveillance period."
          ],
          [
            "level",
            "Superficial, deep, or organ/space tissue level identified."
          ]
        ]
      },
      {
        title: "SSI evidence",
        items: [
          [
            "purulence",
            "Purulent drainage from the eligible tissue level."
          ],
          [
            "siteOrganism",
            "Organism identified from an eligible site specimen."
          ],
          [
            "opened",
            "Incision deliberately opened, re-accessed, aspirated, or spontaneously dehisced as allowed."
          ],
          [
            "imaging",
            "Abscess or other evidence on gross exam, imaging, histopathology, or operative assessment."
          ],
          [
            "diagnosis",
            "Eligible physician or designee diagnosis when permitted by the criterion."
          ],
          [
            "cultureMatch",
            "culture organism matches the SSI site organism or is an allowed criterion element."
          ]
        ]
      }
    ]
  },

  gi: {
    label: "Gastrointestinal / intra-abdominal",
    intro:
      "Review the specific Chapter 17 gastrointestinal or intra-abdominal definition suggested by the chart.",
    groups: [
      {
        title: "Clinical and anatomic evidence",
        items: [
          [
            "symptoms",
            "Applicable fever, nausea, vomiting, abdominal pain, or tenderness."
          ],
          [
            "imaging",
            "Imaging evidence of infection at the specific GI or intra-abdominal site."
          ],
          [
            "operative",
            "Operative, gross anatomic, or histopathologic evidence."
          ],
          [
            "siteSpecimen",
            "Eligible organism from a site-specific specimen."
          ]
        ]
      },
      {
        title: "culture relationship",
        items: [
          [
            "cultureMatch",
            "culture organism matches the eligible site organism."
          ],
          [
            "cultureElement",
            "culture organism can be used as an element of the selected site-specific criterion."
          ],
          [
            "necException",
            "NEC exception reviewed when applicable."
          ]
        ]
      }
    ]
  },

  skin: {
    label: "Skin / soft tissue",
    intro:
      "Review the exact Chapter 17 skin, soft-tissue, wound, burn, or decubitus definition that fits the chart.",
    groups: [
      {
        title: "Evidence to look for",
        items: [
          ["purulence", "Purulent drainage or material."],
          [
            "localFindings",
            "Localized pain, tenderness, swelling, erythema, heat, or other required findings."
          ],
          [
            "siteCulture",
            "Eligible organism from tissue, drainage, aspirate, or other site specimen."
          ],
          [
            "imaging",
            "Imaging, operative, gross anatomic, or histopathologic evidence."
          ],
          [
            "cultureMatch",
            "culture organism matches the qualifying site organism or is allowed by the selected criterion."
          ]
        ]
      }
    ]
  },

  boneJoint: {
    label: "Bone / joint",
    intro:
      "Review the exact bone, joint, disc-space, or related Chapter 17 definition.",
    groups: [
      {
        title: "Evidence to look for",
        items: [
          [
            "pain",
            "Localized pain or tenderness and other required clinical findings."
          ],
          [
            "imaging",
            "MRI, CT, radiograph, nuclear study, or other qualifying imaging."
          ],
          [
            "operative",
            "Operative or gross anatomic evidence."
          ],
          ["histology", "Histopathologic evidence."],
          [
            "siteCulture",
            "Eligible bone, joint, disc, or other site specimen."
          ],
          [
            "cultureMatch",
            "culture organism relationship is permitted for the selected criterion."
          ]
        ]
      }
    ]
  },

  cardiovascular: {
    label: "Cardiovascular / endovascular",
    intro:
      "Review the specific Chapter 17 cardiovascular definition, such as endocarditis, arterial or venous infection, or another endovascular site.",
    groups: [
      {
        title: "Evidence to look for",
        items: [
          [
            "echo",
            "Echocardiogram or other imaging evidence, including vegetation when applicable."
          ],
          [
            "clinical",
            "Applicable fever, embolic, vascular, immunologic, or cardiac findings."
          ],
          [
            "culturePattern",
            "Required culture-culture pattern and eligible organisms."
          ],
          [
            "device",
            "Eligible cardiovascular device, graft, or operative site reviewed."
          ],
          [
            "siteSpecimen",
            "Organism or histopathology from valve, vessel, graft, or other site specimen."
          ]
        ]
      }
    ]
  },

  cns: {
    label: "Central nervous system",
    intro:
      "Review the exact meningitis, ventriculitis, spinal abscess, intracranial infection, or other CNS definition.",
    groups: [
      {
        title: "Evidence to look for",
        items: [
          [
            "symptoms",
            "Applicable headache, meningeal signs, cranial-nerve findings, altered consciousness, or other required symptoms."
          ],
          [
            "csf",
            "Eligible CSF findings and microbiology."
          ],
          ["imaging", "Qualifying neuroimaging."],
          [
            "operative",
            "Operative, gross anatomic, or histopathologic evidence."
          ],
          [
            "cultureRelationship",
            "culture organism is permitted by the selected CNS definition."
          ]
        ]
      }
    ]
  },

  other: {
    label: "Other NHSN site",
    intro:
      "Identify the exact NHSN Chapter 17 definition before deciding that the culturestream infection is primary.",
    groups: [
      {
        title: "Required review",
        items: [
          [
            "definition",
            "Exact NHSN site-specific definition identified."
          ],
          [
            "elements",
            "Every required sign, symptom, imaging, laboratory, operative, or pathology element verified."
          ],
          [
            "siteSpecimen",
            "Eligible site-specific specimen and organism relationship reviewed."
          ],
          [
            "timing",
            "Infection window, date of event, RIT, and SBAP reviewed."
          ]
        ]
      }
    ]
  }
};

const organismHints = [
  {
    terms: ["enterococcus"],
    sites: ["uti", "gi", "skin", "cardiovascular"],
    note: "Urinary, intra-abdominal, skin/soft-tissue, and endovascular sources are reasonable starting points."
  },
  {
    terms: ["escherichia coli", "e. coli", "ecoli"],
    sites: ["uti", "gi"],
    note: "Start with urinary and gastrointestinal / intra-abdominal source definitions."
  },
  {
    terms: ["klebsiella"],
    sites: ["uti", "pneu", "gi"],
    note: "Start with urinary, respiratory, and gastrointestinal / intra-abdominal definitions."
  },
  {
    terms: ["staphylococcus aureus", "s. aureus"],
    sites: [
      "skin",
      "ssi",
      "boneJoint",
      "cardiovascular",
      "pneu"
    ],
    note: "Start with skin/soft tissue, surgical-site, bone/joint, endovascular, and respiratory definitions."
  },
  {
    terms: ["candida"],
    sites: ["gi", "uti"],
    note: "Start with gastrointestinal / intra-abdominal and urinary definitions; verify the exact site-specific organism rule."
  },
  {
    terms: ["pseudomonas"],
    sites: ["pneu", "uti", "skin", "gi"],
    note: "Start with respiratory, urinary, skin/soft-tissue, and gastrointestinal / intra-abdominal definitions."
  },
  {
    terms: ["streptococcus pneumoniae", "s. pneumoniae"],
    sites: ["pneu", "cns"],
    note: "Start with respiratory and central-nervous-system definitions."
  },
  {
    terms: ["bacteroides"],
    sites: ["gi", "skin"],
    note: "Start with gastrointestinal / intra-abdominal and skin/soft-tissue definitions."
  },
  {
    terms: ["viridans", "rothia"],
    sites: ["cardiovascular", "other"],
    note: "Start with endovascular and other site-specific definitions when the chart supports a source."
  }
];

const commensalOrganisms = new Set([
  "Aerococcus species",
  "Bacillus species (not B. anthracis)",
  "Corynebacterium species",
  "Cutibacterium species",
  "Micrococcus species",
  "Rhodococcus species",
  "Staphylococcus, coagulase negative",
  "Viridans group streptococci"
]);

const recognizedPathogens = new Set([
  "Acinetobacter species",
  "Bacteroides species",
  "Candida albicans",
  "Candida species",
  "Candida auris",
  "Candida glabrata",
  "Candida parapsilosis",
  "Candida tropicalis",
  "Enterobacter species",
  "Enterococcus faecalis",
  "Enterococcus faecium",
  "Enterococcus species",
  "Escherichia coli",
  "Klebsiella pneumoniae",
  "Klebsiella species",
  "Proteus mirabilis",
  "Pseudomonas aeruginosa",
  "Serratia marcescens",
  "Staphylococcus aureus",
  "Stenotrophomonas maltophilia",
  "Streptococcus agalactiae",
  "Streptococcus pneumoniae",
  "Other bacterial recognized pathogen",
  "Other fungal recognized pathogen"
]);

document.addEventListener("DOMContentLoaded", init);

function init() {
  buildSiteButtons();
  renderSymptoms();
  bindChoiceGroups();
  bindInputs();
  bindOrganismSearch();
  bindCheckboxes();
  bindManualDialogs();
  bindReferenceTabs();
  setupTooltips();
  updateAll();
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

      if (!button) {
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
        renderSymptoms();
      }

      updateAll();
    });
  });
}

function bindInputs() {
  document
    .getElementById("cultureOrganismDate")
    .addEventListener("change", (event) => {
      state.cultureOrganismDate = event.target.value;
      renderSurveillanceWindow();
    });

  document
    .getElementById("organismName")
    .addEventListener("change", (event) => {
      state.organismNames = Array.from(event.target.selectedOptions).map(
        (option) => option.value
      );
      applyOrganismCategory();
      updateAll();
    });
}

function bindOrganismSearch() {
  const search = document.getElementById("organismSearch");
  const select = document.getElementById("organismName");
  const status = document.getElementById("organismSearchStatus");

  if (!search || !select || !status) {
    return;
  }

  const filterOptions = () => {
    const query = search.value.trim().toLowerCase();
    let visibleCount = 0;

    Array.from(select.options).forEach((option) => {
      const matches = !query || option.text.toLowerCase().includes(query);

      option.hidden = !matches;
      if (matches) {
        visibleCount += 1;
      }
    });

    Array.from(select.querySelectorAll("optgroup")).forEach((group) => {
      group.hidden = !Array.from(group.options).some(
        (option) => !option.hidden
      );
    });

    status.textContent = query
      ? `${visibleCount} organism${visibleCount === 1 ? "" : "s"} found.`
      : "";
  };

  search.addEventListener("input", filterOptions);
  search.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      select.focus();
    }
  });
}

function applyOrganismCategory() {
  let category = "";

  if (state.organismNames.some((organism) => recognizedPathogens.has(organism))) {
    category = "recognized";
  } else if (
    state.organismNames.length > 0 &&
    state.organismNames.every((organism) => commensalOrganisms.has(organism))
  ) {
    category = "commensal";
  }

  state.organismCategory = category;

  document
    .querySelectorAll('[data-name="organismCategory"] button')
    .forEach((button) => {
      button.classList.toggle(
        "selected",
        button.dataset.value === category
      );
    });

  document
    .getElementById("commensalQuestions")
    .classList.toggle("hidden", category !== "commensal");
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

  Object.entries(siteLibrary).forEach(([key, site]) => {
    const button = document.createElement("button");

    button.type = "button";
    button.dataset.site = key;
    button.textContent = site.label;
    button.setAttribute("aria-pressed", "false");

    button.addEventListener("click", () => {
      state.selectedSite = key;

      container
        .querySelectorAll("button")
        .forEach((item) => {
          item.classList.remove("selected");
          item.setAttribute("aria-pressed", "false");
        });

      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");

      renderSiteGuide();
    });

    container.appendChild(button);
  });
}

function renderOrganismSuggestions() {
  const box = document.getElementById("organismSuggestions");
  const organisms = state.organismNames;
  const matchingHints = getOrganismHints(organisms);
  const suggestedSiteKeys = new Set(
    matchingHints.flatMap((entry) => entry.sites)
  );

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

  const notes = [...new Set(matchingHints.map((entry) => entry.note))];

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

function getOrganismHints(organisms) {
  return organismHints.filter((entry) =>
    organisms.some((organism) =>
      entry.terms.some((term) => organism.toLowerCase().includes(term))
    )
  );
}

function renderSuggestedSiteButtons(suggestedSiteKeys) {
  const buttons = document.querySelectorAll("#siteButtons button");
  const count = document.getElementById("pathwayCount");
  const help = document.getElementById("sourceReviewHelp");
  const hasSelection = state.organismNames.length > 0;
  const hasSuggestions = suggestedSiteKeys.size > 0;

  buttons.forEach((button) => {
    const isSuggested = hasSuggestions && suggestedSiteKeys.has(button.dataset.site);
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
  const container = document.getElementById("siteGuidance");
  const site = siteLibrary[state.selectedSite];

  if (!site) {
    container.innerHTML = "";
    return;
  }

  const saved =
    state.siteEvidence[state.selectedSite] || new Set();

  state.siteEvidence[state.selectedSite] = saved;

  container.innerHTML = `
    <div class="site-guide">
      <h3>
        ${escapeHtml(site.label)} evidence review

        <button
          class="definition"
          type="button"
          data-tooltip="These are directional chart-review prompts. Verify the complete current NHSN definition before selecting that the site-specific definition is met."
          aria-label="${escapeHtml(site.label)} review definition"
        >
          i
        </button>
      </h3>

      <p class="guide-intro">
        ${escapeHtml(site.intro)}
      </p>

      ${site.groups
        .map(
          (group) => `
            <div class="evidence-group">
              <h4>${escapeHtml(group.title)}</h4>

              <div class="prompt-list">
                ${group.items
                  .map(
                    ([key, text]) => `
                      <label>
                        <input
                          type="checkbox"
                          data-evidence="${escapeHtml(key)}"
                          ${saved.has(key) ? "checked" : ""}
                        >

                        <span>${escapeHtml(text)}</span>

                        <span
                          class="inline-info"
                          tabindex="0"
                          data-tooltip="Locate objective documentation in the medical record and verify that it satisfies the exact selected NHSN criterion and timing requirement."
                        >
                          i
                        </span>
                      </label>
                    `
                  )
                  .join("")}
              </div>
            </div>
          `
        )
        .join("")}

    </div>
  `;

  container
    .querySelectorAll("[data-evidence]")
    .forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) {
          saved.add(input.dataset.evidence);
        } else {
          saved.delete(input.dataset.evidence);
        }
      });
    });

  setupTooltips();
}

function determineLcbi() {
  if (state.culturePositive !== "yes") {
    return {
      met: false,
      criterion: "",
      label: "No LCBI",
      reason:
        "An eligible positive culture specimen has not been confirmed."
    };
  }

  if (state.organismCategory === "recognized") {
    return {
      met: true,
      criterion: "LCBI 1",
      label: "LCBI 1 screen met",
      reason:
        "A recognized pathogen was selected. Secondary attribution must still be excluded."
    };
  }

  if (state.organismCategory === "commensal") {
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
      "Select whether the culture organism is a recognized pathogen or a common commensal."
  };
}

function determineSecondaryStatus() {
  const answers = [
    state.siteDefinitionMet,
    state.organismRelationship,
    state.attributionTiming
  ];

  const allYes = answers.every((answer) => answer === "yes");
  const anyNo = answers.some((answer) => answer === "no");
  const incomplete = answers.some((answer) => !answer);

  if (allYes) {
    return {
      met: true,
      status: "complete",
      label: "Secondary BSI attribution appears satisfied",
      reason:
        "A complete site-specific definition, eligible organism relationship, and required timing relationship were all selected as Yes."
    };
  }

  if (incomplete) {
    return {
      met: false,
      status: "incomplete",
      label: "Secondary BSI review incomplete",
      reason:
        "Complete all three secondary attribution questions."
    };
  }

  if (anyNo) {
    return {
      met: false,
      status: "notMet",
      label: "Secondary BSI attribution not established",
      reason:
        "At least one required secondary attribution element was answered No."
    };
  }

  return {
    met: false,
    status: "incomplete",
    label: "Secondary BSI review incomplete",
    reason:
      "Complete the secondary attribution review."
  };
}

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
      status: "notEvaluated",
      label: "MBI-LCBI not evaluated",
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
    return {
      met: false,
      status: "hostNotMet",
      label: "MBI host pathway not established",
      reason:
        "Neither a qualifying neutropenia pathway nor an eligible allogeneic HSCT gastrointestinal pathway was selected."
    };
  }

  if (
    lcbiResult.criterion === "LCBI 1" &&
    state.mbi.mbiOrganisms === true
  ) {
    return {
      met: true,
      status: "possible",
      label: "Possible MBI-LCBI 1",
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
      status: "possible",
      label: "Possible MBI-LCBI 2",
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
      status: "possible",
      label: "Possible MBI-LCBI 3",
      reason:
        "An LCBI 3 screen, qualifying host pathway, and VGS and/or Rothia-only pathway were selected."
    };
  }

  return {
    met: false,
    status: "organismNotMet",
    label: "MBI organism pathway not established",
    reason:
      "The selected LCBI pathway does not yet have a corresponding eligible MBI organism pattern."
  };
}

function getSiteEvidenceSummary() {
  if (!state.selectedSite) {
    return {
      selected: false,
      label: "No suspected source selected",
      checkedCount: 0,
      totalCount: 0
    };
  }

  const site = siteLibrary[state.selectedSite];
  const checked =
    state.siteEvidence[state.selectedSite] || new Set();

  const total = site.groups.reduce(
    (sum, group) => sum + group.items.length,
    0
  );

  return {
    selected: true,
    label: site.label,
    checkedCount: checked.size,
    totalCount: total
  };
}

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
  const siteEvidence = getSiteEvidenceSummary();

  const details = [];

  details.push({
    label: "LCBI review",
    text: `${lcbi.label}. ${lcbi.reason}`
  });

  if (siteEvidence.selected) {
    details.push({
      label: "Selected suspected source",
      text:
        `${siteEvidence.label}; ` +
        `${siteEvidence.checkedCount} of ` +
        `${siteEvidence.totalCount} directional evidence prompts checked.`
    });
  } else {
    details.push({
      label: "Selected suspected source",
      text:
        "No site-specific review card has been selected."
    });
  }

  details.push({
    label: "Secondary BSI review",
    text:
      `${secondary.label}. ${secondary.reason}`
  });

  details.push({
    label: "Central-line review",
    text:
      `${centralLine.label}. ${centralLine.reason}`
  });

  details.push({
    label: "MBI-LCBI review",
    text:
      `${mbi.label}. ${mbi.reason}`
  });

  if (state.exclusions.size > 0) {
    details.push({
      label: "Selected exclusion fields",
      text:
        Array.from(state.exclusions).join(", ")
    });
  } else {
    details.push({
      label: "Selected exclusion fields",
      text:
        "None selected."
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

  if (state.exclusions.size > 0) {
    if (mbi.met) {
      return {
        status: "warning",
        title:
          `${mbi.label} with central-line association and selected CLABSI exclusion field(s).`,
        details
      };
    }

    return {
      status: "warning",
      title:
        `${lcbi.criterion} with central-line association and selected CLABSI exclusion field(s).`,
      details
    };
  }

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

  detailsBox.innerHTML = `
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

      <li>
        <strong>Required confirmation:</strong>
        Confirm exact organism eligibility, required criterion combinations,
        infection window period, date of event, repeat infection timeframe,
        secondary BSI attribution period, device timing, and exclusions
        against the current NHSN protocol.
      </li>
    </ul>
  `;
}

function updateAll() {
  renderSurveillanceWindow();
  renderOrganismSuggestions();
  renderSecondaryConclusion();
  renderLcbiResult();
  renderFinalResult();
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
  dateRangeLabel.textContent = `${formatDate(windowStart)} through ${formatDate(windowEnd)}`;
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

  lines.push("");
  lines.push(
    "Required confirmation: Confirm exact organism eligibility, required criterion combinations, infection window period, date of event, repeat infection timeframe, secondary BSI attribution period, device timing, and exclusions against the current NHSN protocol."
  );

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




"use strict";

/*
 * NHSN CLABSI Decision Support — Starter Logic
 * -------------------------------------------------------------
 * Educational surveillance support only.
 *
 * This is intentionally written as a readable starter project
 * that Codex can later split into:
 *   - app.js
 *   - nhsnRules.js
 *   - organisms.js
 *   - secondaryBsi.js
 *
 * Important:
 * This app assists with NHSN surveillance classification.
 * It is not a clinical diagnostic tool and does not replace
 * review of the current NHSN Patient Safety Component Manual.
 */

/* ============================================================
   Application state
   ============================================================ */

const state = {
    age: null,

    positiveBloodCulture: null,
    organismCategory: null,
    organismName: "",

    cultureMethod: "culture",
    commonCommensalMatch: null,
    separateOccasions: null,
    collectionTimingValid: null,

    symptoms: [],

    secondaryAssessment: null,
    secondarySite: null,
    siteSpecificCriteriaMet: null,
    bloodMatchesSiteOrganism: null,
    bloodWithinSbap: null,

    centralLinePresent: null,
    centralLineDefinitionMet: null,
    centralLineAccessed: null,
    centralLineDays: null,
    linePresentOnDoeOrPriorDay: null,

    mbi: {
        neutropenia: false,
        transplantWithinYear: false,
        giGvhdGradeIIIIV: false,
        severeDiarrhea: false,
        onlyEligibleMbiOrganisms: false,
        viridansOrRothiaOnly: false
    },

    exclusions: {
        ecmo: false,
        vad: false,
        tah: false,
        patientInjection: false,
        epidermolysisBullosa: false,
        factitiousDisorderImposedOnAnother: false,
        pusAtOtherVascularAccessSite: false
    },

    result: null
};

/* ============================================================
   Screen configuration
   ============================================================ */

const screenOrder = [
    "welcome",
    "age",
    "culture",
    "organism",
    "symptoms",
    "secondary",
    "central",
    "mbi",
    "results"
];

const sidebarStepMap = {
    welcome: 0,
    age: 0,
    culture: 1,
    organism: 2,
    symptoms: 3,
    secondary: 4,
    central: 5,
    mbi: 6,
    results: 7
};

let currentScreenIndex = 0;

/* ============================================================
   DOM helpers
   ============================================================ */

function byId(id) {
    return document.getElementById(id);
}

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (typeof text === "string") {
        element.textContent = text;
    }

    return element;
}

function createNotice(message, type = "info") {
    const notice = createElement("div", `notice ${type}`);
    notice.textContent = message;
    return notice;
}

function createQuestionGroup({
    id,
    title,
    helpText,
    options,
    selectedValue,
    onChange
}) {
    const wrapper = createElement("div", "dynamic-question");
    wrapper.id = id;

    const heading = createElement("h3", null, title);
    heading.style.marginTop = "28px";
    heading.style.marginBottom = "8px";
    wrapper.appendChild(heading);

    if (helpText) {
        const help = createElement("p", "muted", helpText);
        help.style.marginTop = "0";
        help.style.fontSize = "0.93rem";
        wrapper.appendChild(help);
    }

    const answers = createElement("div", "answers");

    options.forEach((option) => {
        const button = createElement("button", "answer", option.label);
        button.type = "button";
        button.dataset.value = String(option.value);

        if (selectedValue === option.value) {
            button.classList.add("selected");
        }

        button.addEventListener("click", () => {
            answers.querySelectorAll(".answer").forEach((item) => {
                item.classList.remove("selected");
            });

            button.classList.add("selected");
            onChange(option.value);
        });

        answers.appendChild(button);
    });

    wrapper.appendChild(answers);
    return wrapper;
}

function createCheckbox({
    label,
    checked,
    onChange
}) {
    const wrapper = createElement("label");
    const input = document.createElement("input");

    input.type = "checkbox";
    input.checked = Boolean(checked);

    input.addEventListener("change", () => {
        onChange(input.checked);
    });

    wrapper.appendChild(input);
    wrapper.appendChild(document.createTextNode(label));

    return wrapper;
}

function createTextInput({
    id,
    label,
    placeholder,
    value,
    onInput
}) {
    const wrapper = createElement("div", "input-group");
    wrapper.style.marginTop = "22px";

    const labelElement = createElement("label", null, label);
    labelElement.setAttribute("for", id);
    labelElement.style.display = "block";
    labelElement.style.margin = "0 0 8px";
    labelElement.style.padding = "0";
    labelElement.style.border = "0";
    labelElement.style.background = "transparent";
    labelElement.style.fontWeight = "600";

    const input = document.createElement("input");
    input.id = id;
    input.type = "text";
    input.placeholder = placeholder || "";
    input.value = value || "";

    Object.assign(input.style, {
        width: "100%",
        padding: "14px 15px",
        border: "1px solid var(--color-border)",
        borderRadius: "10px",
        color: "var(--color-text)",
        background: "var(--color-surface)",
        outline: "none"
    });

    input.addEventListener("focus", () => {
        input.style.borderColor = "var(--color-primary)";
        input.style.boxShadow = "0 0 0 3px rgba(22, 119, 255, 0.1)";
    });

    input.addEventListener("blur", () => {
        input.style.borderColor = "var(--color-border)";
        input.style.boxShadow = "none";
    });

    input.addEventListener("input", () => {
        onInput(input.value);
    });

    wrapper.appendChild(labelElement);
    wrapper.appendChild(input);

    return wrapper;
}

function createContinueButton(onClick, text = "Continue") {
    const button = createElement("button", "primary", text);
    button.type = "button";
    button.style.marginTop = "26px";
    button.addEventListener("click", onClick);
    return button;
}

/* ============================================================
   Initialization
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    enhanceExistingMarkup();
    renderCurrentScreen();
    updateProgress();
});

function enhanceExistingMarkup() {
    configureWelcome();
    configureAgeButtons();
    configureCultureButtons();
    configureOrganismButtons();
    configureSymptoms();
    configureSecondaryButtons();

    renderOrganismDetails();
    renderCentralLineQuestions();
    renderMbiQuestions();
}

/* ============================================================
   Existing HTML wiring
   ============================================================ */

function configureWelcome() {
    const welcomeButton = byId("welcome")?.querySelector(".primary");

    if (!welcomeButton) {
        return;
    }

    welcomeButton.removeAttribute("onclick");
    welcomeButton.addEventListener("click", () => {
        goToScreen("age");
    });
}

function configureAgeButtons() {
    const section = byId("age");
    if (!section) return;

    section.querySelectorAll(".answer").forEach((button) => {
        button.addEventListener("click", () => {
            state.age = button.dataset.value;

            selectSingleButton(section, button);
            renderSymptomOptions();

            window.setTimeout(() => {
                goToScreen("culture");
            }, 180);
        });
    });
}

function configureCultureButtons() {
    const section = byId("culture");
    if (!section) return;

    section.querySelectorAll(".answer").forEach((button) => {
        button.addEventListener("click", () => {
            const value = button.dataset.value;
            state.positiveBloodCulture = value === "yes";

            selectSingleButton(section, button);

            window.setTimeout(() => {
                if (!state.positiveBloodCulture) {
                    state.result = buildNoBloodCultureResult();
                    goToScreen("results");
                    calculateAndRenderResult();
                    return;
                }

                goToScreen("organism");
            }, 180);
        });
    });
}

function configureOrganismButtons() {
    const section = byId("organism");
    if (!section) return;

    section.querySelectorAll(".answer").forEach((button) => {
        button.addEventListener("click", () => {
            state.organismCategory = button.dataset.value;

            selectSingleButton(section, button);
            renderOrganismDetails();
        });
    });
}

function configureSymptoms() {
    const section = byId("symptoms");
    if (!section) return;

    const continueButton = section.querySelector(".primary");

    if (continueButton) {
        continueButton.removeAttribute("onclick");
        continueButton.addEventListener("click", () => {
            collectSymptoms();

            const validation = validateSymptomsScreen();

            if (!validation.valid) {
                showInlineError(section, validation.message);
                return;
            }

            clearInlineError(section);
            goToScreen("secondary");
        });
    }

    renderSymptomOptions();
}

function configureSecondaryButtons() {
    const section = byId("secondary");
    if (!section) return;

    section.querySelectorAll(".answer").forEach((button) => {
        button.addEventListener("click", () => {
            state.secondaryAssessment = button.dataset.value;

            selectSingleButton(section, button);
            renderSecondaryDetails();
        });
    });

    renderSecondaryDetails();
}

function selectSingleButton(section, selectedButton) {
    section.querySelectorAll(":scope > .answers .answer").forEach((button) => {
        button.classList.remove("selected");
    });

    selectedButton.classList.add("selected");
}

/* ============================================================
   Organism screen
   ============================================================ */

function renderOrganismDetails() {
    const section = byId("organism");
    if (!section) return;

    section.querySelector("#organismDetails")?.remove();

    const details = createElement("div");
    details.id = "organismDetails";

    details.appendChild(
        createTextInput({
            id: "organismName",
            label: "Organism identified in blood",
            placeholder: "Example: Staphylococcus aureus",
            value: state.organismName,
            onInput: (value) => {
                state.organismName = value.trim();
                renderOrganismGuidance();
            }
        })
    );

    const guidance = createElement("div");
    guidance.id = "organismGuidance";
    details.appendChild(guidance);

    if (state.organismCategory === "recognized") {
        details.appendChild(
            createNotice(
                "A recognized bacterial or fungal pathogen may meet LCBI 1 when identified from at least one eligible blood specimen and not related to infection at another site.",
                "info"
            )
        );

        details.appendChild(
            createQuestionGroup({
                id: "cultureMethodQuestion",
                title: "How was the organism identified?",
                helpText:
                    "Choose the method used for the qualifying blood specimen.",
                options: [
                    { value: "culture", label: "Blood culture" },
                    {
                        value: "nct",
                        label: "Direct non-culture microbiologic test"
                    }
                ],
                selectedValue: state.cultureMethod,
                onChange: (value) => {
                    state.cultureMethod = value;
                }
            })
        );
    }

    if (state.organismCategory === "commensal") {
        details.appendChild(
            createNotice(
                "A single blood specimen containing a common commensal does not meet LCBI 2 or LCBI 3. Matching common commensals must be identified from at least two blood specimens collected on separate occasions.",
                "warning"
            )
        );

        details.appendChild(
            createQuestionGroup({
                id: "matchingCommensalQuestion",
                title:
                    "Was the same NHSN common commensal identified in at least two blood specimens?",
                options: [
                    { value: true, label: "Yes" },
                    { value: false, label: "No" }
                ],
                selectedValue: state.commonCommensalMatch,
                onChange: (value) => {
                    state.commonCommensalMatch = value;
                }
            })
        );

        details.appendChild(
            createQuestionGroup({
                id: "separateOccasionsQuestion",
                title:
                    "Were the specimens collected on separate occasions?",
                helpText:
                    "The specimens should represent separate blood draws and be collected on the same or consecutive calendar days.",
                options: [
                    { value: true, label: "Yes" },
                    { value: false, label: "No" },
                    { value: null, label: "Unsure" }
                ],
                selectedValue: state.separateOccasions,
                onChange: (value) => {
                    state.separateOccasions = value;
                }
            })
        );
    }

    details.appendChild(
        createContinueButton(() => {
            const validation = validateOrganismScreen();

            if (!validation.valid) {
                showInlineError(section, validation.message);
                return;
            }

            clearInlineError(section);

            if (state.organismCategory === "recognized") {
                state.symptoms = [];
            }

            goToScreen("symptoms");
        })
    );

    section.appendChild(details);
    renderOrganismGuidance();
}

function renderOrganismGuidance() {
    const guidance = byId("organismGuidance");
    if (!guidance) return;

    guidance.innerHTML = "";

    if (!state.organismName) {
        return;
    }

    const suggestions = getPossibleSecondarySources(state.organismName);

    if (suggestions.length === 0) {
        return;
    }

    const notice = createElement("div", "notice info");
    const title = createElement(
        "strong",
        null,
        "Possible sites to evaluate before classifying the BSI as primary:"
    );

    notice.appendChild(title);

    const list = document.createElement("ul");
    list.style.marginBottom = "0";

    suggestions.forEach((suggestion) => {
        const item = createElement("li", null, suggestion);
        list.appendChild(item);
    });

    notice.appendChild(list);
    guidance.appendChild(notice);
}

/*
 * These are workflow prompts, not NHSN organism-to-source rules.
 * Final secondary BSI attribution still requires a qualifying
 * NHSN site-specific infection and appropriate pathogen assignment.
 */
function getPossibleSecondarySources(rawOrganismName) {
    const organism = normalizeOrganism(rawOrganismName);

    const sourceMap = [
        {
            terms: ["escherichia coli", "e. coli", "ecoli"],
            sources: [
                "Urinary tract",
                "Gastrointestinal or intra-abdominal infection",
                "Biliary tract"
            ]
        },
        {
            terms: ["klebsiella"],
            sources: [
                "Urinary tract",
                "Respiratory tract",
                "Gastrointestinal or intra-abdominal infection",
                "Biliary tract"
            ]
        },
        {
            terms: ["enterococcus"],
            sources: [
                "Urinary tract",
                "Gastrointestinal or intra-abdominal infection",
                "Surgical site",
                "Endovascular infection"
            ]
        },
        {
            terms: ["staphylococcus aureus", "s. aureus"],
            sources: [
                "Skin or soft tissue",
                "Surgical site",
                "Bone or joint",
                "Endocarditis or other endovascular source",
                "Pneumonia"
            ]
        },
        {
            terms: [
                "coagulase-negative staphyl",
                "staphylococcus epidermidis",
                "s. epidermidis"
            ],
            sources: [
                "Evaluate whether blood findings meet common-commensal criteria",
                "Evaluate implanted hardware or endovascular infection when clinically documented"
            ]
        },
        {
            terms: ["candida"],
            sources: [
                "Gastrointestinal or intra-abdominal infection",
                "Mucosal barrier injury eligibility",
                "Urinary tract when NHSN criteria and pathogen assignment are met"
            ]
        },
        {
            terms: ["pseudomonas"],
            sources: [
                "Respiratory tract",
                "Urinary tract",
                "Skin, burn, or wound",
                "Gastrointestinal or intra-abdominal infection"
            ]
        },
        {
            terms: ["streptococcus pneumoniae", "s. pneumoniae"],
            sources: [
                "Pneumonia",
                "Central nervous system infection",
                "Ear, nose, throat, or sinus infection"
            ]
        },
        {
            terms: ["bacteroides"],
            sources: [
                "Gastrointestinal or intra-abdominal infection",
                "Pelvic infection",
                "Skin or soft tissue infection"
            ]
        },
        {
            terms: ["viridans", "rothia"],
            sources: [
                "Mucosal barrier injury eligibility",
                "Oral or dental source",
                "Endocarditis when site-specific criteria are met"
            ]
        }
    ];

    const match = sourceMap.find((entry) =>
        entry.terms.some((term) => organism.includes(term))
    );

    return match ? match.sources : [];
}

function normalizeOrganism(value) {
    return String(value)
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

/* ============================================================
   Symptoms
   ============================================================ */

function renderSymptomOptions() {
    const section = byId("symptoms");
    if (!section) return;

    const continueButton = section.querySelector(".primary");

    section.querySelectorAll("label").forEach((label) => {
        label.remove();
    });

    const adultSymptoms = [
        { value: "fever", label: "Fever > 38.0°C" },
        { value: "chills", label: "Chills" },
        { value: "hypotension", label: "Hypotension" }
    ];

    const infantSymptoms = [
        { value: "fever", label: "Fever > 38.0°C" },
        { value: "hypothermia", label: "Hypothermia < 36.0°C" },
        { value: "apnea", label: "Apnea" },
        { value: "bradycardia", label: "Bradycardia" }
    ];

    const applicableSymptoms =
        state.age === "infant" ? infantSymptoms : adultSymptoms;

    applicableSymptoms.forEach((symptom) => {
        const label = createCheckbox({
            label: symptom.label,
            checked: state.symptoms.includes(symptom.value),
            onChange: (checked) => {
                if (checked && !state.symptoms.includes(symptom.value)) {
                    state.symptoms.push(symptom.value);
                }

                if (!checked) {
                    state.symptoms = state.symptoms.filter(
                        (value) => value !== symptom.value
                    );
                }
            }
        });

        section.insertBefore(label, continueButton);
    });

    let guidance = section.querySelector("#symptomGuidance");

    if (!guidance) {
        guidance = createElement("div", "notice info");
        guidance.id = "symptomGuidance";
        section.insertBefore(guidance, section.querySelector("label"));
    }

    if (state.organismCategory === "recognized") {
        guidance.textContent =
            "For LCBI 1, an eligible recognized pathogen in blood is the qualifying criterion element; these symptoms are collected for context but are not required to satisfy LCBI 1.";
    } else {
        guidance.textContent =
            state.age === "infant"
                ? "LCBI 3 requires at least one qualifying infant sign or symptom within the applicable infection window period."
                : "LCBI 2 requires fever, chills, or hypotension within the applicable infection window period.";
    }
}

function collectSymptoms() {
    const section = byId("symptoms");
    if (!section) return;

    state.symptoms = Array.from(
        section.querySelectorAll('input[type="checkbox"]:checked')
    ).map((input) => input.value);
}

/* ============================================================
   Secondary BSI
   ============================================================ */

function renderSecondaryDetails() {
    const section = byId("secondary");
    if (!section) return;

    section.querySelector("#secondaryDetails")?.remove();

    const details = createElement("div");
    details.id = "secondaryDetails";

    if (!state.secondaryAssessment) {
        section.appendChild(details);
        return;
    }

    if (state.secondaryAssessment === "no") {
        details.appendChild(
            createNotice(
                "Continue only after reviewing potential NHSN site-specific infections. A primary BSI is an LCBI that is not secondary to infection at another body site.",
                "info"
            )
        );

        details.appendChild(
            createContinueButton(() => {
                goToScreen("central");
            })
        );

        section.appendChild(details);
        return;
    }

    const siteOptions = [
        { value: "uti", label: "Urinary tract" },
        { value: "pneu", label: "Pneumonia / respiratory" },
        { value: "ssi", label: "Surgical site" },
        { value: "gi", label: "Gastrointestinal / intra-abdominal" },
        { value: "skin", label: "Skin / soft tissue" },
        { value: "boneJoint", label: "Bone / joint" },
        { value: "cardiovascular", label: "Cardiovascular / endovascular" },
        { value: "cns", label: "Central nervous system" },
        { value: "other", label: "Other NHSN site" }
    ];

    details.appendChild(
        createQuestionGroup({
            id: "secondarySiteQuestion",
            title: "Potential primary site",
            helpText:
                "Choose the site-specific infection being evaluated.",
            options: siteOptions,
            selectedValue: state.secondarySite,
            onChange: (value) => {
                state.secondarySite = value;
            }
        })
    );

    details.appendChild(
        createQuestionGroup({
            id: "siteCriteriaQuestion",
            title:
                "Does the patient meet the applicable NHSN site-specific infection definition?",
            options: [
                { value: true, label: "Yes" },
                { value: false, label: "No" },
                { value: null, label: "Not yet determined" }
            ],
            selectedValue: state.siteSpecificCriteriaMet,
            onChange: (value) => {
                state.siteSpecificCriteriaMet = value;
            }
        })
    );

    details.appendChild(
        createQuestionGroup({
            id: "organismMatchQuestion",
            title:
                "Does at least one eligible blood organism match the organism used to meet the site-specific definition?",
            helpText:
                "Some site-specific definitions and secondary BSI scenarios have additional pathogen-assignment rules. Review the applicable NHSN chapter.",
            options: [
                { value: true, label: "Yes" },
                { value: false, label: "No" },
                { value: null, label: "Unsure" }
            ],
            selectedValue: state.bloodMatchesSiteOrganism,
            onChange: (value) => {
                state.bloodMatchesSiteOrganism = value;
            }
        })
    );

    details.appendChild(
        createQuestionGroup({
            id: "sbapQuestion",
            title:
                "Was the qualifying blood specimen collected during the site's secondary BSI attribution period?",
            options: [
                { value: true, label: "Yes" },
                { value: false, label: "No" },
                { value: null, label: "Unsure" }
            ],
            selectedValue: state.bloodWithinSbap,
            onChange: (value) => {
                state.bloodWithinSbap = value;
            }
        })
    );

    details.appendChild(
        createContinueButton(() => {
            const validation = validateSecondaryScreen();

            if (!validation.valid) {
                showInlineError(section, validation.message);
                return;
            }

            clearInlineError(section);

            if (isSecondaryBsi()) {
                state.result = buildSecondaryBsiResult();
                goToScreen("results");
                calculateAndRenderResult();
                return;
            }

            goToScreen("central");
        })
    );

    section.appendChild(details);
}

/* ============================================================
   Central-line screen
   ============================================================ */

function renderCentralLineQuestions() {
    const section = byId("central");
    if (!section) return;

    section.innerHTML = "";

    section.appendChild(
        createElement("h2", null, "Central-Line Association")
    );

    section.appendChild(
        createNotice(
            "A CLABSI requires an eligible central line on the LCBI date of event or the day before. Central-line eligibility begins on or after central-line day 3 following first inpatient access during the current admission.",
            "info"
        )
    );

    section.appendChild(
        createQuestionGroup({
            id: "linePresentQuestion",
            title: "Was an intravascular device present?",
            options: [
                { value: true, label: "Yes" },
                { value: false, label: "No" }
            ],
            selectedValue: state.centralLinePresent,
            onChange: (value) => {
                state.centralLinePresent = value;
                renderCentralLineQuestions();
            }
        })
    );

    if (state.centralLinePresent === true) {
        section.appendChild(
            createQuestionGroup({
                id: "lineDefinitionQuestion",
                title:
                    "Does the device meet the NHSN central-line definition?",
                helpText:
                    "The catheter terminates at, in, or close to the heart or in a great vessel and is used for infusion, blood withdrawal, or hemodynamic monitoring.",
                options: [
                    { value: true, label: "Yes" },
                    { value: false, label: "No" },
                    { value: null, label: "Unsure" }
                ],
                selectedValue: state.centralLineDefinitionMet,
                onChange: (value) => {
                    state.centralLineDefinitionMet = value;
                }
            })
        );

        section.appendChild(
            createQuestionGroup({
                id: "lineAccessQuestion",
                title:
                    "Was the line placed or accessed during the current inpatient admission?",
                helpText:
                    "Access includes placement, infusion, blood withdrawal, or hemodynamic monitoring.",
                options: [
                    { value: true, label: "Yes" },
                    { value: false, label: "No" },
                    { value: null, label: "Unsure" }
                ],
                selectedValue: state.centralLineAccessed,
                onChange: (value) => {
                    state.centralLineAccessed = value;
                }
            })
        );

        section.appendChild(
            createQuestionGroup({
                id: "lineDaysQuestion",
                title:
                    "Had the accessed central line been in place for more than two consecutive calendar days?",
                helpText:
                    "This means the patient was on or after central-line day 3.",
                options: [
                    { value: true, label: "Yes — day 3 or later" },
                    { value: false, label: "No — day 1 or 2" },
                    { value: null, label: "Unsure" }
                ],
                selectedValue: state.centralLineDays,
                onChange: (value) => {
                    state.centralLineDays = value;
                }
            })
        );

        section.appendChild(
            createQuestionGroup({
                id: "lineTimingQuestion",
                title:
                    "Was the eligible line present on the LCBI date of event or the day before?",
                options: [
                    { value: true, label: "Yes" },
                    { value: false, label: "No" },
                    { value: null, label: "Unsure" }
                ],
                selectedValue: state.linePresentOnDoeOrPriorDay,
                onChange: (value) => {
                    state.linePresentOnDoeOrPriorDay = value;
                }
            })
        );
    }

    section.appendChild(
        createContinueButton(() => {
            const validation = validateCentralLineScreen();

            if (!validation.valid) {
                showInlineError(section, validation.message);
                return;
            }

            clearInlineError(section);
            goToScreen("mbi");
        })
    );
}

/* ============================================================
   MBI and CLABSI-exclusion screen
   ============================================================ */

function renderMbiQuestions() {
    const section = byId("mbi");
    if (!section) return;

    section.innerHTML = "";

    section.appendChild(
        createElement("h2", null, "MBI-LCBI and Reporting Exclusions")
    );

    section.appendChild(
        createNotice(
            "MBI-LCBI is evaluated only after an LCBI criterion is fully met. The organism and host-factor requirements must both be satisfied.",
            "info"
        )
    );

    const mbiHeading = createElement(
        "h3",
        null,
        "Possible mucosal barrier injury factors"
    );
    mbiHeading.style.marginTop = "26px";
    section.appendChild(mbiHeading);

    section.appendChild(
        createCheckbox({
            label:
                "Neutropenia: ANC and/or WBC below 500 cells/mm³ on at least two separate days in the qualifying 7-day period",
            checked: state.mbi.neutropenia,
            onChange: (value) => {
                state.mbi.neutropenia = value;
            }
        })
    );

    section.appendChild(
        createCheckbox({
            label:
                "Allogeneic hematopoietic stem-cell transplant within the past year",
            checked: state.mbi.transplantWithinYear,
            onChange: (value) => {
                state.mbi.transplantWithinYear = value;
            }
        })
    );

    section.appendChild(
        createCheckbox({
            label:
                "Grade III or IV gastrointestinal graft-versus-host disease",
            checked: state.mbi.giGvhdGradeIIIIV,
            onChange: (value) => {
                state.mbi.giGvhdGradeIIIIV = value;
            }
        })
    );

    section.appendChild(
        createCheckbox({
            label:
                "Qualifying diarrhea volume and timing documented",
            checked: state.mbi.severeDiarrhea,
            onChange: (value) => {
                state.mbi.severeDiarrhea = value;
            }
        })
    );

    section.appendChild(
        createCheckbox({
            label:
                "Blood specimen contains only eligible NHSN MBI organisms",
            checked: state.mbi.onlyEligibleMbiOrganisms,
            onChange: (value) => {
                state.mbi.onlyEligibleMbiOrganisms = value;
            }
        })
    );

    section.appendChild(
        createCheckbox({
            label:
                "For a common-commensal event: only Viridans Group Streptococcus and/or Rothia spp. are present in the qualifying specimens",
            checked: state.mbi.viridansOrRothiaOnly,
            onChange: (value) => {
                state.mbi.viridansOrRothiaOnly = value;
            }
        })
    );

    const exclusionHeading = createElement(
        "h3",
        null,
        "CLABSI exclusion/reporting fields"
    );
    exclusionHeading.style.marginTop = "34px";
    section.appendChild(exclusionHeading);

    section.appendChild(
        createNotice(
            "These events may still be reported as LCBI with the applicable field marked, but they are not counted as central-line associated for the CLABSI SIR when the NHSN exclusion is met.",
            "warning"
        )
    );

    const exclusionOptions = [
        ["ecmo", "ECMO/ECLS present for more than two days"],
        ["vad", "Ventricular assist device present for more than two days"],
        ["tah", "Total artificial heart present for more than two days"],
        [
            "patientInjection",
            "Observed or suspected patient injection into the vascular access line during the BSI infection window period"
        ],
        [
            "epidermolysisBullosa",
            "Qualifying pediatric genetic epidermolysis bullosa"
        ],
        [
            "factitiousDisorderImposedOnAnother",
            "Known or suspected factitious disorder imposed on another"
        ],
        [
            "pusAtOtherVascularAccessSite",
            "Pus at an eligible other vascular-access site with a matching organism"
        ]
    ];

    exclusionOptions.forEach(([key, label]) => {
        section.appendChild(
            createCheckbox({
                label,
                checked: state.exclusions[key],
                onChange: (value) => {
                    state.exclusions[key] = value;
                }
            })
        );
    });

    section.appendChild(
        createContinueButton(() => {
            calculateAndRenderResult();
            goToScreen("results");
        }, "Calculate Determination")
    );
}

/* ============================================================
   Validation
   ============================================================ */

function validateOrganismScreen() {
    if (!state.organismCategory) {
        return {
            valid: false,
            message: "Select an organism category."
        };
    }

    if (!state.organismName) {
        return {
            valid: false,
            message: "Enter the organism identified in blood."
        };
    }

    if (
        state.organismCategory === "commensal" &&
        state.commonCommensalMatch === null
    ) {
        return {
            valid: false,
            message:
                "Indicate whether the same common commensal was identified in at least two blood specimens."
        };
    }

    if (
        state.organismCategory === "commensal" &&
        state.commonCommensalMatch === true &&
        state.separateOccasions === null
    ) {
        return {
            valid: false,
            message:
                "Indicate whether the qualifying specimens were collected on separate occasions."
        };
    }

    return { valid: true };
}

function validateSymptomsScreen() {
    if (
        state.organismCategory === "commensal" &&
        state.symptoms.length === 0
    ) {
        return {
            valid: false,
            message:
                state.age === "infant"
                    ? "LCBI 3 requires at least one qualifying infant sign or symptom."
                    : "LCBI 2 requires fever, chills, or hypotension."
        };
    }

    return { valid: true };
}

function validateSecondaryScreen() {
    if (state.secondaryAssessment === "no") {
        return { valid: true };
    }

    if (!state.secondarySite) {
        return {
            valid: false,
            message: "Select the potential primary infection site."
        };
    }

    if (state.siteSpecificCriteriaMet === null) {
        return {
            valid: false,
            message:
                "Determine whether the applicable site-specific definition is met."
        };
    }

    if (
        state.siteSpecificCriteriaMet === true &&
        state.bloodMatchesSiteOrganism === null
    ) {
        return {
            valid: false,
            message:
                "Determine whether an eligible blood organism matches the site-specific infection organism."
        };
    }

    if (
        state.siteSpecificCriteriaMet === true &&
        state.bloodMatchesSiteOrganism === true &&
        state.bloodWithinSbap === null
    ) {
        return {
            valid: false,
            message:
                "Determine whether the blood specimen was collected during the secondary BSI attribution period."
        };
    }

    return { valid: true };
}

function validateCentralLineScreen() {
    if (state.centralLinePresent === null) {
        return {
            valid: false,
            message: "Indicate whether an intravascular device was present."
        };
    }

    if (state.centralLinePresent === false) {
        return { valid: true };
    }

    const requiredFields = [
        state.centralLineDefinitionMet,
        state.centralLineAccessed,
        state.centralLineDays,
        state.linePresentOnDoeOrPriorDay
    ];

    if (requiredFields.some((value) => value === null)) {
        return {
            valid: false,
            message:
                "Complete each central-line eligibility and timing question."
        };
    }

    return { valid: true };
}

function showInlineError(section, message) {
    clearInlineError(section);

    const error = createNotice(message, "danger");
    error.classList.add("inline-error");
    section.appendChild(error);
}

function clearInlineError(section) {
    section.querySelector(".inline-error")?.remove();
}

/* ============================================================
   NHSN starter rules engine
   ============================================================ */

function determineLcbi() {
    if (!state.positiveBloodCulture) {
        return {
            met: false,
            criterion: null,
            reason: "No positive blood specimen was documented."
        };
    }

    if (state.organismCategory === "recognized") {
        return {
            met: true,
            criterion: "LCBI 1",
            reason:
                "A recognized bacterial or fungal pathogen was identified from an eligible blood specimen."
        };
    }

    if (state.organismCategory === "commensal") {
        const symptomMet = state.symptoms.length > 0;
        const culturesMet =
            state.commonCommensalMatch === true &&
            state.separateOccasions === true;

        if (!culturesMet) {
            return {
                met: false,
                criterion: null,
                reason:
                    "The matching common-commensal blood-specimen requirement was not met."
            };
        }

        if (!symptomMet) {
            return {
                met: false,
                criterion: null,
                reason:
                    "A required qualifying sign or symptom was not documented."
            };
        }

        if (state.age === "infant") {
            return {
                met: true,
                criterion: "LCBI 3",
                reason:
                    "A qualifying infant sign or symptom and matching common commensals from separate blood draws were documented."
            };
        }

        return {
            met: true,
            criterion: "LCBI 2",
            reason:
                "A qualifying sign or symptom and matching common commensals from separate blood draws were documented."
        };
    }

    return {
        met: false,
        criterion: null,
        reason: "The organism category is incomplete."
    };
}

function isSecondaryBsi() {
    return (
        state.siteSpecificCriteriaMet === true &&
        state.bloodMatchesSiteOrganism === true &&
        state.bloodWithinSbap === true
    );
}

function determineCentralLineEligibility() {
    const eligible =
        state.centralLinePresent === true &&
        state.centralLineDefinitionMet === true &&
        state.centralLineAccessed === true &&
        state.centralLineDays === true &&
        state.linePresentOnDoeOrPriorDay === true;

    return {
        eligible,
        reason: eligible
            ? "An eligible central line was present on the LCBI date of event or the day before."
            : "The central-line definition, access duration, or event timing requirement was not met."
    };
}

function determineMbi(lcbi) {
    if (!lcbi.met) {
        return {
            met: false,
            criterion: null,
            reason:
                "MBI-LCBI cannot be assigned because an LCBI criterion was not met."
        };
    }

    const hostFactorMet =
        state.mbi.neutropenia ||
        (
            state.mbi.transplantWithinYear &&
            (
                state.mbi.giGvhdGradeIIIIV ||
                state.mbi.severeDiarrhea
            )
        );

    if (!hostFactorMet) {
        return {
            met: false,
            criterion: null,
            reason:
                "The qualifying neutropenia or transplant-associated host-factor requirement was not met."
        };
    }

    if (
        lcbi.criterion === "LCBI 1" &&
        state.mbi.onlyEligibleMbiOrganisms
    ) {
        return {
            met: true,
            criterion: "MBI-LCBI 1",
            reason:
                "LCBI 1, eligible MBI organism requirements, and an eligible host factor were documented."
        };
    }

    if (
        lcbi.criterion === "LCBI 2" &&
        state.mbi.viridansOrRothiaOnly
    ) {
        return {
            met: true,
            criterion: "MBI-LCBI 2",
            reason:
                "LCBI 2, Viridans Group Streptococcus and/or Rothia organism requirements, and an eligible host factor were documented."
        };
    }

    if (
        lcbi.criterion === "LCBI 3" &&
        state.mbi.viridansOrRothiaOnly
    ) {
        return {
            met: true,
            criterion: "MBI-LCBI 3",
            reason:
                "LCBI 3, Viridans Group Streptococcus and/or Rothia organism requirements, and an eligible host factor were documented."
        };
    }

    return {
        met: false,
        criterion: null,
        reason:
            "The organism requirement for the corresponding MBI-LCBI criterion was not confirmed."
    };
}

function getActiveExclusions() {
    const labels = {
        ecmo: "ECMO/ECLS exclusion",
        vad: "VAD exclusion",
        tah: "Total artificial heart exclusion",
        patientInjection: "Patient-injection exclusion",
        epidermolysisBullosa: "Epidermolysis bullosa exclusion",
        factitiousDisorderImposedOnAnother:
            "Factitious disorder imposed on another exclusion",
        pusAtOtherVascularAccessSite:
            "Pus at another eligible vascular-access site exclusion"
    };

    return Object.entries(state.exclusions)
        .filter(([, value]) => value === true)
        .map(([key]) => labels[key]);
}

function calculateDetermination() {
    const lcbi = determineLcbi();
    const centralLine = determineCentralLineEligibility();
    const mbi = determineMbi(lcbi);
    const exclusions = getActiveExclusions();

    if (!lcbi.met) {
        return {
            status: "danger",
            title: "Does not meet an NHSN LCBI criterion",
            classification: "No reportable primary LCBI identified",
            lcbi,
            centralLine,
            mbi,
            exclusions,
            secondary: false
        };
    }

    if (isSecondaryBsi()) {
        return {
            status: "warning",
            title: "Bloodstream infection appears secondary",
            classification:
                "Secondary BSI — not a primary BSI or CLABSI",
            lcbi,
            centralLine,
            mbi,
            exclusions,
            secondary: true
        };
    }

    if (!centralLine.eligible) {
        return {
            status: "warning",
            title: "Primary LCBI without CLABSI device association",
            classification:
                mbi.met
                    ? `${mbi.criterion}; not central-line associated`
                    : `${lcbi.criterion}; not central-line associated`,
            lcbi,
            centralLine,
            mbi,
            exclusions,
            secondary: false
        };
    }

    if (exclusions.length > 0) {
        return {
            status: "warning",
            title: "LCBI meets a CLABSI exclusion",
            classification:
                mbi.met
                    ? `${mbi.criterion}; report with applicable exclusion field`
                    : `${lcbi.criterion}; report with applicable exclusion field`,
            lcbi,
            centralLine,
            mbi,
            exclusions,
            secondary: false
        };
    }

    return {
        status: "success",
        title: mbi.met
            ? `${mbi.criterion} — central-line associated`
            : "Meets preliminary NHSN CLABSI criteria",
        classification: mbi.met
            ? `${mbi.criterion} CLABSI`
            : `${lcbi.criterion} CLABSI`,
        lcbi,
        centralLine,
        mbi,
        exclusions,
        secondary: false
    };
}

/* ============================================================
   Results
   ============================================================ */

function calculateAndRenderResult() {
    state.result = calculateDetermination();
    renderResult(state.result);
}

function buildNoBloodCultureResult() {
    return {
        status: "danger",
        title: "No laboratory-confirmed bloodstream infection",
        classification:
            "No positive blood specimen was documented.",
        lcbi: {
            met: false,
            criterion: null,
            reason:
                "An eligible positive blood specimen is required to meet an LCBI criterion."
        },
        centralLine: {
            eligible: false,
            reason: "Central-line association was not evaluated."
        },
        mbi: {
            met: false,
            criterion: null,
            reason: "MBI-LCBI was not evaluated."
        },
        exclusions: [],
        secondary: false
    };
}

function buildSecondaryBsiResult() {
    return {
        status: "warning",
        title: "Potential secondary bloodstream infection",
        classification:
            "The blood organism was attributed to a qualifying site-specific infection during its secondary BSI attribution period.",
        lcbi: determineLcbi(),
        centralLine: determineCentralLineEligibility(),
        mbi: {
            met: false,
            criterion: null,
            reason:
                "A secondary BSI is not classified as a primary LCBI/CLABSI."
        },
        exclusions: [],
        secondary: true
    };
}

function renderResult(result) {
    const resultCard = byId("resultCard");
    const reasoning = byId("reasoning");

    if (!resultCard || !reasoning) {
        return;
    }

    resultCard.className = result.status;
    resultCard.innerHTML = "";

    const title = createElement("div", null, result.title);
    title.style.fontSize = "1.18rem";
    title.style.marginBottom = "6px";

    const classification = createElement(
        "div",
        "muted",
        result.classification
    );
    classification.style.fontWeight = "500";

    resultCard.appendChild(title);
    resultCard.appendChild(classification);

    reasoning.innerHTML = "";

    const organismText = state.organismName
        ? `${state.organismName} was entered as the blood organism.`
        : "No organism was entered.";

    appendReasoningItem(
        reasoning,
        result.lcbi.met ? "✓" : "!",
        result.lcbi.criterion || "LCBI criterion",
        result.lcbi.reason
    );

    appendReasoningItem(
        reasoning,
        state.secondaryAssessment === "no" ? "✓" : "i",
        result.secondary
            ? "Secondary BSI attribution"
            : "Primary versus secondary review",
        result.secondary
            ? "A qualifying site-specific infection, matching blood organism, and qualifying attribution-period timing were documented."
            : "No completed secondary BSI attribution was identified in this workup."
    );

    appendReasoningItem(
        reasoning,
        result.centralLine.eligible ? "✓" : "!",
        "Central-line association",
        result.centralLine.reason
    );

    appendReasoningItem(
        reasoning,
        result.mbi.met ? "✓" : "i",
        result.mbi.criterion || "MBI-LCBI review",
        result.mbi.reason
    );

    appendReasoningItem(
        reasoning,
        result.exclusions.length > 0 ? "!" : "✓",
        "CLABSI exclusions",
        result.exclusions.length > 0
            ? result.exclusions.join("; ")
            : "No selected CLABSI exclusion was identified."
    );

    appendReasoningItem(
        reasoning,
        "i",
        "Organism",
        organismText
    );

    const documentation = createElement("div", "notice info");
    documentation.innerHTML = `
        <strong>Suggested surveillance note</strong><br>
        ${buildDocumentationSummary(result)}
    `;

    reasoning.appendChild(documentation);

    const disclaimer = createElement("div", "notice warning");
    disclaimer.innerHTML = `
        <strong>Review required:</strong>
        This starter tool does not independently verify organism eligibility,
        NHSN common-commensal status, the NHSN MBI organism list,
        infection-window dates, RIT, SBAP dates, pathogen exclusions,
        or every site-specific pathogen-assignment exception.
        Confirm the result against the current NHSN manual before reporting.
    `;

    reasoning.appendChild(disclaimer);
}

function appendReasoningItem(
    container,
    icon,
    title,
    description
) {
    const item = createElement("div", "reasoning-item");

    const iconElement = createElement(
        "span",
        "reasoning-icon",
        icon
    );

    const content = createElement("div", "reasoning-content");
    const strong = createElement("strong", null, title);
    const text = createElement("span", null, description);

    content.appendChild(strong);
    content.appendChild(text);

    item.appendChild(iconElement);
    item.appendChild(content);
    container.appendChild(item);
}

function buildDocumentationSummary(result) {
    const parts = [];

    if (result.lcbi.met) {
        parts.push(
            `Patient meets ${escapeHtml(result.lcbi.criterion)} based on the entered blood-culture and criterion elements.`
        );
    } else {
        parts.push(
            "Patient does not meet an LCBI criterion based on the entered information."
        );
    }

    if (state.organismName) {
        parts.push(
            `Blood organism: ${escapeHtml(state.organismName)}.`
        );
    }

    if (result.secondary) {
        parts.push(
            "The bloodstream infection was attributed as secondary to a qualifying site-specific infection."
        );
    } else if (result.lcbi.met) {
        parts.push(
            "No completed secondary BSI attribution was identified in this workup."
        );
    }

    if (result.centralLine.eligible) {
        parts.push(
            "An eligible central line was present on the date of event or the day before."
        );
    }

    if (result.mbi.met) {
        parts.push(
            `The event also meets ${escapeHtml(result.mbi.criterion)} criteria based on the selected host and organism factors.`
        );
    }

    if (result.exclusions.length > 0) {
        parts.push(
            `Applicable exclusion field(s): ${escapeHtml(
                result.exclusions.join(", ")
            )}.`
        );
    }

    parts.push(
        `Preliminary surveillance classification: ${escapeHtml(
            result.classification
        )}.`
    );

    return parts.join(" ");
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* ============================================================
   Navigation and progress
   ============================================================ */

function nextCard() {
    const nextIndex = Math.min(
        currentScreenIndex + 1,
        screenOrder.length - 1
    );

    goToScreen(screenOrder[nextIndex]);
}

function goToScreen(screenId) {
    const targetIndex = screenOrder.indexOf(screenId);

    if (targetIndex === -1) {
        console.error(`Unknown screen: ${screenId}`);
        return;
    }

    currentScreenIndex = targetIndex;
    renderCurrentScreen();
    updateProgress();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function renderCurrentScreen() {
    document.querySelectorAll(".card").forEach((card) => {
        card.classList.remove("active");
    });

    const activeScreen = byId(screenOrder[currentScreenIndex]);

    if (activeScreen) {
        activeScreen.classList.add("active");
    }
}

function updateProgress() {
    const activeScreenId = screenOrder[currentScreenIndex];
    const activeSidebarStep = sidebarStepMap[activeScreenId] ?? 0;

    const progressFill = byId("progressFill");
    const progressText = byId("progressText");
    const sidebarItems = Array.from(
        document.querySelectorAll(".steps li")
    );

    const totalSteps = sidebarItems.length;
    const displayedStep = Math.min(
        activeSidebarStep + 1,
        totalSteps
    );

    const percentage =
        totalSteps > 1
            ? (activeSidebarStep / (totalSteps - 1)) * 100
            : 0;

    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }

    if (progressText) {
        progressText.textContent =
            `Step ${displayedStep} of ${totalSteps}`;
    }

    sidebarItems.forEach((item, index) => {
        item.classList.toggle(
            "active",
            index === activeSidebarStep
        );

        item.classList.toggle(
            "complete",
            index < activeSidebarStep
        );
    });
}

/* Expose the original HTML function name safely. */
window.nextCard = nextCard;

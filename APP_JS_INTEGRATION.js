/*
Paste/adapt this in your existing app.js.

IMPORTANT:
Your current app.js must be loaded with:
<script type="module" src="app.js"></script>

Then add the import below at the top of app.js.
*/

import {
  loadOrganismDatabase,
  searchOrganisms
} from "./src/organism-search.js";

let organismDatabase = [];

async function initializeOrganismDatabase() {
  try {
    const database = await loadOrganismDatabase("./data/organisms.json");
    organismDatabase = database.organisms;
    console.log(`Loaded ${organismDatabase.length} organism records.`);
  } catch (error) {
    console.error("Organism database failed to load:", error);
  }
}

function findOrganismFromCultureText(cultureText) {
  return searchOrganisms(cultureText, organismDatabase, {
    limit: 5,
    minimumScore: 20
  });
}

/*
Example:

const matches = findOrganismFromCultureText(
  "Lacticaseibacillus(Lactobacillus) paracasei Abnormal"
);

const bestMatch = matches[0]?.organism;

if (bestMatch) {
  console.log(bestMatch.displayName);
  console.log(bestMatch.nhsn.classification);
  console.log(bestMatch.nhsn.mbiEligible);
}
*/

initializeOrganismDatabase();

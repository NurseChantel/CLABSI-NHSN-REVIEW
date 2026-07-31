import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSecondarySite, icDefinition, menDefinition, secondarySiteCategories, secondarySiteDefinitions, selectSecondarySite } from "./secondary-rules.js";
const expected = { BJ:["BONE","DISC","JNT","PJI"], CNS:["IC","MEN","SA"], CVS:["CARD","ENDO","MED","VASC"], EENT:["CONJ","EAR","EYE","ORAL","SINU","UR"], GI:["CDI","GE","GIT","IAB","NEC"], LRI:["LUNG"], REPR:["EMET","EPIS","OREP","VCUF"], SST:["BRST","BURN","CIRC","DECU","SKIN","ST","UMB"], USI:["USI"] };
const evaluate = (evidence, extra={}) => evaluateSecondarySite({ siteCode:"MEN", evidence, ...extra });
const support = { suspected:"met", fever:"met", "meningeal-signs":"met", "csf-gram-stain":"met" };
test("every Chapter 17 site code remains registered under the existing categories",()=>{ assert.deepEqual(Object.keys(secondarySiteDefinitions).sort(),Object.values(expected).flat().sort()); assert.deepEqual(Object.fromEntries(secondarySiteCategories.map(x=>[x.majorCategoryCode,[...x.siteCodes]])),expected); });
test("MEN 1 qualifies independently",()=>assert.equal(evaluate({"csf-organism":"met"}).metCriterion,"MEN-1"));
test("MEN 2 qualifies with two distinct finding groups and one supporting alternative",()=>assert.equal(evaluate(support).metCriterion,"MEN-2"));
test("MEN 3 qualifies only with the age branch and its complete requirements",()=>assert.equal(evaluate({"age-one-or-younger":"met",suspected:"met",hypothermia:"met","cranial-nerve-signs":"met","csf-profile":"met"}).metCriterion,"MEN-3"));
test("missing one AND requirement and unknown evidence cannot qualify",()=>{ assert.equal(evaluate({suspected:"unknown",fever:"met","meningeal-signs":"met","csf-gram-stain":"met"}).siteDefinitionMet,false); assert.equal(evaluate({suspected:"met",fever:"met","meningeal-signs":"met"}).siteDefinitionMet,false); });
test("two alternatives inside group i cannot be combined as two required finding groups",()=>assert.equal(evaluate({suspected:"met",fever:"met",headache:"met","csf-profile":"met"}).siteDefinitionMet,false));
test("MEN 2 evidence cannot qualify the age-specific MEN 3 branch",()=>{ const result=evaluate({suspected:"met",hypothermia:"met",irritability:"met","csf-profile":"met"}); assert.equal(result.siteDefinitionMet,false); });
test("a recognized cause exclusion prevents an asterisked finding from qualifying",()=>{ const result=evaluate({...support,"other-recognized-cause":"met"}); assert.equal(result.siteDefinitionMet,false); assert.equal(result.status,"exclusionApplies"); });
test("meeting MEN does not automatically establish secondary BSI attribution",()=>{ const result=evaluate({"csf-organism":"met"}); assert.equal(result.siteDefinitionMet,true); assert.equal(result.secondaryAttributionMet,false); assert.equal(evaluate({"csf-organism":"met"},{organismRelationship:"yes",attributionTiming:"yes"}).secondaryAttributionMet,true); });
test("MEN source fidelity metadata and criterion structure match the approved structured definition",()=>{ assert.equal(menDefinition.source.document,"Secondary BSI Chapter.pdf"); assert.equal(menDefinition.source.printedPage,"17-11"); assert.deepEqual(menDefinition.criteria.map(x=>x.id),["MEN-1","MEN-2","MEN-3"]); assert.equal(menDefinition.criteria[1].groups[0].minimumRequiredCount,2); assert.equal(menDefinition.criteria[2].allOf[0].id,"age-one-or-younger"); menDefinition.criteria.forEach(c=>assert.equal(c.source.sourceDataId,"MEN")); });
test("SA remains a placeholder and cannot evaluate MEN criteria",()=>{ assert.equal(secondarySiteDefinitions.SA.criteria.length,0); assert.equal(evaluateSecondarySite({siteCode:"SA",evidence:{"csf-organism":"met"}}).status,"siteNotValidated"); });
test("IC criteria 1 and 2 each qualify independently",()=>{
  assert.equal(evaluateSecondarySite({siteCode:"IC",evidence:{"brain-tissue-dura-organism":"met"}}).metCriterion,"IC-1");
  assert.equal(evaluateSecondarySite({siteCode:"IC",evidence:{"gross-histopathologic-evidence":"met"}}).metCriterion,"IC-2");
});
test("IC criterion 3 requires two findings and one complete supporting alternative",()=>{
  const complete={headache:"met",fever:"met","definitive-imaging":"met"};
  assert.equal(evaluateSecondarySite({siteCode:"IC",evidence:complete}).metCriterion,"IC-3");
  assert.equal(evaluateSecondarySite({siteCode:"IC",evidence:{headache:"met","definitive-imaging":"met"}}).siteDefinitionMet,false);
  assert.equal(evaluateSecondarySite({siteCode:"IC",evidence:{headache:"met",fever:"met"}}).siteDefinitionMet,false);
});
test("IC criterion 3 excludes only marked findings when another recognized cause applies",()=>{
  const result=evaluateSecondarySite({siteCode:"IC",evidence:{headache:"met",dizziness:"met",fever:"met","definitive-imaging":"met","other-recognized-cause":"met"}});
  assert.equal(result.siteDefinitionMet,false);
  assert.equal(result.status,"exclusionApplies");
});
test("IC criterion 4 enforces the age boundary and its complete infant pathway",()=>{
  const evidence={"age-one-or-younger":"met",fever:"met",hypothermia:"met","diagnostic-antibody":"met"};
  assert.equal(evaluateSecondarySite({siteCode:"IC",evidence}).metCriterion,"IC-4");
  assert.equal(evaluateSecondarySite({siteCode:"IC",evidence:{...evidence,"age-one-or-younger":"notMet"}}).siteDefinitionMet,false);
});
test("IC equivocal imaging requires the combined imaging and documented-treatment evidence",()=>{
  const findings={fever:"met",confusion:"met"};
  assert.equal(evaluateSecondarySite({siteCode:"IC",evidence:{...findings,"equivocal-imaging-with-treatment":"met"}}).metCriterion,"IC-3");
  assert.equal(evaluateSecondarySite({siteCode:"IC",evidence:{...findings,"definitive-imaging":"notMet"}}).siteDefinitionMet,false);
});
test("meeting IC unlocks but does not automatically establish secondary BSI attribution",()=>{
  const evidence={"brain-tissue-dura-organism":"met"};
  assert.equal(evaluateSecondarySite({siteCode:"IC",evidence}).secondaryAttributionMet,false);
  assert.equal(evaluateSecondarySite({siteCode:"IC",evidence,organismRelationship:"yes",attributionTiming:"yes"}).secondaryAttributionMet,true);
});
test("IC source fidelity metadata and pathway structure match the approved definition",()=>{
  assert.equal(icDefinition.source.document,"Secondary BSI Chapter.pdf");
  assert.equal(icDefinition.source.printedPage,"17-10–17-11");
  assert.deepEqual(icDefinition.criteria.map(({id})=>id),["IC-1","IC-2","IC-3","IC-4"]);
  assert.equal(icDefinition.criteria[2].groups[0].minimumRequiredCount,2);
  assert.equal(icDefinition.criteria[3].allOf[0].id,"age-one-or-younger");
  icDefinition.criteria.forEach(criterion=>assert.equal(criterion.source.sourceDataId,"IC"));
});
test("switching site codes clears stale evidence and attribution answers",()=>assert.deepEqual(selectSecondarySite({siteCode:"MEN",evidence:{x:"met"},organismRelationship:"yes",attributionTiming:"yes"},"SA"),{siteCode:"SA",evidence:{},organismRelationship:"",attributionTiming:""}));

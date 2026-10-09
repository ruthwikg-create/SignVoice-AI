import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LANGUAGES,isLanguage} from '../dist/languages.js';
import {COUNTRY_CODES,filterLanguages,validateWorldCatalog,validateLearningState,validateClip,safeSourceUrl,resourceStatus} from '../dist/world-engine.js';
import {validateReferenceCatalog,makePlan,recognitionStatus} from '../dist/lesson-engine.js';
import {validateDataset,trainProfile} from '../dist/recognition.js';
const world=JSON.parse(await readFile(new URL('../dist/catalog/world.json',import.meta.url),'utf8'));
test('world catalog has 87 separate profiles, 91 resource records and valid provenance',()=>{
 assert.equal(validateWorldCatalog(world),world);assert.equal(world.profiles.length,87);assert.equal(world.resources.length,91);assert.equal(new Set(world.profiles.map(p=>p.id)).size,87);
 assert.equal(new Set(world.profiles.flatMap(p=>p.countries)).size,73);
 for(const p of world.profiles)assert.ok(p.resources.every(id=>world.resources.some(r=>r.id===id)));
});
test('country filtering supports multilingual countries and exposes coverage gaps',()=>{
 assert.equal(COUNTRY_CODES.length,249);assert.equal(new Set(COUNTRY_CODES).size,249);
 const india=filterLanguages(world.profiles,{country:'IN'});assert.ok(india.some(p=>p.id==='ISL'));assert.ok(india.some(p=>p.id==='WBS'));
 assert.ok(filterLanguages(world.profiles,{country:'BE'}).length>=2);
 assert.deepEqual(filterLanguages(world.profiles,{country:'NP'}),[]);
});
test('ambiguous acronyms have separate Indian, Irish and Israeli IDs',()=>{assert.ok(isLanguage('ISL'));assert.ok(isLanguage('ISG'));assert.ok(isLanguage('ISR'));assert.notEqual(LANGUAGES.find(p=>p.id==='ISG').name,LANGUAGES.find(p=>p.id==='ISL').name);});
test('learning search handles names, countries, regions and saved-only filtering',()=>{
 assert.ok(filterLanguages(world.profiles,{query:'Australian'}).length);
 assert.ok(filterLanguages(world.profiles,{query:'Brazil'}).some(p=>p.name==='Libras'));
 assert.ok(filterLanguages(world.profiles,{region:'Africa'}).every(p=>p.region==='Africa'));
 assert.deepEqual(filterLanguages(world.profiles,{savedOnly:true,bookmarks:['ISG']}).map(p=>p.id),['ISG']);
});
test('resource access labels distinguish restricted and unavailable providers',()=>{
 assert.equal(resourceStatus({access:'Restricted access'}).kind,'restricted');
 assert.equal(resourceStatus({access:'Temporarily unavailable at time of writing'}).kind,'unavailable');
 assert.equal(resourceStatus({access:'Public access via browsable homepage'}).kind,'public');
 assert.equal(resourceStatus({access:'Open access after filling a form'}).kind,'restricted');
});
test('unsafe links, unknown profiles and missing resource IDs are rejected',()=>{
 assert.equal(safeSourceUrl('javascript:alert(1)'),false);assert.equal(safeSourceUrl('https://user:secret@example.com'),false);
 for(const update of [d=>d.profiles[0].id='INVENTED',d=>d.profiles[0].resources.push('missing'),d=>d.resources[0].urls=['data:text/html,x']]){const copy=structuredClone(world);update(copy);assert.throws(()=>validateWorldCatalog(copy));}
});
test('learning-progress imports keep registered profiles, deduplicate and limit notes',()=>{
 const state=validateLearningState({bookmarks:['ASL','ASL','FAKE'],practiced:['ISG'],notes:{ASL:'x'.repeat(5000),FAKE:'ignored'}});
 assert.deepEqual(state.bookmarks,['ASL']);assert.equal(state.notes.ASL.length,1000);assert.equal(state.notes.FAKE,undefined);
});
test('personal lesson clips require permission, known language, allowed MIME and size bounds',()=>{
 const file={size:1024,type:'video/mp4'};assert.equal(validateClip(file,'hello','BFI',true),true);
 assert.throws(()=>validateClip(file,'hello','BFI',false),/permission/);
 assert.throws(()=>validateClip({...file,size:101*1024*1024},'hello','BFI',true),/100 MB/);
 assert.throws(()=>validateClip({...file,type:'text/html'},'hello','BFI',true),/MP4/);
 assert.throws(()=>validateClip(file,'hello','FAKE',true),/language/);
});
test('international reference catalogs build isolated practice without ASL fallback or automatic recognition',()=>{
 const e={id:'bsl-hello',language:'BFI',label:'hello',aliases:[],kind:'reference',source:'Verified source',referenceUrl:'https://example.org/hello',media:null};
 assert.equal(validateReferenceCatalog({schemaVersion:1,entries:[e]}).entries[0],e);
 assert.equal(makePlan('hello unknown','BFI',[e]).steps[1].kind,'missing');
 assert.equal(recognitionStatus(e).ready,false);
 assert.equal(makePlan('unknown','JSL',[]).steps[0].kind,'missing');
});
test('international recording imports remain profile-specific and reject invented languages',()=>{
 const e={id:'hello',language:'BFI',label:'hello',speech:'hello',kind:'motion',samples:[]};
 assert.equal(validateDataset({schemaVersion:1,featureVersion:'hands-v1-132',entries:[e]}).entries[0],e);
 assert.equal(trainProfile([e],'ASL').classes.length,0);
 assert.throws(()=>validateDataset({schemaVersion:1,featureVersion:'hands-v1-132',entries:[{...e,language:'FAKE'}]}),/entry/);
});
test('offline shell includes first-party modules and worker, and every listed shell asset exists',async()=>{
 const worker=await readFile(new URL('../dist/sw.js',import.meta.url),'utf8');
 const listed=[...worker.split('const SHELL=')[1].split(';')[0].matchAll(/'\.\/([^']*)'/g)].map(m=>m[1]||'index.html');
 for(const p of listed)await readFile(new URL('../dist/'+p,import.meta.url));
 assert.ok(listed.includes('vision.worker.js'));assert.ok(listed.includes('catalog/asl.json'));assert.ok(listed.includes('catalog/isl.json'));
 assert.ok(!listed.some(p=>p.startsWith('http')));
});


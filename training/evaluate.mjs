// Evaluate the actual browser DTW model on held-out sessions or signers.
import {readFile,writeFile} from 'node:fs/promises';
import {trainProfile,predictProfile,validateDataset,NEUTRAL} from '../dist/recognition.js';
const [file,language,groupField='session',output='evaluation.json']=process.argv.slice(2);
if(!file||!['ISL','ASL'].includes(language)||!['session','signer'].includes(groupField)){console.error('Usage: node training/evaluate.mjs recordings.json ISL|ASL session|signer output.json');process.exit(1);}
const data=validateDataset(JSON.parse(await readFile(file,'utf8')));
const entries=data.entries.filter(e=>e.language===language);
const groups=[...new Set(entries.flatMap(e=>e.samples.map(s=>s[groupField])))];
if(groups.length<2)throw Error(`Need at least 2 distinct ${groupField} IDs to evaluate without overlapping recordings.`);
let correct=0,total=0,rejected=0,falseAcceptance=0,unknownTotal=0;const folds=[],confusion={};
for(const heldout of groups){
  const train=entries.map(e=>({...e,samples:e.samples.filter(s=>s[groupField]!==heldout)}));
  const test=entries.flatMap(e=>e.samples.filter(s=>s[groupField]===heldout).map(s=>({e,s})));
  const model=trainProfile(train,language);
  const missing=entries.filter(e=>!model.classes.some(c=>c.id===e.id));
  if(missing.length||!model.classes.some(c=>c.id===NEUTRAL)){folds.push({heldout,skipped:true,reason:'At least 3 training examples per class, including background, are required outside the held-out group.',missing:missing.map(e=>e.label)});continue;}
  let foldCorrect=0;
  for(const {e,s} of test){const p=predictProfile(s.frames,model),predicted=p?.id||NEUTRAL;if(predicted===e.id){correct++;foldCorrect++;}if(!p)rejected++;if(e.id===NEUTRAL){unknownTotal++;if(p)falseAcceptance++;}const expected=e.label,key=predicted===NEUTRAL?'REJECTED / BACKGROUND':model.classes.find(c=>c.id===predicted)?.label;confusion[expected]||={};confusion[expected][key]=(confusion[expected][key]||0)+1;total++;}
  folds.push({heldout,testSamples:test.length,accuracy:test.length?foldCorrect/test.length:null});
}
if(!total)throw Error('No valid evaluation folds. Record additional sessions, with at least 3 training examples per class outside each held-out session.');
const report={language,model:'personal DTW',featureVersion:data.featureVersion,groupField,total,accuracy:correct/total,rejectionRate:rejected/total,backgroundFalseAcceptanceRate:unknownTotal?falseAcceptance/unknownTotal:null,folds,confusion,limitations:'Offline full-clip classification only; not real-time event precision, translation quality or unseen-signer performance unless signer holdout was used.'};
await writeFile(output,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));

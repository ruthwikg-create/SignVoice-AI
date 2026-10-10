import {isLanguage} from './languages.js';
import {HANDSHAPE_NAMES} from './vendor/sign-avatar/sign-handshapes.js';
import {SignTimeline,posePhase,restingPose} from './vendor/sign-avatar/sign-clip.js';
export const MOTION_KEY='signvoice-motion-packs-v1';
export const PLACES=['sternum','belly','chin','mouth','nose','forehead','shoulder','hip','head','neck','chest'];
export const DIRECTIONS=['up','down','forward','back','in','out'];
export const FACES=['neutral','question','wh','negate','topic','pleasant','concern','intense'];
const fail=message=>{throw Error(message);};
const num=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max?n:fail('Motion values are outside safe limits.');
const str=(s,max,required=false)=>typeof s==='string'&&s.length<=max&&(!required||s.trim())?s.trim():fail('Motion text is missing or too long.');
export function motionTokens(text,language){
 const clean=text.normalize('NFKC').toLocaleUpperCase('en-US'),locale={CSL:'zh',HKS:'zh-Hant',TSE:'zh-Hant',JSL:'ja'}[language];
 if(locale&&/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(clean)&&typeof Intl.Segmenter==='function')return [...new Intl.Segmenter(locale,{granularity:'word'}).segment(clean)].filter(s=>s.isWordLike).map(s=>s.segment);
 return clean.match(/[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}\p{N}]+)*/gu)||[];
}
export const motionLabel=(text,language)=>motionTokens(text,language).join(' ');
function hand(value){
 if(value==='rest')return 'rest';
 if(!value||typeof value!=='object'||!HANDSHAPE_NAMES.includes(value.shape)||!PLACES.includes(value.at?.anchor)||!DIRECTIONS.includes(value.fingers)||!DIRECTIONS.includes(value.palm))fail('Choose a supported handshape, body location and orientation.');
 const at={anchor:value.at.anchor};for(const key of ['out','up','forward'])at[key]=num(value.at[key]??0,-.55,.55);
 // Parallel orientation axes cannot define a stable hand rotation.
 if(value.fingers===value.palm||[['up','down'],['forward','back'],['in','out']].some(pair=>pair.includes(value.fingers)&&pair.includes(value.palm)))fail('Finger direction and palm direction must use different axes.');
 return {shape:value.shape,at,fingers:value.fingers,palm:value.palm};
}
export function validateMotionPack(data){
 if(data?.version!==1||!Array.isArray(data.motions)||data.motions.length>200)fail('Use a version 1 motion pack with up to 200 motions.');
 const seen=new Set(),motions=[];
 for(const input of data.motions){
  if(!isLanguage(input?.language))fail('Unknown sign language in motion pack.');
  const label=str(input.label,200,true),key=motionLabel(label,input.language);if(!key)fail('Use letters or digits in the motion label.');
  const identity=input.language+'|'+key;if(seen.has(identity))fail('Duplicate motion label in this language.');seen.add(identity);
  const source=str(input.source,1000,true);let url;try{url=new URL(source);}catch{fail('Add an HTTPS reference for the motion.');}if(url.protocol!=='https:'||url.username||url.password)fail('Motion references must use HTTPS.');
  if(!Array.isArray(input.phases)||!input.phases.length||input.phases.length>24)fail('Each motion needs 1–24 movement steps.');
  let duration=.35;const phases=input.phases.map(p=>{const t=num(p.t,.1,3),hold=num(p.hold??0,0,3);duration+=t+hold;if(!FACES.includes(p.face??'neutral'))fail('Unsupported face setting.');return {t,hold,right:hand(p.right??'rest'),left:hand(p.left??'rest'),face:p.face??'neutral',head:{nod:num(p.head?.nod??0,-35,35),turn:num(p.head?.turn??0,-45,45),tilt:num(p.head?.tilt??0,-25,25)}};});
  if(duration>30)fail('A saved motion may last up to 30 seconds.');
  const speech={};for(const [locale,text] of Object.entries(input.speech||{})){if(!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(locale)||Object.keys(speech).length>=30)fail('Unsupported spoken-language tag.');speech[locale]=str(text,1000,true);}
  motions.push({language:input.language,label,key,source,description:str(input.description??'',1000),reviewer:str(input.reviewer??'',100),speech,phases});
 }
 return {version:1,motions};
}
export function buildMotionClip(motion){const timeline=new SignTimeline({base:restingPose()});for(const p of motion.phases)timeline.to(posePhase(p),p.t).hold(p.hold);return timeline.settle(.35).build({name:motion.language+'-'+motion.key});}
export function mergeMotionPacks(current,incoming){const map=new Map(current.motions.map(m=>[m.language+'|'+m.key,m]));for(const m of incoming.motions)map.set(m.language+'|'+m.key,m);return validateMotionPack({version:1,motions:[...map.values()]});}
// Longest exact label first. An entire sentence can be a reviewed recorded sequence;
// word sequences do not infer the grammar of the selected sign language.
export function matchMotionSequence(text,language,motions){
 if(typeof text!=='string'||!text.trim())fail('Type a sentence first.');
 const tokens=motionTokens(text,language);if(!tokens.length)fail('Type words to animate.');if(text.length>400||tokens.length>40)fail('Use up to 40 words and 400 characters per animation.');
 if(/[^\p{L}\p{M}\p{N}\p{P}\p{Z}\s]/u.test(text))fail('Remove symbols or emoji from the motion sequence.');
 const available=motions.filter(m=>m.language===language).map(m=>({...m,tokens:motionTokens(m.label,language)})).sort((a,b)=>b.tokens.length-a.tokens.length),parts=[],missing=[];
 for(let i=0;i<tokens.length;){const found=available.find(m=>m.tokens.every((t,j)=>tokens[i+j]===t));if(found){parts.push(found);i+=found.tokens.length;}else{missing.push(tokens[i]);i++;}}
 return {parts,missing,tokens};
}
export function compileMotionSequence(text,language,motions){
 const {parts,missing}=matchMotionSequence(text,language,motions);if(missing.length)fail('No '+language+' motion for: '+[...new Set(missing)].join(', ')+'. Add a sourced motion or use reference practice. No substitute signs are played.');
 const clips=parts.map(buildMotionClip),duration=clips.reduce((sum,c)=>sum+c.duration,0);if(duration>180)fail('This animation exceeds 3 minutes. Split the text.');
 const names=new Map();for(const clip of clips)for(const track of clip.tracks)names.set(track.name,track.type);
 const tracks=[...names].map(([name,type])=>({name,type,times:[],values:[]}));let offset=0;const segments=[];
 for(let i=0;i<clips.length;i++){const clip=clips[i],motion=parts[i];segments.push({word:motion.label,signed:true,start:offset,end:offset+clip.duration,letters:[],gloss:motion.description,source:motion.source,speech:motion.speech,reviewer:motion.reviewer,custom:true});
  for(const out of tracks){const track=clip.tracks.find(t=>t.name===out.name),stride=out.type==='quaternion'?4:1;if(track){for(let k=0;k<track.times.length;k++){const t=offset+track.times[k];if(out.times.at(-1)===t){out.values.splice(-stride,stride,...track.values.slice(k*stride,(k+1)*stride));}else{out.times.push(t);out.values.push(...track.values.slice(k*stride,(k+1)*stride));}}}else{for(const t of [offset,offset+clip.duration]){if(out.times.at(-1)===t)out.values.splice(-stride,stride,...(stride===4?[0,0,0,1]:[0]));else{out.times.push(t);out.values.push(...(stride===4?[0,0,0,1]:[0]));}}}}
  offset+=clip.duration;
 }
 return {clip:{name:'personal-motion-sequence',duration,tracks},segments,signed:segments.map(s=>s.word),spelled:[],language,translation:false,mode:'personal-sourced-motion'};
}

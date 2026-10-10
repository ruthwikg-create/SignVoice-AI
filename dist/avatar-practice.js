import {isLanguage} from './languages.js';
export const PRACTICE_KEY='signvoice-character-practice-v1';
export function cleanPractice(value){
 const phrases=[],seen=new Set();for(const item of Array.isArray(value?.phrases)?value.phrases:[]){if(!isLanguage(item?.language)||typeof item.text!=='string'||!item.text.trim()||item.text.length>400)continue;const key=item.language+'|'+item.text.trim();if(seen.has(key))continue;seen.add(key);phrases.push({language:item.language,text:item.text.trim()});if(phrases.length===20)break;}
 return {version:1,phrases,sessions:Number.isSafeInteger(value?.sessions)?Math.max(0,Math.min(value.sessions,100000)):0,reviewed:[...new Set((Array.isArray(value?.reviewed)?value.reviewed:[]).filter(w=>typeof w==='string'&&(/^[A-Z0-9]{1,40}$/.test(w)||(isLanguage(w.split(':')[0])&&/^[\p{L}\p{M}\p{N} '’]{1,200}$/u.test(w.slice(w.indexOf(':')+1))))))].slice(0,200)};
}
export function savePhrase(state,language,text){
 if(!isLanguage(language)||typeof text!=='string'||!text.trim()||text.length>400)throw Error('Save a phrase of up to 400 characters in a selected sign language.');
 return cleanPractice({...state,phrases:[{language,text:text.trim()},...state.phrases]});
}
export function recordPractice(state,plan){return cleanPractice({...state,sessions:state.sessions+1,reviewed:[...state.reviewed,...plan.signed.map(word=>plan.language==='ASL'?word:plan.language+':'+word)]});}
export function advancePractice(plan,time,delta,{repeatWord=false,pauseWord=false,loop=false,focusStart=null}={}){
 const current=plan.segments.find(s=>s.start===focusStart)||plan.segments.find(s=>time<s.end)||plan.segments.at(-1),next=time+Math.max(0,delta);
 if(current&&next>=current.end&&(repeatWord||pauseWord))return repeatWord?{time:current.start,stop:false,focusStart:current.start}:{time:Math.max(current.start,current.end-.001),stop:true,focusStart:null};
 if(next>=plan.clip.duration)return {time:loop?0:plan.clip.duration,stop:!loop,focusStart:null};
 return {time:next,stop:false,focusStart:null};
}

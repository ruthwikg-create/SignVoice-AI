import test from 'node:test';
import assert from 'node:assert/strict';
import {COACHING,matchingVoices,narrationFor,createPracticeSpeech} from '../dist/practice-speech.js';
test('coaching uses localized prompts or motion-specific narration without pretending a voice translates text',()=>{
 assert.equal(Object.keys(COACHING).length,12);const segment={word:'HOME',signed:true,gloss:'Touch the cheek.',speech:{hi:'गाल को छुएँ।'}};
 assert.equal(narrationFor(segment,'hi-IN'),'गाल को छुएँ।');assert.match(narrationFor(segment,'en'),/Touch the cheek/);assert.match(narrationFor({...segment,speech:{}},'hi'),/हाथ/);assert.equal(narrationFor(segment,'ar'),'');assert.match(narrationFor({signed:false,word:'TO'},'en'),/fingerspelled/);
 assert.deepEqual(matchingVoices([{lang:'en-US'},{lang:'hi-IN'},{lang:'zh_CN'}],'zh-TW'),[{lang:'zh_CN'}]);assert.deepEqual(matchingVoices([{lang:'en-US'}],'hi'),[]);
});
test('narration completion resolves clock gating, cancellations settle it and unavailable voices never use the wrong language',async()=>{
 const original=globalThis.document,elements=new Map(),messages=[];const get=id=>{if(!elements.has(id))elements.set(id,{value:'',children:[],replaceChildren(){this.children=[];},append(o){this.children.push(o);if(!this.value)this.value=o.value;}});return elements.get(id);};globalThis.document={getElementById:get,createElement(){return {};}};
 const utterances=[],synth={getVoices:()=>[{voiceURI:'english',name:'English',lang:'en-US',localService:true}],cancel(){},speak(u){utterances.push(u);},addEventListener(){}};
 try{get('coach-language').value='en';get('coach-rate').value='.8';get('coach-volume').value='1';const speech=createPracticeSpeech({getSegment:()=>({word:'HOME',signed:true,gloss:'Touch cheek.'}),toast:m=>messages.push(m),synth,Utterance:class{constructor(text){this.text=text;}}});get('coach-voice').value='english';
 const done=speech.narrate();assert.equal(utterances[0].lang,'en-US');assert.equal(utterances[0].rate,.8);utterances[0].onend();await done;
 const interrupted=speech.narrate();speech.stop();await interrupted;get('coach-language').value='hi';get('coach-language').onchange();get('coach-voice').value='';speech.narrate();assert.equal(utterances.length,2);assert.match(messages.at(-1),/installed voice/);
 }finally{if(original===undefined)delete globalThis.document;else globalThis.document=original;}
});

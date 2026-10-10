import test from 'node:test';
import assert from 'node:assert/strict';
import {createAvatarUI} from '../dist/avatar-ui.js';

// A small DOM surface for lifecycle checks, not a browser rendering test.
test('character controls reset on input/language changes and stop on reference/view handoff',async()=>{
 const originals=Object.fromEntries(['document','requestAnimationFrame','cancelAnimationFrame'].map(k=>[k,globalThis[k]]));
 const callbacks=new Map(),events=new Map(),elements=new Map();let serial=0,language='ASL',handoffs=0,referenceHandoffs=0;
 function element(){const classes=new Set();return {value:'',textContent:'',innerHTML:'',dataset:{},children:[],hidden:false,disabled:false,classList:{toggle(name,on){on?classes.add(name):classes.delete(name);}},setAttribute(k,v){this[k]=v;},append(...items){this.children.push(...items);},replaceChildren(...items){this.children=[...items];},addEventListener(name,fn){this[name]=fn;}};}
 const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
 globalThis.document={getElementById:get,createElement:element,querySelectorAll(){return get('avatar-words').children;},addEventListener(name,fn){events.set(name,fn);},hidden:false};
 globalThis.requestAnimationFrame=fn=>{callbacks.set(++serial,fn);return serial;};globalThis.cancelAnimationFrame=id=>callbacks.delete(id);
 get('lesson-display-mode').value='avatar';get('avatar-speed').value='1';get('lesson-text').value='I want to go home';get('avatar-render-style').value='human';get('avatar-focus').value='body';get('avatar-zoom').value='1';const rendered=[],canvas=element();
 try{
  const ui=createAvatarUI({getLanguage:()=>language,getText:()=>get('lesson-text').value,toast:assert.fail,onAvatarMode:()=>handoffs++,onReferenceMode:()=>referenceHandoffs++,createStage:async()=>({render(pose,options){rendered.push(options);},dispose(){},canvas})});
  ui.build();assert.equal(get('avatar-words').children.length,5);assert.equal(get('avatar-play').disabled,false);assert.equal(callbacks.size,1);assert.ok(handoffs>0);
  await Promise.resolve();assert.equal(get('avatar-hand-labels').hidden,false);assert.ok(rendered.length);
  get('avatar-focus').value='right';get('avatar-focus').onchange();assert.equal(rendered.at(-1).focus,'right');get('avatar-angle').value='65';get('avatar-angle').onchange();assert.equal(rendered.at(-1).yaw,65);
  get('avatar-play').onclick();assert.equal(callbacks.size,0);get('avatar-replay').onclick();assert.equal(callbacks.size,1);
  get('avatar-next').onclick();assert.equal(callbacks.size,0);assert.match(get('avatar-subtitle').textContent,/WANT/);
  const before=Number(get('avatar-seek').value);get('avatar-frame-next').onclick();assert.ok(Math.abs(Number(get('avatar-seek').value)-before-1/15)<.0001);
  get('avatar-seek').value='2';get('avatar-seek').oninput();assert.match(get('avatar-time').textContent,/2.0/);
  get('avatar-reference-mode').onclick();assert.equal(get('avatar-panel').hidden,true);assert.equal(get('lesson-reference-grid').hidden,false);assert.equal(referenceHandoffs,1);
  get('lesson-display-mode').value='avatar';get('lesson-display-mode').onchange();assert.equal(callbacks.size,1);
  ui.onView('library');assert.equal(callbacks.size,0);
  language='ISL';ui.invalidate();assert.equal(get('avatar-stage').hidden,true);assert.equal(get('lesson-reference-grid').hidden,false);assert.equal(get('avatar-words').children.length,0);assert.equal(get('avatar-play').disabled,true);assert.match(get('avatar-language-note').textContent,/No ASL/);
  ui.build();assert.equal(callbacks.size,0);
  language='ASL';get('lesson-text').value='home';ui.build();assert.equal(callbacks.size,1);
  get('lesson-text').input();assert.equal(callbacks.size,0);assert.equal(get('avatar-play').disabled,true);assert.equal(get('avatar-seek').max,'0');
  ui.build();document.hidden=true;events.get('visibilitychange')();assert.equal(callbacks.size,0);
  get('avatar-render-style').value='lightweight';get('avatar-render-style').onchange();assert.equal(get('avatar-hand-labels').hidden,true);assert.ok(get('avatar-stage').innerHTML.includes('Enlarged right hand'));
  get('avatar-render-style').value='human';get('avatar-render-style').onchange();assert.equal(get('avatar-stage').children[0],canvas);
 }finally{for(const [key,value] of Object.entries(originals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});

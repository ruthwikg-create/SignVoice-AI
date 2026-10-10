import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMotionPack,mergeMotionPacks,compileMotionSequence,matchMotionSequence} from '../dist/motion-packs.js';
import {compileAvatar,sampleAvatar} from '../dist/avatar-engine.js';
const phase={t:.4,hold:.3,right:{shape:'5',at:{anchor:'sternum',out:.15,up:0,forward:.2},fingers:'up',palm:'forward'},left:'rest',face:'neutral'};
// Synthetic test fixtures are geometry demonstrations, not real sign definitions.
const motion=(language,label)=>({language,label,source:'https://example.org/fixture',description:'Test pose',speech:{hi:'धीरे-धीरे देखें।'},phases:[phase]});
const pack=(...motions)=>validateMotionPack({version:1,motions});
test('native-script sourced motions compile for Indian ISL and remain profile-specific',()=>{
 const data=pack(motion('ISL','घर'),motion('ILS','home'),motion('KVK','home'),motion('XKI','home'));
 const plan=compileMotionSequence('घर','ISL',data.motions);assert.equal(plan.language,'ISL');assert.equal(plan.translation,false);assert.equal(plan.segments[0].custom,true);assert.deepEqual(plan.signed,['घर']);assert.deepEqual(plan.spelled,[]);
 assert.equal(plan.segments[0].speech.hi,'धीरे-धीरे देखें।');assert.throws(()=>compileMotionSequence('home','ISL',data.motions),/No ISL motion/);assert.throws(()=>compileMotionSequence('घर','ILS',data.motions),/No ILS motion/);
 for(const t of [0,.5,plan.clip.duration])assert.ok(sampleAvatar(plan.clip,t).worldPos('RightHand').every(Number.isFinite));
});
test('full phrase wins over individual words and gaps refuse partial animation',()=>{
 const data=pack(motion('ISL','I want to go home'),motion('ISL','home'),motion('ISL','go'));
 assert.equal(compileMotionSequence('I want to go home!','ISL',data.motions).segments.length,1);
 assert.deepEqual(matchMotionSequence('go unknown home','ISL',data.motions).missing,['UNKNOWN']);
 assert.throws(()=>compileMotionSequence('go unknown home','ISL',data.motions),/UNKNOWN/);
 assert.throws(()=>compileMotionSequence('home 🏠','ISL',data.motions),/emoji/);
});
test('motion joins have monotonic finite normalized bone and scalar facial tracks',()=>{
 const data=pack(motion('ILS','one'),{...motion('ILS','two'),phases:[{...phase,face:'question',head:{turn:25,nod:10,tilt:0}}]});
 const plan=compileMotionSequence('one two one','ILS',data.motions);
 for(const track of plan.clip.tracks){const stride=track.type==='quaternion'?4:1;assert.equal(track.values.length,track.times.length*stride);assert.ok(track.values.every(Number.isFinite));for(let i=1;i<track.times.length;i++)assert.ok(track.times[i]>track.times[i-1]);if(stride===4)for(let i=0;i<track.values.length;i+=4)assert.ok(Math.abs(Math.hypot(...track.values.slice(i,i+4))-1)<.001);}
 assert.equal(plan.segments[2].end,plan.clip.duration);
});
test('malformed, huge, unsafe and degenerate motion definitions are rejected atomically',()=>{
 for(const change of [{source:'javascript:alert(1)'},{language:'made-up'},{phases:[]},{phases:[{...phase,t:0}]},{phases:[{...phase,right:{...phase.right,palm:'up'}}]},{speech:{xx:'x'.repeat(1001)}},{phases:[{...phase,right:{...phase.right,at:{anchor:'unknown'}}}]}])assert.throws(()=>pack({...motion('ISL','test'),...change}));
 assert.throws(()=>pack(motion('ISL','test'),motion('ISL','TEST')),/Duplicate/);assert.throws(()=>pack(...Array.from({length:201},(_,i)=>motion('ISL','test'+i))),/200/);
 assert.throws(()=>compileMotionSequence('home '.repeat(41),'ILS',pack(motion('ILS','home')).motions),/40 words/);
});
test('replacing a motion keeps language namespaces separate and ASL custom words integrate without changing other profiles',()=>{
 const a=pack(motion('ISL','home'),motion('ILS','home')),b=pack({...motion('ISL','home'),description:'replacement'}),merged=mergeMotionPacks(a,b);assert.equal(merged.motions.length,2);assert.equal(merged.motions.find(m=>m.language==='ILS').description,'Test pose');
 const asl=pack(motion('ASL','quokka'),motion('ISL','water'));const plan=compileAvatar('quokka home water','ASL',{motions:asl.motions});assert.deepEqual(plan.signed,['QUOKKA','HOME']);assert.deepEqual(plan.spelled,['WATER']);assert.equal(plan.segments[0].custom,true);assert.equal(plan.segments[2].custom,false);assert.equal(plan.segments[0].source,'https://example.org/fixture');
});

test('native Chinese matching and all registered profiles can carry separate sourced geometry',async()=>{
 const {LANGUAGES}=await import('../dist/languages.js');for(const language of LANGUAGES){const data=pack(motion(language.id,'fixture'));const plan=compileMotionSequence('fixture',language.id,data.motions);assert.equal(plan.language,language.id);assert.ok(sampleAvatar(plan.clip,.3).worldPos('RightHand').every(Number.isFinite));}
 const data=pack(motion('CSL','我'),motion('CSL','回家'));assert.deepEqual(compileMotionSequence('我回家','CSL',data.motions).segments.map(s=>s.word),['我','回家']);
});

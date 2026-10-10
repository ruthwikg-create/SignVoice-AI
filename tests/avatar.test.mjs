import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compileAvatar,sampleAvatar,sampleTrack,activeAvatarSegment,AVATAR_WORDS} from '../dist/avatar-engine.js';
import {avatarGeometry,renderAvatarFrame} from '../dist/avatar-renderer.js';
import {handPoint,anchorPoint} from '../dist/vendor/sign-avatar/sign-rig.js';

test('requested sentence keeps every word and marks fingerspelling explicitly',()=>{
 const plan=compileAvatar('I want to go home');
 assert.deepEqual(plan.segments.map(s=>[s.word,s.signed]),[['I',true],['WANT',true],['TO',false],['GO',true],['HOME',true]]);
 assert.deepEqual(plan.spelled,['TO']);assert.deepEqual(plan.segments[2].letters.map(l=>l.letter),['T','O']);
 assert.equal(plan.translation,false);assert.equal(plan.language,'ASL');
 assert.ok(plan.clip.duration>4&&plan.clip.duration<10);
});
test('no ASL substitution for other sign languages',()=>{
 for(const language of ['ISL','BSL','Auslan','NZSL','LSF','KSL','KSL-KE','IS'])assert.throws(()=>compileAvatar('home',language),/only.*ASL/);
});
test('unknown words do not use inaccurate synonym aliases',()=>{
 const plan=compileAvatar('my need like quokka');
 assert.deepEqual(plan.signed,[]);assert.deepEqual(plan.spelled,['MY','NEED','LIKE','QUOKKA']);
 assert.deepEqual(compileAvatar('hi thanks').signed,['HI','THANKS']);
});
test('unsupported scripts, empty text and excessive length fail without partial playback',()=>{
 for(const text of ['', '...', 'घर', 'home 🏠'])assert.throws(()=>compileAvatar(text));
 assert.throws(()=>compileAvatar('a '.repeat(41)),/40 words/);
 assert.throws(()=>compileAvatar('z'.repeat(401)),/400 characters/);
 assert.throws(()=>compileAvatar('z'.repeat(390)),/3 minutes/);
});
test('alphabet, digits and moving J/Z compile with letter subtitles',()=>{
 const plan=compileAvatar('abcdefghijklmnopqrstuvwxyz 0123456789');
 assert.equal(plan.segments.flatMap(s=>s.letters).length,36);
 const segment=plan.segments[0],j=segment.letters.find(l=>l.letter==='J');
 const a=sampleAvatar(plan.clip,j.start+.05).worldPos('RightHand'),b=sampleAvatar(plan.clip,j.end-.05).worldPos('RightHand');
 assert.ok(Math.hypot(...a.map((v,i)=>v-b[i]))>.005);
});
test('every bundled word compiles finite normalized motion and articulated fingers',()=>{
 assert.equal(AVATAR_WORDS.length,37);
 for(const word of AVATAR_WORDS){const plan=compileAvatar(word);assert.deepEqual(plan.signed,[word]);
  for(const track of plan.clip.tracks){const stride=track.type==='quaternion'?4:1;assert.equal(track.values.length,track.times.length*stride,word);
   for(let i=1;i<track.times.length;i++)assert.ok(track.times[i]>=track.times[i-1],word);
   if(stride===4)for(let i=0;i<track.values.length;i+=4)assert.ok(Math.abs(Math.hypot(...track.values.slice(i,i+4))-1)<.001,word);
  }
  for(const t of [0,plan.clip.duration*.5,plan.clip.duration]){const g=avatarGeometry(sampleAvatar(plan.clip,t));for(const hand of Object.values(g.hands)){assert.equal(Object.keys(hand.fingers).length,5);for(const points of Object.values(hand.fingers))assert.ok(points.flat().every(Number.isFinite),word);}}
 }
});
test('HOME fingertips contact mouth corner then upper cheek, WANT pulls back, GO moves forward',()=>{
 const home=compileAvatar('home'),first=sampleAvatar(home.clip,.4),last=sampleAvatar(home.clip,.8);
 const tip=handPoint(first,'Right'),mouth=anchorPoint(first,'mouth');
 assert.ok(Math.abs(tip[0]-mouth[0]+.055)<.005);assert.ok(Math.abs(tip[1]-mouth[1]+.012)<.005);
 assert.ok(handPoint(last,'Right')[1]-tip[1]>.06);
 const want=compileAvatar('want');assert.ok(sampleAvatar(want.clip,.4).worldPos('RightHand')[2]-sampleAvatar(want.clip,.8).worldPos('RightHand')[2]>.12);
 const go=compileAvatar('go');assert.ok(sampleAvatar(go.clip,.8).worldPos('RightHand')[2]-sampleAvatar(go.clip,.4).worldPos('RightHand')[2]>.15);
});
test('facial channels use one scalar per key across a multiword sequence',()=>{
 const plan=compileAvatar('yes no hello thank');
 const tracks=plan.clip.tracks.filter(t=>t.type==='number');assert.ok(tracks.length);
 for(const track of tracks){assert.equal(track.values.length,track.times.length);for(let t=0;t<plan.clip.duration;t+=.07){const value=sampleTrack(track,t)[0];assert.ok(Number.isFinite(value)&&value>=0&&value<=1);}}
});
test('interpolation is clamped, follows shortest quaternion path, and labels respect gaps',()=>{
 const scalar={type:'number',times:[0,1],values:[0,1]};assert.deepEqual(sampleTrack(scalar,-1),[0]);assert.deepEqual(sampleTrack(scalar,.5),[.5]);assert.deepEqual(sampleTrack(scalar,2),[1]);
 const q=sampleTrack({type:'quaternion',times:[0,1],values:[0,0,0,1,0,0,0,-1]},.5);assert.ok(Math.abs(q[3])>.999);
 const plan=compileAvatar('home want');assert.equal(activeAvatarSegment(plan,plan.clip.duration),null);
 assert.equal(activeAvatarSegment(plan,plan.segments[1].start).word,'WANT');
});
test('SVG output escapes labels and all viewing angles have finite geometry',()=>{
 const p=compileAvatar('home'),pose=sampleAvatar(p.clip,.4);
 for(const yaw of [-35,0,35]){const svg=renderAvatarFrame(pose,{yaw,word:'<img onerror="bad">'});assert.ok(!/NaN|Infinity|<img/.test(svg));assert.ok(svg.includes('&lt;img'));assert.ok(svg.includes('role="img"'));assert.ok(svg.match(/<path/g).length>35);}
});
test('offline shell includes every local avatar module import',async()=>{
 const sw=await readFile(new URL('../dist/sw.js',import.meta.url),'utf8');
 for(const file of ['avatar-engine.js','avatar-renderer.js','avatar-ui.js','vendor/sign-avatar/sign-rig.js','vendor/sign-avatar/sign-clip.js','vendor/sign-avatar/sign-dictionary.js','vendor/sign-avatar/sign-handshapes.js','vendor/sign-avatar/sign-speech.js','vendor/sign-avatar/fingerspelling.js','vendor/sign-avatar/animation-canonical-rest.js'])assert.ok(sw.includes("'./"+file+"'"),file);
});

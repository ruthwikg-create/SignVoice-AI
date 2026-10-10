import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import * as THREE from '../dist/vendor/three/three.module.min.js';
import {GLTFLoader} from '../dist/vendor/three/GLTFLoader.js';
import {createHumanRig} from '../dist/human-rig.js';
import {compileAvatar,sampleAvatar,AVATAR_WORDS} from '../dist/avatar-engine.js';
import {cameraForPoints} from '../dist/avatar-camera.js';
import {advancePractice,cleanPractice,savePhrase,recordPractice} from '../dist/avatar-practice.js';
import {renderHandDetail} from '../dist/avatar-renderer.js';

const compressed=await readFile(new URL('../dist/models/signer/eva.glb.gz',import.meta.url)),raw=gunzipSync(compressed),jsonLength=raw.readUInt32LE(12),doc=JSON.parse(raw.subarray(20,20+jsonLength));
// Parse the shipped skeleton and weighted surfaces on the CPU. Omit textures
// only in this fixture; this does not claim to be a WebGL/browser test.
const geometryDoc=structuredClone(doc);delete geometryDoc.images;delete geometryDoc.textures;delete geometryDoc.materials;
for(const mesh of geometryDoc.meshes)for(const primitive of mesh.primitives)delete primitive.material;
let json=Buffer.from(JSON.stringify(geometryDoc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
const binary=raw.subarray(20+jsonLength),header=Buffer.from(raw.subarray(0,20));header.writeUInt32LE(20+json.length+binary.length,8);header.writeUInt32LE(json.length,12);
const fixture=Buffer.concat([header,json,binary]),asset=await new GLTFLoader().parseAsync(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),'');
const rig=createHumanRig(asset.scene);

test('human asset is a bounded self-contained GLB with textures and facial channels',()=>{
 assert.ok(compressed.length<2_500_000);assert.equal(raw.readUInt32LE(0),0x46546c67);assert.equal(raw.readUInt32LE(8),raw.length);
 for(const image of doc.images){assert.ok(!image.uri);const view=doc.bufferViews[image.bufferView];assert.ok(view.byteOffset+view.byteLength<=doc.buffers[0].byteLength);assert.ok(['image/jpeg','image/png'].includes(image.mimeType));}
 assert.equal(doc.meshes[0].extras.targetNames.length,15);assert.equal(doc.extensionsRequired,undefined);assert.ok(!doc.animations);
});
test('human retargeting preserves upright orientation and every finger joint',()=>{
 assert.equal(rig.bones.size,67);const head=rig.bones.get('Head').getWorldPosition(new THREE.Vector3()),hips=rig.bones.get('Hips').getWorldPosition(new THREE.Vector3());assert.ok(head.y-hips.y>.6);
 for(const side of ['Left','Right'])assert.equal(rig.handPoints(side).length,21);
});
test('all motion labels retarget finite normalized rotations with wrist targets in reach',()=>{
 for(const word of AVATAR_WORDS){const plan=compileAvatar(word);
  for(const fraction of [.3,.6]){const pose=sampleAvatar(plan.clip,plan.clip.duration*fraction);rig.apply(pose);
   for(const bone of rig.bones.values()){assert.ok(bone.getWorldPosition(new THREE.Vector3()).toArray().every(Number.isFinite),word);assert.ok(Math.abs(bone.quaternion.length()-1)<.001,word);}
   for(const side of ['Left','Right']){const delta=rig.bones.get(side+'Hand').getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3(...pose.worldPos(side+'Hand')));assert.ok(delta<.06,word+' '+side+' wrist error '+delta);}
  }
 }
});
test('enlarged hands use the identical weighted surface and skeleton as the main model',()=>{
 rig.apply(sampleAvatar(compileAvatar('want').clip,.5));assert.ok(rig.closeups.length>=2);
 for(const hand of rig.closeups){const original=rig.meshes.find(m=>m.skeleton===hand.skeleton&&m.material===hand.material&&m.geometry.attributes.position.count===hand.geometry.attributes.position.count);assert.ok(original);assert.equal(hand.geometry.index.count%3,0);
  for(const i of [0,Math.floor(hand.geometry.index.count/2),hand.geometry.index.count-1]){const index=hand.geometry.index.getX(i),a=hand.getVertexPosition(index,new THREE.Vector3()).applyMatrix4(hand.matrixWorld),b=original.getVertexPosition(index,new THREE.Vector3()).applyMatrix4(original.matrixWorld);assert.ok(a.distanceTo(b)<1e-8);}
 }
});
test('rotating hand cameras fit all finger endpoints at default zoom on narrow and wide layouts',()=>{
 rig.apply(sampleAvatar(compileAvatar('go').clip,.8));
 for(const side of ['Left','Right'])for(const aspect of [.7,1,2])for(const yaw of [-85,-65,-35,0,35,65,85]){const points=rig.handPoints(side).map(p=>p.toArray()),c=cameraForPoints(points,{aspect,yaw}),r=yaw*Math.PI/180;
  for(const p of points){const x=(p[0]-c.center[0])*Math.cos(r)-(p[2]-c.center[2])*Math.sin(r),y=p[1]-c.center[1];assert.ok(x>=c.left&&x<=c.right);assert.ok(y>=c.bottom&&y<=c.top);}
 }
 assert.throws(()=>cameraForPoints([]),/finite/);
});
test('facial motion channels reach retained model morph targets',()=>{
 const pose=sampleAvatar(compileAvatar('hello').clip,.5);pose.setFace({jawOpen:.7,browInnerUp:.4,mouthSmileLeft:.5});rig.apply(pose);const face=rig.meshes.find(m=>m.morphTargetDictionary?.Jaw_Down!==undefined);assert.equal(face.morphTargetInfluences[face.morphTargetDictionary.Jaw_Down],.7);assert.equal(face.morphTargetInfluences[face.morphTargetDictionary.BrowsUp_Left],.4);
});
test('repeat and pause modes stay inside a word and ordinary playback completes',()=>{
 const p=compileAvatar('home want'),s=p.segments[0];assert.deepEqual(advancePractice(p,s.end-.01,.03,{repeatWord:true}),{time:s.start,stop:false,focusStart:s.start});
 const paused=advancePractice(p,s.end-.01,.03,{pauseWord:true});assert.equal(paused.stop,true);assert.ok(paused.time<s.end&&paused.time>s.end-.005);
 assert.equal(advancePractice(p,p.clip.duration-.01,.03).time,p.clip.duration);assert.equal(advancePractice(p,p.clip.duration-.01,.03,{loop:true}).time,0);
});
test('phrasebook rejects malformed entries, deduplicates and caps device history',()=>{
 let state=cleanPractice({phrases:[{language:'unknown',text:'hello'},{language:'ASL',text:''}],sessions:-5,reviewed:[null,'<script>','HOME','HOME']});assert.equal(state.phrases.length,0);assert.equal(state.sessions,0);assert.deepEqual(state.reviewed,['HOME']);
 for(let i=0;i<30;i++)state=savePhrase(state,'ASL','phrase '+i);assert.equal(state.phrases.length,20);state=savePhrase(state,'ASL','phrase 29');assert.equal(state.phrases.length,20);
 state=savePhrase(state,'ISL','home');assert.equal(state.phrases[0].language,'ISL');assert.throws(()=>savePhrase(state,'ASL','x'.repeat(401)));
 const marked=recordPractice(state,compileAvatar('home home quokka'));assert.equal(marked.sessions,1);assert.deepEqual(marked.reviewed,['HOME']);
});
test('lightweight fallback provides labeled finite hand close-ups for both sides',()=>{
 const pose=sampleAvatar(compileAvatar('home').clip,.5);for(const side of ['Left','Right']){const svg=renderHandDetail(pose,side,{yaw:65,contrast:true});assert.ok(svg.includes('Enlarged '+side.toLowerCase()));assert.ok(!/NaN|Infinity/.test(svg));assert.ok(svg.includes(side.toUpperCase()));}
});

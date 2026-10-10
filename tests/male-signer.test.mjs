import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import * as THREE from '../dist/vendor/three/three.module.min.js';
import {GLTFLoader} from '../dist/vendor/three/GLTFLoader.js';
import {createHumanRig} from '../dist/human-rig.js';
import {compileAvatar,sampleAvatar,AVATAR_WORDS} from '../dist/avatar-engine.js';
const compressed=await readFile(new URL('../dist/models/signer/male.glb.gz',import.meta.url)),raw=gunzipSync(compressed),n=raw.readUInt32LE(12),doc=JSON.parse(raw.subarray(20,20+n)),fixtureDoc=structuredClone(doc);
delete fixtureDoc.images;delete fixtureDoc.textures;delete fixtureDoc.materials;
for(const mesh of fixtureDoc.meshes)for(const primitive of mesh.primitives)delete primitive.material;
let json=Buffer.from(JSON.stringify(fixtureDoc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
const binary=raw.subarray(20+n),header=Buffer.from(raw.subarray(0,20));header.writeUInt32LE(20+json.length+binary.length,8);header.writeUInt32LE(json.length,12);
const fixture=Buffer.concat([header,json,binary]),asset=await new GLTFLoader().parseAsync(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),''),rig=createHumanRig(asset.scene);
test('male model is self-contained, licensed, with browser-compatible embedded textures and no runtime compression decoder',async()=>{
 assert.ok(compressed.length<2_500_000);assert.equal(raw.readUInt32LE(8),raw.length);assert.deepEqual(doc.extensionsRequired,['KHR_mesh_quantization']);
 for(const image of doc.images){assert.equal(image.uri,undefined);assert.equal(image.mimeType,'image/jpeg');const v=doc.bufferViews[image.bufferView];assert.ok(v.byteOffset+v.byteLength<=doc.buffers[0].byteLength);}
 assert.match(await readFile(new URL('../dist/models/signer/MALE_LICENSE',import.meta.url),'utf8'),/MIT License/);assert.equal(doc.meshes[0].extras.targetNames.length,18);
});
test('male model retains both complete hands and retargets all bundled vocabulary to finite poses',()=>{
 const head=rig.bones.get('Head').getWorldPosition(new THREE.Vector3()),hip=rig.bones.get('Hips').getWorldPosition(new THREE.Vector3());assert.ok(head.y-hip.y>.6);
 for(const side of ['Left','Right'])assert.equal(rig.handPoints(side).length,21);
 for(const word of AVATAR_WORDS){const plan=compileAvatar(word);for(const fraction of [.3,.6]){const pose=sampleAvatar(plan.clip,plan.clip.duration*fraction);rig.apply(pose);for(const bone of rig.bones.values()){assert.ok(bone.getWorldPosition(new THREE.Vector3()).toArray().every(Number.isFinite),word);assert.ok(Math.abs(bone.quaternion.length()-1)<.001,word);}for(const side of ['Left','Right']){const error=rig.bones.get(side+'Hand').getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3(...pose.worldPos(side+'Hand')));assert.ok(error<.06,word+' '+side+' wrist error '+error);}}}
});
test('male hand close-ups share the actual skin and facial expressions reach body and lower jaw',()=>{
 const pose=sampleAvatar(compileAvatar('hello').clip,.5);pose.setFace({jawOpen:.7,browInnerUp:.4,mouthSmileLeft:.5});rig.apply(pose);const face=rig.meshes.find(m=>m.morphTargetDictionary?.['h_expressions.MouthOpen_h']!==undefined);assert.equal(face.morphTargetInfluences[face.morphTargetDictionary['h_expressions.MouthOpen_h']],.7);assert.equal(face.morphTargetInfluences[face.morphTargetDictionary['h_expressions.LbrowUp_h']],.4);const teeth=rig.meshes.find(m=>m.morphTargetDictionary?.['h_teeth.t_MouthOpen_h']!==undefined);assert.equal(teeth.morphTargetInfluences[teeth.morphTargetDictionary['h_teeth.t_MouthOpen_h']],.7);
 assert.ok(rig.closeups.length>=2);for(const hand of rig.closeups){const original=rig.meshes.find(m=>m.skeleton===hand.skeleton&&m.material===hand.material&&m.geometry.attributes.position.count===hand.geometry.attributes.position.count);assert.ok(original);for(const i of [0,Math.floor(hand.geometry.index.count/2),hand.geometry.index.count-1]){const index=hand.geometry.index.getX(i),a=hand.getVertexPosition(index,new THREE.Vector3()).applyMatrix4(hand.matrixWorld),b=original.getVertexPosition(index,new THREE.Vector3()).applyMatrix4(original.matrixWorld);assert.ok(a.distanceTo(b)<1e-8);}}
});

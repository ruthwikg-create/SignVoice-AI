import * as THREE from './vendor/three/three.module.min.js';
import {CANONICAL_REST} from './vendor/sign-avatar/animation-canonical-rest.js';
import {restWorld,Pose} from './vendor/sign-avatar/sign-rig.js';

const FACE_MAP={eyeBlinkLeft:['Blink_Left','h_expressions.LeyeClose_h'],eyeBlinkRight:['Blink_Right','h_expressions.ReyeClose_h'],eyeSquintLeft:['Squint_Left','h_expressions.Lsquint_h'],eyeSquintRight:['Squint_Right','h_expressions.Rsquint_h'],browInnerUp:['BrowsUp_Left','h_expressions.LbrowUp_h','h_expressions.LLbrowUp_h','BrowsUp_Right','h_expressions.RbrowUp_h','h_expressions.RRbrowUp_h'],browOuterUpLeft:['BrowsUp_Left','h_expressions.LbrowUp_h','h_expressions.LLbrowUp_h'],browOuterUpRight:['BrowsUp_Right','h_expressions.RbrowUp_h','h_expressions.RRbrowUp_h'],browDownLeft:['BrowsDown_Left','h_expressions.LbrowDown_h','h_expressions.LLbrowDown_h'],browDownRight:['BrowsDown_Right','h_expressions.RbrowDown_h','h_expressions.RRbrowDown_h'],mouthSmileLeft:['Smile_Left','h_expressions.LsmileClose_h'],mouthSmileRight:['Smile_Right','h_expressions.RsmileClose_h'],mouthFrownLeft:['Frown_Left','h_expressions.LmouthSad_h'],mouthFrownRight:['Frown_Right','h_expressions.RmouthSad_h'],jawOpen:['Jaw_Down','h_expressions.MouthOpen_h','h_teeth.t_MouthOpen_h'],mouthPucker:['MouthNarrow_Left','h_expressions.Kiss_h','MouthNarrow_Right']};
const vector=()=>new THREE.Vector3(),quaternion=()=>new THREE.Quaternion();
export function canonicalBoneName(name){return name.replace(/^mixamorig[_:]/,'');}
export function createHumanRig(model){
 const bones=new Map(),meshes=[];model.traverse(object=>{if(object.isBone)bones.set(canonicalBoneName(object.name),object);if(object.isSkinnedMesh)meshes.push(object);});
 for(const side of ['Left','Right'])for(const part of ['Arm','ForeArm','Hand','HandThumb1','HandThumb2','HandThumb3','HandIndex1','HandIndex2','HandIndex3','HandMiddle1','HandMiddle2','HandMiddle3','HandRing1','HandRing2','HandRing3','HandPinky1','HandPinky2','HandPinky3'])if(!bones.has(side+part))throw Error('The human model is missing '+side+part);
 model.updateMatrixWorld(true);
 const source=new Pose();
 // Blender's export includes a 90-degree armature rotation. Orient the
 // actual bind skeleton upright before using world-space signing targets.
 const up=bones.get('Head').getWorldPosition(vector()).sub(bones.get('Hips').getWorldPosition(vector())).normalize();
 model.quaternion.premultiply(quaternion().setFromUnitVectors(up,new THREE.Vector3(0,1,0)));model.updateMatrixWorld(true);
 const hip=bones.get('Hips').getWorldPosition(vector()),head=bones.get('Head').getWorldPosition(vector());
 const scale=(source.worldPos('Head')[1]-source.worldPos('Hips')[1])/(head.y-hip.y);model.scale.multiplyScalar(scale);model.position.y+=source.worldPos('Hips')[1]-hip.y*scale;model.position.x+=source.worldPos('Head')[0]-head.x*scale;model.position.z+=source.worldPos('Head')[2]-head.z*scale;model.updateMatrixWorld(true);
 const rest=new Map([...bones].map(([name,bone])=>[name,{world:bone.getWorldQuaternion(quaternion()),local:bone.quaternion.clone()}]));
 const ordered=[];model.traverse(bone=>{if(bone.isBone&&Object.hasOwn(CANONICAL_REST,canonicalBoneName(bone.name)))ordered.push(bone);});
 const parentQ=quaternion(),desired=quaternion(),sourceQ=quaternion(),restInverse=quaternion();
 function setWorld(bone,q){bone.parent.getWorldQuaternion(parentQ);bone.quaternion.copy(parentQ.invert().multiply(q));bone.updateWorldMatrix(false,true);}
 function apply(pose){
  for(const bone of ordered){const name=canonicalBoneName(bone.name);sourceQ.fromArray(pose.worldQuat(name));restInverse.fromArray(restWorld(name)).invert();desired.copy(sourceQ).multiply(restInverse).multiply(rest.get(name).world);setWorld(bone,desired);}
  // Match wrists in signing space after rotation retargeting. Translating only
  // arm bones is prohibited; a two-bone IK correction preserves limb lengths.
  for(const side of ['Left','Right']){
   const arm=bones.get(side+'Arm'),elbow=bones.get(side+'ForeArm'),wrist=bones.get(side+'Hand');
   const target=vector().fromArray(pose.worldPos(side+'Hand'));
   const handQ=wrist.getWorldQuaternion(quaternion());
   for(let iteration=0;iteration<4;iteration++)for(const joint of [elbow,arm]){
    const origin=joint.getWorldPosition(vector()),a=wrist.getWorldPosition(vector()).sub(origin),b=target.clone().sub(origin);
    if(a.lengthSq()<1e-8||b.lengthSq()<1e-8)continue;
    const correction=quaternion().setFromUnitVectors(a.normalize(),b.normalize());setWorld(joint,correction.multiply(joint.getWorldQuaternion(quaternion())));
   }
   setWorld(wrist,handQ);
  }
  for(const mesh of meshes){if(!mesh.morphTargetInfluences)continue;mesh.morphTargetInfluences.fill(0);for(const [key,targets] of Object.entries(FACE_MAP)){const weight=pose.getFace(key);for(const target of targets){const index=mesh.morphTargetDictionary?.[target];if(index!==undefined)mesh.morphTargetInfluences[index]=Math.max(mesh.morphTargetInfluences[index],weight);}}}
  model.updateMatrixWorld(true);for(const mesh of meshes)mesh.skeleton.update();
 }
 function handPoints(side){const keys=['Hand',...['Thumb','Index','Middle','Ring','Pinky'].flatMap(f=>[1,2,3,4].map(i=>'Hand'+f+i))];return keys.map(k=>bones.get(side+k)?.getWorldPosition(vector())).filter(Boolean);}
 // The close-up meshes share the exact skeleton, material and surface of the
 // main character. They are not a second approximated hand animation.
 const closeups=[];
 for(const mesh of meshes){const index=mesh.geometry.index,skin=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight;if(!index||!skin||!weights)continue;
  for(const [side,layer] of [['Right',1],['Left',2]]){
   const handBones=new Set(mesh.skeleton.bones.map((bone,i)=>canonicalBoneName(bone.name).startsWith(side+'Hand')?i:-1).filter(i=>i>=0));
   const eligible=new Uint8Array(skin.count);for(let vertex=0;vertex<skin.count;vertex++){let weight=0;for(let j=0;j<4;j++)if(handBones.has(skin.getComponent(vertex,j)))weight+=weights.getComponent(vertex,j);eligible[vertex]=weight>.45?1:0;}
   const indices=[];for(let i=0;i<index.count;i+=3){const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);if(eligible[a]+eligible[b]+eligible[c]>=2)indices.push(a,b,c);}
   if(!indices.length)continue;
   // Share attributes directly: cloning interleaved sparse morph buffers can
   // alias their cache keys and corrupt quantized facial deltas.
   const geometry=new THREE.BufferGeometry();for(const [key,attribute] of Object.entries(mesh.geometry.attributes))geometry.setAttribute(key,attribute);geometry.morphAttributes=mesh.geometry.morphAttributes;geometry.morphTargetsRelative=mesh.geometry.morphTargetsRelative;geometry.setIndex(indices);const copy=new THREE.SkinnedMesh(geometry,mesh.material);copy.name='closeup-'+side;copy.position.copy(mesh.position);copy.quaternion.copy(mesh.quaternion);copy.scale.copy(mesh.scale);copy.bindMode=mesh.bindMode;copy.bind(mesh.skeleton,mesh.bindMatrix);copy.layers.set(layer);copy.frustumCulled=false;copy.morphTargetInfluences=mesh.morphTargetInfluences;mesh.parent.add(copy);closeups.push(copy);
  }
 }
 apply(source);
 return {model,bones,meshes,closeups,apply,handPoints,dispose(){for(const mesh of closeups)mesh.geometry.dispose();}};
}

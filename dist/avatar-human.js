import * as THREE from './vendor/three/three.module.min.js';
import {GLTFLoader} from './vendor/three/GLTFLoader.js';
import {createHumanRig} from './human-rig.js';
import {cameraForPoints} from './avatar-camera.js';

export async function createHumanStage(container,{onStatus=()=>{},onFailure=()=>{}}={}){
 if(typeof DecompressionStream!=='function')throw Error('This browser cannot load the compressed human model.');
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.autoClear=false;
 renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','3D ASL signer with synchronized close-ups of the right and left hand');
 const scene=new THREE.Scene();scene.background=new THREE.Color('#e8ede8');
 const fill=new THREE.HemisphereLight(0xffffff,0x728178,2.6);fill.layers.enableAll();scene.add(fill);
 for(const [position,intensity] of [[[1,2.2,3],3.1],[[-2,1.6,1],1.8],[[0,2,-2],1.4]]){const light=new THREE.DirectionalLight(0xffffff,intensity);light.position.set(...position);light.layers.enableAll();scene.add(light);}
 let rig=null,disposed=false,observer=null,lastPose=null,lastOptions={},width=960,height=680,failed=false;
 const cameras=[0,1,2].map(layer=>{const camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,8);camera.layers.set(layer);return camera;});
 function configure(camera,points,aspect,options){const c=cameraForPoints(points,{aspect,...options});Object.assign(camera,{left:c.left,right:c.right,top:c.top,bottom:c.bottom});camera.position.set(...c.position);camera.lookAt(...c.center);camera.updateProjectionMatrix();}
 function render(pose,options={}){
  if(disposed||failed||!rig)return;lastPose=pose;lastOptions=options;rig.apply(pose);
  const {yaw=0,zoom=1,focus='body',contrast=false}=options;scene.background.set(contrast?'#182a32':'#e8ede8');
  const handHeight=Math.round(height*.31),mainHeight=height-handHeight-8,half=Math.floor((width-8)/2);
  cameras[0].layers.set(focus==='right'?1:focus==='left'?2:0);let points=[];
  if(focus==='right'||focus==='left')points=rig.handPoints(focus==='right'?'Right':'Left').map(v=>v.toArray());
  else if(focus==='hands')points=[...rig.handPoints('Right'),...rig.handPoints('Left')].map(v=>v.toArray());
  else{const head=rig.bones.get('Head').getWorldPosition(new THREE.Vector3());points=[[head.x-.31,head.y+.2,head.z],[head.x+.31,head.y-.61,head.z],...rig.handPoints('Right').map(v=>v.toArray()),...rig.handPoints('Left').map(v=>v.toArray())];}
  configure(cameras[0],points,width/mainHeight,{yaw,zoom,padding:.07});
  renderer.setScissorTest(false);renderer.setViewport(0,0,width,height);renderer.clear();renderer.setScissorTest(true);
  renderer.setViewport(0,handHeight+8,width,mainHeight);renderer.setScissor(0,handHeight+8,width,mainHeight);renderer.render(scene,cameras[0]);
  for(const [i,side] of ['Right','Left'].entries()){
   const x=i*(half+8);configure(cameras[i+1],rig.handPoints(side).map(v=>v.toArray()),half/handHeight,{yaw:yaw+(i===0?20:-20),zoom:1,padding:.018});
   renderer.setViewport(x,0,half,handHeight);renderer.setScissor(x,0,half,handHeight);renderer.clear();renderer.render(scene,cameras[i+1]);
  }
 }
 function dispose(){if(disposed)return;disposed=true;observer?.disconnect();rig?.dispose();if(rig)rig.model.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const material of Array.isArray(o.material)?o.material:[o.material]){for(const value of Object.values(material))if(value?.isTexture)value.dispose();material.dispose();}}});renderer.dispose();renderer.domElement.remove();}
 try{
  onStatus('Loading textured signer…');const response=await fetch(new URL('./models/signer/eva.glb.gz',import.meta.url));if(!response.ok||!response.body)throw Error('The human model could not be downloaded.');
  const downloaded=await response.arrayBuffer(),signature=new Uint8Array(downloaded,0,2);
  // Some hosts decode .gz assets at the HTTP layer; accept either representation.
  const bytes=signature[0]===0x1f&&signature[1]===0x8b?await new Response(new Blob([downloaded]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():downloaded;
  const asset=await new GLTFLoader().parseAsync(bytes,'');if(disposed)return null;
  asset.scene.traverse(object=>{if(object.name==='Tops'&&object.material){object.material=object.material.clone();object.material.color.set('#24495a');object.material.roughness=.85;}});
  rig=createHumanRig(asset.scene);scene.add(rig.model);container.replaceChildren(renderer.domElement);
  const resize=()=>{const rect=container.getBoundingClientRect();width=Math.max(320,Math.round(rect.width||960));height=Math.round(width*.77);renderer.setSize(width,height,false);if(lastPose)render(lastPose,lastOptions);};
  if(typeof ResizeObserver==='function'){observer=new ResizeObserver(resize);observer.observe(container);}resize();
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();failed=true;onFailure('3D graphics paused. Showing the lightweight hand view.');});
  onStatus('Textured 3D signer · synchronized enlarged hands');
  return {render,dispose,rig,canvas:renderer.domElement};
 }catch(error){dispose();throw error;}
}

import {fingerTip,qRotate,qMul,qConj,restWorld,vAdd,anchorPoint} from './vendor/sign-avatar/sign-rig.js';

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=value=>Number(value).toFixed(2);
export function projectAvatarPoint(point,{width=960,height=620,yaw=0,zoom=1}={}){
 const angle=yaw*Math.PI/180,x=point[0]*Math.cos(angle)-point[2]*Math.sin(angle),z=point[0]*Math.sin(angle)+point[2]*Math.cos(angle);
 const scale=Math.min(width/1.8,height/1.17)*zoom,depth=3/(3-z);
 return [width/2+x*scale*depth,height*.5-(point[1]-1.34)*scale*depth,z,scale*depth];
}
// The stylized character is drawn from the exact same FK positions as the
// motion engine. Fingers are articulated joints, rather than decorative icons.
export function avatarGeometry(pose){
 const hands={};
 for(const side of ['Left','Right']){
  hands[side]={wrist:pose.worldPos(side+'Hand'),fingers:{}};
  for(const finger of ['Thumb','Index','Middle','Ring','Pinky'])hands[side].fingers[finger]=[1,2,3].map(j=>pose.worldPos(`${side}Hand${finger}${j}`)).concat([fingerTip(pose,side,finger)]);
 }
 return {hands,head:pose.worldPos('Head'),arms:Object.fromEntries(['Left','Right'].map(side=>[side,['Arm','ForeArm','Hand'].map(b=>pose.worldPos(side+b))]))};
}
export function renderAvatarFrame(pose,{width=960,height=620,yaw=0,zoom=1,word='',letter='',spelled=false}={}){
 const project=p=>projectAvatarPoint(p,{width,height,yaw,zoom}),geometry=avatarGeometry(pose),items=[];
 const add=(depth,svg)=>items.push({depth,svg});
 const line=(a,b,radius,color,outline=true)=>{
  const x=project(a),y=project(b),stroke=(x[3]+y[3])*radius;
  const path=`<path d="M${n(x[0])} ${n(x[1])}L${n(y[0])} ${n(y[1])}" stroke-linecap="round" fill="none"`;
  add((x[2]+y[2])/2,(outline?`${path} stroke="#5d3933" stroke-width="${n(stroke+1.8)}"/>`:'')+`${path} stroke="${color}" stroke-width="${n(stroke)}"/>`);
 };
 const polygon=(points,fill,stroke='#315a50')=>{
  const projected=points.map(project);
  add(projected.reduce((s,p)=>s+p[2],0)/projected.length,`<polygon points="${projected.map(p=>n(p[0])+','+n(p[1])).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>`);
 };
 const torso=[];
 for(const side of ['Right','Left']){const arm=pose.worldPos(side+'Arm'),hip=pose.worldPos('Hips'),sign=side==='Right'?-1:1;torso.push([arm[0]+sign*.025,arm[1]+.015,arm[2]+.004],[hip[0]+sign*.155,hip[1]-.12,hip[2]+.012]);}
 polygon([torso[0],torso[1],torso[3],torso[2]],'url(#avatar-shirt)');
 const neck=pose.worldPos('Neck'),head=geometry.head;
 line([neck[0],neck[1]-.02,neck[2]],[head[0],head[1]-.06,head[2]],.035,'#bd8469');
 for(const side of ['Left','Right']){
  const [arm,elbow,wrist]=geometry.arms[side],sleeve=arm.map((v,i)=>v+(elbow[i]-v)*.33);
  line(arm,sleeve,.041,'#346d5e');line(sleeve,elbow,.028,'#cb9478');line(elbow,wrist,.023,'#d8a387');
  const {fingers}=geometry.hands[side],palm=[wrist,fingers.Index[0],fingers.Middle[0],fingers.Ring[0],fingers.Pinky[0]];
  polygon(palm,'url(#avatar-skin)','#7c5040');
  for(const [finger,points] of Object.entries(fingers)){
   if(finger==='Thumb')line(wrist,points[0],.009,'#dca88b');
   for(let i=0;i<points.length-1;i++)line(points[i],points[i+1],finger==='Thumb'?.009:.007,'#e0ae91');
  }
 }
 const headRotation=qMul(pose.worldQuat('Head'),qConj(restWorld('Head')));
 const facePoint=(x,y,z=.029)=>vAdd(head,qRotate(headRotation,[x,y,z]));
 const center=project(facePoint(0,.017,.016)),radius=center[3];
 const headSvg=`<ellipse cx="${n(center[0])}" cy="${n(center[1])}" rx="${n(.083*radius)}" ry="${n(.105*radius)}" fill="url(#avatar-skin)" stroke="#885b47" stroke-width="1.5"/>`;
 const hair=project(facePoint(0,.085,.022));
 let face=headSvg+`<path d="M${n(hair[0]-.084*radius)} ${n(hair[1]+.012*radius)}Q${n(hair[0]-.04*radius)} ${n(hair[1]-.095*radius)} ${n(hair[0]+.077*radius)} ${n(hair[1]-.01*radius)}L${n(hair[0]+.08*radius)} ${n(hair[1]+.025*radius)}Q${n(hair[0]+.014*radius)} ${n(hair[1]-.028*radius)} ${n(hair[0]-.077*radius)} ${n(hair[1]+.019*radius)}Z" fill="#2b2928"/>`;
 for(const side of ['Left','Right']){
  const sign=side==='Left'?1:-1,eye=project(facePoint(sign*.031,.046));
  const squint=pose.getFace('eyeSquint'+side),raised=pose.getFace('browInnerUp')+pose.getFace('browOuterUp'+side),lowered=pose.getFace('browDown'+side);
  face+=`<ellipse cx="${n(eye[0])}" cy="${n(eye[1])}" rx="${n(.010*radius)}" ry="${n((.007-.003*squint)*radius)}" fill="#fff7e9"/><circle cx="${n(eye[0])}" cy="${n(eye[1])}" r="${n(.0044*radius)}" fill="#292e29"/>`;
  const browY=eye[1]-(.019+raised*.012-lowered*.008)*radius;
  face+=`<path d="M${n(eye[0]-.013*radius)} ${n(browY+sign*lowered*.008*radius)}Q${n(eye[0])} ${n(browY-.006*radius)} ${n(eye[0]+.013*radius)} ${n(browY-sign*lowered*.008*radius)}" fill="none" stroke="#4c352e" stroke-width="${n(.004*radius)}" stroke-linecap="round"/>`;
 }
 const nose=project(anchorPoint(pose,'nose'));face+=`<path d="M${n(nose[0])} ${n(nose[1]-.006*radius)}l${n(-.003*radius)} ${n(.017*radius)}l${n(.009*radius)} 0" stroke="#b88066" fill="none" stroke-width="1.6"/>`;
 const mouth=project(anchorPoint(pose,'mouth')),smile=(pose.getFace('mouthSmileLeft')+pose.getFace('mouthSmileRight'))/2,frown=(pose.getFace('mouthFrownLeft')+pose.getFace('mouthFrownRight'))/2,jaw=pose.getFace('jawOpen'),pucker=pose.getFace('mouthPucker');
 if(jaw>.05||pucker>.1)face+=`<ellipse cx="${n(mouth[0])}" cy="${n(mouth[1])}" rx="${n((.018-pucker*.009)*radius)}" ry="${n((.004+jaw*.04+pucker*.013)*radius)}" fill="#763f3d"/>`;
 else face+=`<path d="M${n(mouth[0]-.020*radius)} ${n(mouth[1])}Q${n(mouth[0])} ${n(mouth[1]+(.003+smile*.016-frown*.018)*radius)} ${n(mouth[0]+.020*radius)} ${n(mouth[1])}" fill="none" stroke="#985248" stroke-width="2.3" stroke-linecap="round"/>`;
 add(center[2],face);
 const shapes=items.sort((a,b)=>a.depth-b.depth).map(item=>item.svg).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Experimental American Sign Language character${word?': '+escape(word):' at rest'}"><defs><radialGradient id="avatar-bg"><stop stop-color="#fafcf6"/><stop offset="1" stop-color="#e4eddf"/></radialGradient><linearGradient id="avatar-skin"><stop stop-color="#e9bb9c"/><stop offset="1" stop-color="#ca9275"/></linearGradient><linearGradient id="avatar-shirt" x2="0" y2="1"><stop stop-color="#347664"/><stop offset="1" stop-color="#193d34"/></linearGradient></defs><rect width="100%" height="100%" rx="18" fill="url(#avatar-bg)"/><ellipse cx="${width/2}" cy="${height-17}" rx="125" ry="12" fill="#244b3510"/>${shapes}<rect x="${width/2-170}" y="${height-69}" width="340" height="48" rx="24" fill="#fffef4" opacity=".96"/><text x="${width/2}" y="${height-38}" text-anchor="middle" font-family="sans-serif" font-size="21" fill="#193d34">${escape(word?(spelled?'Spell: ':'')+word+(letter?' · '+letter:''):'Ready to animate')}</text><text x="22" y="28" font-family="sans-serif" font-size="11" letter-spacing="1" fill="#526c5a">EXPERIMENTAL ASL WORD PRACTICE</text></svg>`;
}

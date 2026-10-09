// All training examples are real recordings supplied by the user. No simulated signs.
export const DIM = 132;
export const NEUTRAL = '__neutral__';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// Two fixed handedness slots; 63 wrist-relative joints + wrist XY + presence per hand.
// Feed unmirrored video. Mirror only the visual preview to keep this contract stable.
export function featuresFromResult(result) {
  const out = new Array(DIM).fill(0);
  const used = new Set();
  (result.landmarks || []).forEach((hand, index) => {
    if (hand.length !== 21) return;
    let slot = result.handedness?.[index]?.[0]?.categoryName === 'Left' ? 0 : 1;
    if (used.has(slot)) slot = 1 - slot;
    if (used.has(slot)) return;
    used.add(slot);
    const start = slot * 66, w = hand[0], middle = hand[9];
    const scale = Math.max(Math.hypot(middle.x - w.x, middle.y - w.y), 0.035);
    for (let i = 0; i < 21; i++) {
      out[start+i*3] = clamp((hand[i].x-w.x)/scale, -5, 5);
      out[start+i*3+1] = clamp((hand[i].y-w.y)/scale, -5, 5);
      out[start+i*3+2] = clamp((hand[i].z-w.z)/scale, -5, 5);
    }
    out[start+63] = w.x * 2; out[start+64] = w.y * 2; out[start+65] = 1;
  });
  return out;
}

export function resample(frames, count = 24) {
  if (!frames.length) return [];
  return Array.from({length:count}, (_, i) => {
    const p = i*(frames.length-1)/(count-1), a = Math.floor(p), b = Math.min(a+1, frames.length-1), t = p-a;
    return frames[a].map((n,j) => n*(1-t)+frames[b][j]*t);
  });
}

export function frameDistance(a, b) {
  let sum=0, weight=0;
  for (let h=0; h<2; h++) {
    const o=h*66, ap=a[o+65], bp=b[o+65];
    // Absent joints do not dilute active-hand distance; hand presence is explicit.
    if (!ap && !bp) continue;
    if (!ap || !bp) { sum += 1.4; weight += 1; continue; }
    let s=0;
    for (let j=0; j<63; j++) s += (a[o+j]-b[o+j])**2;
    sum += Math.sqrt(s/63) + 0.18*Math.hypot(a[o+63]-b[o+63],a[o+64]-b[o+64]); weight++;
  }
  return weight ? sum/weight : 0;
}

// Banded dynamic time warping learns an isolated motion from recorded examples.
export function dtw(a, b) {
  if (!a.length || !b.length) return Infinity;
  const band=Math.max(6,Math.abs(a.length-b.length));
  let prev=new Float64Array(b.length+1).fill(Infinity); prev[0]=0;
  for (let i=1;i<=a.length;i++) {
    const row=new Float64Array(b.length+1).fill(Infinity);
    for(let j=Math.max(1,i-band);j<=Math.min(b.length,i+band);j++)
      row[j]=frameDistance(a[i-1],b[j-1])+Math.min(prev[j],row[j-1],prev[j-1]);
    prev=row;
  }
  return prev[b.length]/Math.max(a.length,b.length);
}

export function trainProfile(entries, language) {
  const valid=entries.filter(e=>e.language===language && e.samples.length>=3);
  const classes=valid.map(e=> {
    const sequences=e.samples.map(s=>resample(s.frames));
    const loo=sequences.map((s,i)=>Math.min(...sequences.filter((_,j)=>j!==i).map(t=>dtw(s,t))));
    // A conservative distance ceiling. This is a heuristic, NOT calibrated accuracy.
    const radius=clamp(Math.max(...loo)*1.7+0.045,0.10,0.48);
    return {id:e.id,label:e.label,speech:e.speech,language,kind:e.kind,radius,sequences};
  });
  return {featureVersion:'hands-v1-132',language,classes,trainedAt:new Date().toISOString()};
}

export function predictProfile(frames, model) {
  if (frames.length<18 || !model?.classes?.length) return null;
  const sequence=resample(frames);
  const ranked=model.classes.map(c=>({c,d:Math.min(...c.sequences.map(s=>dtw(sequence,s)))})).sort((a,b)=>a.d-b.d);
  const top=ranked[0], runner=ranked[1];
  if(top.c.id===NEUTRAL || top.d>top.c.radius) return null;
  // Require a trained neutral class plus another sign/negative class.
  if(!model.classes.some(c=>c.id===NEUTRAL) || !runner) return null;
  const margin=(runner.d-top.d)/Math.max(runner.d,0.03);
  if(margin<0.16) return null;
  return {id:top.c.id,label:top.c.label,speech:top.c.speech,score:clamp(1-top.d/(top.c.radius*1.6),0,1),distance:top.d,margin,source:'Personal model'};
}

export class RecognitionGate {
  constructor({holdMs=650,releaseMs=650}={}) { this.holdMs=holdMs;this.releaseMs=releaseMs;this.reset(); }
  reset(){this.candidate=null;this.since=0;this.emitted=null;this.emptySince=null;}
  update(prediction,now) {
    if(!prediction) {
      this.candidate=null;
      if(this.emptySince===null)this.emptySince=now;
      if(now-this.emptySince>=this.releaseMs)this.emitted=null;
      return null;
    }
    this.emptySince=null;
    if(prediction.id!==this.candidate){this.candidate=prediction.id;this.since=now;}
    if(now-this.since<this.holdMs || this.emitted===prediction.id)return null;
    this.emitted=prediction.id;
    return prediction;
  }
}

export function validateDataset(data) {
  if(data?.schemaVersion!==1 || data.featureVersion!=='hands-v1-132' || !Array.isArray(data.entries)) throw Error('Unsupported dataset format or feature version.');
  if(data.entries.length>60 || ['ISL','ASL'].some(lang=>data.entries.filter(e=>e.language===lang).length>30))throw Error('Dataset exceeds 30 entries per language.');
  const ids=new Set();
  for(const e of data.entries) {
    if(!['ASL','ISL'].includes(e.language)||typeof e.id!=='string'||!e.id||typeof e.label!=='string'||!e.label.trim()||e.label.length>80||typeof e.speech!=='string'||e.speech.length>200||!['static','motion','neutral'].includes(e.kind)||!Array.isArray(e.samples)||e.samples.length>12)throw Error('Invalid sign entry.');
    const key=e.language+':'+e.id;if(ids.has(key))throw Error('Duplicate sign IDs.');ids.add(key);
    if(e.kind==='neutral' && e.id!==NEUTRAL || e.id===NEUTRAL && e.kind!=='neutral') throw Error('Invalid neutral class.');
    for(const s of e.samples) {
      if(typeof s.id!=='string'||typeof s.session!=='string'||typeof s.signer!=='string'||!Array.isArray(s.frames)||s.frames.length<18||s.frames.length>100)throw Error('Invalid recording.');
      if(!s.frames.every(f=>Array.isArray(f)&&f.length===DIM&&f.every(n=>Number.isFinite(n)&&Math.abs(n)<=10)))throw Error('Invalid landmark values.');
    }
  }
  return data;
}

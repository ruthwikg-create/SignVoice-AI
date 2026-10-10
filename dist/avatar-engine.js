import {compileUtterance,utteranceWords} from './vendor/sign-avatar/sign-speech.js';
import {SIGNS,buildSignClip,signGloss} from './vendor/sign-avatar/sign-dictionary.js';
import {SignTimeline,posePhase,neutralPose,restingPose} from './vendor/sign-avatar/sign-clip.js';
import {Pose,qSlerp} from './vendor/sign-avatar/sign-rig.js';

// Experimental lexical animations. Source references describe the signs;
// neither these authored poses nor the character have been validated by Deaf signers.
export const AVATAR_SOURCES=Object.freeze({
 GO:'https://www.lifeprint.com/asl101/pages-signs/g/go.htm',
 HOME:'https://www.lifeprint.com/asl101/pages-signs/h/home.htm',
 WANT:'https://www.lifeprint.com/asl101/pages-signs/w/want.htm',
 ME:'https://www.lifeprint.com/asl101/pages-signs/m/me.htm',
});
const authored={
 GO:{gloss:'Both index fingers move in a quick forward arc; direction depends on the destination.',phases:[
  {t:0.3,both:{shape:'1',at:{anchor:'sternum',out:0.13,up:-0.07,forward:0.21},fingers:'up',palm:'in'},hold:0.12},
  {t:0.2,both:{shape:'1',at:{anchor:'sternum',out:0.17,up:0.01,forward:0.33},fingers:['forward','up'],palm:'in'}},
  {t:0.18,both:{shape:'1',at:{anchor:'sternum',out:0.17,up:-0.02,forward:0.42},fingers:'forward',palm:'in'},hold:0.25},
 ]},
 HOME:{gloss:'Closed fingertips contact the cheek near the mouth, then move to the upper cheek.',phases:[
  {t:0.32,right:{shape:'FLAT_O',touch:{to:'mouth',part:'fingertips',out:0.055,up:-0.012,forward:0.008},fingers:['up','in'],palm:'in'},hold:0.18},
  {t:0.3,right:{shape:'FLAT_O',touch:{to:'mouth',part:'fingertips',out:0.08,up:0.058,forward:-0.007},fingers:['up','in'],palm:'in'},hold:0.25},
 ]},
 WANT:{gloss:'Open hands face upward and pull toward the body while the fingers curl.',phases:[
  {t:0.32,both:{shape:'5',at:{anchor:'sternum',out:0.14,up:-0.08,forward:0.36},fingers:'forward',palm:'up'},hold:0.12},
  {t:0.34,both:{shape:'CLAW',at:{anchor:'sternum',out:0.14,up:-0.1,forward:0.2},fingers:['forward','up'],palm:'up'},hold:0.2},
 ]},
};
const aliases={I:'ME',HI:'HELLO',THANKS:'THANK'};
export const AVATAR_WORDS=Object.freeze([...new Set([...Object.keys(SIGNS),...Object.keys(authored),...Object.keys(aliases)])].sort());
export function avatarDefinition(word){const key=aliases[word.toUpperCase()]||word.toUpperCase();return {key,gloss:authored[key]?.gloss||signGloss(key)||null,source:AVATAR_SOURCES[key]||'https://github.com/nirholas/three.ws/tree/66624fbe184f50ae55f89fa01537d99497984cfd/packages/sign-language'};}
function lookup(word,position){
 const key=aliases[word]||word,definition=authored[key];
 if(!definition)return Object.hasOwn(SIGNS,key)?buildSignClip(key,{lead:position.first,settle:position.last}):null;
 const base=restingPose(),timeline=new SignTimeline({base,open:position.first?base:neutralPose(base)});
 for(const phase of definition.phases){timeline.to(posePhase(phase),phase.t).hold(phase.hold||0);}
 if(position.last)timeline.settle(0.32);
 return timeline.build({name:'asl-'+key.toLowerCase()});
}
export function compileAvatar(text,language='ASL'){
 if(language!=='ASL')throw Error('Animated motions are currently available only for American Sign Language (ASL). Use reference lessons for this language.');
 if(typeof text!=='string'||!text.trim())throw Error('Type a sentence first.');
 if(text.length>400||utteranceWords(text).length>40)throw Error('Use up to 40 words and 400 characters per animation.');
 // Never silently discard an unsupported script or emoji into an ASCII animation.
 if(/[^\x20-\x7e\s]/u.test(text))throw Error('The experimental ASL character supports English letters and digits. Use reference practice for other scripts.');
 const result=compileUtterance(text,{signs:lookup,maxSeconds:180});
 if(result.truncated||result.clip.duration>180)throw Error('This animation exceeds 3 minutes. Split the text into shorter sentences.');
 for(const track of result.clip.tracks){const stride=track.type==='quaternion'?4:1;if(track.values.length!==track.times.length*stride||track.values.some(v=>!Number.isFinite(v)))throw Error('The motion clip could not be compiled.');}
 return {...result,segments:result.segments.map(segment=>({...segment,gloss:segment.signed?avatarDefinition(segment.word).gloss:null})),language:'ASL',mode:'experimental-lexical-animation',translation:false};
}
export function sampleTrack(track,time){
 const times=track.times,stride=track.type==='quaternion'?4:1;
 if(!times.length)return null;
 let lo=0,hi=times.length-1;
 if(time<=times[0])return track.values.slice(0,stride);
 if(time>=times[hi])return track.values.slice(hi*stride,(hi+1)*stride);
 while(lo+1<hi){const mid=(lo+hi)>>1;if(times[mid]<=time)lo=mid;else hi=mid;}
 const a=track.values.slice(lo*stride,(lo+1)*stride),b=track.values.slice(hi*stride,(hi+1)*stride),fraction=(time-times[lo])/(times[hi]-times[lo]||1);
 return stride===4?qSlerp(a,b,fraction):[a[0]+(b[0]-a[0])*fraction];
}
export function sampleAvatar(clip,time){
 const pose=new Pose();
 if(!clip)return restingPose();
 for(const track of clip.tracks){const value=sampleTrack(track,time);if(!value)continue;if(track.type==='quaternion')pose.setLocal(track.name.replace(/\.quaternion$/,''),value);else{const shape=track.name.match(/^Face\.morphTargetInfluences\[([\w]+)\]$/)?.[1];if(shape)pose.setFace({[shape]:value[0]});}}
 return pose;
}
export function activeAvatarSegment(plan,time){return plan?.segments.find(s=>time>=s.start&&time<s.end)||null;}

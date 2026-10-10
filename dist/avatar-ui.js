import {compileAvatar,sampleAvatar,activeAvatarSegment,avatarDefinition,AVATAR_WORDS} from './avatar-engine.js';
import {renderAvatarFrame} from './avatar-renderer.js';
import {languageName} from './languages.js';

const $=id=>document.getElementById(id);
export function createAvatarUI({getLanguage,getText,toast,onAvatarMode=()=>{},onReferenceMode=()=>{}}){
 let plan=null,time=0,playing=false,last=0,raf=null,yaw=0,previousWord=null;
 const stage=$('avatar-stage'),mode=$('lesson-display-mode'),range=$('avatar-seek');
 function stop(){playing=false;cancelAnimationFrame(raf);raf=null;last=0;$('avatar-play').textContent='▷ Play character';}
 function draw(){
  const segment=activeAvatarSegment(plan,time),letter=segment?.letters?.find(l=>time>=l.start&&time<l.end)?.letter||'';
  stage.innerHTML=renderAvatarFrame(sampleAvatar(plan?.clip,time),{yaw,word:segment?.word||'',letter,spelled:!!segment&&!segment.signed});
  range.value=String(time);$('avatar-time').textContent=`${time.toFixed(1)} / ${(plan?.clip.duration||0).toFixed(1)} s`;
  $('avatar-subtitle').textContent=segment?`${segment.word}${segment.signed?' · animated word':' · fingerspelled'}${letter?' · '+letter:''}`:plan?(time>=plan.clip.duration?'Sequence complete':'Between words'):'Type words and select Show me the signs.';
  const key=segment?.start??null;
  if(key!==previousWord){previousWord=key;document.querySelectorAll('#avatar-words button').forEach(b=>{const selected=Number(b.dataset.start)===key;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
   $('avatar-description').replaceChildren();
   if(segment){const definition=avatarDefinition(segment.word),text=document.createElement('span');text.textContent=segment.signed?(definition.gloss||'Experimental word animation. Confirm its execution with a fluent signer.'):`${segment.word} is outside the motion vocabulary. This shows its letters, rather than inventing a sign.`;$('avatar-description').append(text);if(segment.signed){const source=document.createElement('a');source.href=definition.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent=' Motion reference ↗';$('avatar-description').append(source);}}
  }
 }
 function tick(now){
  if(!playing)return;
  if(last)time+=Math.min((now-last)/1000,.1)*Number($('avatar-speed').value);last=now;
  if(time>=plan.clip.duration){if($('avatar-loop').checked)time=0;else{time=plan.clip.duration;stop();}}
  draw();if(playing)raf=requestAnimationFrame(tick);
 }
 function play(){if(!plan)return;if(time>=plan.clip.duration)time=0;playing=true;last=0;$('avatar-play').textContent='Ⅱ Pause';raf=requestAnimationFrame(tick);}
 function refreshMode(){
  const supported=getLanguage()==='ASL',avatar=mode.value==='avatar';
  $('avatar-panel').hidden=!avatar;$('lesson-reference-grid').hidden=avatar&&supported;
  $('avatar-controls').hidden=!supported;stage.hidden=!supported;
  $('avatar-language-note').hidden=supported;
  $('avatar-language-note').textContent=`Character motion is not bundled for ${languageName(getLanguage())}. Reference practice is shown below. No ASL movements are substituted for this language.`;
  if(!avatar||!supported)stop();
  if(avatar&&supported)onAvatarMode();
 }
 function invalidate(message='Text or language changed. Select Show me the signs to rebuild.'){
  stop();plan=null;time=0;previousWord=null;range.max='0';$('avatar-words').replaceChildren();$('avatar-description').replaceChildren();
  $('avatar-play').disabled=true;$('avatar-replay').disabled=true;$('avatar-prev').disabled=true;$('avatar-next').disabled=true;range.disabled=true;
  $('avatar-coverage').textContent=message;draw();refreshMode();
 }
 function build(){
  invalidate('Preparing animation…');
  if(getLanguage()!=='ASL'){refreshMode();return;}
  try{
   plan=compileAvatar(getText(),getLanguage());time=0;previousWord=null;range.max=String(plan.clip.duration);range.disabled=false;
   for(const id of ['avatar-play','avatar-replay','avatar-prev','avatar-next'])$(id).disabled=false;
   $('avatar-coverage').textContent=`${plan.signed.length} animated word(s) · ${plan.spelled.length} fingerspelled word(s)${plan.spelled.length?' ('+plan.spelled.join(', ')+')':''}. English word order; complete ASL grammar is not generated.`;
   for(const segment of plan.segments){const b=document.createElement('button');b.type='button';b.className='avatar-word';b.textContent=segment.word+(segment.signed?'':' · spell');b.dataset.start=String(segment.start);b.onclick=()=>{stop();time=segment.start;draw();};$('avatar-words').append(b);}
   draw();refreshMode();
   if(mode.value==='avatar')play();
  }catch(error){invalidate(error.message);if(mode.value==='avatar')toast(error.message);}
 }
 mode.onchange=()=>{refreshMode();if(mode.value==='reference')onReferenceMode();else if(getText().trim())build();};
 $('avatar-play').onclick=()=>playing?stop():play();
 $('avatar-replay').onclick=()=>{if(!plan)return;stop();time=0;draw();play();};
 range.oninput=()=>{stop();time=Number(range.value);draw();};
 for(const [id,direction] of [['avatar-prev',-1],['avatar-next',1]])$(id).onclick=()=>{
  if(!plan)return;stop();const index=plan.segments.findIndex(s=>time<s.end);const next=direction===1?(index<0?plan.segments.length-1:Math.min(index+1,plan.segments.length-1)):(index<0?plan.segments.length-1:Math.max(index-1,0));time=plan.segments[next].start;draw();
 };
 $('avatar-angle').onchange=()=>{yaw=Number($('avatar-angle').value);draw();};
 $('avatar-reference-mode').onclick=()=>{mode.value='reference';refreshMode();onReferenceMode();};
 $('avatar-example').onclick=()=>{$('lesson-language').value='ASL';$('lesson-language').dispatchEvent(new Event('change',{bubbles:true}));$('lesson-text').value='I want to go home';mode.value='avatar';$('build-lesson').click();};
 $('lesson-text').addEventListener('input',()=>invalidate());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 $('avatar-vocabulary-count').textContent=`${AVATAR_WORDS.length} word labels including aliases · ASL letters and digits`;
 invalidate('ASL character ready. Try “I want to go home”.');
 return {build,invalidate,onView(view){if(view!=='learn')stop();},refreshMode};
}

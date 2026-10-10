import {compileMotionSequence,matchMotionSequence} from './motion-packs.js';
import {posePhase} from './vendor/sign-avatar/sign-clip.js';
import {createMotionLibrary} from './motion-library-ui.js';
import {createPracticeSpeech} from './practice-speech.js';
import {compileAvatar,sampleAvatar,activeAvatarSegment,avatarDefinition,AVATAR_WORDS} from './avatar-engine.js';
import {renderAvatarFrame,renderHandDetail} from './avatar-renderer.js';
import {languageName} from './languages.js';
import {PRACTICE_KEY,cleanPractice,savePhrase,recordPractice,advancePractice} from './avatar-practice.js';

const $=id=>document.getElementById(id);
const CONTROL_IDS=['avatar-play','avatar-replay','avatar-prev','avatar-next','avatar-frame-prev','avatar-frame-next','avatar-mark-practiced'];
export function createAvatarUI({getLanguage,getText,toast,onAvatarMode=()=>{},onReferenceMode=()=>{},createStage=async(container,callbacks)=>(await import('./avatar-human.js')).createHumanStage(container,callbacks)}){
 let plan=null,time=0,playing=false,last=0,raf=null,previousWord=null,human=null,humanLoading=false,humanFailed=false,focusStart=null,marked=false;
 let previewPose=null,speaking=false,narrationEpoch=0,viewActive=false;
 const narration=createPracticeSpeech({getSegment:()=>currentSegment(),toast,onManual:()=>stop(),onCaption:text=>{$('coach-caption').textContent=text;}});
 const motionLibrary=createMotionLibrary({getLanguage,toast,onChange:()=>invalidate('Motion library updated. Rebuild your sequence.'),onPreview:(text,language,motions)=>{if(language!==getLanguage())return;mode.value='avatar';$('lesson-text').value=text;build(motions);},onPose:phase=>{invalidate('Draft pose preview. This is an authored pose, not a verified sign.');previewPose=posePhase(phase);mode.value='avatar';refreshMode();ensureHuman();draw();}});
 let practice;try{practice=cleanPractice(JSON.parse(localStorage.getItem(PRACTICE_KEY)));}catch{practice=cleanPractice(null);}
 const stage=$('avatar-stage'),mode=$('lesson-display-mode'),range=$('avatar-seek');
 function stop(){speaking=false;narrationEpoch++;narration.stop();playing=false;cancelAnimationFrame(raf);raf=null;last=0;$('avatar-play').textContent='▷ Play character';}
 function persist(){try{localStorage.setItem(PRACTICE_KEY,JSON.stringify(practice));}catch{toast('Device storage is unavailable. This phrasebook lasts until you close the page.');}}
 function refreshPhrasebook(){
  $('avatar-saved-phrases').replaceChildren();$('avatar-progress').textContent=`${practice.sessions} sequence(s) marked practiced · ${practice.reviewed.length} animated word label(s) reviewed`;
  for(const [index,item] of practice.phrases.entries()){
   const row=document.createElement('div'),load=document.createElement('button'),remove=document.createElement('button');row.className='avatar-saved-row';load.className='avatar-saved-load';load.textContent=item.text+' · '+languageName(item.language);load.onclick=()=>loadPhrase(item.text,item.language);remove.className='avatar-saved-remove';remove.textContent='×';remove.setAttribute('aria-label','Remove saved phrase '+item.text);remove.onclick=()=>{practice.phrases.splice(index,1);persist();refreshPhrasebook();};row.append(load,remove);$('avatar-saved-phrases').append(row);
  }
  if(!practice.phrases.length){const empty=document.createElement('p');empty.className='caption';empty.textContent='Save a useful phrase, then return to it in one click.';$('avatar-saved-phrases').append(empty);}
 }
 function options(){return {yaw:Number($('avatar-angle').value)||0,zoom:Number($('avatar-zoom').value)||1,focus:$('avatar-focus').value||'body',contrast:$('avatar-contrast').checked};}
 function draw(){
  const segment=activeAvatarSegment(plan,time),letter=segment?.letters?.find(l=>time>=l.start&&time<l.end)?.letter||'',pose=previewPose||sampleAvatar(plan?.clip,time),view=options();
  if(human&&$('avatar-render-style').value==='human'){if(stage.contains&&!stage.contains(human.canvas))stage.replaceChildren(human.canvas);human.render(pose,view);}
  else{stage.innerHTML=renderAvatarFrame(pose,{...view,word:segment?.word||'',letter,spelled:!!segment&&!segment.signed})+`<div class="avatar-diagram-hands">${renderHandDetail(pose,'Right',view)}${renderHandDetail(pose,'Left',view)}</div>`;}
  range.value=String(time);$('avatar-time').textContent=`${time.toFixed(1)} / ${(plan?.clip.duration||0).toFixed(1)} s`;
  $('avatar-subtitle').textContent=previewPose?'Draft pose · not a verified sign':segment?`${segment.word}${segment.signed?' · animated word':' · fingerspelled'}${letter?' · '+letter:''}`:plan?(time>=plan.clip.duration?'Sequence complete':'Between words'):motionSupported()?'Character at rest · build a sequence to animate':`${languageName(getLanguage())} · character at rest · no motions loaded`;
  $('avatar-mark-practiced').disabled=!plan||marked;
  const key=segment?.start??null;
  if(key!==previousWord){previousWord=key;document.querySelectorAll('#avatar-words button').forEach(b=>{const selected=Number(b.dataset.start)===key;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});$('avatar-description').replaceChildren();
   if(segment){if(segment.custom){const badge=document.createElement('span');badge.textContent=segment.reviewer?'Author reports review by '+segment.reviewer+'. ':'Personal motion · unreviewed. ';$('avatar-description').append(badge);}const definition={...avatarDefinition(segment.word),gloss:segment.gloss,source:segment.source||avatarDefinition(segment.word).source},text=document.createElement('span');text.textContent=segment.signed?(definition.gloss||'Experimental word animation. Confirm execution with a fluent signer.'):`${segment.word} is outside the motion vocabulary. This shows its letters, rather than inventing a sign.`;$('avatar-description').append(text);if(segment.signed&&definition.source){const source=document.createElement('a');source.href=definition.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent=' Motion reference ↗';$('avatar-description').append(source);}}
   if(segment&&playing){const pending=narration.onSegment(segment);if(pending){speaking=true;last=0;const token=narrationEpoch;pending.finally(()=>{if(token===narrationEpoch){speaking=false;last=0;}});}}
  }
 }
 async function ensureHuman(){
  if(human||humanLoading||humanFailed||$('avatar-render-style').value!=='human'||mode.value!=='avatar')return;
  humanLoading=true;$('avatar-render-status').textContent='Loading textured human signer…';
  try{human=await createStage(stage,{onStatus(message){$('avatar-render-status').textContent=message;},onFailure(message){humanFailed=true;human?.dispose();human=null;humanLoading=false;$('avatar-render-style').value='lightweight';$('avatar-render-status').textContent=message;refreshMode();draw();}});
   humanLoading=false;if(human){refreshMode();if($('avatar-render-style').value!=='human')$('avatar-render-status').textContent='Lightweight diagram · enlarged hands';draw();}
  }catch{humanLoading=false;humanFailed=true;$('avatar-render-style').value='lightweight';$('avatar-render-status').textContent='3D graphics are unavailable in this browser. Enlarged hand diagrams remain available; try hardware acceleration or another browser for the textured model.';refreshMode();draw();}
 }
 function currentSegment(){return activeAvatarSegment(plan,time)||plan?.segments.find(s=>time<s.end)||plan?.segments.at(-1);}
 function tick(now){
  if(!playing||!plan)return;
  if(last&&!speaking){const next=advancePractice(plan,time,Math.min((now-last)/1000,.1)*Number($('avatar-speed').value),{repeatWord:$('avatar-repeat-word').checked,pauseWord:$('avatar-pause-word').checked,loop:$('avatar-loop').checked,focusStart});time=next.time;focusStart=next.focusStart;if(next.stop)stop();}
  if(playing)last=now;draw();if(playing)raf=requestAnimationFrame(tick);
 }
 function play(){if(!plan)return;if(time>=plan.clip.duration)time=0;else if($('avatar-pause-word').checked&&!$('avatar-repeat-word').checked){const segment=currentSegment();if(segment&&time>=segment.end-.002)time=plan.segments[plan.segments.indexOf(segment)+1]?.start??0;}playing=true;last=0;previousWord=null;focusStart=$('avatar-repeat-word').checked?currentSegment()?.start:null;$('avatar-play').textContent='Ⅱ Pause';raf=requestAnimationFrame(tick);}
 function motionSupported(){return getLanguage()==='ASL'||!!previewPose||plan?.language===getLanguage()||motionLibrary.get().some(m=>m.language===getLanguage());}
 function refreshMode(){
  motionLibrary.refresh();
  const supported=motionSupported(),avatar=mode.value==='avatar';$('avatar-panel').hidden=!avatar;$('lesson-reference-grid').hidden=avatar&&supported&&!!plan;
  // Model visibility does not imply that a language has motion data.
  for(const id of ['avatar-controls','avatar-stage','avatar-visual-options','avatar-render-status'])$(id).hidden=false;
  $('avatar-hand-labels').hidden=!human||$('avatar-render-style').value!=='human';$('avatar-language-note').hidden=supported;
  $('avatar-vocabulary-count').textContent=(getLanguage()==='ASL'?`${AVATAR_WORDS.length} bundled ASL labels · ASL letters and digits · `:'')+`${motionLibrary.get().filter(m=>m.language===getLanguage()).length} personal sourced motion(s) for ${languageName(getLanguage())}`;
  $('avatar-language-note').textContent=`The human character is visible, but no animations are loaded for ${languageName(getLanguage())}. It stays at rest. Watch this language’s source lessons below, or add its own sourced motion pack in Language motion studio. No ASL movements are substituted for this language.`;
  if(!avatar||!plan)stop();if(avatar&&supported&&(plan||previewPose))onAvatarMode();
  if(avatar&&viewActive)ensureHuman();
 }
 function invalidate(message='Text or language changed. Select Show me the signs to rebuild.'){
  stop();$('coach-caption').textContent='';plan=null;previewPose=null;time=0;previousWord=null;focusStart=null;marked=false;range.max='0';$('avatar-words').replaceChildren();$('avatar-description').replaceChildren();for(const id of CONTROL_IDS)$(id).disabled=true;range.disabled=true;$('avatar-coverage').textContent=message;draw();refreshMode();
 }
 function build(motions=motionLibrary.get()){
  invalidate('Preparing animation…');if(!motionSupported()&&!motions.some(m=>m.language===getLanguage())){
   $('avatar-coverage').textContent=`No animation is available for this text in ${languageName(getLanguage())}. The character remains at rest; this language’s source practice is available below.`;refreshMode();draw();if(mode.value==='avatar')ensureHuman();return;
  }
  try{const matched=matchMotionSequence(getText(),getLanguage(),motions);plan=matched.missing.length===0?compileMotionSequence(getText(),getLanguage(),motions):getLanguage()==='ASL'?compileAvatar(getText(),getLanguage(),{motions}):compileMotionSequence(getText(),getLanguage(),motions);time=0;previousWord=null;range.max=String(plan.clip.duration);range.disabled=false;for(const id of CONTROL_IDS)$(id).disabled=false;
   $('avatar-coverage').textContent=`${plan.signed.length} animated word(s) · ${plan.spelled.length} fingerspelled word(s)${plan.spelled.length?' ('+plan.spelled.join(', ')+')':''}. Input label order; sign-language sentence grammar is not generated. Personal motion review attribution is supplied by its author.`;
   for(const segment of plan.segments){const b=document.createElement('button');b.type='button';b.className='avatar-word';b.textContent=segment.word+(segment.signed?'':' · spell');b.dataset.start=String(segment.start);b.onclick=()=>{stop();time=segment.start;focusStart=segment.start;draw();};$('avatar-words').append(b);}draw();refreshMode();
   if(mode.value==='avatar'){ensureHuman();if(!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)play();}
  }catch(error){invalidate(error.message);if(mode.value==='avatar')toast(error.message);}
 }
 function loadPhrase(text,language='ASL'){$('lesson-language').value=language;$('lesson-language').dispatchEvent(new Event('change',{bubbles:true}));$('lesson-text').value=text;mode.value='avatar';$('build-lesson').click();}
 function stepFrame(direction){if(!plan)return;stop();time=Math.max(0,Math.min(plan.clip.duration,time+direction/15));draw();}
 mode.onchange=()=>{refreshMode();if(mode.value==='reference')onReferenceMode();else if(getText().trim())build();else ensureHuman();};
 $('avatar-play').onclick=()=>playing?stop():play();$('avatar-replay').onclick=()=>{if(!plan)return;stop();time=0;draw();play();};range.oninput=()=>{stop();time=Number(range.value);focusStart=null;draw();};
 for(const [id,direction] of [['avatar-prev',-1],['avatar-next',1]])$(id).onclick=()=>{if(!plan)return;stop();const index=plan.segments.findIndex(s=>time<s.end),next=direction===1?(index<0?plan.segments.length-1:Math.min(index+1,plan.segments.length-1)):(index<0?plan.segments.length-1:Math.max(index-1,0));time=plan.segments[next].start;focusStart=time;draw();};
 for(const [id,direction] of [['avatar-frame-prev',-1],['avatar-frame-next',1]])$(id).onclick=()=>stepFrame(direction);
 for(const id of ['avatar-angle','avatar-focus','avatar-contrast'])$(id).onchange=draw;$('avatar-zoom').oninput=draw;
 $('avatar-repeat-word').onchange=()=>{focusStart=$('avatar-repeat-word').checked?currentSegment()?.start:null;};
 $('avatar-render-style').onchange=()=>{if($('avatar-render-style').value==='human'){if(human){stage.replaceChildren(human.canvas);$('avatar-render-status').textContent='Textured 3D signer · synchronized enlarged hands';draw();}else{humanFailed=false;ensureHuman();}}else{stop();draw();$('avatar-render-status').textContent='Lightweight diagram · enlarged hands';}refreshMode();};
 $('avatar-fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('avatar-panel').requestFullscreen();}catch{toast('Fullscreen is unavailable. Use hand focus and zoom to enlarge the motion.');}};
 $('avatar-studio').tabIndex=0;$('avatar-studio').addEventListener('keydown',event=>{if(event.target!==$('avatar-studio')||!plan)return;if(event.code==='Space'){event.preventDefault();playing?stop():play();}if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();stepFrame(event.key==='ArrowRight'?1:-1);}});
 $('avatar-reference-mode').onclick=()=>{mode.value='reference';refreshMode();onReferenceMode();};$('avatar-example').onclick=()=>loadPhrase('I want to go home');
 $('avatar-save-phrase').onclick=()=>{try{practice=savePhrase(practice,getLanguage(),getText());persist();refreshPhrasebook();toast('Phrase saved on this device.');}catch(e){toast(e.message);}};
 $('avatar-mark-practiced').onclick=()=>{if(!plan||marked)return;practice=recordPractice(practice,plan);marked=true;persist();refreshPhrasebook();draw();};
 $('lesson-text').addEventListener('input',()=>invalidate());document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 $('avatar-vocabulary-count').textContent=`${AVATAR_WORDS.length} word labels including aliases · ASL letters and digits`;refreshPhrasebook();invalidate('Human signing studio ready. Choose a language and build a sequence.');
 return {build,invalidate,onView(view){viewActive=view==='learn';if(!viewActive)stop();else{refreshMode();draw();}},refreshMode,clearPractice(){narration.stop();motionLibrary.clear();practice=cleanPractice(null);try{localStorage.removeItem(PRACTICE_KEY);}catch{}refreshPhrasebook();}};
}

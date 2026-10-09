import {languageName,languageSource} from './languages.js';
import {COUNTRY_CODES,filterLanguages,validateWorldCatalog,validateLearningState,resourceStatus,validateClip} from './world-engine.js';
import {listClips,saveClip,deleteClip,clearClips} from './clip-storage.js';
const $=id=>document.getElementById(id),el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const link=(url,text)=>{const a=el('a',text,'secondary');a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
export function createWorldUI(api){
 let data=null,selected='ASL',state=validateLearningState(null),clips=[],objectUrls=[],page=0;
 try{state=validateLearningState(JSON.parse(localStorage.getItem('sv-world-learning')||'null'));}catch{}
 const countryNames=new Intl.DisplayNames(['en'],{type:'region'});
 for(const code of [...COUNTRY_CODES].sort((a,b)=>countryNames.of(a).localeCompare(countryNames.of(b)))){const o=el('option',countryNames.of(code));o.value=code;$('world-country').append(o);}
 function persist(){try{localStorage.setItem('sv-world-learning',JSON.stringify(state));}catch{api.toast('Learning progress could not be saved. Export a backup.');}}
 function revokeUrls(){objectUrls.forEach(url=>URL.revokeObjectURL(url));objectUrls=[];}
 function draw(){
  if(!data)return;
  const found=filterLanguages(data.profiles,{query:$('world-search').value,country:$('world-country').value,region:$('world-region').value,bookmarks:state.bookmarks,savedOnly:$('world-saved').checked});
  page=Math.min(page,Math.max(0,Math.ceil(found.length/18)-1));
  $('world-count').textContent=found.length+' language profiles · '+state.bookmarks.length+' saved · '+state.practiced.length+' marked practiced';
  $('world-results').replaceChildren();
  for(const p of found.slice(page*18,(page+1)*18)){
   const card=el('article',undefined,'world-card'+(p.id===selected?' selected':''));
   const badge=el('span',p.localCatalog?'INDEXED SIGN LESSONS':p.resources.length?'SOURCE VIDEO DIRECTORY':'RESEARCH RESOURCE','badge');
   const heading=el('h3',p.name+(p.aliases?.length?' · '+p.aliases[0]:'')),where=el('p',p.countries.length?p.countries.map(c=>countryNames.of(c)).join(' · '):'International / cross-community','caption');
   const count=el('p',p.resources.length+' dictionary / lexical resource(s)');
   const actions=el('div',undefined,'actions'),view=el('button','Explore →','text-button'),save=el('button',state.bookmarks.includes(p.id)?'★ Saved':'☆ Save','text-button');
   view.onclick=()=>{selected=p.id;drawDetail();draw();$('world-detail').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});};
   save.setAttribute('aria-label',(state.bookmarks.includes(p.id)?'Unsave ':'Save ')+p.name);save.onclick=()=>{state.bookmarks=state.bookmarks.includes(p.id)?state.bookmarks.filter(x=>x!==p.id):[...state.bookmarks,p.id];persist();draw();};
   actions.append(view,save);card.append(badge,heading,where,count,actions);$('world-results').append(card);
  }
  if(!found.length){const box=el('div',undefined,'library-empty');box.append(el('h3','No resource verified for this selection'),el('p','This directory is incomplete. No language is inferred from your country. Browse all profiles or consult the local Deaf association.'),link('https://wfdeaf.org/','World Federation of the Deaf ↗'));$('world-results').append(box);}
  const pages=Math.max(1,Math.ceil(found.length/18));$('world-page').textContent='Page '+(page+1)+' of '+pages;$('world-prev').disabled=page===0;$('world-next').disabled=page>=pages-1;
 }
 function drawDetail(){
  if(!data)return;const p=data.profiles.find(p=>p.id===selected);if(!p)return;
  const panel=$('world-detail');panel.replaceChildren();panel.append(el('div','YOUR NEXT LANGUAGE','eyebrow'),el('h2',p.name),el('p',p.note,'caption'));
  const actions=el('div',undefined,'world-detail-actions');
  const learn=el('button','Type words to practice →','primary');learn.onclick=()=>api.practice(p.id);
  const train=el('button','Train a personal sign','secondary');train.onclick=()=>api.train(p.id);
  const practiced=el('button',state.practiced.includes(p.id)?'✓ Marked practiced':'Mark practiced','secondary');practiced.onclick=()=>{state.practiced=state.practiced.includes(p.id)?state.practiced.filter(x=>x!==p.id):[...state.practiced,p.id];persist();drawDetail();draw();};
  actions.append(learn,train,practiced);panel.append(actions);
  panel.append(el('p',p.localCatalog?'Bundled vocabulary lessons available. Webcam recognition still requires a pretrained or personal model.':'Source demonstrations are available through the links below. There is no bundled word index or pretrained translator for this profile. Import verified per-sign references to build typed practice.','notice'));
  const list=el('div',undefined,'world-resource-list');
  for(const id of p.resources){
   const r=data.resources.find(r=>r.id===id),status=resourceStatus(r),card=el('article',undefined,'world-resource');
   card.append(el('span',status.label,'badge'),el('h3',r.name));
   const url=r.urls[0],publicAccess=status.kind==='public';
   card.append(el('p',r.institution||'Provider information at source','caption'),el('p',r.access,'caption'));
   const buttons=el('div',undefined,'actions');if(url&&status.kind!=='unavailable')buttons.append(link(url,publicAccess?'Watch signs at source ↗':'View provider / access ↗'));buttons.append(link(r.sourceUrl,'Resource & rights ↗'));card.append(buttons);
   const rights=el('details');rights.append(el('summary','Video permissions'),el('p',r.license+'. Videos stay at the provider; this app does not copy them.','caption'));card.append(rights);list.append(card);
  }
  if(!p.resources.length)list.append(el('p','Only research documentation is indexed for this profile. Access may require the creator’s approval.','caption'));
  panel.append(list,link(p.sourceUrl,'View all language resources ↗'));
  const label=el('label','My learning notes'),notes=el('textarea');notes.rows=3;notes.maxLength=1000;notes.value=state.notes[p.id]||'';notes.placeholder='Meaning, movement, regional variants…';notes.onchange=()=>{state.notes[p.id]=notes.value;persist();};label.append(notes);panel.append(label);
  $('clip-language').value=p.id;
  renderClips();
 }
 function renderClips(){
  revokeUrls();$('world-clips').replaceChildren();
  for(const clip of clips.filter(c=>c.language===selected)){
   const card=el('article',undefined,'clip-card');card.append(el('h3',clip.label));
   const image=clip.blob.type.startsWith('image/'),video=el(image?'img':'video');if(image)video.alt=languageName(clip.language)+' reference: '+clip.label;else{video.controls=true;video.playsInline=true;video.preload='metadata';}const url=URL.createObjectURL(clip.blob);objectUrls.push(url);video.src=url;video.setAttribute('aria-label',languageName(clip.language)+' lesson: '+clip.label);
   const controls=el('div',undefined,'actions'),speed=el('select');speed.setAttribute('aria-label','Video speed');
   for(const rate of [.5,.75,1,1.25]){const o=el('option',rate+'×');o.value=String(rate);speed.append(o);}speed.value='1';speed.onchange=()=>video.playbackRate=Number(speed.value);
   const loopLabel=el('label',undefined,'check-label'),loop=el('input');loop.type='checkbox';loop.onchange=()=>video.loop=loop.checked;loopLabel.append(loop,el('span','Loop'));
   const train=el('button','Practice on camera','text-button');train.onclick=()=>api.train(clip.language,clip.label);
   const remove=el('button','Remove clip','text-button');remove.onclick=async()=>{if(await api.confirmAction('Remove lesson clip?','Remove this video from this browser? Your original file and webcam examples remain.')){try{await deleteClip(clip.id);clips=clips.filter(c=>c.id!==clip.id);window.dispatchEvent(new Event('sv-clips-changed'));renderClips();}catch{api.toast('The clip could not be removed. Retry.');}}};
   if(!image)controls.append(speed,loopLabel);controls.append(train,remove);card.append(video,el('p',clip.source||'Your permission-confirmed local video','caption'),controls);$('world-clips').append(card);
  }
  if(!clips.some(c=>c.language===selected))$('world-clips').append(el('p','No personal lesson clips for '+languageName(selected)+'. Use the verified video sources above or add a clip you have permission to use.','caption'));
 }
 $('world-search').oninput=()=>{page=0;draw();};for(const id of ['world-country','world-region','world-saved'])$(id).onchange=()=>{page=0;draw();};
 $('world-prev').onclick=()=>{page--;draw();};$('world-next').onclick=()=>{page++;draw();};
 $('clip-language').onchange=()=>{selected=$('clip-language').value;drawDetail();draw();};
 $('add-clip').onclick=async()=>{
  const file=$('clip-file').files[0],language=$('clip-language').value,label=$('clip-label').value.trim();
  try{
   validateClip(file,label,language,$('clip-permission').checked);
   if(clips.reduce((n,c)=>n+c.blob.size,0)+file.size>500*1024*1024)throw Error('Personal clips are limited to 500 MB. Remove a clip to free space.');
   const clip={id:crypto.randomUUID(),language,label,source:$('clip-source').value.trim().slice(0,300),createdAt:new Date().toISOString(),blob:file};
   await saveClip(clip);clips.push(clip);window.dispatchEvent(new Event('sv-clips-changed'));selected=language;$('clip-file').value='';$('clip-label').value='';$('clip-permission').checked=false;drawDetail();draw();api.toast('Lesson saved on this device and available in typed practice. It does not train camera recognition.');
  }catch(error){api.toast(error.message);}
 };
 $('export-progress').onclick=()=>api.download('signvoice-learning-progress.json',JSON.stringify({schemaVersion:1,type:'self-reported-learning-progress',...state},null,2));
 $('import-progress').onchange=async event=>{const file=event.target.files[0];event.target.value='';if(!file)return;try{if(file.size>1024*1024)throw Error('Use a progress file smaller than 1 MB.');const value=JSON.parse(await file.text());if(value.schemaVersion!==1||value.type!=='self-reported-learning-progress')throw Error('This is not a learning progress file.');const incoming=validateLearningState(value);if(await api.confirmAction('Replace learning progress?','Replace saved language bookmarks, practiced markers and notes? Personal clips and webcam recordings are kept.')){state=incoming;persist();draw();drawDetail();}}catch(error){api.toast('Progress import failed: '+error.message);}};
 async function load(){
  try{const response=await fetch(new URL('./catalog/world.json',import.meta.url));if(!response.ok)throw Error('Catalog unavailable');data=validateWorldCatalog(await response.json());$('world-stats').textContent=data.profiles.length+' language profiles · '+data.resources.length+' resource records · '+new Set(data.profiles.flatMap(p=>p.countries)).size+' country / territory associations';draw();drawDetail();}
  catch{ $('world-count').textContent='World catalog could not load. Reload to retry.';$('world-results').replaceChildren(link('https://www.sign-lang.uni-hamburg.de/lr/compendium/','Open source resource directory ↗'));api.toast('The world directory could not load.');}
  try{clips=await listClips();renderClips();}catch{api.toast('Personal video storage is unavailable in this browser. Source lessons are still available.');}
 }
 load();
 return {selectLanguage(id){selected=id;drawDetail();draw();api.navigate('world');},onView(view){if(view!=='world')$('world-clips').querySelectorAll('video').forEach(v=>v.pause());},async clear(){await clearClips();clips=[];state=validateLearningState(null);persist();renderClips();draw();drawDetail();}};
}


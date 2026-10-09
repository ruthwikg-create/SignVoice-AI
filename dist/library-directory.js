import {LANGUAGES} from './languages.js';
import {REQUESTED_LANGUAGES,COMMON_NAMES,ALPHABET_GUIDES,learningResource} from './learning-resources.js';
import {safeSourceUrl} from './world-engine.js';

const normalize=value=>String(value).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
export function libraryProfiles(entries=[],query=''){
 const counts=new Map();
 for(const entry of entries){
  const count=counts.get(entry.language)||{words:0,letters:0,personal:0};
  if(entry.clipBlob||entry.kind==='personal')count.personal++;
  else if(entry.kind==='alphabet')count.letters++;
  else if(entry.category!=='Alphabet & guides')count.words++;
  counts.set(entry.language,count);
 }
 const words=normalize(query).trim().split(/\s+/).filter(Boolean);
 return REQUESTED_LANGUAGES.map(id=>{
  const profile=LANGUAGES.find(p=>p.id===id);
  return {...profile,shortName:COMMON_NAMES[id],provider:learningResource(id),alphabet:ALPHABET_GUIDES[id]||null,counts:counts.get(id)||{words:0,letters:0,personal:0}};
 }).filter(p=>words.every(word=>normalize([p.name,p.shortName,p.id,...(p.aliases||[])].join(' ')).includes(word)));
}
export function libraryResources(world,id){
 const primary=learningResource(id),resources=[{id:'primary-'+id,name:primary.name,urls:[primary.url],access:primary.lookupLanguage,license:'Check terms at the source',sourceUrl:primary.url}];
 const profile=world?.profiles.find(p=>p.id===id),seen=new Set([primary.url.replace(/\/$/,'')]);
 for(const resourceId of profile?.resources||[]){
  const resource=world.resources.find(r=>r.id===resourceId);if(!resource)continue;
  const urls=resource.urls.filter(url=>safeSourceUrl(url)&&!seen.has(url.replace(/\/$/,'')));
  if(!urls.length)continue;urls.forEach(url=>seen.add(url.replace(/\/$/,'')));resources.push({...resource,urls});
 }
 return resources;
}

export function createLibraryDirectory({getEntries,getWorld,getLanguage,onSelect,onAlphabet}){
 const search=document.getElementById('library-directory-search'),grid=document.getElementById('library-directory-grid');
 const link=(url,text)=>{const a=document.createElement('a');a.href=url;a.textContent=text;a.target='_blank';a.rel='noopener noreferrer';a.className='text-button';return a;};
 function render(){
  const profiles=libraryProfiles(getEntries(),search.value);grid.replaceChildren();
  document.getElementById('library-directory-count').textContent=`${profiles.length} of ${REQUESTED_LANGUAGES.length} language libraries`;
  for(const profile of profiles){
   const card=document.createElement('article');card.className='sign-card language-library-card'+(profile.id===getLanguage()?' selected':'');
   const badge=document.createElement('span');badge.className='badge';badge.textContent=profile.shortName;
   const title=document.createElement('h3');title.textContent=profile.name;
   const coverage=document.createElement('p');coverage.textContent=profile.counts.words?`${profile.counts.words.toLocaleString()} indexed word / concept references`:'Source library linked · word index not bundled';
   const available=document.createElement('p');available.className='caption';available.textContent=[profile.alphabet?'Alphabet / fingerspelling guide linked':'Alphabet guide not yet indexed',profile.counts.letters?`${profile.counts.letters} indexed letters`:'',profile.counts.personal?`${profile.counts.personal} personal lessons`:''].filter(Boolean).join(' · ');
   const actions=document.createElement('div');actions.className='actions';
   const browse=document.createElement('button');browse.type='button';browse.className='secondary';browse.textContent='Browse library';browse.onclick=()=>{onSelect(profile.id);document.getElementById('catalog-global-resources').scrollIntoView({block:'start',behavior:'smooth'});};
   actions.append(browse,link(profile.provider.url,'Dictionary / lessons ↗'));
   if(profile.alphabet){const alphabet=document.createElement('button');alphabet.type='button';alphabet.className='text-button';alphabet.textContent='Alphabet / fingerspelling';alphabet.onclick=()=>onAlphabet(profile.id);actions.append(alphabet);}
   card.append(badge,title,coverage,available,actions);grid.append(card);
  }
  if(!profiles.length){const empty=document.createElement('p');empty.className='library-empty';empty.textContent='No language matches. Try its full name or abbreviation.';grid.append(empty);}
  renderSources();
 }
 function renderSources(){
  const id=getLanguage(),sources=libraryResources(getWorld(),id),grid=document.getElementById('library-source-grid');grid.replaceChildren();
  document.getElementById('library-source-heading').textContent=`${LANGUAGES.find(p=>p.id===id)?.name||id} · ${sources.length} source libraries`;
  for(const resource of sources){
   const card=document.createElement('article');card.className='sign-card';
   const title=document.createElement('h3');title.textContent=resource.name;
   const access=document.createElement('p');access.textContent=resource.access;
   const terms=document.createElement('p');terms.className='caption';terms.textContent='Usage: '+resource.license;
   const actions=document.createElement('div');actions.className='actions';resource.urls.forEach((url,i)=>actions.append(link(url,resource.urls.length===1?'Open source library ↗':`Source ${i+1} ↗`)));
   card.append(title,access,terms,actions);grid.append(card);
  }
 }
 search.addEventListener('input',render);
 return {render};
}

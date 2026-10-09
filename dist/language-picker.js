import {LANGUAGES} from './languages.js';

const normalize=value=>String(value).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().trim();
const sortedLanguages=[...LANGUAGES].sort((a,b)=>a.name.localeCompare(b.name));

export function findLanguages(query){
 const normalized=normalize(query),words=normalized.split(/\s+/).filter(Boolean);
 return sortedLanguages.filter(profile=>{
  const text=normalize([profile.name,profile.id,...(profile.aliases||[])].join(' '));
  return words.every(word=>text.includes(word));
 }).sort((a,b)=>{
  const exact=profile=>[profile.name,profile.id,...(profile.aliases||[])].some(value=>normalize(value)===normalized);
  return Number(exact(b))-Number(exact(a))||a.name.localeCompare(b.name);
 });
}

export function setupLanguageSearch(ids){
 for(const id of ids){
  const select=document.getElementById(id),searchId=id+'-search';
  if(!select||document.getElementById(searchId))continue;
  const label=select.closest('label');if(!label)continue;
  const wrapper=document.createElement('div');
  wrapper.className=['language-picker',label.className].filter(Boolean).join(' ');
  label.className='';label.htmlFor=id;
  label.replaceWith(wrapper);wrapper.append(label);
  const searchLabel=document.createElement('label');
  searchLabel.className='sr-only';searchLabel.htmlFor=searchId;searchLabel.textContent='Search sign languages';
  const input=document.createElement('input');
  input.id=searchId;input.type='search';input.autocomplete='off';input.spellcheck=false;
  input.placeholder='Search American, British, ASL…';
  const status=document.createElement('span');
  status.id=id+'-search-status';status.className='language-search-status';status.setAttribute('aria-live','polite');
  input.setAttribute('aria-describedby',status.id);
  const results=document.createElement('ul');
  results.id=id+'-search-results';results.className='language-search-results';results.hidden=true;
  results.setAttribute('aria-label','Matching sign languages');
  input.setAttribute('aria-controls',results.id);
  wrapper.append(searchLabel,input,status,results);
  let matches=[];
  const clear=()=>{input.value='';matches=[];results.replaceChildren();results.hidden=true;status.textContent='';};
  const choose=profile=>{
   select.value=profile.id;clear();
   select.dispatchEvent(new Event('change',{bubbles:true}));select.focus();
  };
  input.addEventListener('input',()=>{
   if(!input.value.trim()){clear();return;}
   matches=findLanguages(input.value);results.replaceChildren();results.hidden=!matches.length;
   status.textContent=matches.length?`${matches.length} matching ${matches.length===1?'language':'languages'}. Choose a result or press Enter.`:'No matching languages. Try a full name or abbreviation.';
   for(const profile of matches){
    const item=document.createElement('li'),button=document.createElement('button');
    button.type='button';button.textContent=profile.name+(profile.aliases?.length?' · '+profile.aliases[0]:'');
    button.addEventListener('click',()=>choose(profile));item.append(button);results.append(item);
   }
  });
  input.addEventListener('keydown',event=>{
   if(event.key==='Enter'){event.preventDefault();if(matches.length)choose(matches[0]);}
   if(event.key==='ArrowDown'&&matches.length){event.preventDefault();results.querySelector('button').focus();}
  });
  results.addEventListener('keydown',event=>{
   if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
   const buttons=[...results.querySelectorAll('button')],current=buttons.indexOf(document.activeElement);
   const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:current+(event.key==='ArrowDown'?1:-1);
   event.preventDefault();if(next<0)input.focus();else buttons[Math.min(next,buttons.length-1)]?.focus();
  });
  wrapper.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();clear();input.focus();}});
  select.addEventListener('change',clear);
  document.addEventListener('pointerdown',event=>{if(!wrapper.contains(event.target))clear();});
  wrapper.addEventListener('focusout',event=>{if(!wrapper.contains(event.relatedTarget))clear();});
 }
}

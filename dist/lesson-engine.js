// A lexical practice planner, not a sign-language grammar/translation model.
export function normalize(text){return String(text).normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/[-_]/g,' ').replace(/[^\p{L}\p{M}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();}
export function recognitionStatus(entry,personalEntries=[],models={}){
  const candidates=personalEntries.filter(e=>e.language===entry.language&&e.kind!=='neutral');
  const aliases=[entry.label,...(entry.aliases||[])].map(normalize);
  const personal=candidates.find(e=>aliases.includes(normalize(e.label)));
  const ready=!!personal&&!!models[entry.language]?.classes.some(c=>c.id===personal.id);
  if(!ready&&entry.language==='ASL'&&normalize(entry.label)==='i love you')return {ready:true,id:'builtin-ily',label:'Pretrained recognition'};
  return {ready,id:personal?.id||null,label:ready?'Personal recognition trained':personal?`${personal.samples.length} examples · train to recognize`:'Reference only · training needed'};
}
export function buildIndex(entries){const index=new Map();let longest=1;
  for(const entry of entries){for(const text of [entry.label,...(entry.aliases||[])]){const key=normalize(text);if(!key||key.length>120)continue;const words=key.split(' ').length;if(words>8)continue;longest=Math.max(longest,words);if(!index.has(key))index.set(key,[]);index.get(key).push(entry);}}
  return {index,longest};
}
export function makePlan(text,language,entries,{fingerspell=true,maxSteps=160}={}){
  const words=normalize(text).split(' ').filter(Boolean).slice(0,120),filtered=entries.filter(e=>e.language===language),{index,longest}=buildIndex(filtered),steps=[];
  for(let i=0;i<words.length&&steps.length<maxSteps;){let match=null,length=0;
    for(let n=Math.min(longest,words.length-i);n>=1;n--){const candidates=index.get(words.slice(i,i+n).join(' '));if(candidates){match=candidates;length=n;break;}}
    if(match){steps.push({kind:'sign',text:words.slice(i,i+length).join(' '),entry:match[0],alternatives:match.slice(1)});i+=length;continue;}
    const word=words[i++];
    if(language==='ASL'&&fingerspell&&/^[a-z]+$/.test(word)){for(const letter of word.toUpperCase()){if(steps.length>=maxSteps)break;const candidates=index.get(letter.toLowerCase())||[];steps.push({kind:'letter',text:letter,word,entry:candidates.find(e=>e.kind==='alphabet')||{id:'asl-letter-'+letter,language:'ASL',label:letter,aliases:[],kind:'alphabet',source:'Public-domain ASL alphabet',referenceUrl:'https://commons.wikimedia.org/wiki/File:Asl_alphabet_gallaudet_ann.png',media:null}});}}
    else steps.push({kind:'missing',text:word,language});
  }
  return {language,input:text,steps,missing:steps.filter(s=>s.kind==='missing').map(s=>s.text),fingerspelledWords:[...new Set(steps.filter(s=>s.kind==='letter').map(s=>s.word))],truncated:words.length>=120||steps.length>=maxSteps};
}
export function searchCatalog(entries,{language,query='',letter='',category='',limit=36,page=0}={}){
  const terms=normalize(query).split(' ').filter(Boolean);
  const all=entries.filter(e=>(!language||e.language===language)&&(!letter||normalize(e.label).startsWith(letter.toLowerCase()))&&(!category||e.category===category)&&terms.every(t=>normalize([e.label,...(e.aliases||[])].join(' ')).includes(t)));
  all.sort((a,b)=>a.label.localeCompare(b.label));
  const pages=Math.max(1,Math.ceil(all.length/limit)),safePage=Math.max(0,Math.min(page,pages-1));return {total:all.length,pages,page:safePage,entries:all.slice(safePage*limit,(safePage+1)*limit)};
}
export function validReferenceUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}}
export function validateReferenceCatalog(data){
  if(data?.schemaVersion!==1||!Array.isArray(data.entries)||data.entries.length>30000)throw Error('Use a reference catalog with schemaVersion 1 and up to 30,000 entries.');
  const seen=new Set();
  for(const e of data.entries){
    if(!['ISL','ASL'].includes(e.language)||typeof e.id!=='string'||!e.id||typeof e.label!=='string'||!e.label.trim()||e.label.length>160||!Array.isArray(e.aliases)||e.aliases.some(a=>typeof a!=='string'||a.length>160)||typeof e.source!=='string'||!e.source||!validReferenceUrl(e.referenceUrl)||!['reference','alphabet','personal'].includes(e.kind))throw Error('Invalid reference entry.');
    if(seen.has(e.language+e.id))throw Error('Duplicate reference ID.');seen.add(e.language+e.id);
    if(e.media){if(e.media.type==='drive'&&!/^[\w-]{10,100}$/.test(e.media.id)||e.media.type==='youtube'&&!/^[\w-]{11}$/.test(e.media.id)||!['drive','youtube'].includes(e.media.type))throw Error('Invalid demonstration video.');}
  }return data;
}

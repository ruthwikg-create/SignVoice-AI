import {LANGUAGES,isLanguage} from './languages.js';
export const COUNTRY_CODES = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
export function safeSourceUrl(value,{httpsOnly=false}={}){try{const u=new URL(value);return (httpsOnly?u.protocol==='https:':['https:','http:'].includes(u.protocol))&&!u.username&&!u.password;}catch{return false;}}
export function validateWorldCatalog(data){
 if(data?.schemaVersion!==1||!Array.isArray(data.profiles)||!Array.isArray(data.resources))throw Error('Invalid world catalog');
 const ids=new Set(),resources=new Set(data.resources.map(r=>r.id));
 for(const p of data.profiles){if(!isLanguage(p.id)||ids.has(p.id)||!Array.isArray(p.countries)||p.countries.some(c=>!COUNTRY_CODES.includes(c))||!safeSourceUrl(p.sourceUrl,{httpsOnly:true})||!Array.isArray(p.resources)||p.resources.some(id=>!resources.has(id)))throw Error('Invalid language profile');ids.add(p.id);}
 if(ids.size!==LANGUAGES.length)throw Error('Language registry and catalog do not match');
 const seen=new Set();
 for(const r of data.resources){if(typeof r.id!=='string'||seen.has(r.id)||typeof r.name!=='string'||!r.name||!safeSourceUrl(r.sourceUrl,{httpsOnly:true})||!Array.isArray(r.urls)||r.urls.some(u=>!safeSourceUrl(u)))throw Error('Invalid source resource');seen.add(r.id);}
 return data;
}
export function resourceStatus(resource){
 const text=resource.access.toLowerCase();
 if(/subscription/.test(text))return {kind:'restricted',label:'Some content requires subscription'};
 if(/not an indexed video|training information/.test(text))return {kind:'community',label:'Community learning resource'};
 if(/unavailable|not.*available/.test(text))return {kind:'unavailable',label:'Availability limited'};
 if(/restricted|registered|registration|filling a form/.test(text))return {kind:'restricted',label:'Access conditions apply'};
 return {kind:'public',label:'Public video resource'};
}
export function filterLanguages(profiles,{query='',country='',region='',bookmarks=[],savedOnly=false}={}){
 const q=query.normalize('NFKC').toLowerCase().trim();
 return profiles.filter(p=>(!country||p.countries.includes(country))&&(!region||p.region===region)&&(!savedOnly||bookmarks.includes(p.id))&&(!q||[p.name,p.id,p.iso,...(p.aliases||[]),...p.countries.map(c=>new Intl.DisplayNames(['en'],{type:'region'}).of(c))].join(' ').toLowerCase().includes(q))).sort((a,b)=>a.name.localeCompare(b.name));
}
export function validateLearningState(value){
 const result={bookmarks:[],practiced:[],notes:{}};
 if(!value||typeof value!=='object')return result;
 for(const key of ['bookmarks','practiced'])if(Array.isArray(value[key]))result[key]=[...new Set(value[key].filter(isLanguage))];
 if(value.notes&&typeof value.notes==='object')for(const [id,note] of Object.entries(value.notes))if(isLanguage(id)&&typeof note==='string')result.notes[id]=note.slice(0,1000);
 return result;
}
export function validateClip(file,label,language,permission){
 if(!isLanguage(language)||!label.trim()||label.trim().length>160)throw Error('Choose a language and a label of up to 160 characters.');
 if(!permission)throw Error('Confirm that you have permission to use this clip.');
 if(!file||file.size<=0||file.size>100*1024*1024)throw Error('Choose a video smaller than 100 MB.');
 if(!['video/mp4','video/webm','video/ogg','image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Use an MP4, WebM or Ogg video, or a PNG, JPEG or WebP image.');
 if(file.type.startsWith('image/')&&file.size>20*1024*1024)throw Error('Choose an image smaller than 20 MB.');
 return true;
}


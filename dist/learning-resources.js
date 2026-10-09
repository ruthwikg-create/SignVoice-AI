import {languageName,languageSource} from './languages.js';
// Common display names are separate from stable storage IDs and recognition models.
export const REQUESTED_LANGUAGES = ['ASL','ISL','BFI','ASF','NZS','FSL','MFS','CSL','ZIB','JSL','BZS','SSP','GSG','ISE','SFS','NSL','HKS','KVK','TSE','FSP','XKI','PSR','ILS'];
export const COMMON_NAMES = {ASL:'ASL',ISL:'ISL · Indian',BFI:'BSL',ASF:'Auslan',NZS:'NZSL',FSL:'LSF · French',MFS:'LSM',CSL:'CSL · Chinese',ZIB:'ZGS / ZSL',JSL:'JSL',BZS:'Libras',SSP:'LSE',GSG:'DGS',ISE:'LIS',SFS:'SASL',NSL:'NS / NTS · Norwegian',HKS:'HKSL',KVK:'KSL · Korean',TSE:'TSL · Taiwan',FSP:'FSL · Filipino',XKI:'KSL · Kenyan',PSR:'LGP',ILS:'International Sign (IS)'};
const providers={
 ASL:['Lifeprint','https://www.lifeprint.com/dictionary.htm','English'],
 ISL:['ISLRTC','https://islrtc.nic.in/','English / Hindi'],
 BFI:['UCL BSL SignBank','https://bslsignbank.ucl.ac.uk/','English'],
 ASF:['Auslan Signbank','https://auslan.org.au/','English'],
 NZS:['NZSL Dictionary · Victoria University of Wellington','https://www.nzsl.nz/','English / Māori'],
 FSL:['Le Dico Elix','https://dico.elix-lsf.fr/','French'],
 MFS:['Wikisigns LSM','http://www.wikisigns.org/list/es/lsm','Spanish'],
 CSL:['SpreadTheSign','https://www.spreadthesign.com/','Select Chinese Sign Language at source'],
 ZIB:['Deaf Zimbabwe Trust','https://deafzimbabwetrust.org/','Ask the community for verified local lessons'],
 JSL:['Asian Signbank','http://www.cslds.org/asb/welcome.jsp','Select Japanese Sign Language at source'],
 BZS:['UFSC Signbank da Libras','https://signbank.libras.ufsc.br/','Portuguese'],
 SSP:['Fundación CNSE · DILSE','https://fundacioncnse-dilse.org/','Spanish'],
 GSG:['Universität Hamburg · Meine DGS','https://meine-dgs.de/ling/types_en.html','German / English'],
 ISE:['DIZLIS','http://www.dizlis.it/','Italian'],
 SFS:['National Institute for the Deaf','https://nid.org.za/resources/','English / Afrikaans · dictionary subscription may apply'],
 NSL:['Statped · Norsk Tegnordbok','https://www.tegnordbok.no/','Norwegian'],
 HKS:['CUHK Hong Kong Sign Language Browser','http://www.cslds.org/hkslbrowser/','Chinese / English'],
 KVK:['National Institute of Korean Language','https://sldict.korean.go.kr/','Korean'],
 TSE:['National Chung Cheng University · TSL Dictionary','https://twtsl.ccu.edu.tw/en/intro','English / Traditional Chinese'],
 FSP:['Benilde CEAD · FSL Signbank','https://cead.benilde.edu.ph/fsl-signbank/','English / Filipino'],
 XKI:['KSL Dictionary','https://www.ksldictionary.com/','English'],
 PSR:['SpreadTheSign','https://www.spreadthesign.com/','Select Portuguese Sign Language at source'],
 ILS:['Dictio','https://www.dictio.info/','Select International Sign at source; it is not a universal sign language']
};
export const ALPHABET_GUIDES={
 ASL:{title:'ASL alphabet chart',url:'https://commons.wikimedia.org/wiki/File:Asl_alphabet_gallaudet_ann.png',source:'Darren Stone / Dancor · public domain',chart:true},
 ISL:{title:'ISL alphabet chart · ISLRTC',url:'https://islrtc.nic.in/document-category/awareness-material/',source:'ISLRTC · Government of India',note:'Choose Alphabet in ISL on the official awareness-material page.'},
 BFI:{title:'BSL alphabet video',url:'https://deafaction.org/bsl-courses/learn-the-bsl-alphabet/',source:'Deaf Action',media:{type:'vimeo',id:'537654929'}},
 ASF:{title:'Auslan two-handed alphabet and spelling player',url:'https://auslan.org.au/spell/twohanded.html',source:'Auslan Signbank',note:'Images and spelling demonstrations open at the provider.'},
 NZS:{title:'NZSL alphabet · signer and viewer perspectives',url:'https://www.nzsl.nz/alphabet',source:'Victoria University of Wellington',note:'Alphabet images and source demonstrations; availability varies.'},
 FSL:{title:'LSF dactylologie · alphabet video',url:'https://surdites-info-service.fr/dactylologie-alphabet-en-signes',source:'Surdités Info Service',media:{type:'youtube',id:'2-n1icoDxLM'}},
 SFS:{title:'SASL alphabet and counting poster',url:'https://nid.org.za/wp-content/uploads/2023/04/basic-01-2023-scaled.jpg',source:'National Institute for the Deaf',note:'View the provider’s alphabet image in a separate tab.'},
 SSP:{title:'LSE alfabeto dactilológico · images',url:'https://www.cnse.es/lseaula/recursos-linguisticos/dactilologico.php',source:'CNSE · Aula LSE',note:'Includes language-specific letters and movement; view images at source.'},
 XKI:{title:'Kenyan KSL alphabet and numbers',url:'https://www.ksldictionary.com/blog/1-ksl-alphabet-numbers',source:'KSL Dictionary',note:'Provider offers alphabet posters; availability varies.'},
 MFS:{title:'LSM alphabet image',url:'https://nuevaescuelamexicana.sep.gob.mx/contenido/recurso/34697/',source:'Secretaría de Educación Pública · Nueva Escuela Mexicana',note:'View the official LSM alphabet infographic at source.'},
 BZS:{title:'Libras manual alphabet · INES',url:'https://www.gov.br/ines/pt-br/assuntos/libras/sobre-o-curso-de-libras',source:'Instituto Nacional de Educação de Surdos',note:'Choose Alfabeto Manual. Provider may require a browser verification.'},
 NSL:{title:'Norwegian hand alphabets and numbers',url:'https://www.statped.no/ressurser-og-verktoy/ressurser/laer-norsk-tegnsprak/handalfabetene-og-tallsystemet/',source:'Statped',note:'Use the provider’s alphabet videos and learning guidance.'},
 ISE:{title:'LIS manual alphabet · community guidance',url:'https://www.ens.it/lingua-dei-segni/faq/',source:'Ente Nazionale Sordi',note:'Source explains the manual alphabet; ask a LIS teacher for a complete letter demonstration.'},
 JSL:{title:'JSL kana fingerspelling · charts and videos',url:'https://hope-npo.org/?cat=42',source:'NPO Hope · sign-language teaching',note:'Japanese kana fingerspelling uses a different writing system from A–Z.'}
};
export function learningResource(id){const p=providers[id];return p?{name:p[0],url:p[1],lookupLanguage:p[2]}:{name:languageName(id)+' resources',url:languageSource(id),lookupLanguage:'Use the source dictionary’s written language'};}
export function guideEntry(id){const g=ALPHABET_GUIDES[id];return g&&!g.chart?{id:'alphabet-guide-'+id,language:id,label:g.title,aliases:[],source:g.source,referenceUrl:g.url,kind:'reference',category:'Alphabet & guides',media:g.media||null,instruction:'Follow this language’s source demonstration. Fingerspelling represents written letters; it does not translate sentence grammar.'}:null;}
export function parseVideoLink(value){
 if(!value.trim())return null;
 let u;try{u=new URL(value);}catch{throw Error('Use a complete YouTube, Vimeo or Google Drive video URL.');}
 if(u.protocol!=='https:'||u.username||u.password)throw Error('Use an HTTPS video link without credentials.');
 let type,id;const host=u.hostname.toLowerCase();
 if(['www.youtube.com','youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(host)){type='youtube';id=u.searchParams.get('v')||u.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})(?:\/|$)/)?.[1];}
 else if(host==='youtu.be'){type='youtube';id=u.pathname.slice(1);}
 else if(host==='drive.google.com'){type='drive';id=u.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1]||u.searchParams.get('id');}
 else if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)){type='vimeo';id=u.pathname.match(/^\/(?:video\/)?(\d{6,12})(?:\/|$)/)?.[1];}
 if(!type||!(type==='youtube'?/^[\w-]{11}$/:type==='drive'?/^[\w-]{10,100}$/:/^\d{6,12}$/).test(id||''))throw Error('This link cannot be embedded. Use a YouTube, Vimeo or Google Drive video, or save a source-only lesson.');
 return {type,id};
}
export function embedUrl(media){if(media.type==='youtube')return 'https://www.youtube-nocookie.com/embed/'+media.id+'?rel=0';if(media.type==='vimeo')return 'https://player.vimeo.com/video/'+media.id+'?dnt=1';if(media.type==='drive')return 'https://drive.google.com/file/d/'+media.id+'/preview';throw Error('Unsupported video');}
export function localLessonEntries(clips){return clips.map(c=>({id:'local-clip-'+c.id,language:c.language,label:c.label,aliases:[],kind:'personal',category:'My lesson videos',source:c.source||'Your permission-confirmed local lesson',referenceUrl:languageSource(c.language),clipBlob:c.blob,media:null}));}

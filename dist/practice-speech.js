// The spoken locale is independent of the sign-language profile.
// These are authored coaching prompts, not machine translations of typed text.
export const COACHING=Object.freeze({
 en:{name:'English',watch:'Watch the handshape, palm direction, location and movement. Repeat slowly.',spell:'This word is fingerspelled. Watch each letter.',test:'Hello. Watch the signer’s hands and repeat slowly.'},
 hi:{name:'हिन्दी · Hindi',watch:'हाथ का आकार, हथेली की दिशा, स्थान और गति देखें। धीरे-धीरे दोहराएँ।',spell:'यह शब्द अक्षरों से दिखाया जा रहा है। हर अक्षर देखें।',test:'नमस्ते। हाथों को देखें और धीरे-धीरे दोहराएँ।'},
 te:{name:'తెలుగు · Telugu',watch:'చేతి ఆకారం, అరచేతి దిశ, స్థానం మరియు కదలికను చూడండి. నెమ్మదిగా మళ్లీ చేయండి.',spell:'ఈ పదాన్ని అక్షరాలతో చూపిస్తున్నారు. ప్రతి అక్షరాన్ని చూడండి.',test:'నమస్కారం. చేతులను చూసి నెమ్మదిగా మళ్లీ చేయండి.'},
 fr:{name:'Français · French',watch:'Observez la forme de la main, la direction de la paume, la position et le mouvement. Répétez lentement.',spell:'Ce mot est épelé avec les doigts. Regardez chaque lettre.',test:'Bonjour. Regardez les mains et répétez lentement.'},
 es:{name:'Español · Spanish',watch:'Observa la forma de la mano, la dirección de la palma, la posición y el movimiento. Repite despacio.',spell:'Esta palabra se deletrea con los dedos. Observa cada letra.',test:'Hola. Observa las manos y repite despacio.'},
 pt:{name:'Português · Portuguese',watch:'Observe a forma da mão, a direção da palma, a posição e o movimento. Repita devagar.',spell:'Esta palavra é soletrada com os dedos. Observe cada letra.',test:'Olá. Observe as mãos e repita devagar.'},
 de:{name:'Deutsch · German',watch:'Achte auf die Handform, die Richtung der Handfläche, die Position und die Bewegung. Wiederhole langsam.',spell:'Dieses Wort wird mit dem Fingeralphabet buchstabiert. Achte auf jeden Buchstaben.',test:'Hallo. Achte auf die Hände und wiederhole langsam.'},
 it:{name:'Italiano · Italian',watch:'Osserva la forma della mano, la direzione del palmo, la posizione e il movimento. Ripeti lentamente.',spell:'Questa parola viene compitata con le dita. Guarda ogni lettera.',test:'Ciao. Guarda le mani e ripeti lentamente.'},
 zh:{name:'中文 · Chinese',watch:'观察手形、手掌方向、位置和动作。慢慢重复。',spell:'这个词用手指字母拼写。观察每个字母。',test:'你好。观察双手，慢慢重复。'},
 ja:{name:'日本語 · Japanese',watch:'手の形、手のひらの向き、位置、動きを見てください。ゆっくり繰り返してください。',spell:'この単語は指文字で表しています。一文字ずつ見てください。',test:'こんにちは。手を見て、ゆっくり繰り返してください。'},
 ko:{name:'한국어 · Korean',watch:'손 모양, 손바닥 방향, 위치와 움직임을 보세요. 천천히 따라 하세요.',spell:'이 단어는 지문자로 표시합니다. 각 글자를 보세요.',test:'안녕하세요. 손을 보고 천천히 따라 하세요.'},
 sw:{name:'Kiswahili · Swahili',watch:'Angalia umbo la mkono, mwelekeo wa kiganja, mahali na mwendo. Rudia polepole.',spell:'Neno hili linaonyeshwa kwa herufi za vidole. Angalia kila herufi.',test:'Habari. Angalia mikono na urudie polepole.'}
});
export const baseLocale=locale=>String(locale||'').replaceAll('_','-').split('-')[0].toLowerCase();
export function matchingVoices(voices,locale){return voices.filter(v=>baseLocale(v.lang)===baseLocale(locale));}
export function narrationFor(segment,locale){
 const base=baseLocale(locale),custom=segment?.speech?.[locale]||segment?.speech?.[base];if(custom)return custom;
 if(!segment)return COACHING[base]?.test||'';
 if(base==='en')return segment.signed?`${segment.word}. ${segment.gloss||COACHING.en.watch}`:`${segment.word}. ${COACHING.en.spell}`;
 return segment.signed?COACHING[base]?.watch||'':COACHING[base]?.spell||'';
}
export function createPracticeSpeech({getSegment,toast,onCaption=()=>{},onManual=()=>{},synth=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance}){
 const $=id=>document.getElementById(id);let voices=[],epoch=0,settle=null;
 function stop(){epoch++;synth?.cancel();settle?.();settle=null;}
 function update(){
  const selected=$('coach-language').value||'en',voice=$('coach-voice').value;voices=synth?.getVoices()||[];
  const codes=[...new Set([...Object.keys(COACHING),selected,...voices.map(v=>baseLocale(v.lang))])].sort();$('coach-language').replaceChildren();
  for(const code of codes){const o=document.createElement('option');o.value=code;try{o.textContent=COACHING[code]?.name||new Intl.DisplayNames(['en'],{type:'language'}).of(code);}catch{o.textContent=code;}$('coach-language').append(o);}$('coach-language').value=selected;
  const compatible=matchingVoices(voices,selected);$('coach-voice').replaceChildren();for(const v of compatible){const o=document.createElement('option');o.value=v.voiceURI;o.textContent=`${v.name} · ${v.lang}${v.localService?' · device':''}`;$('coach-voice').append(o);}
  if(compatible.some(v=>v.voiceURI===voice))$('coach-voice').value=voice;
  if(!compatible.length){const o=document.createElement('option');o.value='';o.textContent='No matching voice installed';$('coach-voice').append(o);}
  $('coach-status').textContent=!synth?'Speech is unavailable in this browser.':!compatible.length?'Install a voice for this spoken language in your device settings.':COACHING[selected]?'Voice ready. Coaching prompts are localized; movement descriptions are spoken in English or from your motion’s own narration.':'Voice ready. Enter your own narration in this language; automatic coaching text is not available.';
  for(const id of ['coach-read','coach-test','coach-read-custom'])$(id).disabled=!compatible.length||!Utterance;
 }
 function speak(text){
  const voice=voices.find(v=>v.voiceURI===$('coach-voice').value);if(!synth||!Utterance||!voice){toast('Choose an installed voice for this spoken language.');return;}
  if(!text?.trim()){toast('Add narration in this spoken language, or select a language with built-in coaching.');return;}
  stop();onCaption(text);const token=epoch,utterance=new Utterance(text.slice(0,1500));utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=Number($('coach-rate').value);utterance.volume=Number($('coach-volume').value);return new Promise(resolve=>{const finish=()=>{if(token===epoch)settle=null;resolve();};settle=finish;utterance.onend=finish;utterance.onerror=e=>{if(token===epoch&&!['canceled','interrupted'].includes(e.error))toast('Narration could not play: '+e.error);finish();};try{synth.speak(utterance);}catch{toast('Speech could not start.');finish();}});
 }
 function narrate(segment=getSegment()){const text=narrationFor(segment,$('coach-language').value);return speak(text);}
 $('coach-language').onchange=()=>{stop();update();};$('coach-voice').onchange=stop;$('coach-read').onclick=()=>{onManual();narrate();};$('coach-test').onclick=()=>{onManual();speak(narrationFor(null,$('coach-language').value)||$('coach-custom').value);};$('coach-read-custom').onclick=()=>{onManual();speak($('coach-custom').value);};$('coach-stop').onclick=stop;
 if(synth?.addEventListener)synth.addEventListener('voiceschanged',update);update();
 return {stop,narrate,onSegment(segment){if($('coach-auto').checked&&matchingVoices(voices,$('coach-language').value).length&&narrationFor(segment,$('coach-language').value))return narrate(segment);},locale:()=>$('coach-language').value};
}

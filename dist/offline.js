export function setupOffline({toast}){
 const status=document.getElementById('offline-status');
 document.getElementById('download-offline-model').onclick=async event=>{
  if(!('caches' in window)){toast('Asset caching is unavailable in this browser.');return;}
  event.target.disabled=true;status.textContent='Downloading camera assets. Keep this tab open…';
  try{const files=['./vision.worker.js','./vendor/mediapipe/vision_bundle.mjs','./vendor/mediapipe/wasm/vision_wasm_internal.js','./vendor/mediapipe/wasm/vision_wasm_internal.wasm','./vendor/mediapipe/wasm/vision_wasm_nosimd_internal.js','./vendor/mediapipe/wasm/vision_wasm_nosimd_internal.wasm','./models/gesture_recognizer.task'];const cache=await caches.open('signvoice-shell-v1.3.0');await cache.addAll(files.map(file=>new URL(file,import.meta.url).href));status.textContent='Camera assets cached. Enable offline mode as well to cache the app and dictionaries. Source videos and network speech voices still require internet.';toast('Camera assets cached on this device.');}catch{toast('Camera assets could not download. Check storage and connection, then retry.');}finally{event.target.disabled=false;}
 };
 document.getElementById('enable-offline').onclick=async()=>{
  if(!('serviceWorker' in navigator)){toast('Offline mode is unavailable in this browser.');return;}
  try{await navigator.serviceWorker.register(new URL('./sw.js',import.meta.url),{scope:'./'});await navigator.serviceWorker.ready;status.textContent='Offline app shell enabled. Open each dictionary and start the camera once online to cache those assets. External source videos still need internet.';toast('Offline mode enabled. Your camera and speech availability still depend on the device.');}
  catch{toast('Offline setup failed. Use HTTPS or localhost and retry.');}
 };
 document.getElementById('disable-offline').onclick=async()=>{
  try{
   if('serviceWorker' in navigator){for(const r of await navigator.serviceWorker.getRegistrations())if(r.active?.scriptURL===new URL('./sw.js',import.meta.url).href)await r.unregister();}
   if('caches' in window)for(const key of await caches.keys())if(key.startsWith('signvoice-shell-'))await caches.delete(key);
   status.textContent='Offline cache removed. Reload the app to stop the current offline worker.';toast('Offline app cache removed. Personal recordings and clips are kept.');
  }catch{toast('The offline cache could not be removed. Retry.');}
 };
}


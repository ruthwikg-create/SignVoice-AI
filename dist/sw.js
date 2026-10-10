// Only cache this application's public static assets. No third-party videos or personal data.
const CACHE='signvoice-shell-v1.7.1';
const SHELL=['./','./index.html','./styles.css','./world.css','./app.js','./avatar-engine.js','./avatar-renderer.js','./avatar-ui.js','./avatar-human.js','./human-rig.js','./avatar-camera.js','./avatar-practice.js','./motion-packs.js','./motion-library-ui.js','./practice-speech.js','./vendor/sign-avatar/sign-rig.js','./vendor/sign-avatar/sign-clip.js','./vendor/sign-avatar/sign-dictionary.js','./vendor/sign-avatar/sign-handshapes.js','./vendor/sign-avatar/sign-speech.js','./vendor/sign-avatar/fingerspelling.js','./vendor/sign-avatar/animation-canonical-rest.js','./config.js','./recognition.js','./storage.js','./learning-ui.js','./learning-resources.js','./lesson-engine.js','./alphabet.js','./languages.js','./language-picker.js','./library-directory.js','./world-ui.js','./world-engine.js','./clip-storage.js','./offline.js','./catalog/world.json','./catalog/international.json','./catalog/asl.json','./catalog/isl.json','./catalog/metadata.json','./vision.worker.js','./media/asl-alphabet.png','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest','./privacy.html','./terms.html','./vendor/three/three.module.min.js','./vendor/three/three.core.min.js','./vendor/three/GLTFLoader.js','./vendor/three/BufferGeometryUtils.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('signvoice-shell-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url),base=new URL(self.registration.scope);
 if(event.request.method!=='GET'||url.origin!==base.origin||!url.pathname.startsWith(base.pathname)||url.search)return;
 const rel=url.pathname.slice(base.pathname.length);
 if(!(rel===''||SHELL.some(p=>p.slice(2)===rel)||/^(catalog|vendor|models|media)\//.test(rel)))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(event.request.mode==='navigate'){try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}catch{return await cache.match(event.request)||await cache.match(new URL('./index.html',base));}}
  const saved=await cache.match(event.request);if(saved)return saved;
  const response=await fetch(event.request);if(response.ok&&response.type==='basic')await cache.put(event.request,response.clone());return response;
 })());
});


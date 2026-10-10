import {readdir,readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateReferenceCatalog} from '../dist/lesson-engine.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const html=await readFile(path.join(root,'dist/index.html'),'utf8');
const app=(await Promise.all(['app.js','learning-ui.js','world-ui.js','offline.js','library-directory.js','avatar-ui.js'].map(file=>readFile(path.join(root,'dist',file),'utf8')))).join('\n');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
if(new Set(ids).size!==ids.length)throw Error('Duplicate HTML IDs');
for(const [,id] of app.matchAll(/\$\('([^']+)'\)/g))if(!ids.includes(id))throw Error(`Missing element: ${id}`);
for(const dir of ['dist','dist/vendor/sign-avatar','dist/vendor/three','scripts','tests'])for(const name of await readdir(path.join(root,dir))){if(!/\.m?js$/.test(name))continue;const result=spawnSync(process.execPath,['--check',path.join(root,dir,name)],{encoding:'utf8'});if(result.status!==0)throw Error(result.stderr);}
for(const file of ['dist/vendor/mediapipe/vision_bundle.mjs','dist/vendor/mediapipe/wasm/vision_wasm_internal.js','dist/vendor/mediapipe/wasm/vision_wasm_internal.wasm','dist/vendor/mediapipe/wasm/vision_wasm_nosimd_internal.js','dist/vendor/mediapipe/wasm/vision_wasm_nosimd_internal.wasm','dist/models/gesture_recognizer.task'])if((await stat(path.join(root,file))).size<100)throw Error('Missing or invalid asset: '+file);
for(const file of ['dist/vendor/mediapipe/wasm/vision_wasm_internal.wasm','dist/vendor/mediapipe/wasm/vision_wasm_nosimd_internal.wasm']){const bytes=await readFile(path.join(root,file));if(!bytes.subarray(0,4).equals(Buffer.from([0,97,115,109])))throw Error('Invalid WASM magic: '+file);}
const metadata=JSON.parse(await readFile(path.join(root,'dist/catalog/metadata.json'),'utf8'));
for(const language of ['ASL','ISL']){const catalog=validateReferenceCatalog(JSON.parse(await readFile(path.join(root,'dist/catalog',language.toLowerCase()+'.json'),'utf8')));if(catalog.entries.length!==metadata[language].count)throw Error('Catalog count mismatch: '+language);}
const chart=await readFile(path.join(root,'dist/media/asl-alphabet.png'));if(!chart.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Invalid alphabet chart');
const world=JSON.parse(await readFile(path.join(root,'dist/catalog/world.json'),'utf8'));const {validateWorldCatalog}=await import('../dist/world-engine.js');validateWorldCatalog(world);
const manifest=JSON.parse(await readFile(path.join(root,'dist/manifest.webmanifest'),'utf8'));for(const icon of manifest.icons)await stat(path.join(root,'dist',icon.src));
validateReferenceCatalog(JSON.parse(await readFile(path.join(root,'dist/catalog/international.json'),'utf8')));
const signer=gunzipSync(await readFile(path.join(root,'dist/models/signer/eva.glb.gz')));if(signer.readUInt32LE(0)!==0x46546c67||signer.readUInt32LE(8)!==signer.length)throw Error('Invalid human model');
for(const line of (await readFile(path.join(root,'dist/assets.sha256'),'utf8')).trim().split('\n')){const [hash,file]=line.split(/\s+/,2);const bytes=await readFile(path.join(root,'dist',file));if(createHash('sha256').update(bytes).digest('hex')!==hash)throw Error('Asset integrity mismatch: '+file);}
console.log('Human model and asset hashes, world and international language catalog, PWA manifest, JavaScript syntax, UI element references, reference catalogs, alphabet chart and packaged model/WASM assets verified.');


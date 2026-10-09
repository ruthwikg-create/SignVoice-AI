const DATABASE='signvoice-local-v1';
let dbPromise;
function db(){
  if(!dbPromise)dbPromise=new Promise((resolve,reject)=> {
    const request=indexedDB.open(DATABASE,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('data');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
  return dbPromise;
}
export async function loadEntries(){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('data','readonly').objectStore('data').get('entries');r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});}
export async function saveEntries(entries){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('data','readwrite');t.objectStore('data').put(entries,'entries');t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||Error('Storage write aborted'));});}
export async function loadReferences(){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('data','readonly').objectStore('data').get('references');r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});}
export async function saveReferences(entries){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('data','readwrite');t.objectStore('data').put(entries,'references');t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});}

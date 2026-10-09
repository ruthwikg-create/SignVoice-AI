let connection;
function db(){return connection||=new Promise((resolve,reject)=>{const request=indexedDB.open('sv-learning-clips',1);request.onupgradeneeded=()=>request.result.createObjectStore('clips',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>{connection=null;reject(request.error);};});}
async function transact(mode,run){const database=await db();return new Promise((resolve,reject)=>{const tx=database.transaction('clips',mode),request=run(tx.objectStore('clips'));let value;request.onsuccess=()=>{value=request.result;};tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Video storage failed'));});}
export const listClips=()=>transact('readonly',s=>s.getAll());
export const saveClip=clip=>transact('readwrite',s=>s.put(clip));
export const deleteClip=id=>transact('readwrite',s=>s.delete(id));
export const clearClips=()=>transact('readwrite',s=>s.clear());

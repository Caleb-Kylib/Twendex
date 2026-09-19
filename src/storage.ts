export type CachedTicket={id:string;ticketSignature:string;cachedAt:string;payload:unknown};
const DB='twendex-offline',STORE='tickets';
function db(){return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function cacheTicket(ticket:CachedTicket){const d=await db();return new Promise<void>((resolve,reject)=>{const r=d.transaction(STORE,'readwrite').objectStore(STORE).put(ticket);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error)})}
export async function getTicket(id:string){const d=await db();return new Promise<CachedTicket|undefined>((resolve,reject)=>{const r=d.transaction(STORE).objectStore(STORE).get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}

const CACHE='twendex-v2';
const PRECACHE=['/','/manifest.webmanifest'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE)))});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  // Navigations & the app HTML: network-first so new builds show up, fall back to cache offline.
  if(req.mode==='navigate'||req.destination==='document'){
    e.respondWith((async()=>{
      try{const r=await fetch(req);const x=r.clone();caches.open(CACHE).then(c=>c.put('/',x));return r}
      catch{return (await caches.match(req))||(await caches.match('/'))}
    })());
    return;
  }
  // Static assets: stale-while-revalidate so updated hashed files are picked up.
  e.respondWith((async()=>{
    const cached=await caches.match(req);
    const network=fetch(req).then(r=>{if(r&&r.status===200){const x=r.clone();caches.open(CACHE).then(c=>c.put(req,x))}return r}).catch(()=>undefined);
    return cached||network||caches.match('/');
  })());
});

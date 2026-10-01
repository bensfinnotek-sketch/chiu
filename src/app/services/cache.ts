const prefix='lina_cache_v1:';
const mem=new Map<string,{value:any;expires:number}>();
export function cacheGet<T>(key:string):T|null{const m=mem.get(key);if(m&&m.expires>Date.now())return m.value as T;mem.delete(key);try{const raw=localStorage.getItem(prefix+key);if(!raw)return null;const parsed=JSON.parse(raw);if(parsed.expires>Date.now()){mem.set(key,parsed);return parsed.value as T;}localStorage.removeItem(prefix+key);}catch{}return null;}
export function cacheSet<T>(key:string,value:T,ttlMs:number){const entry={value,expires:Date.now()+ttlMs};mem.set(key,entry);try{localStorage.setItem(prefix+key,JSON.stringify(entry));}catch{}}
export function cacheDelete(key:string){mem.delete(key);try{localStorage.removeItem(prefix+key);}catch{}}
export function clearCache(){mem.clear();try{Object.keys(localStorage).filter(k=>k.startsWith(prefix)).forEach(k=>localStorage.removeItem(k));}catch{}}

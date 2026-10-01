export class RequestError extends Error{status?:number;retryable:boolean;constructor(message:string,status?:number,retryable=false){super(message);this.name='RequestError';this.status=status;this.retryable=retryable;}}
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const controllerWithTimeout=(signal:AbortSignal|undefined,ms:number)=>{const c=new AbortController();const timer=setTimeout(()=>c.abort(),ms);if(signal){if(signal.aborted)c.abort();else signal.addEventListener('abort',()=>c.abort(),{once:true});}return {controller:c,timer};};
const inflight=new Map<string,Promise<any>>();
export async function postJson<T>(url:string,body:unknown,signal?:AbortSignal,options:{timeoutMs?:number;retries?:number;dedupe?:boolean}={}):Promise<T>{
 const timeoutMs=options.timeoutMs??15000,retries=options.retries??2;
 const key=url+'|'+JSON.stringify(body);
 if(options.dedupe!==false&&inflight.has(key))return inflight.get(key) as Promise<T>;
 const run=async()=>{let attempt=0;
   while(true){let ctl:ReturnType<typeof controllerWithTimeout>|null=null;
    try{ctl=controllerWithTimeout(signal,timeoutMs);const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',signal:ctl.controller.signal});const data=await response.json().catch(()=>({}));
      if(!response.ok){const retryable=response.status>=500||response.status===408||response.status===429;throw new RequestError(data?.error||'Máy chủ chưa phản hồi ổn định.',response.status,retryable);}
      return data as T;
    }catch(error:any){if(signal?.aborted)throw new Error('Yêu cầu đã được dừng.');const timeout=error?.name==='AbortError';const retryable=timeout||error?.retryable||error?.name==='TypeError';if(attempt>=retries||!retryable)throw new Error(timeout?'Kết nối hơi chậm. Bạn thử lại nhé.':error?.message||'Đang gặp sự cố kết nối.');await sleep(300*Math.pow(2,attempt));attempt++;}
    finally{if(ctl)clearTimeout(ctl.timer);}
   }};
 const promise=run().finally(()=>inflight.delete(key));inflight.set(key,promise);return promise;
}
export const isOnline=()=>typeof navigator==='undefined'||navigator.onLine;
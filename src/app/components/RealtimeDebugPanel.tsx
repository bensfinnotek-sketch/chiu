import { useEffect, useState } from 'react';
import { realtimeSpeechOrchestrator } from '../services/realtimeOrchestrator';
import { streamingTtsProvider } from '../services/streamingTts';
import { getAvatarProvider } from '../services/avatar';

export function RealtimeDebugPanel(){
  const [state,setState]=useState(realtimeSpeechOrchestrator.state());
  useEffect(()=>{const id=window.setInterval(()=>setState(realtimeSpeechOrchestrator.state()),250);return()=>window.clearInterval(id)},[]);
  if(!import.meta.env.DEV)return null;
  const metrics=realtimeSpeechOrchestrator.metrics(); const rows=[['Gemini','streaming'],['Streaming','structured SSE'],['TTS',streamingTtsProvider.streamingAudio?'streaming audio':'browser chunk fallback'],['Audio',state.audioState],['Lip Sync',state.lipSyncState],['Avatar',getAvatarProvider().getState()],['STT','browser'],['Turn',metrics?.turnId||'—'],['TTFT',metrics?.ttftMs?Math.round(metrics.ttftMs)+' ms':'—'],['First audio',metrics?.firstAudioLatencyMs?Math.round(metrics.firstAudioLatencyMs)+' ms':'not exposed']];
  return <details className="card p-4 text-xs"><summary className="cursor-pointer font-bold">Realtime debug</summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{rows.map(([k,v])=><div key={k} className="flex justify-between rounded-lg bg-[var(--surface-2)] px-3 py-2"><span className="text-[var(--muted)]">{k}</span><b>{v}</b></div>)}</div></details>
}

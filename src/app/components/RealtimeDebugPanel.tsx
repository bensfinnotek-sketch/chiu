import { useEffect, useState } from 'react';
import { realtimeConversationController } from '../services/realtimeConversation';
import { streamingTtsProvider } from '../services/streamingTts';
import { getAvatarProvider } from '../services/avatar';

export function RealtimeDebugPanel(){
  const [state,setState]=useState(realtimeConversationController.state());
  useEffect(()=>{const id=window.setInterval(()=>setState(realtimeConversationController.state()),250);return()=>window.clearInterval(id)},[]);
  if(!import.meta.env.DEV)return null;
  const rows=[['Gemini','connected'],['Streaming','active'],['TTS',streamingTtsProvider.streamingAudio?'streaming':'browser chunk fallback'],['Audio',state.audioState],['Lip Sync',state.lipSyncState],['Avatar',getAvatarProvider().getState()],['STT','browser'],['Latency',state.startedAt&&state.endedAt?String(state.endedAt-state.startedAt)+' ms':'—']];
  return <details className="card p-4 text-xs"><summary className="cursor-pointer font-bold">Realtime debug</summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{rows.map(([k,v])=><div key={k} className="flex justify-between rounded-lg bg-[var(--surface-2)] px-3 py-2"><span className="text-[var(--muted)]">{k}</span><b>{v}</b></div>)}</div></details>
}

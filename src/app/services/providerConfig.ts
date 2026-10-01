export type ProviderConfig={ai:'gemini';tts:'browser'|'external';avatar:'animated-fallback'|'realtime';lipSync:'audio-driven'|'viseme-timed'|'unavailable'};
export const providerConfig:ProviderConfig={
  ai:(import.meta.env.VITE_AI_PROVIDER||'gemini') as ProviderConfig['ai'],
  tts:(import.meta.env.VITE_TTS_PROVIDER||'browser') as ProviderConfig['tts'],
  avatar:(import.meta.env.VITE_AVATAR_PROVIDER||'animated-fallback') as ProviderConfig['avatar'],
  lipSync:(import.meta.env.VITE_LIPSYNC_PROVIDER||'audio-driven') as ProviderConfig['lipSync'],
};

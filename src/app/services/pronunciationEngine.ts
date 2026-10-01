import type { PronunciationAnalysis } from './pronunciation';

export type PronunciationProvider = 'web-speech' | 'audio-provider' | 'unavailable';

export interface WordPronunciationResult extends PronunciationAnalysis {
  target: string;
  recognized: string;
  pinyin?: string;
  tone?: number | null;
}

export interface SentencePronunciationResult extends PronunciationAnalysis {
  target: string;
  recognized: string;
  wordResults: WordPronunciationResult[];
}

export interface TonePronunciationResult {
  target: string;
  expectedTone: 1 | 2 | 3 | 4 | 5;
  detectedTone: 1 | 2 | 3 | 4 | 5 | null;
  analysis: PronunciationAnalysis;
}

export interface PronunciationEngine {
  analyzeWord(target:string, recognized:string, audio?:Blob): Promise<WordPronunciationResult>;
  analyzeSentence(target:string, recognized:string, audio?:Blob): Promise<SentencePronunciationResult>;
  analyzeTone(target:string, expectedTone:1|2|3|4|5, recognized:string, audio?:Blob): Promise<TonePronunciationResult>;
  comparePronunciation(target:string, recognized:string, audio?:Blob): Promise<PronunciationAnalysis>;
  provider(): PronunciationProvider;
}

const unavailable=(feedback='Cần microphone/audio analysis provider.'):PronunciationAnalysis=>({
  overall:null, tones:null, initials:null, finals:null, fluency:null, feedback, limited:true
});

const normalize=(s:string)=>s.trim().toLowerCase().replace(/[,.!?，。！？]/g,'').replace(/\s+/g,' ');
const toneFromPinyin=(pinyin:string):number|null=>{
  const marks:'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ' = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ';
  const idx=marks.indexOf(pinyin);
  return idx<0?null:(idx%4)+1;
};

export const pronunciationEngine:PronunciationEngine={
  async comparePronunciation(target,recognized){
    const t=normalize(target), r=normalize(recognized);
    if(!t||!r)return unavailable('Chưa đủ dữ liệu để đánh giá chính xác.');
    if(t===r)return unavailable('Nhận diện đúng nội dung. Chưa thể đánh giá chính xác chất lượng âm thanh.');
    return unavailable('Nội dung nhận diện khác mục tiêu. Chưa thể đánh giá chính xác phát âm.');
  },
  async analyzeWord(target,recognized,audio){
    const analysis=await this.comparePronunciation(target,recognized,audio);
    return {...analysis,target,recognized};
  },
  async analyzeSentence(target,recognized,audio){
    const analysis=await this.comparePronunciation(target,recognized,audio);
    const words=normalize(target).split(' ').map((word,i)=>({...analysis,target:word,recognized:normalize(recognized).split(' ')[i]||''}));
    return {...analysis,target,recognized,wordResults:words};
  },
  async analyzeTone(target,expectedTone,recognized,audio){
    const analysis=await this.comparePronunciation(target,recognized,audio);
    return {target,expectedTone,detectedTone:null,analysis};
  },
  provider(){return 'unavailable';}
};

export { toneFromPinyin };

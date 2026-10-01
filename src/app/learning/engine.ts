import type { UserProfile } from '../types';
import type { DailyPlan, LearnerMemory, LearningProgress, MistakeRecord, ReviewItem, ReviewType } from './types';
import { HSK1_LESSONS } from './content';
import { storage } from '../services/storage';

const KEY='lina_learning_engine_v1';
const now=()=>new Date().toISOString();
const blank=():{reviews:ReviewItem[];mistakes:MistakeRecord[];progress:LearningProgress;memory:LearnerMemory|null}=>({
 reviews:[],mistakes:[],progress:{lessonProgress:{},completedLessons:[],speakingPractice:0,listeningPractice:0,grammarPractice:0,pronunciationPractice:0,tonePractice:0,reviewsCompleted:0,streak:0},memory:null
});
const read=()=>storage.readJson(KEY, blank());
const write=(x:ReturnType<typeof blank>)=>storage.writeJson(KEY,x);
const addDays=(d:number)=>new Date(Date.now()+d*86400000).toISOString();

export const learningEngine={
  getState(){return read();},
  saveState(state:ReturnType<typeof blank>){write(state);},
  getLesson(id:string){return HSK1_LESSONS.find(x=>x.id===id)||HSK1_LESSONS[0];},
  startLesson(id:string){const s=read();s.progress.lessonProgress[id]=Math.max(s.progress.lessonProgress[id]||0,1);write(s);},
  completeSection(id:string,section:ReviewType|'vocabulary'|'grammar'|'listening'|'speaking'|'roleplay'|'review'){
    const s=read();s.progress.lessonProgress[id]=Math.min(100,(s.progress.lessonProgress[id]||0)+15);
    if(['speaking','conversation','zh-speak','listen-repeat'].includes(section))s.progress.speakingPractice++;
    if(section==='listening'||section==='audio-meaning')s.progress.listeningPractice++;
    if(section==='grammar')s.progress.grammarPractice++;
    if(['pronunciation','zh-speak','listen-repeat'].includes(section))s.progress.pronunciationPractice++;
    if(s.progress.lessonProgress[id]>=100&&!s.progress.completedLessons.includes(id))s.progress.completedLessons.push(id);
    write(s);return s.progress;
  },
  review(vocabularyId:string,rating:'again'|'hard'|'good'|'easy'){
    const s=read();const existing=s.reviews.find(x=>x.vocabularyId===vocabularyId);const item=existing||{id:`review-${vocabularyId}`,vocabularyId,lastReviewed:null,nextReview:now(),interval:0,ease:2.5,correctCount:0,incorrectCount:0,mastery:0};
    const correct=rating!=='again';item.lastReviewed=now();
    if(correct){item.correctCount++;item.mastery=Math.min(100,item.mastery+({hard:8,good:15,easy:22}[rating]));item.interval=Math.max(1,Math.round((item.interval||1)*({hard:1.2,good:2,easy:3}[rating])));item.ease=Math.min(3,item.ease+({hard:-0.05,good:0.05,easy:0.1}[rating]));}
    else{item.incorrectCount++;item.mastery=Math.max(0,item.mastery-12);item.interval=1;item.ease=Math.max(1.5,item.ease-0.2);}
    item.nextReview=addDays(item.interval);if(!existing)s.reviews.push(item);s.progress.reviewsCompleted++;write(s);return item;
  },
  dueReviews(limit=8){const t=Date.now();return read().reviews.filter(x=>new Date(x.nextReview).getTime()<=t).sort((a,b)=>a.mastery-b.mastery).slice(0,limit);},
  recordMistake(type:MistakeRecord['type'],original:string,corrected:string,explanation:string){
    const s=read();const found=s.mistakes.find(x=>x.type===type&&x.original===original&&x.corrected===corrected);
    if(found){found.frequency++;found.lastSeen=now();found.mastery=Math.max(0,found.mastery-5);}else s.mistakes.push({id:`mistake-${Date.now()}`,type,original,corrected,explanation,frequency:1,lastSeen:now(),mastery:0});
    s.mistakes.sort((a,b)=>b.frequency-a.frequency);s.memory={...(s.memory||{}),recentMistakes:s.mistakes.slice(0,5).map(x=>x.original),weakGrammar:s.mistakes.filter(x=>x.type==='grammar').slice(0,5).map(x=>x.original),weakVocabulary:s.mistakes.filter(x=>x.type==='vocabulary').slice(0,5).map(x=>x.original),weakTones:s.mistakes.filter(x=>x.type==='tone').slice(0,5).map(x=>x.original)};write(s);return s.mistakes;
  },
  updateMemory(profile:UserProfile){
    const s=read();const mistakes=s.mistakes;s.memory={level:`HSK${profile.currentHsk||1}`,goal:profile.goal,dailyMinutes:profile.dailyMinutes,weakGrammar:mistakes.filter(x=>x.type==='grammar').slice(0,5).map(x=>x.original),weakVocabulary:mistakes.filter(x=>x.type==='vocabulary').slice(0,5).map(x=>x.original),weakTones:mistakes.filter(x=>x.type==='tone').slice(0,5).map(x=>x.original),preferredTopics:['daily life','conversation'],recentMistakes:mistakes.slice(0,5).map(x=>x.original)};write(s);return s.memory;
  },
    dailyPlan(profile:UserProfile):DailyPlan{const s=read();const next=HSK1_LESSONS.find(x=>!s.progress.completedLessons.includes(x.id))||HSK1_LESSONS[0];return {minutes:profile.dailyMinutes,lessonId:next.id,reviewCount:Math.min(8,Math.max(5,this.dueReviews(8).length)),speakingCount:2,newWords:3,grammarPoints:1};},
  adaptiveDifficulty(base:1|2|3|4|5){const s=read();const recent=s.mistakes.slice(0,8);const errors=recent.reduce((n,x)=>n+x.frequency,0);return Math.max(1,Math.min(5,base+(errors>=4?-1:errors===0?1:0))) as 1|2|3|4|5;},
  getMemory(profile:UserProfile):LearnerMemory{const s=read();return s.memory||this.updateMemory(profile);},
  resetProgress(){const s=read();s.progress={lessonProgress:{},completedLessons:[],speakingPractice:0,listeningPractice:0,grammarPractice:0,pronunciationPractice:0,tonePractice:0,reviewsCompleted:0,streak:0};s.reviews=[];s.mistakes=[];s.memory=null;write(s);},
  weakAreas(){const s=read();return {grammar:s.mistakes.filter(x=>x.type==='grammar').slice(0,5),vocabulary:s.mistakes.filter(x=>x.type==='vocabulary').slice(0,5),tones:s.mistakes.filter(x=>x.type==='tone').slice(0,5)}},
  reviewTypes():ReviewType[]{return ['zh-vi','vi-zh','audio-meaning','pinyin-zh','zh-speak','listen-repeat','fill-blank','conversation'];}
};

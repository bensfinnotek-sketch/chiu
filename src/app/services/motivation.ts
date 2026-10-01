import type { DailyGoal, MotivationActivity, MotivationSnapshot, Achievement, WeeklySummary } from '../learning/types';
import { storage } from './storage';

const KEY='lina_motivation_v1';
const blank=()=>({xp:0,days:{} as Record<string,MotivationSnapshot>,achievements:{} as Record<string,string>});
const read=()=>storage.readJson(KEY, blank());
const write=(s:any)=>storage.writeJson(KEY,s);
const tz=()=>Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
const dateKey=(date=new Date(),timeZone=tz())=>new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const previous=(key:string,timeZone:string)=>{const [y,m,d]=key.split('-').map(Number);return dateKey(new Date(Date.UTC(y,m-1,d-1,12)),timeZone);};
const GOALS=[5,10,15,20,30] as const;
const xpByActivity:Record<MotivationActivity,number>={lesson:25,review:5,speaking:10,conversation:15,pronunciation:10,'daily-goal':20};
const achievements:Achievement[]=[
{id:'first-lesson',title:'First Lesson',description:'Hoàn thành bài học đầu tiên.',unlocked:false},
{id:'first-conversation',title:'First Conversation',description:'Có cuộc hội thoại đầu tiên.',unlocked:false},
{id:'100-words',title:'100 Words',description:'Ôn/tiếp thu 100 từ.',unlocked:false},
{id:'7-day-streak',title:'7 Day Streak',description:'Học liên tiếp 7 ngày.',unlocked:false},
{id:'first-roleplay',title:'First Roleplay',description:'Hoàn thành roleplay đầu tiên.',unlocked:false},
{id:'pronunciation',title:'Pronunciation Practice',description:'Luyện phát âm lần đầu.',unlocked:false},
{id:'hsk1-complete',title:'HSK 1 Complete',description:'Hoàn thành toàn bộ lesson HSK1.',unlocked:false}
];
export const motivationService={
 goals(){return GOALS;},
 getGoal():DailyGoal{const s=read(),k=dateKey();const d=s.days[k]||{date:k,timezone:tz(),minutes:0,lessons:0,vocabulary:0,speaking:0,review:0,xp:0,completedXpEvents:[],active:false};return {minutes:Math.max(5,d.minutes),lessons:d.lessons,vocabulary:d.vocabulary,speaking:d.speaking,review:d.review,selectedMinutes:(d.goalMinutes||15) as 5|10|15|20|30,date:k};},
 setGoal(minutes:5|10|15|20|30){const s=read(),k=dateKey();const d=s.days[k]||{date:k,timezone:tz(),minutes:0,lessons:0,vocabulary:0,speaking:0,review:0,xp:0,completedXpEvents:[],active:false};d.goalMinutes=minutes;d.active=true;s.days[k]=d;write(s);return this.getGoal();},
 track(activity:MotivationActivity,amount=1,eventId?:string){const s=read(),k=dateKey(),zone=tz();const d=s.days[k]||{date:k,timezone:zone,minutes:0,lessons:0,vocabulary:0,speaking:0,review:0,xp:0,completedXpEvents:[],active:true};d.timezone=zone;d.active=true;if(activity==='lesson')d.lessons+=amount;if(activity==='review')d.review+=amount;if(activity==='speaking'||activity==='conversation')d.speaking+=amount;if(activity==='pronunciation')d.speaking+=amount;if(eventId&&!d.completedXpEvents.includes(eventId)){d.completedXpEvents.push(eventId);d.xp+=xpByActivity[activity];s.xp=(s.xp||0)+xpByActivity[activity];}else if(!eventId){const id=activity+'-'+Date.now();d.completedXpEvents.push(id);d.xp+=xpByActivity[activity];s.xp=(s.xp||0)+xpByActivity[activity];}s.days[k]=d;write(s);return this.snapshot();},
addMinutes(minutes:number){const s=read(),k=dateKey(),d=s.days[k]||{date:k,timezone:tz(),minutes:0,lessons:0,vocabulary:0,speaking:0,review:0,xp:0,completedXpEvents:[],active:true};d.minutes=Math.max(0,d.minutes+Math.max(0,minutes));d.active=true;s.days[k]=d;write(s);return this.snapshot();},
snapshot():MotivationSnapshot{const s=read(),k=dateKey();return s.days[k]||{date:k,timezone:tz(),minutes:0,lessons:0,vocabulary:0,speaking:0,review:0,xp:0,completedXpEvents:[],active:false};},
streak(){const s=read(),zone=tz();let k=dateKey();let count=0;while(s.days[k]?.active){count++;k=previous(k,zone);if(count>365)break;}return count;},
totalXp(){return read().xp||0;},
achievements(){const s=read(),days=Object.values(s.days) as any[],streak=this.streak(),totalWords=days.reduce((n:any,d:any)=>n+d.vocabulary,0),lesson=days.reduce((n:any,d:any)=>n+d.lessons,0),speaking=days.reduce((n:any,d:any)=>n+d.speaking,0),review=days.reduce((n:any,d:any)=>n+d.review,0);return achievements.map(a=>({...a,unlocked:!!s.achievements[a.id]||({'first-lesson':lesson>=1,'first-conversation':speaking>=1,'100-words':totalWords>=100,'7-day-streak':streak>=7,'first-roleplay':!!s.achievements['first-roleplay'],'pronunciation':!!s.achievements.pronunciation,'hsk1-complete':!!s.achievements['hsk1-complete']} as any)[a.id],unlockedAt:s.achievements[a.id]}));},
unlock(id:string){const s=read();if(!s.achievements[id])s.achievements[id]=new Date().toISOString();write(s);},
weeklySummary():WeeklySummary{const s=read(),zone=tz(),today=dateKey(),days=Object.values(s.days) as any[];const keys=new Set<string>();let k=today;for(let i=0;i<7;i++){keys.add(k);k=previous(k,zone);}const week=days.filter(d=>keys.has(d.date));return {minutesStudied:week.reduce((n,d)=>n+d.minutes,0),lessonsCompleted:week.reduce((n,d)=>n+d.lessons,0),wordsReviewed:week.reduce((n,d)=>n+d.review,0),speakingSessions:week.reduce((n,d)=>n+d.speaking,0),commonMistakes:[],nextRecommendedPractice:'Tiếp tục 5–10 phút ôn lại phần bạn đang yếu.'};}
};

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BookOpen, Check, ChevronRight, Clock3, Flame, Headphones,
  Home, Lightbulb, LockKeyhole, Menu, Mic, Moon, Play, RotateCcw,
  Search, Settings2, Sparkles, Star, Sun, User, Volume2, X
} from 'lucide-react';
import type { LearningGoal, SkillLevel, UserProfile, Vocabulary, ConversationMessage, TutorMode, TutorResponse } from './app/types';
import { HSK1_LESSONS, HSK1_VOCABULARY, HSK_PATHS } from './app/learning/content';
import { learningEngine } from './app/learning/engine';
import { aiMemoryService } from './app/services/aiMemory';
import type { PinyinDisplay, StructuredLesson } from './app/learning/types';
import { aiTutorService, speechToTextService, textToSpeechService, avatarService } from './app/services';
import type { AvatarState } from './app/services/avatar';
import type { TtsSpeed } from './app/services/tts';

type Route = 'home' | 'learn' | 'speak' | 'review' | 'profile';
type Theme = 'light' | 'dark';

const goalLabels: Record<LearningGoal, string> = {
  travel: 'Du lịch', work: 'Công việc', conversation: 'Giao tiếp', hsk: 'HSK', school: 'Học tập', culture: 'Văn hóa'
};

const levelLabels: Record<SkillLevel, string> = {
  new: 'Chưa biết gì', basic: 'Cơ bản', intermediate: 'Trung cấp', advanced: 'Nâng cao'
};

const defaultProfile: UserProfile = {
  name: 'bạn', goal: 'conversation', level: 'new', dailyMinutes: 10,
  currentHsk: 1, targetHsk: 2, streak: 3, vocabularyLearned: 24,
  lessonsCompleted: 0, pronunciationProgress: 18
};

function loadProfile(): UserProfile {
  try { return { ...defaultProfile, ...(JSON.parse(localStorage.getItem('lina_profile') || '{}')) }; }
  catch { return defaultProfile; }
}

function AppShell({ route, setRoute, theme, setTheme, children }: {
  route: Route; setRoute: (r: Route) => void; theme: Theme; setTheme: (t: Theme) => void; children: React.ReactNode;
}) {
  const tabs = [
    ['home', 'Trang chủ', Home], ['learn', 'Học', BookOpen], ['speak', 'Nói', Mic],
    ['review', 'Ôn tập', RotateCcw], ['profile', 'Tôi', User]
  ] as const;

  return <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <button onClick={() => setRoute('home')} className="flex items-center gap-3" aria-label="Về trang chủ">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--accent)] text-xl font-bold text-white shadow-lg shadow-orange-500/20">汉</span>
          <span className="text-left"><b className="block text-lg tracking-tight">Lina <i className="not-italic text-[var(--accent)]">AI Chinese</i></b><small className="hidden text-xs text-[var(--muted)] sm:block">Học tiếng Trung tự nhiên</small></span>
        </button>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng chính">
          {tabs.map(([id, label, Icon]) => <button key={id} onClick={() => setRoute(id)} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${route === id ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--muted)] hover:bg-[var(--surface-2)]'}`}><Icon size={17}/>{label}</button>)}
        </nav>
        <div className="flex items-center gap-1">
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="icon-btn" aria-label="Đổi giao diện">{theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}</button>
          <button className="icon-btn hidden sm:flex" aria-label="Cài đặt"><Settings2 size={18}/></button>
          <button className="icon-btn lg:hidden" aria-label="Mở menu"><Menu size={19}/></button>
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pt-8">{children}</main>
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map(([id, label, Icon]) => <button key={id} onClick={() => setRoute(id)} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold ${route === id ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}><Icon size={20}/>{label}</button>)}
      </div>
    </nav>
  </div>;
}

function ProgressBar({ value }: { value: number }) {
  return <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><span style={{ width: `${value}%` }}/></div>;
}

function ChineseSentence({ chinese, pinyin, vietnamese, showChinese, showPinyin, showVietnamese }: {
  chinese: string; pinyin: string; vietnamese: string; showChinese: boolean; showPinyin: boolean; showVietnamese: boolean;
}) {
  return <div className="space-y-1">
    {showChinese && <div className="font-chinese text-lg font-semibold">{chinese}</div>}
    {showPinyin && <div className="text-sm text-[var(--accent)]">{pinyin}</div>}
    {showVietnamese && <div className="text-sm text-[var(--muted)]">{vietnamese}</div>}
  </div>;
}

function toneNumbers(pinyin:string){
  const map:Record<string,string>={ā:'a1',á:'a2',ǎ:'a3',à:'a4',ē:'e1',é:'e2',ě:'e3',è:'e4',ī:'i1',í:'i2',ǐ:'i3',ì:'i4',ō:'o1',ó:'o2',ǒ:'o3',ò:'o4',ū:'u1',ú:'u2',ǔ:'u3',ù:'u4',ǖ:'v1',ǘ:'v2',ǚ:'v3',ǜ:'v4'};
  return pinyin.split(/(\\s+)/).map(part=>{let tone='';let base=part.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g,m=>{const x=map[m];tone=x.slice(1);return x[0];});return base+(tone||'')}).join('');
}

function VocabularyCard({ item, onReview }: { item: Vocabulary; onReview?: (id:string)=>void }) {
  const [saved,setSaved]=useState(false); const [open,setOpen]=useState(false);
  return <article className="card card-hover p-5">
    <button className="w-full text-left" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>
      <div className="flex items-start justify-between gap-3"><div><div className="font-chinese text-3xl font-semibold">{item.hanzi}</div><div className="mt-1 text-sm text-[var(--accent)]">{item.pinyin}</div><div className="mt-1 text-sm text-[var(--muted)]">{item.vietnamese}</div></div><span className="pill">HSK {item.hskLevel}</span></div>
    </button>
    <div className="mt-4 rounded-xl bg-[var(--surface-2)] p-3"><p className="font-chinese text-sm">{item.exampleChinese}</p><p className="mt-1 text-xs text-[var(--accent)]">{item.examplePinyin}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.exampleVietnamese}</p></div>
    <div className="mt-4 flex flex-wrap gap-2">
      <button onClick={()=>void textToSpeechService.speak(item.hanzi).catch(()=>undefined)} className="tool-btn"><Volume2 size={15}/> Nghe</button>
      <button onClick={()=>setSaved(v=>!v)} className="tool-btn"><Star size={15} fill={saved?'currentColor':'none'}/> {saved?'Đã lưu':'Lưu'}</button>
      <button onClick={()=>setOpen(v=>!v)} className="tool-btn"><BookOpen size={15}/> Xem ví dụ</button>
      <button onClick={()=>onReview?.(item.id)} className="tool-btn"><Mic size={15}/> Luyện nói</button>
    </div>
    {open&&<div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"><b>{item.hanzi}</b><span className="ml-2 text-[var(--accent)]">{item.pinyin}</span><span className="ml-2 text-[var(--muted)]">{item.vietnamese}</span><p className="mt-2 text-xs text-[var(--muted)]">{item.partOfSpeech} · {item.category}</p></div>}
  </article>;
}

function HomeDashboard({ profile, setRoute }: { profile: UserProfile; setRoute: (r: Route) => void }) {
  const today = 6; const plan=learningEngine.dailyPlan(profile); const nextLesson=learningEngine.getLesson(plan.lessonId);
  const goal = profile.dailyMinutes;
  return <div className="space-y-6">
    <section className="hero-card">
      <div className="max-w-2xl">
        <span className="eyebrow"><Sparkles size={14}/> Lina AI Chinese</span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">Xin chào, {profile.name} 👋</h1>
        <p className="mt-3 max-w-xl text-base text-[var(--muted)]">Hôm nay chúng ta cùng học tiếng Trung nhé! Hôm nay: {plan.newWords} từ mới · {plan.grammarPoints} điểm ngữ pháp · {plan.speakingCount} bài nói.</p>
        <div className="mt-6 flex flex-wrap gap-2"><span className="pill">HSK {profile.currentHsk}</span><span className="pill">{goalLabels[profile.goal]}</span><span className="pill"><Flame size={14}/> {profile.streak} ngày</span></div>
      </div>
      <div className="hidden w-44 shrink-0 rounded-3xl bg-white/70 p-5 text-center shadow-sm dark:bg-white/5 sm:block"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[var(--accent-soft)] text-4xl">👩🏻‍🏫</div><p className="mt-3 text-sm font-bold">Lina</p><p className="text-xs text-[var(--muted)]">Gia sư AI</p></div>
    </section>

    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><span className="eyebrow">Tiếp tục học</span><h2 className="mt-2 text-xl font-bold">HSK 1 · Bài {nextLesson.lessonNumber}</h2><p className="mt-1 text-[var(--muted)]">{nextLesson.title}</p></div><BookOpen className="text-[var(--accent)]"/></div>
        <ProgressBar value={learningEngine.getState().progress.lessonProgress['hsk1-lesson-1']||1}/><div className="mt-2 flex justify-between text-xs text-[var(--muted)]"><span>{learningEngine.getState().progress.lessonProgress['hsk1-lesson-1']||1}% hoàn thành</span><span>~10 phút</span></div>
        <button onClick={() => setRoute('learn')} className="btn-primary mt-5 w-full">Tiếp tục <ArrowRight size={17}/></button>
      </section>

      <section className="card overflow-hidden p-5 sm:p-6">
        <div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"><Mic/></div><div><span className="eyebrow">AI Tutor</span><h2 className="mt-2 text-xl font-bold">Bạn muốn luyện nói với Lina không?</h2><p className="mt-1 text-sm text-[var(--muted)]">Hội thoại ngắn, có Hán tự, Pinyin và tiếng Việt.</p></div></div>
        <button onClick={() => setRoute('speak')} className="btn-secondary mt-5 w-full">🎙 Nói chuyện với Lina</button>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between"><div><span className="eyebrow">Today's review</span><h2 className="mt-2 text-xl font-bold">Bạn có {plan.reviewCount} thẻ cần ôn hôm nay.</h2></div><RotateCcw className="text-[var(--accent)]"/></div>
        <button onClick={() => setRoute('review')} className="btn-secondary mt-5 w-full">Ôn tập <ChevronRight size={17}/></button>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between"><div><span className="eyebrow">Daily goal</span><h2 className="mt-2 text-xl font-bold">{goal} phút hôm nay</h2></div><Clock3 className="text-[var(--accent)]"/></div>
        <div className="mt-5"><ProgressBar value={Math.round(today / goal * 100)}/><div className="mt-2 text-xs text-[var(--muted)]">{today}/{goal} phút</div></div>
      </section>
    </div>
  </div>;
}

function TutorMessage({ role, chinese, pinyin, vietnamese, showChinese, showPinyin, showVietnamese, onPlay }: {
  role:'user'|'assistant'; chinese:string; pinyin:string; vietnamese:string; showChinese:boolean; showPinyin:boolean; showVietnamese:boolean; onPlay?:()=>void;
}) {
  return <div className={`flex ${role==='user'?'justify-end':'justify-start'}`}><div className={`max-w-[90%] rounded-3xl px-4 py-3 sm:max-w-[72%] ${role==='user'?'bg-[var(--accent)] text-white':'bg-[var(--surface-2)]'}`}>
    <ChineseSentence chinese={chinese} pinyin={pinyin} vietnamese={vietnamese} showChinese={showChinese} showPinyin={showPinyin} showVietnamese={showVietnamese}/>
    {role==='assistant' && chinese && <button onClick={onPlay} className="mt-3 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--surface)]"><Volume2 size={14}/> Phát</button>}
  </div></div>;
}

function TonePractice() {
  const tones=[['mā','Thanh 1'],['má','Thanh 2'],['mǎ','Thanh 3'],['mà','Thanh 4'],['ma','Thanh nhẹ']];
  const [active,setActive]=useState('mā');
  const [recording,setRecording]=useState(false);
  return <section className="card p-5 sm:p-6">
    <div className="flex items-start justify-between gap-3"><div><span className="eyebrow">Phát âm</span><h2 className="mt-1 text-xl font-bold">Luyện 5 thanh điệu</h2><p className="mt-1 text-sm text-[var(--muted)]">Chấm âm học chính xác sẽ được bổ sung khi có bộ phân tích audio phù hợp.</p></div><Headphones className="text-[var(--accent)]"/></div>
    <div className="mt-5 grid grid-cols-5 gap-2">{tones.map(([tone,label])=><button key={tone} onClick={()=>setActive(tone)} className={`rounded-2xl border p-3 text-center ${active===tone?'border-[var(--accent)] bg-[var(--accent-soft)]':'border-[var(--border)]'}`}><b className="font-chinese text-2xl">{tone}</b><small className="mt-1 block text-[10px] text-[var(--muted)]">{label}</small></button>)}</div>
    <div className="mt-4 flex gap-2"><button className="tool-btn flex-1" onClick={()=>void textToSpeechService.speak(active,1).catch(()=>undefined)}><Volume2 size={16}/> Phát</button><button className={`tool-btn flex-1 ${recording?'bg-[var(--accent-soft)] text-[var(--accent)]':''}`} onClick={()=>setRecording(v=>!v)}><Mic size={16}/> {recording?'Đang ghi…':'Ghi âm'}</button><button className="tool-btn flex-1" onClick={()=>setRecording(false)}><RotateCcw size={16}/> Thử lại</button></div>
    <p className="mt-3 text-xs text-[var(--muted)]">Phản hồi phát âm hiện được đánh dấu là <b>giới hạn</b>, không giả lập điểm số âm học.</p>
  </section>;
}

function TutorScreen() {
  const [messages,setMessages]=useState<Array<{id?:string;role:'user'|'assistant';chinese:string;pinyin:string;vietnamese:string}>>([{id:'welcome',role:'assistant',chinese:'你好，你叫什么名字？',pinyin:'Nǐ hǎo, nǐ jiào shénme míngzi?',vietnamese:'Xin chào, bạn tên là gì?'}]);
  const [input,setInput]=useState(''); const [listening,setListening]=useState(false); const [status,setStatus]=useState<'Idle'|'Listening'|'Thinking'|'Speaking'|'Error'>('Idle');
  const [showChinese,setShowChinese]=useState(true),[showPinyin,setShowPinyin]=useState(true),[showVietnamese,setShowVietnamese]=useState(true);
  const [notice,setNotice]=useState(''); const [mode,setMode]=useState<TutorMode>('conversation'); const [busy,setBusy]=useState(false);
  const [hintLevel,setHintLevel]=useState<1|2|3|4>(1),[hint,setHint]=useState(''); const [lastAnalysis,setLastAnalysis]=useState<TutorResponse|null>(null);
  const [speed,setSpeed]=useState<TtsSpeed>(1); const [autoPlay,setAutoPlay]=useState(true); const [language,setLanguage]=useState<'zh-CN'|'zh-TW'|'en-US'|'vi-VN'>('zh-CN');
  const [interim,setInterim]=useState('');
  const [avatarState,setAvatarState]=useState<AvatarState>('idle');
  useEffect(()=>{avatarService.initialize();return avatarService.subscribe(setAvatarState);},[]);

  const play=(text:string)=>{setStatus('Speaking');avatarService.setState('speaking');void textToSpeechService.speak(text,speed).catch(()=>setNotice('Trình duyệt chưa hỗ trợ phát giọng nói tiếng Trung.')).finally(()=>{avatarService.setState('idle');setStatus('Idle');});};
  const submit=async(text:string)=>{
    const value=text.trim(); if(!value||busy)return;
    const history=messages.slice(-12).map((m,i)=>({id:m.id||String(i),role:m.role,chinese:m.chinese,pinyin:m.pinyin,vietnamese:m.vietnamese}));
    setMessages(m=>[...m,{id:String(Date.now()),role:'user',chinese:value,pinyin:'',vietnamese:''}]); setInput('');setHint('');setNotice('');setBusy(true);setStatus('Thinking');
    try{
      const analysis=await aiTutorService.respond({userText:value,targetLevel:'HSK 1',topic:'Self introduction',mode,conversationHistory:history,difficulty:'normal',memory:aiMemoryService.buildTutorContext(loadProfile(),'Self introduction',null,history)});
      setLastAnalysis(analysis); analysis.corrections.forEach(c=>aiMemoryService.recordMistake({type:'grammar',originalInput:c.original,correctedInput:c.corrected,explanation:c.explanation,severity:'medium'})); aiMemoryService.summarizeConversation([...history, value, analysis.reply]); setMessages(m=>[...m,{id:String(Date.now()+1),role:'assistant',chinese:analysis.reply,pinyin:analysis.pinyin,vietnamese:analysis.translation}]);
      const emotion=analysis.emotion==='happy'?'happy':analysis.emotion==='encouraging'?'encouraging':analysis.emotion==='confused'?'confused':analysis.emotion==='error'?'error':'idle';
      avatarService.setState(emotion);
      if(autoPlay)play(analysis.reply); else setStatus('Idle');
    }catch(error){setStatus('Error');setNotice(error instanceof Error&&error.message.startsWith('AI server')?'Đang gặp sự cố kết nối. Bạn thử lại nhé.':'Lina chưa thể trả lời lúc này. Bạn thử lại nhé.');setStatus('Idle');}
    finally{setBusy(false);}
  };

  const toggleMic=async()=>{
    if(listening){speechToTextService.stop();setListening(false);setStatus('Thinking');return;}
    setNotice('');setInterim('');setListening(true);setStatus('Listening');avatarService.setState('listening');
    let finalText='';
    try{
      await speechToTextService.start(text=>{finalText=text;setInput(text);},text=>{setInterim(text);setInput(text)},message=>{setNotice(message);setStatus('Error');setListening(false)},language);
      setListening(false);setInterim('');avatarService.setState('thinking');
      if(finalText.trim()) await submit(finalText); else {setStatus('Idle');setNotice('Mình chưa nghe rõ. Bạn thử nói chậm hơn nhé.');}
    }catch(error){setListening(false);setInterim('');setStatus('Idle');avatarService.setState('error');if(!notice)setNotice(error instanceof Error&&error.message.includes('permission')?'Bạn chưa cấp quyền microphone.':'Mình chưa nghe rõ. Bạn thử lại nhé.');}
  };
  const requestHint=async()=>{const prompt=input.trim()||lastAnalysis?.question||messages[messages.length-1]?.chinese||'Giới thiệu bản thân bằng tiếng Trung';try{const result=await aiTutorService.hint({prompt,targetLevel:'HSK 1',level:hintLevel});setHint(result.hint);setHintLevel(Math.min(4,hintLevel+1) as 1|2|3|4);}catch{setNotice('Đang gặp sự cố kết nối. Bạn thử lại nhé.');}};

  const statusText=status==='Listening'?'Đang nghe…':status==='Thinking'?'Đang hiểu…':status==='Speaking'?'Lina đang nói…':status==='Error'?'Có lỗi':'Sẵn sàng';
  return <div className="mx-auto max-w-5xl space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><span className="eyebrow">Nói với Lina</span><h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Luyện hội thoại Mandarin</h1></div><span className={`status-dot ${status.toLowerCase()}`}><span className="h-2 w-2 rounded-full bg-current"/>{statusText}</span></div>
    <section className="card overflow-hidden">
      <div className="flex flex-col items-center justify-center border-b border-[var(--border)] bg-gradient-to-b from-[var(--accent-soft)] to-transparent px-5 py-6 sm:py-8"><div className={`lina-avatar lina-avatar-${avatarState}`} aria-label={`Lina 林娜 · ${avatarState}`}><div className="lina-face"><span className="lina-hair"/><span className="lina-eye lina-eye-left"/><span className="lina-eye lina-eye-right"/><span className="lina-mouth"/></div></div><p className="mt-3 text-sm font-bold">Lina 林娜</p><p className="text-xs text-[var(--muted)]">Gia sư tiếng Trung</p></div>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] p-3">
        <button onClick={()=>setMode('conversation')} className={`toggle-chip ${mode==='conversation'?'active':''}`}>Trò chuyện</button><button onClick={()=>setMode('teacher')} className={`toggle-chip ${mode==='teacher'?'active':''}`}>Gia sư</button>
        {[
  ['Hán tự',showChinese,()=>setShowChinese(v=>!v)],
  ['Pinyin',showPinyin,()=>setShowPinyin(v=>!v)],
  ['Tiếng Việt',showVietnamese,()=>setShowVietnamese(v=>!v)]
].map(([label,value,toggle])=><button key={String(label)} onClick={()=> (toggle as ()=>void)()} className={`toggle-chip ${value?'active':''}`}><Check size={13} className={value?'':'opacity-0'}/>{label}</button>)}
      </div>
      <div className="max-h-[46vh] min-h-64 space-y-3 overflow-y-auto p-4 sm:p-6">
        {messages.map((m,i)=><TutorMessage key={i} {...m} showChinese={showChinese} showPinyin={showPinyin} showVietnamese={showVietnamese} onPlay={()=>play(m.chinese)}/>)}
        {interim&&<div className="flex justify-end"><div className="max-w-[90%] rounded-3xl bg-[var(--accent-soft)] px-4 py-3 text-sm"><div className="font-chinese">{interim}</div><div className="mt-1 text-xs text-[var(--muted)]">Đang nhận diện…</div></div></div>}
      </div>
      {hint&&<div className="mx-4 mb-3 rounded-xl bg-[var(--accent-soft)] px-4 py-3 text-sm"><b>Gợi ý:</b> {hint}</div>}
      {lastAnalysis&&mode==='teacher'&&(lastAnalysis.corrections.length>0||lastAnalysis.grammarNote)&&<div className="mx-4 mb-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"><div className="eyebrow">Sửa nhẹ & giải thích</div>{lastAnalysis.corrections.map((c,i)=><div key={i} className="mt-3"><p className="text-sm text-[var(--muted)]">Bạn nói: <span className="font-chinese text-[var(--text)]">{c.original}</span></p><p className="mt-1 text-sm font-semibold">Tự nhiên hơn: <span className="font-chinese">{c.corrected}</span></p><p className="mt-1 text-sm text-[var(--muted)]">{c.explanation}</p></div>)}{lastAnalysis.grammarNote&&<p className="mt-3 rounded-xl bg-[var(--surface-2)] p-3 text-sm text-[var(--muted)]">{lastAnalysis.grammarNote}</p>}<p className="mt-3 text-sm font-semibold text-[var(--accent)]">Hãy thử nói lại câu vừa sửa nhé.</p></div>}
      {notice&&<div className="mx-4 mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">{notice}</div>}
      <div className="border-t border-[var(--border)] p-3 sm:p-4">
        <div className="flex items-end gap-2"><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void submit(input);}}} placeholder="Nhập câu tiếng Trung..." rows={1} className="input min-h-12 flex-1 resize-none"/>
          <button onClick={()=>void toggleMic()} disabled={busy} className={`mic-btn ${listening?'active':''}`} aria-label={listening?'Dừng nói':'Nói'}><Mic size={23}/></button><button onClick={()=>void submit(input)} disabled={busy} className="icon-btn min-h-12 min-w-12 bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)]" aria-label="Gửi"><ArrowRight size={20}/></button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"><button className="tool-btn" onClick={()=>void requestHint()}><Lightbulb size={16}/> Gợi ý {hintLevel}</button><button className="tool-btn" onClick={()=>play(messages[messages.length-1]?.chinese||'你好')}><Volume2 size={16}/> Nghe lại</button><button className="tool-btn hidden sm:flex"><Headphones size={16}/> Luyện nghe</button></div>
      </div>
    </section>

    <section className="card p-4 sm:p-5"><div className="flex flex-wrap items-center gap-3"><Settings2 size={18} className="text-[var(--accent)]"/><b className="text-sm">Cài đặt giọng nói</b><label className="text-xs text-[var(--muted)]">Ngôn ngữ <select value={language} onChange={e=>setLanguage(e.target.value as typeof language)} className="ml-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1"><option value="zh-CN">中文 zh-CN</option><option value="zh-TW">中文 zh-TW</option><option value="en-US">English</option><option value="vi-VN">Tiếng Việt</option></select></label><label className="text-xs text-[var(--muted)]">Tốc độ <select value={speed} onChange={e=>setSpeed(Number(e.target.value) as TtsSpeed)} className="ml-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1"><option value="0.75">0.75x</option><option value="1">1.0x</option><option value="1.25">1.25x</option></select></label><button onClick={()=>setAutoPlay(v=>!v)} className={`toggle-chip ${autoPlay?'active':''}`}>{autoPlay?'✓ Tự phát':'Tự phát'}</button></div></section>
    <TonePractice/>
  </div>;
}

function LessonSentence({ chinese,pinyin,vietnamese,showChinese,showPinyin,showVietnamese }:{chinese:string;pinyin:string;vietnamese:string;showChinese:boolean;showPinyin:boolean;showVietnamese:boolean}){
  return <div className="space-y-1">{showChinese&&<div className="font-chinese text-lg font-semibold">{chinese}</div>}{showPinyin&&<div className="text-sm text-[var(--accent)]">{pinyin}</div>}{showVietnamese&&<div className="text-sm text-[var(--muted)]">{vietnamese}</div>}</div>;
}

function LearnScreen({ setRoute }: { setRoute: (r: Route) => void }) {
  const [lessonId,setLessonId]=useState('hsk1-lesson-1'); const [active,setActive]=useState(0);
  const [showChinese,setShowChinese]=useState(true),[showPinyin,setShowPinyin]=useState(true),[showVietnamese,setShowVietnamese]=useState(true);
  const [pinyinMode,setPinyinMode]=useState<PinyinDisplay>('marks');
  const [selected,setSelected]=useState<Vocabulary|null>(null);
  const lesson=learningEngine.getLesson(lessonId); const state=learningEngine.getState();
  const progress=state.progress.lessonProgress[lesson.id]||0;
  const sections=['objective','vocabulary','grammar','listening','speaking','roleplay','review'] as const;
  const complete=(section:any)=>{learningEngine.completeSection(lesson.id,section);setActive(i=>Math.min(i+1,sections.length-1));};
  const displayPinyin=(p:string)=>pinyinMode==='hidden'?'':pinyinMode==='numbers'?toneNumbers(p):p;
  const nextLesson=HSK1_LESSONS.find(x=>x.lessonNumber===lesson.lessonNumber+1);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><span className="eyebrow">HSK 1 · {lesson.lessonNumber}/10</span><h1 className="mt-1 text-3xl font-extrabold">{lesson.title}</h1><p className="mt-2 text-[var(--muted)]">{lesson.objective}</p></div><span className="pill"><Clock3 size={14}/> {10+lesson.difficulty*2} phút</span></div>
    <div className="flex flex-wrap gap-2">{HSK_PATHS.map(path=><span key={path.level} className={`pill ${path.status==='planned'?'opacity-60':''}`}>HSK {path.level}{path.status==='planned'?' · Sắp mở':' · Đang học'}</span>)}</div><div className="card p-4 sm:p-5"><div className="flex justify-between text-sm font-semibold"><span>Tiến độ bài học</span><span className="text-[var(--accent)]">{progress}%</span></div><ProgressBar value={progress}/><div className="mt-3 flex flex-wrap gap-2">{HSK1_LESSONS.map(l=><button key={l.id} onClick={()=>{setLessonId(l.id);setActive(0);learningEngine.startLesson(l.id)}} className={`toggle-chip ${lesson.id===l.id?'active':''}`}>Bài {l.lessonNumber}</button>)}</div></div>
    <div className="card flex flex-wrap items-center gap-2 p-3"><b className="mr-2 text-sm">Hiển thị</b><button className={`toggle-chip ${showChinese?'active':''}`} onClick={()=>setShowChinese(v=>!v)}>Hán tự</button><button className={`toggle-chip ${showPinyin?'active':''}`} onClick={()=>setShowPinyin(v=>setPinyinMode(v?'marks':'hidden'))}>Pinyin</button><button className={`toggle-chip ${showVietnamese?'active':''}`} onClick={()=>setShowVietnamese(v=>!v)}>Tiếng Việt</button>{showPinyin&&<select value={pinyinMode} onChange={e=>setPinyinMode(e.target.value as PinyinDisplay)} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-xs"><option value="marks">Dấu thanh</option><option value="numbers">Số thanh</option><option value="hidden">Ẩn Pinyin</option></select>}</div>
    <div className="grid gap-5 lg:grid-cols-[0.85fr_1.5fr]">
      <div className="card p-3">{sections.map((id,i)=><button key={id} onClick={()=>setActive(i)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ${active===i?'bg-[var(--accent-soft)]':'hover:bg-[var(--surface-2)]'}`}><span className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-bold ${active===i?'bg-[var(--accent)] text-white':'bg-[var(--surface-2)]'}`}>{i+1}</span><span className="min-w-0"><b className="block text-sm">{id==='objective'?'Objective':id[0].toUpperCase()+id.slice(1)}</b><small className="text-xs text-[var(--muted)]">{id==='vocabulary'?'Từ vựng':id==='grammar'?'Mẫu câu':id==='roleplay'?'Tình huống thực tế':'Luyện tập'}</small></span>{active===i&&<ChevronRight size={16} className="ml-auto text-[var(--accent)]"/>}</button>)}</div>
      <section className="card p-5 sm:p-7">
        {active===0&&<><span className="eyebrow">Objective</span><h2 className="mt-2 text-2xl font-bold">Mục tiêu bài học</h2><p className="mt-4 text-[var(--muted)]">{lesson.objective}</p><button onClick={()=>complete('objective')} className="btn-primary mt-6">Bắt đầu bài <ArrowRight size={17}/></button></>}
        {active===1&&<><span className="eyebrow">Vocabulary</span><h2 className="mt-2 text-2xl font-bold">Từ vựng cốt lõi</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{lesson.vocabulary.map(v=><VocabularyCard key={v.id} item={v} onReview={()=>setRoute('speak')}/>)}</div><button onClick={()=>complete('vocabulary')} className="btn-primary mt-5">Đã học xong từ vựng</button></>}
        {active===2&&<><span className="eyebrow">Grammar</span><h2 className="mt-2 text-2xl font-bold">Ngữ pháp</h2><div className="mt-5 space-y-4">{lesson.grammar.map(g=><div key={g.id} className="rounded-2xl bg-[var(--surface-2)] p-5"><b>{g.pattern}</b><p className="mt-1 text-sm">{g.meaning}</p><p className="mt-2 text-sm text-[var(--muted)]">{g.explanationVi}</p>{g.examples.map(e=><div key={e.chinese} className="mt-3 border-t border-[var(--border)] pt-3"><LessonSentence chinese={e.chinese} pinyin={displayPinyin(e.pinyin)} vietnamese={e.vietnamese} showChinese={showChinese} showPinyin={showPinyin&&pinyinMode!=='hidden'} showVietnamese={showVietnamese}/></div>)}</div>)}</div><button onClick={()=>complete('grammar')} className="btn-primary mt-5">Luyện ngữ pháp</button></>}
        {active===3&&<><span className="eyebrow">Listening</span><h2 className="mt-2 text-2xl font-bold">Nghe và hiểu</h2><div className="mt-5 space-y-3">{lesson.dialogue.map((d,i)=><button key={i} onClick={()=>void textToSpeechService.speak(d.chinese).catch(()=>undefined)} className="flex w-full items-center gap-3 rounded-2xl bg-[var(--surface-2)] p-4 text-left"><Volume2 size={18} className="text-[var(--accent)]"/><LessonSentence chinese={d.chinese} pinyin={displayPinyin(d.pinyin)} vietnamese={d.vietnamese} showChinese={showChinese} showPinyin={showPinyin&&pinyinMode!=='hidden'} showVietnamese={showVietnamese}/></button>)}</div><button onClick={()=>complete('listening')} className="btn-primary mt-5">Hoàn thành nghe</button></>}
        {active===4&&<><span className="eyebrow">Speaking</span><h2 className="mt-2 text-2xl font-bold">Luyện nói</h2><div className="mt-5 space-y-3">{lesson.speaking.map(x=><div key={x} className="rounded-2xl bg-[var(--surface-2)] p-4"><LessonSentence chinese={x} pinyin="" vietnamese="" showChinese={showChinese} showPinyin={false} showVietnamese={false}/></div>)}</div><button onClick={()=>{complete('speaking');setRoute('speak')}} className="btn-primary mt-5"><Mic size={17}/> Luyện với Lina</button></>}
        {active===5&&<><span className="eyebrow">Roleplay</span><h2 className="mt-2 text-2xl font-bold">{lesson.roleplay.title}</h2><p className="mt-2 text-[var(--muted)]">{lesson.roleplay.scenario}</p><div className="mt-4 rounded-2xl bg-[var(--surface-2)] p-5"><p className="font-chinese text-xl">{lesson.roleplay.prompt}</p><p className="mt-2 text-sm text-[var(--muted)]">Hãy trả lời bằng tiếng Trung. Lina sẽ đánh giá ý nghĩa, ngữ pháp, từ vựng và độ tự nhiên; phát âm chỉ được đánh giá khi dữ liệu âm thanh hỗ trợ.</p></div><button onClick={()=>{complete('roleplay');setRoute('speak')}} className="btn-primary mt-5">Bắt đầu roleplay <Mic size={17}/></button></>}
        {active===6&&<><span className="eyebrow">Review</span><h2 className="mt-2 text-2xl font-bold">Ôn lại toàn bài</h2><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{learningEngine.reviewTypes().map(t=><div key={t} className="rounded-xl bg-[var(--surface-2)] p-3 text-xs font-semibold">{t}</div>)}</div><p className="mt-4 text-sm text-[var(--muted)]">Ôn theo nhiều chiều: Trung → Việt, Việt → Trung, nghe, Pinyin, nói, điền từ và hội thoại.</p><button onClick={()=>{complete('review'); if(nextLesson)setLessonId(nextLesson.id)}} className="btn-primary mt-5">{nextLesson?'Sang bài tiếp theo':'Hoàn thành HSK 1'} <ArrowRight size={17}/></button></>}
      </section>
    </div>
    {selected&&<div className="fixed inset-0 z-[90] grid place-items-center bg-black/30 p-4" onClick={()=>setSelected(null)}><div className="card max-w-md p-6" onClick={e=>e.stopPropagation()}><div className="font-chinese text-4xl">{selected.hanzi}</div><p className="mt-2 text-[var(--accent)]">{displayPinyin(selected.pinyin)}</p><p className="mt-1">{selected.vietnamese}</p><button onClick={()=>void textToSpeechService.speak(selected.hanzi)} className="btn-primary mt-5"><Volume2 size={17}/> Nghe</button></div></div>}
  </div>;
}

function ReviewScreen() {
  const due=learningEngine.dueReviews(8); const pool=due.length?due.map(r=>HSK1_VOCABULARY.find(v=>v.id===r.vocabularyId)).filter(Boolean) as Vocabulary[]:HSK1_VOCABULARY.slice(0,8);
  const [index,setIndex]=useState(0),[revealed,setRevealed]=useState(false),[type,setType]=useState('zh-vi');
  const card=pool[index%pool.length];
  const rate=(rating:'again'|'hard'|'good'|'easy')=>{learningEngine.review(card.id,rating);setRevealed(false);setIndex(i=>(i+1)%pool.length);};
  return <div className="mx-auto max-w-2xl space-y-6 text-center">
    <div><span className="eyebrow">Ôn tập thông minh</span><h1 className="mt-2 text-3xl font-extrabold">{due.length||pool.length} thẻ hôm nay</h1><p className="mt-2 text-[var(--muted)]">SRS đơn giản, nhiều kiểu luyện tập, không chỉ trắc nghiệm.</p></div>
    <div className="flex flex-wrap justify-center gap-2">{learningEngine.reviewTypes().map(t=><button key={t} onClick={()=>setType(t)} className={`toggle-chip ${type===t?'active':''}`}>{t}</button>)}</div>
    <div className="card flex min-h-[360px] flex-col items-center justify-center p-8 sm:min-h-[420px]"><span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">{type} · {revealed?'Đáp án':'Mặt trước'}</span><button onClick={()=>setRevealed(v=>!v)} className="mt-8 w-full rounded-3xl bg-[var(--surface-2)] p-10"><div className="font-chinese text-5xl font-semibold">{type==='vi-zh'&&!revealed?card.vietnamese:card.hanzi}</div>{revealed&&<><div className="mt-4 text-xl text-[var(--accent)]">{card.pinyin}</div><div className="mt-1 text-base text-[var(--muted)]">{card.vietnamese}</div><div className="mt-3 text-sm">{card.exampleChinese}</div></>}</button><button onClick={()=>setRevealed(true)} className="mt-5 text-sm font-semibold text-[var(--accent)]">Chạm để xem đáp án</button></div>
    <div className="grid grid-cols-4 gap-2">{[['Lại','again'],['Khó','hard'],['Tốt','good'],['Dễ','easy']].map(([label,value])=><button key={value} disabled={!revealed} onClick={()=>rate(value as any)} className="review-btn"><span>{label}</span></button>)}</div>
  </div>;
}

function ProfileScreen({ profile, setProfile, startOnboarding }: { profile: UserProfile; setProfile: React.Dispatch<React.SetStateAction<UserProfile>>; startOnboarding: () => void }) {
  const state=learningEngine.getState(); const memory=aiMemoryService.getLearnerProfile(profile); const weak=learningEngine.weakAreas(); const [confirm,setConfirm]=useState(false);
  const reset=()=>{aiMemoryService.resetProgress();setConfirm(false);};
  const stats=[['🔥',String(profile.streak),'Ngày liên tiếp'],['词',String(profile.vocabularyLearned),'Từ đã học'],['✓',String(state.progress.completedLessons.length),'Bài hoàn thành'],['🎙',String(state.progress.speakingPractice),'Lượt luyện nói'],['👂',String(state.progress.listeningPractice),'Lượt luyện nghe'],['文',String(state.progress.grammarPractice),'Lượt ngữ pháp'],['声',String(state.progress.pronunciationPractice),'Luyện phát âm'],['声调',String(state.progress.tonePractice),'Luyện thanh điệu']];
  return <div className="space-y-6">
    <section className="hero-card flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><span className="eyebrow"><User size={14}/> Hồ sơ học tập</span><h1 className="mt-2 text-3xl font-extrabold">{profile.name}</h1><p className="mt-1 text-[var(--muted)]">HSK {profile.currentHsk} · {levelLabels[profile.level]}</p></div><button onClick={startOnboarding} className="btn-secondary">Cập nhật mục tiêu</button></section>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([icon,value,label])=><div className="card p-4" key={label}><span className="text-xl">{icon}</span><b className="mt-3 block text-2xl">{value}</b><small className="text-[var(--muted)]">{label}</small></div>)}</div>
    <section className="card p-5 sm:p-6"><h2 className="text-xl font-bold">Điểm mạnh</h2><div className="mt-3 flex flex-wrap gap-2">{memory.strongAreas.length?memory.strongAreas.map(x=><span className="pill" key={x}>{x}</span>):<span className="text-sm text-[var(--muted)]">Lina sẽ xác định khi bạn tích lũy thêm review.</span>}</div><h2 className="mt-6 text-xl font-bold">Cần cải thiện</h2><div className="mt-3 flex flex-wrap gap-2">{memory.weakAreas.length?memory.weakAreas.map(x=><span className="pill" key={x}>{x}</span>):<span className="text-sm text-[var(--muted)]">Chưa có điểm yếu lặp lại.</span>}</div></section>
    <section className="card p-5 sm:p-6"><h2 className="text-xl font-bold">Lỗi thường gặp</h2>{state.mistakes.length?<div className="mt-4 space-y-2">{state.mistakes.slice(0,5).map(x=><div key={x.id} className="info-row"><span>{x.original}</span><b>{x.corrected}</b></div>)}</div>:<p className="mt-2 text-sm text-[var(--muted)]">Lina sẽ ghi nhớ các lỗi học tập hữu ích.</p>}</section>
    <section className="card p-5 sm:p-6"><h2 className="text-xl font-bold">Quyền kiểm soát bộ nhớ học tập</h2><p className="mt-2 text-sm text-[var(--muted)]">Chỉ lưu dữ liệu phục vụ việc học: tiến độ, lỗi, review và sở thích học tập. Bạn có thể reset bất cứ lúc nào.</p>{confirm?<div className="mt-4 flex gap-2"><button onClick={reset} className="btn-primary">Xác nhận reset</button><button onClick={()=>setConfirm(false)} className="btn-secondary">Hủy</button></div>:<button onClick={()=>setConfirm(true)} className="btn-secondary mt-4">Xóa & reset tiến trình học</button>}</section>
    <section className="card p-5 sm:p-6"><h2 className="text-xl font-bold">Tiến trình</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><div className="flex justify-between text-sm"><span>HSK</span><b>HSK {memory.hskLevel}</b></div><ProgressBar value={Math.min(100,memory.hskLevel/6*100)}/></div><div><div className="flex justify-between text-sm"><span>Từ vựng</span><b>{memory.vocabularyStats.learned}</b></div><ProgressBar value={Math.min(100,memory.vocabularyStats.learned/150*100)}/></div><div><div className="flex justify-between text-sm"><span>Ngữ pháp</span><b>{memory.grammarStats.practiced}</b></div><ProgressBar value={Math.min(100,memory.grammarStats.practiced*10)}/></div><div><div className="flex justify-between text-sm"><span>Nói</span><b>{memory.speakingStats.sessions}</b></div><ProgressBar value={Math.min(100,memory.speakingStats.sessions*5)}/></div></div></section>
  </div>;
}

function Onboarding({ profile, onComplete }: { profile: UserProfile; onComplete: (p: UserProfile) => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(profile);
  const next = () => step < 3 ? setStep(step + 1) : onComplete(draft);
  const options = [
    { title: 'Bạn học tiếng Trung để làm gì?', values: Object.keys(goalLabels) as LearningGoal[], labels: goalLabels },
    { title: 'Bạn đang ở trình độ nào?', values: Object.keys(levelLabels) as SkillLevel[], labels: levelLabels },
    { title: 'Bạn muốn học bao lâu mỗi ngày?', values: [5, 10, 15, 20] as number[], labels: {5:'5 phút',10:'10 phút',15:'15 phút',20:'20 phút'} }
  ];
  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-[var(--bg)]/95 backdrop-blur-xl"><div className="mx-auto flex min-h-full max-w-lg items-center px-4 py-8"><section className="card w-full p-6 sm:p-8">
    <div className="flex items-center justify-between"><div><span className="eyebrow">Bắt đầu cùng Lina</span><p className="mt-2 text-xs text-[var(--muted)]">Bước {Math.min(step + 1, 3)}/3</p></div><Sparkles className="text-[var(--accent)]"/></div>
    {step < 3 ? <><h1 className="mt-8 text-2xl font-extrabold">{options[step].title}</h1><div className="mt-5 space-y-2">{options[step].values.map((v, i) => { const selected = step === 0 ? draft.goal === v : step === 1 ? draft.level === v : draft.dailyMinutes === v; const label = step === 0 ? goalLabels[v as LearningGoal] : step === 1 ? levelLabels[v as SkillLevel] : `${v} phút`; return <button key={String(v)} onClick={() => setDraft(p => step === 0 ? {...p, goal: v as LearningGoal} : step === 1 ? {...p, level: v as SkillLevel} : {...p, dailyMinutes: v as 5|10|15|20})} className={`choice ${selected ? 'selected' : ''}`}><span>{step === 0 ? ['✈️','💼','🗣','📚','🎓','🎬'][i] : ''}</span>{label}{selected && <Check className="ml-auto" size={18}/>}</button> })}</div><button onClick={next} className="btn-primary mt-6 w-full">Tiếp tục <ArrowRight size={17}/></button></> :
    <><div className="mx-auto mt-10 grid h-20 w-20 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"><Check size={34}/></div><h1 className="mt-6 text-center text-2xl font-extrabold">Sẵn sàng học cùng Lina</h1><p className="mt-2 text-center text-[var(--muted)]">Lộ trình đầu tiên của bạn sẽ bắt đầu với HSK 1 · Bài 1.</p><button onClick={next} className="btn-primary mt-7 w-full">Bắt đầu học <ArrowRight size={17}/></button></>}
  </section></div></div>;
}

export default function App() {
  const [route, setRoute] = useState<Route>('home');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('lina_theme') as Theme) || 'light');
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [onboarding, setOnboarding] = useState(() => localStorage.getItem('lina_onboarding_done') !== 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('lina_theme', theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem('lina_profile', JSON.stringify(profile)); }, [profile]);

  const finishOnboarding = (next: UserProfile) => {
    setProfile(next); localStorage.setItem('lina_onboarding_done', 'true'); setOnboarding(false);
  };

  const content = useMemo(() => {
    if (route === 'home') return <HomeDashboard profile={profile} setRoute={setRoute}/>;
    if (route === 'learn') return <LearnScreen setRoute={setRoute}/>;
    if (route === 'speak') return <TutorScreen/>;
    if (route === 'review') return <ReviewScreen/>;
    return <ProfileScreen profile={profile} setProfile={setProfile} startOnboarding={() => setOnboarding(true)}/>;
  }, [route, profile]);

  return <AppShell route={route} setRoute={setRoute} theme={theme} setTheme={setTheme}>
    {content}
    {onboarding && <Onboarding profile={profile} onComplete={finishOnboarding}/>}
  </AppShell>;
}

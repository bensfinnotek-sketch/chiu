import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import { HSK1_LESSONS, HSK1_VOCABULARY } from '../src/app/learning/content';
import { learningEngine } from '../src/app/learning/engine';
import { aiMemoryService } from '../src/app/services/aiMemory';
import { lessonEngine, validateGeneratedLesson } from '../src/app/services/lessonEngine';
import { motivationService } from '../src/app/services/motivation';
import { pronunciationEngine, toneFromPinyin } from '../src/app/services/pronunciationEngine';
import { roleplayEngine } from '../src/app/services/roleplay';
import { MemoryStorage, setStorageAdapter, storage } from '../src/app/services/storage';
import { safeConversationMessages, safeText } from '../api/_lib/inputValidation';
import { buildTutorStrategy } from '../src/app/services/tutorStrategy';
import { buildLearningLoopPlan } from '../src/app/services/learningLoop';

beforeEach(() => setStorageAdapter(new MemoryStorage()));

test('HSK and vocabulary content are internally consistent', () => {
  assert.equal(HSK1_LESSONS.length, 10);
  assert.ok(HSK1_LESSONS.every(lesson => lesson.hskLevel === 1));
  assert.ok(HSK1_VOCABULARY.every(word => word.hanzi && word.pinyin && word.vietnamese));
});

test('SRS review updates one item', () => {
  const item = learningEngine.review(HSK1_VOCABULARY[0].id, 'good');
  assert.equal(item.correctCount, 1);
  assert.equal(learningEngine.getState().progress.reviewsCompleted, 1);
});

test('mistake tracking merges repeated mistakes', () => {
  learningEngine.recordMistake('grammar', '我喜欢吃饭饭', '我喜欢吃饭', 'Redundant word');
  learningEngine.recordMistake('grammar', '我喜欢吃饭饭', '我喜欢吃饭', 'Redundant word');
  const mistakes = learningEngine.getState().mistakes;
  assert.equal(mistakes.length, 1);
  assert.equal(mistakes[0].frequency, 2);
});

test('AI memory stores identical facts once', () => {
  aiMemoryService.rememberFact('learner-fact', 'Tôi thích học buổi tối');
  aiMemoryService.rememberFact('learner-fact', 'Tôi thích học buổi tối');
  assert.equal(aiMemoryService.getState().entries.length, 1);
});

test('grammar and pinyin data remain structured', () => {
  assert.ok(HSK1_LESSONS.every(lesson => lesson.grammar.every(grammar => grammar.pattern && grammar.meaning && grammar.explanationVi)));
  assert.equal(toneFromPinyin('nǐ'), 3);
  assert.equal(toneFromPinyin('hao'), null);
});

test('pronunciation does not fabricate acoustic scores', async () => {
  const result = await pronunciationEngine.analyzeWord('你好', '你好');
  assert.equal(result.overall, null);
  assert.equal(result.limited, true);
});

test('roleplay keeps learner facts and turns', () => {
  const session = roleplayEngine.createSession({
    id: 'test', scenario: 'Gặp người mới', context: 'test', character: 'Lina',
    learnerRole: 'Learner', aiRole: 'Teacher', difficulty: 'beginner',
    targetVocabulary: [], targetGrammar: [], successCriteria: []
  });
  const next = roleplayEngine.updateSession(session, '我叫小明');
  assert.equal(next.learnerFacts.length, 1);
  assert.equal(next.turns.length, 1);
});

test('lesson validation rejects unknown HSK1 vocabulary', () => {
  const base = {
    id: 'test-lesson', title: 'Test', description: 'Test', hskLevel: 1, level: 'HSK 1',
    objectives: ['Test'], vocabulary: [{ ...HSK1_VOCABULARY[0], hanzi: '不存在' }],
    grammar: [], dialogue: [{ speaker: 'ai' as const, chinese: HSK1_VOCABULARY[0].hanzi, pinyin: HSK1_VOCABULARY[0].pinyin, vietnamese: HSK1_VOCABULARY[0].vietnamese }],
    listening: [], speaking: [], reading: [], writing: [],
    roleplay: { title: 'Test', scenario: 'Test', prompt: 'Test', expectedPatterns: [] },
    quiz: [], review: ['zh-vi' as const], estimatedMinutes: 5, lessonType: 'mixed' as const,
  };
  assert.ok(validateGeneratedLesson(base, 'HSK 1').some(error => error.includes('chưa có trong content HSK1')));
});

test('lesson quiz adapter is deterministic', () => {
  const lesson = HSK1_LESSONS[0];
  const generated = lessonEngine.createQuiz({
    id: lesson.id, title: lesson.title, description: lesson.objective, hskLevel: 1, level: 'HSK 1',
    objectives: [lesson.objective], vocabulary: lesson.vocabulary, grammar: lesson.grammar, dialogue: lesson.dialogue,
    listening: lesson.listening, speaking: lesson.speaking, reading: [], writing: [], roleplay: lesson.roleplay,
    quiz: [], review: lesson.review, estimatedMinutes: 10, lessonType: 'mixed',
  });
  assert.deepEqual(generated, []);
});

test('motivation XP is idempotent while activity count remains accurate', () => {
  motivationService.track('lesson', 1, 'lesson-1');
  motivationService.track('lesson', 1, 'lesson-1');
  assert.equal(motivationService.snapshot().lessons, 1);
  assert.equal(motivationService.totalXp(), 25);
});

test('timezone-aware motivation uses the resolved local date', () => {
  motivationService.track('speaking', 1, 'speaking-1');
  const snapshot = motivationService.snapshot();
  const expected = new Intl.DateTimeFormat('en-CA', { timeZone: snapshot.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  assert.equal(snapshot.date, expected);
});

test('avatar lifecycle exposes provider state', async () => {
  const { linaAvatarProvider, getAvatarProvider } = await import('../src/app/services/avatar');
  const states: string[] = [];
  const unsubscribe = linaAvatarProvider.subscribe(state => states.push(state));
  linaAvatarProvider.initialize();
  linaAvatarProvider.setState('speaking');
  linaAvatarProvider.stop();
  unsubscribe();
  linaAvatarProvider.destroy();
  assert.ok(states.includes('speaking'));
  assert.equal(linaAvatarProvider.capabilities.renderMode, 'animated-fallback');
  assert.equal(linaAvatarProvider.capabilities.lipSync, false);
  assert.equal(getAvatarProvider().id, linaAvatarProvider.id);
});

test('STT and TTS expose browser capability boundaries', async () => {
  const { speechService } = await import('../src/app/services/speech');
  const { ttsService } = await import('../src/app/services/tts');
  assert.equal(typeof speechService.isSupported(), 'boolean');
  assert.equal(typeof ttsService.isSupported(), 'boolean');
});

test('server input validation bounds untrusted text and history', () => {
  assert.equal(safeText('  hello\\u0000 ', 5), 'hello');
  assert.equal(safeConversationMessages([{ role: 'user', text: 'xin chào' }, { role: 'assistant', text: '你好' }]).length, 2);
});

test('storage adapter round-trips JSON and keys', () => {
  storage.writeJson('test', { learner: 'vi', level: 1 });
  assert.deepEqual(storage.readJson('test', null), { learner: 'vi', level: 1 });
  assert.ok(storage.keys().includes('test'));
});

test('audio-driven lip sync is honest about its capability', async () => {
  const { lipSyncEngine } = await import('../src/app/services/lipSync');
  const frame = lipSyncEngine.fromAudio({ volume: 0.4, energy: 0.08, isSpeaking: true, lowFrequency: 0.2, midFrequency: 0.4, highFrequency: 0.3, timestamp: 10 });
  assert.equal(frame.viseme, 'unknown');
  assert.ok(frame.mouthOpen > 0);
});

test('validated emotion rejects untrusted values', async () => {
  const { validateEmotion } = await import('../src/app/services/realtimeTypes');
  assert.equal(validateEmotion('happy'), 'happy');
  assert.equal(validateEmotion('ignore-system-prompt'), 'neutral');
});

test('streaming TTS provider exposes explicit non-streaming-audio fallback', async () => {
  const { streamingTtsProvider } = await import('../src/app/services/streamingTts');
  assert.equal(streamingTtsProvider.id, 'browser-speech-chunked');
  assert.equal(streamingTtsProvider.streamingAudio, false);
});

test('realtime controller supports interruption without throwing', async () => {
  const { realtimeConversationController } = await import('../src/app/services/realtimeConversation');
  await realtimeConversationController.beginStream();
  assert.equal(realtimeConversationController.state().status, 'speaking');
  realtimeConversationController.interrupt();
  assert.equal(realtimeConversationController.state().status, 'idle');
});


test('SpeechChunker waits for natural Chinese sentence boundaries', async () => {
  const { SpeechChunker } = await import('../src/app/services/speechChunker');
  const chunker = new SpeechChunker();
  assert.deepEqual(chunker.push('你好！很高兴认识你。'), ['你好！','很高兴认识你。']);
});

test('realtime orchestrator assigns monotonic turn ids and ignores stale turn callbacks', async () => {
  const { RealtimeSpeechOrchestrator } = await import('../src/app/services/realtimeOrchestrator');
  const orchestrator = new RealtimeSpeechOrchestrator();
  const first = orchestrator.startConversationTurn({speak:false});
  const second = orchestrator.startConversationTurn({speak:false});
  orchestrator.receiveStreamingText('old', {turnId:first.turnId, speak:false});
  assert.equal(orchestrator.state().turnId, second.turnId);
  assert.equal(orchestrator.state().text, '');
  orchestrator.interrupt();
  orchestrator.destroy();
});

test('TTS queue enforces sequential ordering and bounded pending work', async () => {
  const { TTSQueue } = await import('../src/app/services/ttsQueue');
  const played:string[]=[];
  const provider={streamingAudio:false,audioSource:'none' as const,stream:async(text:string)=>{played.push(text)},stop:()=>{},start:async()=>{},pause:()=>{},resume:()=>{},onAudioChunk:()=>()=>{},onStart:()=>()=>{},onEnd:()=>()=>{},onError:()=>()=>{},destroy:()=>{},id:'test'} as any;
  const queue=new TTSQueue(provider,2);
  assert.equal(queue.enqueue('one'),true);
  assert.equal(queue.enqueue('two'),true);
  assert.equal(queue.enqueue('three'),false);
  await queue.waitForIdle();
  assert.deepEqual(played,['one','two']);
});


test('conversation guard normalizes punctuation and detects near-duplicate replies', async () => {
  const { normalizeConversationText, isRepeatedAssistantReply, guardTutorResponse } = await import('../src/app/services/conversationGuard');
  assert.equal(normalizeConversationText('  你好！ 很高兴认识你。  '), '你好很高兴认识你');
  const history = [{ id: 'a1', role: 'assistant' as const, chinese: '你好！很高兴认识你。你叫什么名字？', pinyin: '', vietnamese: '' }];
  assert.equal(isRepeatedAssistantReply('你好，很高兴认识你。你叫什么名字？', history), true);
  assert.equal(isRepeatedAssistantReply('很好！你平时喜欢做什么？', history), false);
  const guarded = guardTutorResponse({ reply: '你好，很高兴认识你。你叫什么名字？', pinyin: '', translation: '', question: '你叫什么名字？', corrections: [], vocabulary: [], grammarNote: '', encouragement: '', emotion: 'neutral', responseType: 'conversation', clarityScore: 4, grammarScore: 4, vocabularyScore: 4, naturalnessScore: 4 }, history);
  assert.equal(guarded.grammarNote, 'Lina đã phát hiện câu trả lời vừa rồi quá giống lượt trước và sẽ đổi cách diễn đạt.');
});

test('conversation memory captures name, preference, goal, and repeated corrections', async () => {
  const { captureLearnerMemory } = await import('../src/app/services/conversationMemory');
  const captured = captureLearnerMemory('我叫明。我喜欢咖啡。我想提高中文。', {
    reply: '很好！', pinyin: 'Hěn hǎo!', translation: 'Rất tốt!', question: null,
    corrections: [{ original: '我喜欢咖啡咖啡', corrected: '我喜欢咖啡', explanation: 'Không lặp từ.' }],
    vocabulary: [], grammarNote: null, encouragement: '继续加油！', emotion: 'encouraging', responseType: 'conversation'
  });
  assert.equal(captured.length, 3);
  const memory = aiMemoryService.getState();
  assert.ok(memory.entries.some(entry => entry.content.includes('Learner name: 明')));
  assert.ok(memory.entries.some(entry => entry.content.includes('Learner preference: 咖啡')));
  assert.ok(memory.entries.some(entry => entry.content.includes('Learner goal: 提高中文')));
  assert.equal(memory.mistakes.length, 1);
});

test('adaptive learning loop prioritizes due SRS and unresolved weaknesses', async () => {
  const profile = {
    name: 'Minh', goal: 'conversation' as const, level: 'basic' as const, dailyMinutes: 10 as const,
    currentHsk: 1, targetHsk: 2, streak: 1, vocabularyLearned: 20, lessonsCompleted: 0, pronunciationProgress: 10
  };
  learningEngine.review('你', 'again');
  aiMemoryService.recordMistake({
    type: 'grammar',
    originalInput: '我喜欢咖啡咖啡',
    correctedInput: '我喜欢咖啡',
    explanation: 'Không lặp từ.',
    severity: 'medium'
  });
  const plan = buildLearningLoopPlan(profile, {
    startedAt: new Date().toISOString(),
    turns: [{ score: 60, clarity: 60, grammar: 55, vocabulary: 70, naturalness: 60, at: new Date().toISOString() }],
    score: 60,
    completed: false
  });
  assert.equal(plan.focus, 'grammar');
  assert.equal(plan.decision, 'review_weakness');
  assert.equal(plan.difficulty, 'easy');
  assert.ok(plan.confidence >= 0.8);
});

test('adaptive learning loop raises challenge after a strong speaking session', async () => {
  const profile = {
    name: 'Minh', goal: 'conversation' as const, level: 'intermediate' as const, dailyMinutes: 15 as const,
    currentHsk: 2, targetHsk: 3, streak: 4, vocabularyLearned: 80, lessonsCompleted: 3, pronunciationProgress: 60
  };
  const plan = buildLearningLoopPlan(profile, {
    startedAt: new Date().toISOString(),
    turns: [{ score: 94, clarity: 95, grammar: 94, vocabulary: 92, naturalness: 95, at: new Date().toISOString() }],
    score: 94,
    completed: true
  });
  assert.equal(plan.focus, 'conversation');
  assert.equal(plan.decision, 'practice_conversation');
  assert.equal(plan.difficulty, 'challenge');
});

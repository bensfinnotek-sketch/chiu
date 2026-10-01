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
  assert.equal(motivationService.snapshot().lessons, 2);
  assert.equal(motivationService.totalXp(), 25);
});

test('timezone-aware motivation uses the resolved local date', () => {
  motivationService.track('speaking', 1, 'speaking-1');
  const snapshot = motivationService.snapshot();
  const expected = new Intl.DateTimeFormat('en-CA', { timeZone: snapshot.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  assert.equal(snapshot.date, expected);
});

test('avatar lifecycle exposes provider state', async () => {
  const { linaAvatarProvider } = await import('../src/app/services/avatar');
  const states: string[] = [];
  const unsubscribe = linaAvatarProvider.subscribe(state => states.push(state));
  linaAvatarProvider.initialize();
  linaAvatarProvider.setState('speaking');
  linaAvatarProvider.stop();
  unsubscribe();
  linaAvatarProvider.destroy();
  assert.ok(states.includes('speaking'));
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
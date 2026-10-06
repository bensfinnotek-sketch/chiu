import type { TutorResponse } from '../types';
import { storage } from './storage';

export interface SpeakingTurnScore {
  score: number;
  clarity: number | null;
  grammar: number | null;
  vocabulary: number | null;
  naturalness: number | null;
  at: string;
}

export interface SpeakingSessionSnapshot {
  startedAt: string;
  turns: SpeakingTurnScore[];
  score: number;
  completed: boolean;
}

const KEY = 'lina_speaking_session_v1';
const MAX_TURNS = 5;

const finiteScore = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;

const average = (values: Array<number | null>) => {
  const usable = values.filter((value): value is number => value !== null);
  return usable.length ? Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length) : 0;
};

const empty = (): SpeakingSessionSnapshot => ({
  startedAt: new Date().toISOString(),
  turns: [],
  score: 0,
  completed: false
});

const read = (): SpeakingSessionSnapshot => {
  const value = storage.readJson<SpeakingSessionSnapshot | null>(KEY, null);
  if (!value || !Array.isArray(value.turns)) return empty();
  return {
    startedAt: value.startedAt || new Date().toISOString(),
    turns: value.turns.slice(-MAX_TURNS),
    score: typeof value.score === 'number' ? value.score : 0,
    completed: Boolean(value.completed)
  };
};

const write = (session: SpeakingSessionSnapshot) => storage.writeJson(KEY, session);

export const speakingSessionService = {
  get() {
    return read();
  },
  reset() {
    const session = empty();
    write(session);
    return session;
  },
  record(response: TutorResponse) {
    const session = read();
    const clarity = finiteScore(response.clarityScore);
    const grammar = finiteScore(response.grammarScore);
    const vocabulary = finiteScore(response.vocabularyScore);
    const naturalness = finiteScore(response.naturalnessScore);
    const score = average([clarity, grammar, vocabulary, naturalness]);
    const next: SpeakingSessionSnapshot = {
      ...session,
      turns: [...session.turns, { score, clarity, grammar, vocabulary, naturalness, at: new Date().toISOString() }].slice(-MAX_TURNS)
    };
    next.score = average(next.turns.map(turn => turn.score));
    next.completed = next.turns.length >= MAX_TURNS;
    write(next);
    return next;
  }
};

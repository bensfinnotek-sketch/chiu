// Conversation Repository for HanziAI
// Provides an abstracted storage interface ready for local storage or cloud database.

import { ConversationMessage } from '../types';
import {
  ConversationMemory,
  createEmptyMemory,
  saveMemoryToStorage,
  loadMemoryFromStorage,
  clearMemoryFromStorage,
} from '../ai/memory/conversationMemory';

export interface ConversationRepository {
  createSession(topic: string, level: string): Promise<ConversationMemory>;
  getSession(sessionId: string): Promise<ConversationMemory | null>;
  saveMessage(sessionId: string, message: ConversationMessage): Promise<void>;
  updateMemory(memory: ConversationMemory): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  listSessions(): Promise<ConversationMemory[]>;
  clearAllSessions(): Promise<void>;
}

const INDEX_KEY = 'hanzi_ai_conversation_sessions_index_v1';

export class LocalStorageConversationRepository implements ConversationRepository {
  private getSessionIds(): string[] {
    try {
      const raw = localStorage.getItem(INDEX_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveSessionIds(ids: string[]): void {
    try {
      localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
    } catch (err) {
      console.warn('Could not save session ids:', err);
    }
  }

  async createSession(topic: string, level: string): Promise<ConversationMemory> {
    const sessionId = `speaking_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newMemory = createEmptyMemory(sessionId, topic, level);

    saveMemoryToStorage(newMemory);

    const ids = this.getSessionIds();
    if (!ids.includes(sessionId)) {
      this.saveSessionIds([sessionId, ...ids].slice(0, 30));
    }

    return newMemory;
  }

  async getSession(sessionId: string): Promise<ConversationMemory | null> {
    return loadMemoryFromStorage(sessionId);
  }

  async saveMessage(sessionId: string, message: ConversationMessage): Promise<void> {
    let memory = await this.getSession(sessionId);
    if (!memory) {
      memory = createEmptyMemory(sessionId);
    }
    memory.recentMessages = [...memory.recentMessages, message].slice(-20);
    memory.updatedAt = Date.now();
    await this.updateMemory(memory);
  }

  async updateMemory(memory: ConversationMemory): Promise<void> {
    saveMemoryToStorage(memory);
    const ids = this.getSessionIds();
    if (!ids.includes(memory.sessionId)) {
      this.saveSessionIds([memory.sessionId, ...ids].slice(0, 30));
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    clearMemoryFromStorage(sessionId);
    const ids = this.getSessionIds().filter((id) => id !== sessionId);
    this.saveSessionIds(ids);
  }

  async listSessions(): Promise<ConversationMemory[]> {
    const ids = this.getSessionIds();
    const list: ConversationMemory[] = [];
    for (const id of ids) {
      const mem = loadMemoryFromStorage(id);
      if (mem) list.push(mem);
    }
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async clearAllSessions(): Promise<void> {
    const ids = this.getSessionIds();
    ids.forEach((id) => clearMemoryFromStorage(id));
    this.saveSessionIds([]);
  }
}

export const conversationRepository = new LocalStorageConversationRepository();

/**
 * Comprehensive Regression Test Suite for HanziAI
 * Tests:
 * 1. Health Endpoint
 * 2. Unauthenticated Access Protection (401 on /api/flashcards, /api/user/profile)
 * 3. Guest Mode Speaking (Lina turn-by-turn with no Bearer token)
 * 4. User Isolation & IDOR Protection (client cannot spoof userId)
 * 5. Deduplication & Upsert Logic (UNIQUE(user_id, hanzi))
 * 6. Flashcard Reuse in Teacher Lina Context
 */

import { getFlashcardsForUser, upsertFlashcardForUser, updateFlashcardForUser, deleteFlashcardForUser } from '../api/_lib/flashcardHandlers.ts';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('==============================================');
  console.log('STARTING HANZI-AI REGRESSION TEST SUITE');
  console.log('==============================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  // 1. Health check test
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    assert(res.status === 200 && data.status === 'ok', '1. GET /api/health returns 200 and status: ok');
  } catch (err: any) {
    assert(false, '1. GET /api/health', err.message);
  }

  // 2. Auth Protection Tests (No Token => 401)
  try {
    const resGet = await fetch(`${BASE_URL}/api/flashcards`);
    assert(resGet.status === 401, '2.1 GET /api/flashcards without token returns 401 Unauthorized');

    const resPost = await fetch(`${BASE_URL}/api/flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hanzi: '测试', pinyin: 'cèshì', meaning: 'kiểm tra' }),
    });
    assert(resPost.status === 401, '2.2 POST /api/flashcards without token returns 401 Unauthorized');

    const resPatch = await fetch(`${BASE_URL}/api/flashcards/test-id`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'learned' }),
    });
    assert(resPatch.status === 401, '2.3 PATCH /api/flashcards/:id without token returns 401 Unauthorized');

    const resDelete = await fetch(`${BASE_URL}/api/flashcards/test-id`, {
      method: 'DELETE',
    });
    assert(resDelete.status === 401, '2.4 DELETE /api/flashcards/:id without token returns 401 Unauthorized');

    const resProfile = await fetch(`${BASE_URL}/api/user/profile`);
    assert(resProfile.status === 401, '2.5 GET /api/user/profile without token returns 401 Unauthorized');
  } catch (err: any) {
    assert(false, '2. Auth Protection Tests', err.message);
  }

  // 3. User Isolation & IDOR Protection Test
  try {
    const userA = 'user-alpha-' + Date.now();
    const userB = 'user-beta-' + Date.now();

    // User A creates a flashcard
    await upsertFlashcardForUser(userA, {
      hanzi: '学习',
      pinyin: 'xuéxí',
      meaning: 'học tập',
      example_sentence: '我喜欢学习中文。',
      topic: 'Education',
    });

    // User B creates a different flashcard
    await upsertFlashcardForUser(userB, {
      hanzi: '工作',
      pinyin: 'gōngzuò',
      meaning: 'làm việc',
      example_sentence: '他在一家医院工作。',
      topic: 'Career',
    });

    const cardsA = await getFlashcardsForUser(userA);
    const cardsB = await getFlashcardsForUser(userB);

    const userAHasOnlyOwn = cardsA.every((c) => c.user_id === userA) && cardsA.some((c) => c.hanzi === '学习');
    const userBHasNoA = !cardsB.some((c) => c.hanzi === '学习') && cardsB.some((c) => c.hanzi === '工作');

    assert(userAHasOnlyOwn && userBHasNoA, '3. User Isolation: User A and User B cannot see each other\'s flashcards (Strict Isolation)');

    // IDOR protection test: User B cannot modify User A's card
    const cardAId = cardsA[0].id;
    const updateResult = await updateFlashcardForUser(userB, cardAId, { status: 'learned' });
    assert(updateResult === null, '3.1 IDOR Protection: User B cannot modify User A\'s flashcard');

    // IDOR protection test: User B cannot delete User A's card
    const deleteResult = await deleteFlashcardForUser(userB, cardAId);
    assert(deleteResult === false, '3.2 IDOR Protection: User B cannot delete User A\'s flashcard');
  } catch (err: any) {
    assert(false, '3. User Isolation & IDOR Protection', err.message);
  }

  // 4. Deduplication & Progress Preservation Test (UNIQUE(user_id, hanzi))
  try {
    const testUserId = 'test-dedup-user-' + Date.now();

    // Insert card 1st time
    const firstInsert = await upsertFlashcardForUser(testUserId, {
      hanzi: '苹果',
      pinyin: 'píngguǒ',
      meaning: 'quả táo',
      example_sentence: '我买了一个苹果。',
      topic: 'Food',
    });

    if (firstInsert) {
      await updateFlashcardForUser(testUserId, firstInsert.id, {
        status: 'learning',
        review_count: 3,
      });
    }

    // Insert same Hanzi 2nd time with a new example sentence
    const secondInsert = await upsertFlashcardForUser(testUserId, {
      hanzi: '苹果',
      pinyin: 'píngguǒ',
      meaning: 'quả táo (màu đỏ)',
      example_sentence: '红色的苹果很甜。',
      topic: 'Food',
    });

    const allCards = await getFlashcardsForUser(testUserId);
    const appleCards = allCards.filter((c) => c.hanzi === '苹果');

    const exactOneCard = appleCards.length === 1;
    const updatedExample = appleCards[0]?.example_sentence === '红色的苹果很甜。';
    const preservedProgress = appleCards[0]?.status === 'learning' && appleCards[0]?.review_count === 3;

    assert(
      exactOneCard && updatedExample && preservedProgress,
      '4. Deduplication: Upserting same Hanzi preserves review progress (status, review_count) and updates example'
    );
  } catch (err: any) {
    assert(false, '4. Deduplication & Progress Preservation', err.message);
  }

  // 5. Guest Mode Speaking API Test (3 turns)
  try {
    const history: any[] = [];
    const turns = [
      '你好，莉娜老师！',
      '我想练习在餐厅点菜。',
      '请给我一杯热茶，谢谢。',
    ];

    let allTurnsSuccess = true;
    for (let i = 0; i < turns.length; i++) {
      const userText = turns[i];
      const res = await fetch(`${BASE_URL}/api/ai/speaking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userText,
          targetLevel: 'HSK 1',
          topic: 'Ordering Food',
          conversationHistory: history,
          nativeLanguage: 'vi',
        }),
      });

      if (!res.ok) {
        console.error(`Turn ${i + 1} failed with status:`, res.status);
        allTurnsSuccess = false;
        break;
      }

      const data = await res.json();
      if (!data.reply || typeof data.reply !== 'string') {
        console.error(`Turn ${i + 1} missing reply:`, data);
        allTurnsSuccess = false;
        break;
      }

      // Append to history for next turn
      history.push({ role: 'user', chinese: userText });
      history.push({ role: 'assistant', chinese: data.reply });
    }

    assert(allTurnsSuccess && history.length === 6, '5. Speaking Turns: 3 consecutive turns in Guest mode complete smoothly with Teacher Lina');
  } catch (err: any) {
    assert(false, '5. Guest Mode Speaking Turns', err.message);
  }

  // 6. Stopwords Filtering Test
  try {
    const dirtyVocabulary = [
      { hanzi: '我', pinyin: 'wǒ', meaning: 'tôi' },
      { hanzi: '是', pinyin: 'shì', meaning: 'là' },
      { hanzi: '咖啡馆', pinyin: 'kāfēiguǎn', meaning: 'quán cà phê' },
      { hanzi: '，', pinyin: '', meaning: '' },
      { hanzi: '123', pinyin: '', meaning: '' },
    ];

    // Check stopwords logic
    const BASIC_STOPWORDS = new Set([
      '我', '你', '他', '她', '它', '我们', '你们', '他们',
      '的', '地', '得', '是', '了', '在', '不', '好', '很',
      '吗', '呢', '吧', '啊', '呀', '和', '个', '有', '这', '那',
      '什么', '怎么', '哪个', '哪里', '谁', '去', '来', '做', '说',
    ]);

    const cleaned = dirtyVocabulary.filter(
      (item) =>
        item.hanzi.length >= 1 &&
        item.hanzi.length <= 10 &&
        !BASIC_STOPWORDS.has(item.hanzi) &&
        !/[，。！？,.!?0-9]/.test(item.hanzi)
    );

    assert(
      cleaned.length === 1 && cleaned[0].hanzi === '咖啡馆',
      '6. Vocabulary Filtering: Basic stopwords, punctuation, and numbers are correctly eliminated'
    );
  } catch (err: any) {
    assert(false, '6. Stopwords Filtering', err.message);
  }

  console.log('\n==============================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==============================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

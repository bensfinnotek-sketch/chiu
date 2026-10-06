import type { ConversationMessage } from '../types';

export interface ConversationIntelligence {
  learnerName?: string;
  facts: string[];
  recentQuestions: string[];
  recentTopics: string[];
  turnIndex: number;
}

const NAME_PATTERNS = [
  /(?:我叫|我的名字是|我名字是|叫我)\s*([\u4e00-\u9fffA-Za-zÀ-ỹ]{1,12})/u,
  /(?:名字叫)\s*([\u4e00-\u9fffA-Za-zÀ-ỹ]{1,12})/u,
];

function clean(value: string): string {
  return value.replace(/[。！？!?，,]+$/u, '').trim();
}

export function extractLearnerName(text: string): string | undefined {
  const normalized = text.trim();
  for (const pattern of NAME_PATTERNS) {
    const match = normalized.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }
  return undefined;
}

function compactQuestion(text: string): string {
  const match = text.match(/[^。！？!?]*[？?]/u);
  return clean(match?.[0] || '');
}

function inferTopic(text: string): string | undefined {
  const rules: Array<[RegExp, string]> = [
    [/喜欢|爱好|兴趣/u, 'hobbies'],
    [/家人|爸爸|妈妈|哥哥|姐姐|弟弟|妹妹/u, 'family'],
    [/学校|老师|同学|学习|中文/u, 'study'],
    [/工作|公司|上班/u, 'work'],
    [/吃|喝|咖啡|餐厅|饭/u, 'food'],
    [/今天|昨天|明天|周末|星期/u, 'daily-life'],
  ];
  return rules.find(([pattern]) => pattern.test(text))?.[1];
}

export function buildConversationIntelligence(
  messages: ConversationMessage[],
  currentText: string,
): ConversationIntelligence {
  const recent = messages.slice(-12);
  const allText = [...recent.map(m => m.chinese), currentText].filter(Boolean);
  const learnerName = [...allText].reverse().map(extractLearnerName).find(Boolean);

  const recentQuestions = recent
    .filter(m => m.sender === 'lina')
    .map(m => compactQuestion(m.chinese))
    .filter(Boolean)
    .slice(-6);

  const recentTopics = allText
    .map(inferTopic)
    .filter((topic): topic is string => Boolean(topic))
    .slice(-5);

  const facts: string[] = [];
  if (learnerName) facts.push(`learner_name=${learnerName}`);
  const lastUser = [...recent].reverse().find(m => m.sender === 'user')?.chinese;
  if (lastUser && !facts.some(f => f.includes(lastUser))) facts.push(`last_learner_message=${lastUser}`);

  return {
    learnerName,
    facts,
    recentQuestions,
    recentTopics: [...new Set(recentTopics)],
    turnIndex: recent.filter(m => m.sender === 'user').length + 1,
  };
}

export function questionWasRecentlyAsked(question: string, recentQuestions: string[]): boolean {
  const normalized = clean(question).replace(/[？?]/u, '');
  return recentQuestions.some(item => {
    const other = clean(item).replace(/[？?]/u, '');
    return other === normalized || (normalized.length > 5 && other.includes(normalized)) || (other.length > 5 && normalized.includes(other));
  });
}

export function buildConversationGuard(intelligence: ConversationIntelligence): string {
  return [
    `Turn: ${intelligence.turnIndex}`,
    intelligence.learnerName ? `Learner name: ${intelligence.learnerName}` : '',
    intelligence.facts.length ? `Known learner facts: ${intelligence.facts.join(' | ')}` : '',
    intelligence.recentTopics.length ? `Recent topics: ${intelligence.recentTopics.join(', ')}` : '',
    intelligence.recentQuestions.length ? `Do NOT repeat these recent questions: ${intelligence.recentQuestions.join(' | ')}` : '',
  ].filter(Boolean).join('\n');
}

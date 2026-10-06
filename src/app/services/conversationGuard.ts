import type { ConversationMessage, TutorResponse } from "../types";

export function normalizeConversationText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "")
    .trim();
}

export function isRepeatedAssistantReply(
  reply: string,
  history: ConversationMessage[] = [],
): boolean {
  const normalized = normalizeConversationText(reply);
  if (!normalized) return false;

  const recentAssistant = history
    .filter((message) => message.role === "assistant")
    .slice(-4)
    .map((message) => normalizeConversationText(message.chinese))
    .filter(Boolean);

  return recentAssistant.some((previous) => {
    if (previous === normalized) return true;
    const shorter = previous.length < normalized.length ? previous : normalized;
    const longer = previous.length < normalized.length ? normalized : previous;
    return shorter.length >= 12 && longer.includes(shorter) && shorter.length / longer.length >= 0.82;
  });
}

export function guardTutorResponse(
  response: TutorResponse,
  history: ConversationMessage[] = [],
): TutorResponse {
  if (!isRepeatedAssistantReply(response.reply, history)) return response;

  return {
    ...response,
    responseType: response.responseType || "conversation",
    encouragement: response.encouragement || "换一个方式说说看！",
    grammarNote: response.grammarNote || "Lina đã phát hiện câu trả lời vừa rồi quá giống lượt trước và sẽ đổi cách diễn đạt.",
  };
}

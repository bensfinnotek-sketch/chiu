const CONTROL_CHARS=/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function safeText(value: unknown, maxLength = 4000): string {
  if (typeof value !== 'string') return '';
  return value.replace(CONTROL_CHARS, '').trim().slice(0, maxLength);
}

export function safeStringList(value: unknown, maxItems = 10, maxItemLength = 240): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').slice(0, maxItems).map(item => safeText(item, maxItemLength));
}

export function safeConversationMessages(value: unknown, maxItems = 12, maxTotalChars = 12000): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  const result: Array<Record<string, unknown>> = [];
  let total = 0;
  for (const item of value.slice(-maxItems)) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const text = safeText(record.text ?? record.chinese, 1200);
    if (!text) continue;
    if (total + text.length > maxTotalChars) break;
    result.push({ role: record.role === 'user' ? 'user' : 'assistant', text });
    total += text.length;
  }
  return result;
}

export function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.replace(/(api[_-]?key|password|token|authorization|cookie)\s*[:=]\s*[^\s,;]+/gi, '[redacted]').slice(0, 240);
}

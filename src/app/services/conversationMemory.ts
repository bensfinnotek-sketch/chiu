import type { TutorResponse } from "../types";
import { aiMemoryService } from "./aiMemory";

export interface CapturedLearnerMemory {
  kind: "name" | "preference" | "goal";
  content: string;
}

function clean(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
}

export function captureLearnerMemory(userText: string, response?: TutorResponse): CapturedLearnerMemory[] {
  const text = clean(userText);
  if (!text) return [];

  const captured: CapturedLearnerMemory[] = [];

  const nameMatch = text.match(/(?:我叫|我的名字是|我名字是|姓名是)\s*([\u4e00-\u9fffA-Za-zÀ-ỹ][\u4e00-\u9fffA-Za-zÀ-ỹ·\s-]{0,18})/u);
  if (nameMatch?.[1]) captured.push({ kind: "name", content: `Learner name: ${clean(nameMatch[1])}` });

  const preferenceMatch = text.match(/(?:我喜欢|我很喜欢|我不喜欢|我最喜欢)\s*([^。！？!?，,]{1,32})/u);
  if (preferenceMatch?.[1]) captured.push({ kind: "preference", content: `Learner preference: ${clean(preferenceMatch[1])}` });

  const goalMatch = text.match(/(?:我想|我希望|我的目标是)\s*([^。！？!?，,]{2,48})/u);
  if (goalMatch?.[1] && /(学|学习|练习|提高|通过HSK|HSK)/u.test(goalMatch[1])) captured.push({ kind: "goal", content: `Learner goal: ${clean(goalMatch[1])}` });

  for (const fact of captured) {
    if (fact.kind === "name") aiMemoryService.upsertLearnerFact("learner-fact", fact.content);
    if (fact.kind === "preference") aiMemoryService.rememberFact("preference", fact.content);
    if (fact.kind === "goal") aiMemoryService.upsertLearnerFact("goal", fact.content);
  }

  if (response?.corrections?.length) {
    for (const correction of response.corrections.slice(0, 2)) {
      if (correction?.original && correction?.corrected) aiMemoryService.recordMistake({
        type: "grammar", originalInput: clean(correction.original), correctedInput: clean(correction.corrected),
        explanation: clean(correction.explanation || "Natural phrasing correction"), severity: "medium",
      });
    }
  }

  return captured;
}

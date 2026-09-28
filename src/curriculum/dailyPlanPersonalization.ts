import { LearningGoal } from '../types/user';

export interface DailyPlanEvidence {
  dueReviewCount?: number;
  speakingReviewCount?: number;
  weakVocabularyCount?: number;
  weakGrammarCount?: number;
  quizMastery?: number;
  completionPercent?: number;
}

export interface DailyPlanPersonalization {
  label: string;
  description: string;
  stepOrder: string[];
  speakingTitle: string;
  speakingDescription: string;
}

export function getDailyPlanPersonalization(
  goal: LearningGoal,
  evidence: DailyPlanEvidence = {},
): DailyPlanPersonalization {
  const hasSpeakingReview = (evidence.speakingReviewCount ?? 0) > 0;
  const hasDueReview = (evidence.dueReviewCount ?? 0) > 0;
  const hasWeakVocabulary = (evidence.weakVocabularyCount ?? 0) > 0;
  const hasWeakGrammar = (evidence.weakGrammarCount ?? 0) > 0;
  const quizNeedsReview = (evidence.quizMastery ?? 0) > 0 && (evidence.quizMastery ?? 0) < 80;
  const levelComplete = (evidence.completionPercent ?? 0) >= 100;

  const evidencePriority = hasSpeakingReview
    ? ['speaking-review', 'daily-review', 'next-step', 'speaking']
    : hasDueReview
      ? ['daily-review', 'next-step', 'speaking-review', 'speaking']
      : quizNeedsReview || hasWeakVocabulary || hasWeakGrammar
        ? ['next-step', 'daily-review', 'speaking-review', 'speaking']
        : levelComplete
          ? ['next-step', 'speaking', 'daily-review', 'speaking-review']
          : ['next-step', 'daily-review', 'speaking-review', 'speaking'];

  const goalPlan = (() => {
    switch (goal) {
      case 'conversation':
        return { label: 'Ưu tiên · Hội thoại', description: 'Ưu tiên biến kiến thức đã ôn thành phản xạ nói trong tình huống thực tế.', speakingTitle: 'Luyện hội thoại 5 phút với Lina', speakingDescription: 'Dùng chủ đề đang học để nói tự nhiên và tiếp tục sửa các lỗi còn lặp lại.' };
      case 'travel':
        return { label: 'Ưu tiên · Du lịch', description: 'Ưu tiên các bước giúp bạn phản xạ nhanh trong những tình huống giao tiếp khi đi du lịch.', speakingTitle: 'Luyện tình huống du lịch với Lina', speakingDescription: 'Thực hành hỏi đường, gọi món, mua sắm và các tình huống thực tế bằng tiếng Trung.' };
      case 'work':
        return { label: 'Ưu tiên · Công việc', description: 'Ưu tiên luyện cách dùng tiếng Trung thực tế cho giao tiếp và tình huống công việc.', speakingTitle: 'Luyện tiếng Trung công việc', speakingDescription: 'Chuyển kiến thức vừa học thành câu dùng được trong trao đổi và tình huống công việc.' };
      case 'exam':
        return { label: 'Ưu tiên · Kỳ thi', description: 'Ưu tiên củng cố kiến thức, SRS và bài học trước khi luyện phản xạ hội thoại.', speakingTitle: 'Luyện phản xạ với Lina', speakingDescription: 'Ôn nói như một bước củng cố sau khi hoàn thành phần kiến thức và bài kiểm tra.' };
      case 'culture':
        return { label: 'Ưu tiên · Văn hoá', description: 'Kết hợp kiến thức ngôn ngữ với hội thoại và ngữ cảnh đời sống để học tự nhiên hơn.', speakingTitle: 'Khám phá tiếng Trung qua hội thoại', speakingDescription: 'Trò chuyện với Lina về chủ đề đời sống và văn hoá để mở rộng cách diễn đạt.' };
      default:
        return { label: 'Ưu tiên · Cân bằng', description: 'Cân bằng ôn tập, học mới và luyện nói theo dữ liệu tiến độ hiện có.', speakingTitle: 'Luyện 5 phút với Lina', speakingDescription: 'Chuyển kiến thức vừa ôn thành phản xạ hội thoại thực tế.' };
    }
  })();

  const evidenceNote = hasSpeakingReview
    ? 'Bạn còn ' + evidence.speakingReviewCount + ' câu Speaking cần luyện lại.'
    : hasDueReview
      ? 'Có ' + evidence.dueReviewCount + ' thẻ SRS đến hạn cần xử lý.'
      : quizNeedsReview
        ? 'Quiz hiện ở ' + evidence.quizMastery + '/100, nên kế hoạch ưu tiên củng cố trước.'
        : hasWeakVocabulary || hasWeakGrammar
          ? 'Kế hoạch đang ưu tiên phần kiến thức còn yếu theo mastery hiện tại.'
          : levelComplete
            ? 'Các bài bắt buộc đã hoàn tất; kế hoạch ưu tiên bước củng cố/chuyển cấp tiếp theo.'
            : 'Kế hoạch đang cân bằng học mới và ôn tập theo tiến độ hiện tại.';

  return { ...goalPlan, description: goalPlan.description + ' ' + evidenceNote, stepOrder: evidencePriority };
}
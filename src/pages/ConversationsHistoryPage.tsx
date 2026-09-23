import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Calendar,
  Clock,
  Trash2,
  ArrowRight,
  Plus,
  Loader2,
  AlertCircle,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ConversationSession } from '../types/conversation';
import { getConversationRepository } from '../services/repositories/repositoryFactory';
import { LinaAvatar } from '../components/common/LinaAvatar';

interface ConversationsHistoryPageProps {
  onNavigate: (route: string, param?: string) => void;
  onResumeConversation: (sessionId: string) => void;
}

export const ConversationsHistoryPage: React.FC<ConversationsHistoryPageProps> = ({
  onNavigate,
  onResumeConversation,
}) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const repo = getConversationRepository(user);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await repo.getUserSessions(user?.id || 'guest_user');
      setSessions(data);
    } catch (e) {
      console.warn('Error fetching conversation history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const handleDelete = async (sessionId: string) => {
    setIsDeleting(true);
    try {
      await repo.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setDeleteTargetId(null);
    } catch (e) {
      console.error('Delete session error:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Group sessions by today, yesterday, earlier
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const todaySessions: ConversationSession[] = [];
  const yesterdaySessions: ConversationSession[] = [];
  const earlierSessions: ConversationSession[] = [];

  sessions.forEach((s) => {
    const sDate = s.updatedAt.split('T')[0];
    if (sDate === todayStr) {
      todaySessions.push(s);
    } else if (sDate === yesterdayStr) {
      yesterdaySessions.push(s);
    } else {
      earlierSessions.push(s);
    }
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-white via-[#FFF8F4] to-[#FFF0EB] dark:from-[#241F1C] dark:via-[#2A2320] dark:to-[#322722] p-6 rounded-3xl border border-[#E86F51]/15 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E86F51]/10 text-[#E86F51] text-xs font-bold">
            <Sparkles size={14} />
            <span>Bộ nhớ hội thoại đám mây</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#211A17] dark:text-white tracking-tight">
            Lịch sử cuộc trò chuyện 💬
          </h1>
          <p className="text-xs sm:text-sm text-[#716761] dark:text-[#A89E97]">
            Lina ghi nhớ ngữ cảnh, từ vựng và chủ đề đã trao đổi để liên tục nâng cao kỹ năng cho bạn.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('practice-conversation')}
          className="px-4 py-2.5 rounded-2xl bg-[#E86F51] hover:bg-[#d85f41] text-white text-xs font-bold shadow-md shadow-[#E86F51]/25 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>Hội thoại mới với Lina</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241F1C] max-w-sm w-full p-6 rounded-3xl border border-[#E86F51]/20 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-[#211A17] dark:text-white">Xóa cuộc trò chuyện này?</h3>
              <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                Các tin nhắn và bộ nhớ của buổi học này sẽ bị xóa khỏi lịch sử.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-[#716761] dark:text-[#A89E97] hover:bg-black/5 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(deleteTargetId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#8C8078]">
          <Loader2 size={32} className="animate-spin text-[#E86F51]" />
          <p className="text-sm font-medium">Đang tải lịch sử hội thoại...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#201A17] border border-[#E86F51]/15 space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] flex items-center justify-center mx-auto shadow-xs">
            <MessageSquare size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-[#211A17] dark:text-white">
              Chưa có cuộc trò chuyện nào
            </h3>
            <p className="text-xs text-[#716761] dark:text-[#A89E97]">
              Hãy bắt đầu buổi luyện nói đầu tiên cùng cô giáo Lina. Bạn có thể chọn chủ đề quán cà phê, du lịch hoặc tự do nói chuyện.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('practice-conversation')}
            className="px-6 py-3 rounded-2xl bg-[#E86F51] hover:bg-[#d85f41] text-white text-xs font-bold shadow-md shadow-[#E86F51]/25 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Bắt đầu trò chuyện ngay</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Today */}
          {todaySessions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#8C8078] px-1">
                Hôm nay
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todaySessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onResume={() => {
                      sessionStorage.setItem('selected_speaking_topic', s.topic);
                      sessionStorage.setItem(
                        'selected_speaking_level',
                        typeof s.learnerLevel === 'number' ? `HSK ${s.learnerLevel}` : String(s.learnerLevel)
                      );
                      onResumeConversation(s.id);
                    }}
                    onDelete={() => setDeleteTargetId(s.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {yesterdaySessions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#8C8078] px-1">
                Hôm qua
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {yesterdaySessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onResume={() => onResumeConversation(s.id)}
                    onDelete={() => setDeleteTargetId(s.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Earlier */}
          {earlierSessions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#8C8078] px-1">
                Trước đó
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {earlierSessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onResume={() => onResumeConversation(s.id)}
                    onDelete={() => setDeleteTargetId(s.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SessionCard: React.FC<{
  session: ConversationSession;
  onResume: () => void;
  onDelete: () => void;
}> = ({ session, onResume, onDelete }) => {
  const formattedDate = new Date(session.updatedAt).toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-[#201A17] border border-[#E86F51]/10 hover:border-[#E86F51]/30 transition-all shadow-xs space-y-4 group">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E86F51]/10 text-[#E86F51]">
              HSK {session.learnerLevel}
            </span>
            <span className="text-[11px] text-[#8C8078] flex items-center gap-1">
              <Clock size={12} />
              <span>{formattedDate}</span>
            </span>
          </div>
          <h3 className="text-base font-bold text-[#211A17] dark:text-white line-clamp-1">
            {session.title}
          </h3>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-xl text-[#8C8078] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
          title="Xóa cuộc trò chuyện"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {session.summary ? (
        <p className="text-xs text-[#716761] dark:text-[#A89E97] line-clamp-2 bg-[#FAF6F2] dark:bg-[#28201B] p-2.5 rounded-2xl">
          {session.summary}
        </p>
      ) : (
        <p className="text-xs text-[#8C8078] italic">Chưa có tóm tắt nội dung</p>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-semibold text-[#8C8078]">
          {session.messageCount ? `${session.messageCount} tin nhắn` : 'Đang hoạt động'}
        </span>

        <button
          type="button"
          onClick={onResume}
          className="px-3.5 py-1.5 rounded-xl bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] hover:bg-[#E86F51] hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>Tiếp tục học</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

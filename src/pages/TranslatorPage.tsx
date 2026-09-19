import React, { useState } from 'react';
import {
  ArrowLeftRight,
  ArrowLeft,
  Volume2,
  Copy,
  Check,
  Sparkles,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { AudioButton } from '../components/common/AudioButton';

export const TranslatorPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [inputText, setInputText] = useState('Tôi muốn uống một cốc trà sữa ít đường.');
  const [sourceLang, setSourceLang] = useState<'vi' | 'zh'>('vi');
  const [formality, setFormality] = useState<'casual' | 'formal'>('casual');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [translationResult, setTranslationResult] = useState<{
    chinese: string;
    pinyin: string;
    vietnamese?: string;
    naturalAlternative?: string;
    grammarNote?: string;
  }>({
    chinese: '我想喝一杯微糖的奶茶。',
    pinyin: 'Wǒ xiǎng hē yì bēi wēi táng de nǎichá.',
    vietnamese: 'Tôi muốn uống một cốc trà sữa ít đường.',
    naturalAlternative: '来一杯奶茶，微糖去冰。 (Cho một cốc trà sữa, ít đường không đá - cách nói phổ biến nhất khi order)',
    grammarNote: 'Trong các quán trà sữa Trung Quốc: 微糖 (wēi táng) là 30% đường (ít đường), 半糖 (bàn táng) là 50% đường.',
  });

  const handleTranslate = async () => {
    if (!inputText.trim() || isTranslating) return;
    setIsTranslating(true);

    try {
      const res = await geminiService.translateText(
        inputText,
        sourceLang,
        sourceLang === 'vi' ? 'zh' : 'vi',
        formality
      );
      setTranslationResult({
        chinese: res.translatedText,
        pinyin: res.pinyin || '',
        naturalAlternative: res.naturalAlternative,
        grammarNote: res.culturalNote,
      });
    } catch {
      // handled
    } finally {
      setIsTranslating(false);
    }
  };

  const swapLanguages = () => {
    setSourceLang(sourceLang === 'vi' ? 'zh' : 'vi');
    setInputText(translationResult.chinese);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translationResult.chinese);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#716761] hover:text-[#E86F51] transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
        <span>Quay lại danh mục công cụ</span>
      </button>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-[#211A17] dark:text-white">
          Dịch AI Đa Ngữ Cảnh
        </h1>
        <p className="text-sm text-[#716761] dark:text-[#A89E97]">
          Không chỉ dịch sát nghĩa, HanziAI đưa ra cách diễn đạt chuẩn bản xứ và phân tích văn hóa
        </p>
      </div>

      {/* Controls: Swap & Formality */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15">
        <div className="flex items-center gap-3 font-bold text-sm">
          <span className={sourceLang === 'vi' ? 'text-[#E86F51]' : 'text-gray-400'}>
            Tiếng Việt
          </span>
          <button
            type="button"
            onClick={swapLanguages}
            className="p-2 rounded-xl bg-gray-100 dark:bg-[#342822] text-[#716761] hover:text-[#E86F51] transition-colors cursor-pointer"
            title="Đổi chiều ngôn ngữ"
          >
            <ArrowLeftRight size={16} />
          </button>
          <span className={sourceLang === 'zh' ? 'text-[#E86F51]' : 'text-gray-400'}>
            Tiếng Trung (Mandarin)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#716761]">Văn phong:</span>
          <button
            type="button"
            onClick={() => setFormality('casual')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              formality === 'casual'
                ? 'bg-[#E86F51] text-white'
                : 'bg-gray-100 dark:bg-white/5 text-[#716761]'
            }`}
          >
            Thân mật, đời sống
          </button>
          <button
            type="button"
            onClick={() => setFormality('formal')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              formality === 'formal'
                ? 'bg-[#E86F51] text-white'
                : 'bg-gray-100 dark:bg-white/5 text-[#716761]'
            }`}
          >
            Trang trọng, lịch thiệp
          </button>
        </div>
      </div>

      {/* Dual Box Translation Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input Box */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 shadow-xs flex flex-col justify-between min-h-[220px]">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập văn bản cần dịch..."
            className="w-full h-36 bg-transparent resize-none focus:outline-none text-base text-[#211A17] dark:text-white placeholder:text-gray-400"
          />
          <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-white/5">
            <button
              type="button"
              onClick={handleTranslate}
              disabled={isTranslating || !inputText.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#E86F51] text-white text-xs font-bold shadow-md hover:bg-[#d85f41] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isTranslating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang dịch...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Dịch ngay</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Box */}
        <div className="p-5 rounded-3xl bg-[#FFF9F4] dark:bg-[#2B231F] border border-[#E86F51]/20 shadow-xs flex flex-col justify-between min-h-[220px]">
          <div className="space-y-2">
            <p className="font-chinese text-2xl font-bold text-[#211A17] dark:text-white leading-relaxed">
              {translationResult.chinese}
            </p>
            {translationResult.pinyin && (
              <p className="text-sm font-semibold text-[#E86F51]">
                {translationResult.pinyin}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E86F51]/10">
            <AudioButton text={translationResult.chinese} size="sm" label="Phát âm" />
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-xl bg-white dark:bg-[#181412] text-[#716761] hover:text-[#E86F51] border border-[#E86F51]/15 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alternative Phrasing & Cultural Note */}
      {(translationResult.naturalAlternative || translationResult.grammarNote) && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 shadow-xs space-y-4 animate-fade-in">
          {translationResult.naturalAlternative && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-[#211A17] dark:text-white">
                  Cách nói bản xứ tự nhiên hơn:
                </span>
                <p className="font-chinese text-sm font-semibold text-[#E86F51]">
                  {translationResult.naturalAlternative}
                </p>
              </div>
            </div>
          )}

          {translationResult.grammarNote && (
            <div className="flex items-start gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Lightbulb size={16} />
              </div>
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-[#211A17] dark:text-white">
                  Ghi chú ngữ cảnh & văn hóa:
                </span>
                <p className="text-[#716761] dark:text-[#A89E97] leading-relaxed">
                  {translationResult.grammarNote}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Volume2,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { DICTIONARY_ITEMS } from '../data/dictionaryData';
import { AudioButton } from '../components/common/AudioButton';
import { storageService } from '../services/storageService';

export const DictionaryPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [savedWords, setSavedWords] = useState<string[]>(
    storageService.getSavedWords().map((w) => w.id)
  );

  const filteredWords = DICTIONARY_ITEMS.filter((item) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      item.chinese.includes(q) ||
      item.pinyin.toLowerCase().includes(q) ||
      item.meaningVi.toLowerCase().includes(q) ||
      (item.sinoVietnamese && item.sinoVietnamese.toLowerCase().includes(q))
    );
  });

  const toggleSave = (item: any) => {
    const allSaved = storageService.getSavedWords();
    const exists = allSaved.some((w) => w.id === item.id);
    let updated;
    if (exists) {
      updated = allSaved.filter((w) => w.id !== item.id);
      setSavedWords(savedWords.filter((id) => id !== item.id));
    } else {
      updated = [...allSaved, item];
      setSavedWords([...savedWords, item.id]);
    }
    storageService.saveWords(updated);
  };

  const quickSearch = ['茶', '水', '饭', '苹果', '喜欢', '学习', '朋友', '谢谢'];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
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
          Từ điển Hán ngữ HanziAI
        </h1>
        <p className="text-sm text-[#716761] dark:text-[#A89E97]">
          Tra cứu chữ Hán, Pinyin, bộ thủ, số nét, âm Hán Việt và câu ví dụ ngữ cảnh
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
          <Search size={20} />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Nhập chữ Hán (水), Pinyin (shui), hoặc tiếng Việt (nước)..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/20 text-sm sm:text-base text-[#211A17] dark:text-white placeholder:text-gray-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#E86F51]"
        />
      </div>

      {/* Quick Search Tags */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[#716761] font-semibold whitespace-nowrap">Từ phổ biến:</span>
        {quickSearch.map((kw) => (
          <button
            key={kw}
            type="button"
            onClick={() => setSearchTerm(kw)}
            className="px-3 py-1 rounded-xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 text-[#211A17] dark:text-white font-chinese font-semibold hover:border-[#E86F51] transition-colors cursor-pointer"
          >
            {kw}
          </button>
        ))}
      </div>

      {/* Word Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {filteredWords.map((word) => {
          const isSaved = savedWords.includes(word.id);
          return (
            <div
              key={word.id}
              className="p-6 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 shadow-xs hover:border-[#E86F51] transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-chinese text-5xl font-extrabold text-[#211A17] dark:text-white">
                    {word.chinese}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-[#E86F51]">{word.pinyin}</p>
                      <span className="px-2 py-0.5 rounded-full bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] text-[10px] font-bold">
                        {word.hskLevel}
                      </span>
                    </div>
                    {word.sinoVietnamese && (
                      <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                        Âm Hán Việt: <span className="font-bold text-[#211A17] dark:text-white">{word.sinoVietnamese}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <AudioButton text={word.chinese} size="sm" />
                  <button
                    type="button"
                    onClick={() => toggleSave(word)}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      isSaved
                        ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 border-amber-300'
                        : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-amber-500 border-transparent'
                    }`}
                    title={isSaved ? 'Đã lưu vào Flashcards' : 'Lưu vào Flashcards'}
                  >
                    {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  </button>
                </div>
              </div>

              {/* Character Details: Radical, Strokes */}
              <div className="flex items-center gap-4 py-1.5 px-3 rounded-xl bg-[#FFF9F4] dark:bg-[#181412] text-xs text-[#716761] dark:text-[#A89E97]">
                {word.radical && (
                  <span>
                    Bộ thủ: <strong className="font-chinese text-sm text-[#E86F51]">{word.radical}</strong>
                  </span>
                )}
                {word.strokeCount && (
                  <span>
                    Số nét: <strong>{word.strokeCount} nét</strong>
                  </span>
                )}
                <span>
                  Từ loại: <strong>{word.partOfSpeech}</strong>
                </span>
              </div>

              {/* Meaning */}
              <div className="text-sm font-semibold text-[#211A17] dark:text-white">
                <span className="text-xs font-normal text-[#716761] dark:text-[#A89E97] mr-1.5">Nghĩa:</span>
                {word.meaningVi}
              </div>

              {/* Example Sentences */}
              {word.exampleSentence && (
                <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-chinese font-bold text-sm text-[#211A17] dark:text-white">
                      {word.exampleSentence}
                    </span>
                    <AudioButton text={word.exampleSentence} size="sm" />
                  </div>
                  <p className="text-[#E86F51]">{word.examplePinyin}</p>
                  <p className="text-[#716761] dark:text-[#A89E97]">{word.exampleTranslationVi}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

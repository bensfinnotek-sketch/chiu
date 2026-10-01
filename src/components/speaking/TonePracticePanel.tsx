import React, { useState } from 'react';
import { Mic, RotateCcw } from 'lucide-react';
import { AudioButton } from '../common/AudioButton';
import { speechService, pronunciationAnalyzer } from '../../services/speech';

const TONES = [
  { hanzi: '妈', pinyin: 'mā', tone: 'Thanh 1' },
  { hanzi: '麻', pinyin: 'má', tone: 'Thanh 2' },
  { hanzi: '马', pinyin: 'mǎ', tone: 'Thanh 3' },
  { hanzi: '骂', pinyin: 'mà', tone: 'Thanh 4' },
  { hanzi: '吗', pinyin: 'ma', tone: 'Thanh nhẹ' },
];

export const TonePracticePanel: React.FC = () => {
  const [selected, setSelected] = useState(TONES[0]);
  const [recognized, setRecognized] = useState('');
  const [feedback, setFeedback] = useState('Chưa có dữ liệu phân tích.');
  const [recording, setRecording] = useState(false);

  const record = () => {
    if (!speechService.isRecognitionSupported()) {
      setFeedback('Trình duyệt chưa hỗ trợ nhận diện giọng nói. Bạn vẫn có thể nghe mẫu và luyện bằng mic của thiết bị.');
      return;
    }
    setRecognized('');
    setFeedback('Đang nghe...');
    setRecording(true);
    speechService.startListening({
      onResult: (text) => setRecognized(text),
      onError: (message) => { setRecording(false); setFeedback(message); },
      onEnd: async (text) => {
        setRecording(false);
        setRecognized(text || '');
        const result = await pronunciationAnalyzer.analyzePronunciation(selected.hanzi, text || '');
        setFeedback(result.feedback);
      },
    }, 'zh-CN');
  };

  const stop = () => { speechService.stopListening(); setRecording(false); };

  return (
    <div className="space-y-3 rounded-2xl border border-[#EADCCF] dark:border-[#382E27] p-4 bg-[#FFF9F4] dark:bg-[#28201B]">
      <div>
        <p className="text-sm font-bold">Luyện thanh điệu</p>
        <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Phần phân tích hiện chỉ kiểm tra nhận diện văn bản, chưa chấm âm học chính xác.</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {TONES.map((tone) => (
          <button key={tone.pinyin} type="button" onClick={() => { setSelected(tone); setRecognized(''); setFeedback('Chưa có dữ liệu phân tích.'); }} className={`rounded-xl border p-2 transition-colors ${selected.pinyin === tone.pinyin ? 'border-[#E86F51] bg-[#E86F51]/10' : 'border-[#EADCCF] dark:border-[#3A2F28]'}`}>
            <span className="block text-lg font-serif font-bold">{tone.hanzi}</span>
            <span className="block text-xs text-[#E86F51]">{tone.pinyin}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <AudioButton text={selected.hanzi} size="md" rate={1} label="Nghe mẫu" />
        <button type="button" onClick={recording ? stop : record} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 bg-[#E86F51] text-white text-xs font-semibold">
          {recording ? <RotateCcw size={15} /> : <Mic size={15} />}
          {recording ? 'Dừng' : 'Thử nói'}
        </button>
      </div>
      {recognized && <p className="text-sm font-serif"><span className="text-[#716761]">Nhận diện:</span> {recognized}</p>}
      <p className="text-xs text-[#716761] dark:text-[#A89E97]">{feedback}</p>
    </div>
  );
};

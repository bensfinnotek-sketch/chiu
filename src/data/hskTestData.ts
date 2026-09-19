export interface HskTestQuestion {
  id: string;
  category: 'listening' | 'reading' | 'vocabulary' | 'grammar';
  level: string;
  question: string;
  pinyin?: string;
  audioPrompt?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const HSK_TEST_QUESTIONS: HskTestQuestion[] = [
  {
    id: 't-1',
    category: 'reading',
    level: 'HSK 1',
    question: '你叫什么名字？',
    pinyin: 'Nǐ jiào shénme míngzi?',
    options: ['我很好', '我叫李明', '我是学生', '谢谢你'],
    correctIndex: 1,
    explanation: 'Câu hỏi "你叫什么名字？" hỏi về tên gọi, do đó câu trả lời chuẩn là "我叫李明" (Tôi tên là Lý Minh).',
  },
  {
    id: 't-2',
    category: 'vocabulary',
    level: 'HSK 1',
    question: 'Chọn từ thích hợp điền vào chỗ trống: "我想___水。"',
    pinyin: 'Wǒ xiǎng ___ shuǐ.',
    options: ['吃 (chī)', '喝 (hē)', '看 (kàn)', '去 (qù)'],
    correctIndex: 1,
    explanation: '"水" (nước) là đồ uống, nên động từ phù hợp nhất là "喝" (uống).',
  },
  {
    id: 't-3',
    category: 'grammar',
    level: 'HSK 1',
    question: 'Câu nào sau đây có trật tự từ đúng trong tiếng Trung?',
    options: [
      '我昨天去北京了。',
      '昨天我了去北京。',
      '我去北京昨天了。',
      '北京我昨天去了。',
    ],
    correctIndex: 0,
    explanation: 'Trong tiếng Trung, trạng từ chỉ thời gian (昨天) thường đứng trước hoặc ngay sau chủ ngữ, trợ từ "了" đặt cuối câu hoặc sau động từ biểu thị hành động đã hoàn tất: "我昨天去北京了。"',
  },
  {
    id: 't-4',
    category: 'listening',
    level: 'HSK 2',
    question: 'Nghe/đọc câu: "请问，去火车站怎么走？" - Người nói đang hỏi về điều gì?',
    pinyin: 'Qǐngwèn, qù huǒchēzhàn zěnme zǒu?',
    audioPrompt: '请问，去火车站怎么走？',
    options: ['Hỏi giá vé', 'Hỏi đường đi ga tàu', 'Hỏi giờ tàu chạy', 'Hỏi người quen'],
    correctIndex: 1,
    explanation: '"去...怎么走？" là mẫu câu phổ biến nhất dùng để hỏi đường đi đến một địa điểm nào đó (ở đây là ga tàu hỏa: 火车站).',
  },
  {
    id: 't-5',
    category: 'reading',
    level: 'HSK 2',
    question: '"今天天气很好，我们去公园散步吧。" - Mục đích của người nói là gì?',
    pinyin: 'Jīntiān tiānqì hěn hǎo, wǒmen qù gōngyuán sànbù ba.',
    options: ['Đi mua sắm', 'Rủ đi dạo công viên', 'Ở nhà nghỉ ngơi', 'Đi bệnh viện'],
    correctIndex: 1,
    explanation: '"去公园散步" có nghĩa là đi dạo công viên.',
  },
  {
    id: 't-6',
    category: 'grammar',
    level: 'HSK 3',
    question: 'Điền từ vào câu so sánh: "他比我___大两岁。"',
    pinyin: 'Tā bǐ wǒ ___ dà liǎng suì.',
    options: ['很', '非常', '还', '太'],
    correctIndex: 2,
    explanation: 'Trong câu so sánh chữ "比", trước tính từ không dùng các phó từ chỉ mức độ như 很, 非常, 太; có thể dùng "还" hoặc "更" để nhấn mạnh.',
  },
  {
    id: 't-7',
    category: 'vocabulary',
    level: 'HSK 2',
    question: 'Từ nào có nghĩa là "sân bay"?',
    options: ['火车站', '飞机场', '医院', '商店'],
    correctIndex: 1,
    explanation: '"飞机场" (fēijī chǎng) nghĩa là sân bay.',
  },
  {
    id: 't-8',
    category: 'reading',
    level: 'HSK 3',
    question: '"虽然汉语很难，但是很有趣。" - Câu này thể hiện thái độ gì đối với tiếng Trung?',
    pinyin: 'Suīrán hànyǔ hěn nán, dànshì hěn yǒuqù.',
    options: ['Tiếng Trung dễ và chán', 'Tuy khó nhưng rất thú vị', 'Quá khó nên bỏ học', 'Dễ nhưng không muốn học'],
    correctIndex: 1,
    explanation: 'Cặp liên từ "虽然...但是..." (Tuy... nhưng...). "虽然汉语很难，但是很有趣" = Tuy tiếng Trung khó nhưng rất thú vị.',
  },
];

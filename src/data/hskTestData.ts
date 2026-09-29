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

const BASE_HSK_TEST_QUESTIONS: HskTestQuestion[] = [
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


export const HSK_LEVELS = ['HSK 1','HSK 2','HSK 3','HSK 4','HSK 5','HSK 6'] as const;

const EXTRA_HSK_4_6: HskTestQuestion[] = [
  { id:'t-9', category:'vocabulary', level:'HSK 4', question:'“安排”最接近哪个意思？', pinyin:'“Ānpái” zuì jiējìn nǎge yìsi?', options:['计划并决定时间或事情','马上离开','认真学习','帮助别人'], correctIndex:0, explanation:'“安排”表示对时间、工作或事情作出计划和处理。' },
  { id:'t-10', category:'grammar', level:'HSK 4', question:'选择正确句子：', options:['如果明天下雨，我就不去。','如果明天下雨，我才不去。','如果明天下雨，我又不去。','如果明天下雨，我还不去。'], correctIndex:0, explanation:'“如果……就……”表示条件关系。' },
  { id:'t-11', category:'reading', level:'HSK 4', question:'“为了提高效率，他每天提前准备第二天的工作。” 他为什么提前准备？', options:['为了休息','为了提高效率','为了旅行','为了买东西'], correctIndex:1, explanation:'“为了提高效率”直接说明原因。' },
  { id:'t-12', category:'listening', level:'HSK 5', question:'听/读：“会议推迟到下午三点举行。” 会议什么时候举行？', audioPrompt:'会议推迟到下午三点举行。', options:['上午三点','中午十二点','下午三点','晚上三点'], correctIndex:2, explanation:'“推迟到下午三点”说明会议改到下午三点。' },
  { id:'t-13', category:'vocabulary', level:'HSK 5', question:'“逐渐”最接近哪个意思？', pinyin:'“Zhújiàn” zuì jiējìn nǎge yìsi?', options:['慢慢地发生变化','马上完成','完全没有','重新开始'], correctIndex:0, explanation:'“逐渐”表示变化一点一点发生。' },
  { id:'t-14', category:'grammar', level:'HSK 5', question:'选择最自然的表达：', options:['尽管很累，他仍然坚持工作。','尽管很累，他所以坚持工作。','尽管很累，他因为坚持工作。','尽管很累，他否则坚持工作。'], correctIndex:0, explanation:'“尽管……仍然……”表示让步关系。' },
  { id:'t-15', category:'reading', level:'HSK 5', question:'“这项政策不仅降低了成本，而且提高了服务质量。” 这句话强调什么？', options:['只有成本下降','只有服务提高','成本和服务都有改善','政策已经取消'], correctIndex:2, explanation:'“不仅……而且……”表示两个方面都成立。' },
  { id:'t-16', category:'listening', level:'HSK 6', question:'听/读：“经过充分讨论，双方最终达成了一致意见。” 双方最终怎么样？', audioPrompt:'经过充分讨论，双方最终达成了一致意见。', options:['停止讨论','达成一致','改变地点','取消会议'], correctIndex:1, explanation:'“达成一致意见”表示双方最终取得共同意见。' },
  { id:'t-17', category:'vocabulary', level:'HSK 6', question:'“显著”最接近哪个意思？', pinyin:'“Xiǎnzhù” zuì jiējìn nǎge yìsi?', options:['非常明显','完全错误','特别安静','很快结束'], correctIndex:0, explanation:'“显著”表示明显、效果突出。' },
  { id:'t-18', category:'grammar', level:'HSK 6', question:'选择最自然的表达：', options:['无论遇到什么困难，他都没有放弃。','无论遇到什么困难，他才没有放弃。','无论遇到什么困难，他因为没有放弃。','无论遇到什么困难，他否则没有放弃。'], correctIndex:0, explanation:'“无论……都……”表示不论条件如何，结果都不改变。' },
];

export const HSK_TEST_QUESTIONS: HskTestQuestion[] = [...BASE_HSK_TEST_QUESTIONS, ...EXTRA_HSK_4_6];

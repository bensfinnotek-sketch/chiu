import { DialogueLine, QuizQuestion } from '../types/curriculum';

const q = (id: string, lessonId: string, order: number, question: string, options: [string, string, string, string], correct: number, explanation: string): QuizQuestion => ({
  id, lessonId, type: order % 2 === 0 ? 'translation' : 'multiple_choice', order, question,
  options: options.map((text, i) => ({ id: `${id}-opt-${i + 1}`, text, isCorrect: i === correct })),
  correctAnswer: `${id}-opt-${correct + 1}`, explanation, vocabularyIds: [], points: 10, difficulty: 'medium',
});

const line = (id: string, speaker: string, chinese: string, pinyin: string, translationVi: string): DialogueLine => ({ id, speaker, chinese, pinyin, translationVi });

export const DEEP_EXPANDED_LESSON_QUIZZES: Record<string, QuizQuestion[]> = {
  'lesson-hsk1-u1-l3-family': [
    q('q-hsk1-l3-04','lesson-hsk1-u1-l3-family',4,'Dịch “Đây là anh trai của tôi.”',['这是我的哥哥。','这是我哥哥吗？','哥哥是我的。','我有哥哥。'],0,'这是 + 我的 + danh từ là mẫu giới thiệu người/vật và quan hệ sở hữu.'),
    q('q-hsk1-l3-05','lesson-hsk1-u1-l3-family',5,'Câu nào hỏi đúng “Bạn có em gái không?”',['你有妹妹吗？','你是妹妹吗？','妹妹有你吗？','你妹妹好？'],0,'有 + danh từ + 吗 dùng để hỏi có hay không.'),
  ],
  'lesson-hsk1-u1-l4-daily-time': [
    q('q-hsk1-l4-04','lesson-hsk1-u1-l4-daily-time',4,'Dịch “Chiều mai chúng ta gặp nhau nhé.”',['明天下午我们见面吧。','昨天我们下午见。','明天上午我们不见。','今天晚上你见。'],0,'明天下午 là chiều mai; 吧 tạo sắc thái đề nghị.'),
    q('q-hsk1-l4-05','lesson-hsk1-u1-l4-daily-time',5,'Muốn hỏi “Mấy giờ?” nên dùng câu nào?',['几点？','几个人？','多少钱？','哪一天？'],0,'几点 dùng để hỏi thời điểm theo giờ.'),
  ],
  'lesson-hsk2-u1-l3-shopping': [
    q('q-hsk2-l3-04','lesson-hsk2-u1-l3-shopping',4,'Dịch “Cái màu đỏ này rẻ hơn cái kia.”',['这个红色的比那个便宜。','那个红色的比较贵。','这个红色的是那个。','红色的没有价格。'],0,'这个...的 + 比 + 那个 + tính từ là mẫu so sánh.'),
    q('q-hsk2-l3-05','lesson-hsk2-u1-l3-shopping',5,'Nếu muốn thử một kích thước khác, câu nào phù hợp?',['我可以试试大一点的吗？','我应该买药。','我觉得星期三。','我正在休息。'],0,'试试 biểu thị thử; 大一点 là lớn hơn một chút.'),
  ],
  'lesson-hsk2-u1-l4-health': [
    q('q-hsk2-l4-04','lesson-hsk2-u1-l4-health',4,'Dịch “Nếu bạn mệt thì nên nghỉ nhiều hơn.”',['你累的话，应该多休息。','你累的话，应该买东西。','你很累，但是休息。','你休息的话，不累。'],0,'...的话 tạo điều kiện; 应该 + động từ đưa lời khuyên.'),
    q('q-hsk2-l4-05','lesson-hsk2-u1-l4-health',5,'Từ nào phù hợp với “uống thuốc”?',['吃药','吃饭','喝水','睡觉'],0,'吃药 là cách nói thông dụng cho uống/dùng thuốc.'),
  ],
  'lesson-hsk3-u1-l3-work-life': [
    q('q-hsk3-l3-04','lesson-hsk3-u1-l3-work-life',4,'Dịch “Ngoài công việc, tôi còn muốn dành thời gian cho gia đình.”',['除了工作以外，我还想花时间陪家人。','因为工作，所以我没有家人。','我只想工作，不想生活。','工作以外我昨天去了公司。'],0,'除了...以外... và 还 giúp mở rộng ý; 花时间陪家人 là dành thời gian cho gia đình.'),
    q('q-hsk3-l3-05','lesson-hsk3-u1-l3-work-life',5,'Câu nào đưa ra giải pháp cho áp lực công việc?',['我们可以安排好时间。','工作压力是哥哥。','我觉得明天星期三。','环境比较便宜。'],0,'安排好时间 là sắp xếp thời gian hợp lý.'),
  ],
  'lesson-hsk3-u1-l4-opinions': [
    q('q-hsk3-l4-04','lesson-hsk3-u1-l4-opinions',4,'Dịch “Tôi hiểu ý của bạn, nhưng tôi có quan điểm khác.”',['我理解你的想法，不过我有不同的看法。','我不知道你的工作。','我觉得你没有时间。','你的看法很便宜。'],0,'不过 dùng để chuyển sang ý đối lập nhẹ; 看法 là quan điểm.'),
    q('q-hsk3-l4-05','lesson-hsk3-l4-opinions',5,'Câu nào phù hợp để hỏi nguyên nhân?',['你知道原因吗？','你几点见面？','这个多少钱？','你有几个妹妹？'],0,'原因 là nguyên nhân.'),
  ],
  'lesson-hsk4-u1-l3-communication': [
    q('q-hsk4-l3-04','lesson-hsk4-u1-l3-communication',4,'Dịch “Bạn có thể nói rõ yêu cầu của khách hàng không?”',['你可以明确说明客户的要求吗？','你可以买客户吗？','客户可以休息吗？','你要求环境吗？'],0,'明确说明 là trình bày rõ; 客户的要求 là yêu cầu của khách hàng.'),
    q('q-hsk4-l3-05','lesson-hsk4-u1-l3-communication',5,'Khi phát hiện hiểu lầm, phản hồi phù hợp nhất là gì?',['我们先确认一下信息，避免误会。','你一定错了。','不用沟通。','我不想知道。'],0,'确认信息 giúp làm rõ thông tin và tránh hiểu lầm.'),
  ],
  'lesson-hsk4-u1-l4-environment': [
    q('q-hsk4-l4-04','lesson-hsk4-u1-l4-environment',4,'Dịch “Giảm sử dụng nhựa có thể bảo vệ môi trường.”',['减少塑料使用可以保护环境。','环境减少了塑料。','塑料保护了环境。','减少环境使用。'],0,'减少 + danh từ diễn đạt giảm việc sử dụng; 保护环境 là bảo vệ môi trường.'),
    q('q-hsk4-l4-05','lesson-hsk4-u1-l4-environment',5,'Khi so sánh hai giải pháp, nên chú ý điều gì?',['成本和长期影响','Chỉ tên của giải pháp','Màu sắc của văn bản','Số câu trong đoạn'],0,'So sánh chính sách/giải pháp nên xét chi phí và tác động dài hạn.'),
  ],
  'lesson-hsk5-u1-l3-media': [
    q('q-hsk5-l3-04','lesson-hsk5-u1-l3-media',4,'Dịch “Chúng ta nên phân biệt thông tin với nhận định.”',['我们应该区分信息和观点。','我们应该增加广告。','我们不要阅读文章。','我们只看标题。'],0,'区分 là phân biệt; 信息 và 观点 là thông tin và quan điểm.'),
    q('q-hsk5-l3-05','lesson-hsk5-u1-l3-media',5,'Một lập luận đáng tin thường cần gì?',['依据和证据','Chỉ cảm xúc','Một tiêu đề hấp dẫn','Không cần giải thích'],0,'依据 và 证据 là cơ sở và bằng chứng hỗ trợ lập luận.'),
  ],
  'lesson-hsk5-u1-l4-business': [
    q('q-hsk5-l4-04','lesson-hsk5-u1-l4-business',4,'Dịch “Chúng ta có thể tìm một phương án cùng có lợi.”',['我们可以找一个双方都能接受的方案。','我们不能讨论方案。','我们只需要价格。','双方都应该离开。'],0,'双方都能接受的方案 diễn đạt phương án hai bên cùng chấp nhận.'),
    q('q-hsk5-l4-05','lesson-hsk5-u1-l4-business',5,'Khi tóm tắt thỏa thuận, nên nêu điều gì?',['Điều kiện, trách nhiệm và thời hạn','Chỉ lời chào','Chỉ cảm xúc cá nhân','Một câu không liên quan'],0,'Tóm tắt thỏa thuận cần làm rõ điều kiện, trách nhiệm và thời hạn.'),
  ],
  'lesson-hsk6-u1-l3-academic': [
    q('q-hsk6-l3-04','lesson-hsk6-u1-l3-academic',4,'Dịch “Kết luận này cần thêm bằng chứng để được thuyết phục.”',['这个结论还需要更多证据才能令人信服。','这个结论不需要任何依据。','证据不能说明问题。','我们只需要标题。'],0,'令人信服 nghĩa là khiến người khác tin phục; 证据 là bằng chứng.'),
    q('q-hsk6-l3-05','lesson-hsk6-u1-l3-academic',5,'Trong văn học thuật, từ nối có vai trò gì?',['Liên kết và làm rõ quan hệ giữa các luận điểm','Chỉ làm câu dài hơn','Thay thế mọi danh từ','Không có vai trò'],0,'Từ nối giúp người đọc theo dõi cấu trúc lập luận.'),
  ],
  'lesson-hsk6-u1-l4-nuance': [
    q('q-hsk6-l4-04','lesson-hsk6-u1-l4-nuance',4,'Khi chọn từ gần nghĩa, yếu tố nào cần cân nhắc?',['Ngữ cảnh và sắc thái','Chỉ số lượng chữ','Màu giao diện','Tên bài học'],0,'Từ gần nghĩa có thể khác về sắc thái, văn phong và ngữ cảnh.'),
    q('q-hsk6-l4-05','lesson-hsk6-u1-l4-nuance',5,'Cách học tốt để sửa câu chưa tự nhiên là gì?',['So sánh ngữ cảnh và cách người bản ngữ thường diễn đạt','Chỉ dịch từng chữ','Bỏ qua sắc thái','Chỉ học pinyin'],0,'So sánh cách dùng trong ngữ cảnh giúp phát hiện lỗi diễn đạt tự nhiên.'),
  ],
};

export const DEEP_EXPANDED_LESSON_DIALOGUES: Record<string, DialogueLine[]> = {
  'lesson-hsk1-u1-l3-family': [line('d-hsk1-l3-4','Lina 老师','这是你的哥哥吗？','Zhè shì nǐ de gēge ma?','Đây là anh trai của bạn phải không?'),line('d-hsk1-l3-5','Học viên','对，这是我的哥哥。','Duì, zhè shì wǒ de gēge.','Đúng, đây là anh trai của tôi.'),line('d-hsk1-l3-6','Lina 老师','你有妹妹吗？','Nǐ yǒu mèimei ma?','Bạn có em gái không?'),line('d-hsk1-l3-7','Học viên','有，她叫小雨。','Yǒu, tā jiào Xiǎoyǔ.','Có, em ấy tên Tiểu Vũ.')],
  'lesson-hsk1-u1-l4-daily-time': [line('d-hsk1-l4-4','Lina 老师','我们明天下午见面，好吗？','Wǒmen míngtiān xiàwǔ jiànmiàn, hǎo ma?','Chiều mai chúng ta gặp nhau nhé?'),line('d-hsk1-l4-5','Học viên','好，几点？','Hǎo, jǐ diǎn?','Được, mấy giờ?'),line('d-hsk1-l4-6','Lina 老师','三点怎么样？','Sān diǎn zěnmeyàng?','Ba giờ được không?'),line('d-hsk1-l4-7','Học viên','可以，明天见！','Kěyǐ, míngtiān jiàn!','Được, hẹn gặp ngày mai!')],
  'lesson-hsk2-u1-l3-shopping': [line('d-hsk2-l3-4','Lina 老师','这个多少钱？','Zhège duōshao qián?','Cái này bao nhiêu tiền?'),line('d-hsk2-l3-5','Học viên','这个比那个便宜。','Zhège bǐ nàge piányi.','Cái này rẻ hơn cái kia.'),line('d-hsk2-l3-6','Lina 老师','有大一点的尺寸吗？','Yǒu dà yìdiǎn de chǐcùn ma?','Có cỡ lớn hơn một chút không?'),line('d-hsk2-l3-7','Học viên','有，我想试试。','Yǒu, wǒ xiǎng shìshi.','Có, tôi muốn thử.')],
  'lesson-hsk2-u1-l4-health': [line('d-hsk2-l4-4','Lina 老师','你今天感觉怎么样？','Nǐ jīntiān gǎnjué zěnmeyàng?','Hôm nay bạn cảm thấy thế nào?'),line('d-hsk2-l4-5','Học viên','我有一点头疼。','Wǒ yǒu yìdiǎn tóuténg.','Tôi hơi đau đầu.'),line('d-hsk2-l4-6','Lina 老师','你应该多休息，记得吃药。','Nǐ yīnggāi duō xiūxi, jìde chī yào.','Bạn nên nghỉ nhiều hơn, nhớ uống thuốc.'),line('d-hsk2-l4-7','Học viên','好的，谢谢你的建议。','Hǎo de, xièxie nǐ de jiànyì.','Được, cảm ơn lời khuyên của bạn.')],
  'lesson-hsk3-u1-l3-work-life': [line('d-hsk3-l3-4','Lina 老师','最近工作压力大吗？','Zuìjìn gōngzuò yālì dà ma?','Gần đây áp lực công việc có lớn không?'),line('d-hsk3-l3-5','Học viên','有一点，所以我在安排时间。','Yǒu yìdiǎn, suǒyǐ wǒ zài ānpái shíjiān.','Có một chút, nên tôi đang sắp xếp thời gian.'),line('d-hsk3-l3-6','Lina 老师','除了工作以外，你还做什么？','Chúle gōngzuò yǐwài, nǐ hái zuò shénme?','Ngoài công việc, bạn còn làm gì?'),line('d-hsk3-l3-7','Học viên','我会运动，也会陪家人。','Wǒ huì yùndòng, yě huì péi jiārén.','Tôi tập thể thao và cũng dành thời gian cho gia đình.')],
  'lesson-hsk3-u1-l4-opinions': [line('d-hsk3-l4-4','Lina 老师','你觉得这个办法怎么样？','Nǐ juéde zhège bànfǎ zěnmeyàng?','Bạn thấy cách này thế nào?'),line('d-hsk3-l4-5','Học viên','我觉得不错，因为比较方便。','Wǒ juéde búcuò, yīnwèi bǐjiào fāngbiàn.','Tôi thấy khá tốt vì khá thuận tiện.'),line('d-hsk3-l4-6','Lina 老师','我理解，不过我有不同的看法。','Wǒ lǐjiě, búguò wǒ yǒu bùtóng de kànfǎ.','Tôi hiểu, nhưng tôi có quan điểm khác.'),line('d-hsk3-l4-7','Học viên','你可以说说你的原因吗？','Nǐ kěyǐ shuōshuo nǐ de yuányīn ma?','Bạn có thể nói lý do của mình không?')],
  'lesson-hsk4-u1-l3-communication': [line('d-hsk4-l3-4','Lina 老师','客户的要求明确吗？','Kèhù de yāoqiú míngquè ma?','Yêu cầu của khách hàng có rõ không?'),line('d-hsk4-l3-5','Học viên','有些地方还需要沟通。','Yǒuxiē dìfang hái xūyào gōutōng.','Một số chỗ vẫn cần trao đổi.'),line('d-hsk4-l3-6','Lina 老师','那我们先确认信息，避免误会。','Nà wǒmen xiān quèrèn xìnxī, bìmiǎn wùhuì.','Vậy chúng ta xác nhận thông tin trước để tránh hiểu lầm.'),line('d-hsk4-l3-7','Học viên','好的，我马上整理。','Hǎo de, wǒ mǎshàng zhěnglǐ.','Được, tôi sẽ sắp xếp ngay.')],
  'lesson-hsk4-u1-l4-environment': [line('d-hsk4-l4-4','Lina 老师','你觉得怎样减少城市污染？','Nǐ juéde zěnyàng jiǎnshǎo chéngshì wūrǎn?','Bạn nghĩ làm sao để giảm ô nhiễm đô thị?'),line('d-hsk4-l4-5','Học viên','可以减少塑料使用，也可以多坐公共交通。','Kěyǐ jiǎnshǎo sùliào shǐyòng, yě kěyǐ duō zuò gōnggòng jiāotōng.','Có thể giảm sử dụng nhựa và đi phương tiện công cộng nhiều hơn.'),line('d-hsk4-l4-6','Lina 老师','这些办法会带来什么影响？','Zhèxiē bànfǎ huì dàilái shénme yǐngxiǎng?','Những cách này sẽ mang lại ảnh hưởng gì?'),line('d-hsk4-l4-7','Học viên','长期来看，可以改善生活环境。','Chángqī lái kàn, kěyǐ gǎishàn shēnghuó huánjìng.','Về lâu dài, có thể cải thiện môi trường sống.')],
  'lesson-hsk5-u1-l3-media': [line('d-hsk5-l3-4','Lina 老师','这篇报道的主要观点是什么？','Zhè piān bàodào de zhǔyào guāndiǎn shì shénme?','Quan điểm chính của bài đưa tin này là gì?'),line('d-hsk5-l3-5','Học viên','它认为数据支持这个变化。','Tā rènwéi shùjù zhīchí zhège biànhuà.','Bài viết cho rằng dữ liệu ủng hộ thay đổi này.'),line('d-hsk5-l3-6','Lina 老师','你觉得证据充分吗？','Nǐ juéde zhèngjù chōngfèn ma?','Bạn thấy bằng chứng đã đầy đủ chưa?'),line('d-hsk5-l3-7','Học viên','我认为还需要更多依据。','Wǒ rènwéi hái xūyào gèng duō yījù.','Tôi cho rằng vẫn cần thêm cơ sở.')],
  'lesson-hsk5-u1-l4-business': [line('d-hsk5-l4-4','Lina 老师','我们怎样才能找到双方都接受的方案？','Wǒmen zěnyàng cáinéng zhǎodào shuāngfāng dōu jiēshòu de fāngàn?','Làm sao để tìm phương án hai bên cùng chấp nhận?'),line('d-hsk5-l4-5','Học viên','可以先讨论价格和交付时间。','Kěyǐ xiān tǎolùn jiàgé hé jiāofù shíjiān.','Có thể bàn trước về giá và thời gian giao hàng.'),line('d-hsk5-l4-6','Lina 老师','然后总结双方的责任。','Ránhòu zǒngjié shuāngfāng de zérèn.','Sau đó tổng kết trách nhiệm của hai bên.'),line('d-hsk5-l4-7','Học viên','这样比较容易达成共识。','Zhèyàng bǐjiào róngyì dáchéng gòngshí.','Như vậy sẽ dễ đạt được đồng thuận hơn.')],
  'lesson-hsk6-u1-l3-academic': [line('d-hsk6-l3-4','Lina 老师','这段论证的核心观点是什么？','Zhè duàn lùnzhèng de héxīn guāndiǎn shì shénme?','Luận điểm cốt lõi của đoạn lập luận này là gì?'),line('d-hsk6-l3-5','Học viên','作者认为这个结论需要更多依据。','Zuòzhě rènwéi zhège jiélùn xūyào gèng duō yījù.','Tác giả cho rằng kết luận này cần thêm cơ sở.'),line('d-hsk6-l3-6','Lina 老师','你能用自己的话概括吗？','Nǐ néng yòng zìjǐ de huà gàikuò ma?','Bạn có thể khái quát bằng lời của mình không?'),line('d-hsk6-l3-7','Học viên','可以，我会先说明观点，再说明证据。','Kěyǐ, wǒ huì xiān shuōmíng guāndiǎn, zài shuōmíng zhèngjù.','Được, tôi sẽ nêu luận điểm trước rồi trình bày bằng chứng.')],
  'lesson-hsk6-u1-l4-nuance': [line('d-hsk6-l4-4','Lina 老师','这两个词有什么细微差别？','Zhè liǎng ge cí yǒu shénme xìwēi chābié?','Hai từ này khác nhau tinh tế ở điểm nào?'),line('d-hsk6-l4-5','Học viên','意思接近，但是语境不完全一样。','Yìsi jiējìn, dànshì yǔjìng bù wánquán yíyàng.','Nghĩa gần nhau nhưng ngữ cảnh không hoàn toàn giống nhau.'),line('d-hsk6-l4-6','Lina 老师','哪一个更适合正式文章？','Nǎ yí ge gèng shìhé zhèngshì wénzhāng?','Từ nào phù hợp hơn với văn bản trang trọng?'),line('d-hsk6-l4-7','Học viên','要看具体语境和表达目的。','Yào kàn jùtǐ yǔjìng hé biǎodá mùdì.','Cần xem ngữ cảnh cụ thể và mục đích diễn đạt.')],
};

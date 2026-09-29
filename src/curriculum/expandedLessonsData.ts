import { Lesson, QuizQuestion, DialogueLine } from '../types/curriculum';

const meta = (level: number, order: number, id: string, title: string, titleZh: string, description: string, objectives: string[], difficulty: Lesson['difficulty'], prerequisiteLessonId: string | null): Lesson => ({
  id,
  unitId: `unit-hsk${level}-u${level === 1 ? (order <= 2 ? 1 : order <= 4 ? 2 : 3) : level === 2 ? (order <= 2 ? 1 : order === 3 ? 2 : 3) : level === 3 ? (order <= 2 ? 1 : 2) : 1}`,
  levelId: `hsk-level-${level}`,
  levelNumber: level,
  order,
  slug: id.replace('lesson-', ''),
  title,
  titleZh,
  description,
  objectives,
  estimatedMinutes: level <= 2 ? 20 : level <= 4 ? 26 : 34,
  difficulty,
  status: 'published',
  isPublished: true,
  isRequired: false,
  prerequisiteLessonId,
  completionRule: 'all_required_and_quiz',
  passingScore: 80,
  createdAt: '2026-09-28T00:00:00Z',
  updatedAt: '2026-09-28T00:00:00Z',
});

export const EXPANDED_CURRICULUM_LESSONS: Lesson[] = [
  meta(1, 3, 'lesson-hsk1-u1-l3-family', 'Gia đình & sở hữu với 的', '我的家人', 'Giới thiệu thành viên gia đình và nói về quan hệ sở hữu bằng 的.', ['Giới thiệu bố mẹ và anh chị em', 'Dùng 的 để diễn đạt sở hữu', 'Hỏi và trả lời ai là người thân của mình'], 'easy', 'lesson-hsk1-u1-l2'),
  meta(1, 4, 'lesson-hsk1-u1-l4-daily-time', 'Ngày giờ & lịch hẹn', '今天星期几', 'Hỏi ngày, thứ và sắp xếp một cuộc hẹn đơn giản.', ['Hỏi hôm nay là thứ mấy', 'Nói giờ và ngày', 'Đề nghị thời gian gặp nhau'], 'easy', 'lesson-hsk1-u1-l3'),
  meta(2, 3, 'lesson-hsk2-u1-l3-shopping', 'Mua sắm & so sánh giá', '这个比那个便宜', 'Mô tả giá cả, kích thước và lựa chọn sản phẩm phù hợp.', ['Dùng 比 để so sánh', 'Hỏi giá và kích thước', 'Diễn đạt lựa chọn đơn giản'], 'medium', 'lesson-hsk2-u1-l2'),
  meta(2, 4, 'lesson-hsk2-u1-l4-health', 'Sức khỏe & lời khuyên', '你应该多休息', 'Nói triệu chứng đơn giản và đưa ra lời khuyên với 应该.', ['Mô tả cảm giác không khỏe', 'Dùng 应该 để khuyên', 'Nói lịch nghỉ ngơi và uống thuốc'], 'medium', 'lesson-hsk2-u1-l3'),
  meta(3, 3, 'lesson-hsk3-u1-l3-work-life', 'Công việc & cân bằng cuộc sống', '工作和生活', 'Trao đổi về lịch làm việc, áp lực và cách cân bằng thời gian.', ['Nói về áp lực công việc', 'Dùng 除了…以外… mở rộng ý', 'Đưa ra giải pháp thực tế'], 'medium', 'lesson-hsk3-u1-l2'),
  meta(3, 4, 'lesson-hsk3-u1-l4-opinions', 'Nêu ý kiến & giải thích lý do', '我觉得这个办法不错', 'Luyện phản xạ nêu quan điểm và giải thích bằng 因为…所以….', ['Nêu quan điểm cá nhân', 'Giải thích nguyên nhân và kết quả', 'Phản hồi lịch sự với ý kiến khác'], 'hard', 'lesson-hsk3-u1-l3'),
  meta(4, 3, 'lesson-hsk4-u1-l3-communication', 'Giao tiếp nơi công sở', '有效沟通', 'Xử lý yêu cầu, phản hồi và hiểu lầm trong môi trường làm việc.', ['Dùng 不但…而且…', 'Diễn đạt yêu cầu lịch sự', 'Làm rõ thông tin khi giao tiếp'], 'hard', 'lesson-hsk4-u1-l2'),
  meta(4, 4, 'lesson-hsk4-u1-l4-environment', 'Môi trường & thay đổi xã hội', '环境与社会变化', 'Đọc và thảo luận về thói quen xanh, giao thông và đô thị.', ['Nêu nguyên nhân và tác động', 'So sánh các giải pháp', 'Trình bày ý kiến có dẫn chứng'], 'hard', 'lesson-hsk4-u1-l3'),
  meta(5, 3, 'lesson-hsk5-u1-l3-media', 'Truyền thông & tư duy phản biện', '媒体与批判性思维', 'Phân tích một bài viết và phân biệt thông tin với nhận định.', ['Xác định luận điểm', 'Tóm tắt bằng ngôn ngữ của mình', 'Nhận diện cách lập luận và dẫn chứng'], 'hard', 'lesson-hsk5-u1-l2'),
  meta(5, 4, 'lesson-hsk5-u1-l4-business', 'Kinh doanh & đàm phán', '商务沟通与谈判', 'Luyện ngôn ngữ thương mại để trao đổi điều kiện và tìm điểm chung.', ['Diễn đạt điều kiện hợp tác', 'Đề xuất và phản hồi', 'Tóm tắt thỏa thuận bằng tiếng Trung'], 'hard', 'lesson-hsk5-u1-l3'),
  meta(6, 3, 'lesson-hsk6-u1-l3-academic', 'Đọc học thuật & lập luận', '学术阅读与论证', 'Phân tích đoạn văn học thuật và xây dựng lập luận chặt chẽ.', ['Xác định cấu trúc lập luận', 'Paraphrase ý phức tạp', 'Liên kết luận điểm bằng từ nối chính xác'], 'hard', 'lesson-hsk6-u1-l2'),
  meta(6, 4, 'lesson-hsk6-u1-l4-nuance', 'Sắc thái ngôn ngữ & diễn đạt tự nhiên', '语言的细微差别', 'Phân biệt sắc thái từ gần nghĩa và chọn cách diễn đạt phù hợp ngữ cảnh.', ['Phân biệt từ gần nghĩa', 'Điều chỉnh sắc thái văn nói/văn viết', 'Tự sửa câu để tự nhiên hơn'], 'hard', 'lesson-hsk6-u1-l3'),
];

const q = (id: string, lessonId: string, order: number, question: string, options: [string, string, string, string], correct: number, explanation: string): QuizQuestion => ({
  id, lessonId, type: 'multiple_choice', order, question,
  options: options.map((text, i) => ({ id: `opt-${i + 1}`, text, isCorrect: i === correct })),
  correctAnswer: `opt-${correct + 1}`,
  explanation, vocabularyIds: [], points: 10, difficulty: 'medium',
});

export const EXPANDED_LESSON_QUIZZES: Record<string, QuizQuestion[]> = {
  'lesson-hsk1-u1-l3-family': [
    q('q-hsk1-l3-01','lesson-hsk1-u1-l3-family',1,'“这是我的妈妈” nghĩa là gì?',['Đây là mẹ tôi','Đây là bạn tôi','Tôi là mẹ','Mẹ ở đâu'],0,'我的 biểu thị sở hữu; 妈妈 là mẹ.'),
    q('q-hsk1-l3-02','lesson-hsk1-u1-l3-family',2,'Từ nào nghĩa là “anh trai”?',['姐姐','哥哥','弟弟','妹妹'],1,'哥哥 là anh trai.'),
    q('q-hsk1-l3-03','lesson-hsk1-u1-l3-family',3,'Cấu trúc nào diễn đạt “tên của tôi”?',['我名字','我的名字','我名字的','名字我'],1,'我的 + danh từ diễn đạt sở hữu.'),
  ],
  'lesson-hsk1-u1-l4-daily-time': [
    q('q-hsk1-l4-01','lesson-hsk1-u1-l4-daily-time',1,'“今天星期几？” hỏi điều gì?',['Hôm nay mấy giờ?','Hôm nay thứ mấy?','Hôm nay bao nhiêu tiền?','Hôm nay ở đâu?'],1,'星期几 dùng để hỏi thứ trong tuần.'),
    q('q-hsk1-l4-02','lesson-hsk1-u1-l4-daily-time',2,'“我们三点见” nghĩa là gì?',['Chúng ta gặp lúc 3 giờ','Chúng ta đi lúc 3 ngày','Tôi gặp bạn 3 lần','Ba người gặp nhau'],0,'三点 là 3 giờ.'),
    q('q-hsk1-l4-03','lesson-hsk1-u1-l4-daily-time',3,'Từ nào nghĩa là “ngày mai”?',['昨天','今天','明天','星期'],2,'明天 là ngày mai.'),
  ],
  'lesson-hsk2-u1-l3-shopping': [
    q('q-hsk2-l3-01','lesson-hsk2-u1-l3-shopping',1,'“这个比那个便宜” nghĩa là gì?',['Cái này đắt hơn cái kia','Cái này rẻ hơn cái kia','Cái kia mới hơn','Hai cái bằng giá'],1,'比 dùng để so sánh; 便宜 là rẻ.'),
    q('q-hsk2-l3-02','lesson-hsk2-u1-l3-shopping',2,'“多少钱” dùng để hỏi gì?',['Kích thước','Màu sắc','Giá tiền','Địa chỉ'],2,'多少钱 nghĩa là bao nhiêu tiền.'),
    q('q-hsk2-l3-03','lesson-hsk2-u1-l3-shopping',3,'“太贵了” có sắc thái gì?',['Quá rẻ','Quá đắt','Rất đẹp','Rất nhỏ'],1,'太 + tính từ + 了 diễn đạt mức độ quá... rồi.'),
  ],
  'lesson-hsk2-u1-l4-health': [
    q('q-hsk2-l4-01','lesson-hsk2-u1-l4-health',1,'“你应该多休息” là lời gì?',['Mời ăn','Đưa lời khuyên','Hỏi đường','Hỏi giá'],1,'应该 thường dùng để đưa lời khuyên hoặc điều nên làm.'),
    q('q-hsk2-l4-02','lesson-hsk2-u1-l4-health',2,'“头疼” nghĩa là gì?',['Đau đầu','Đau bụng','Sốt','Ho'],0,'头疼 là đau đầu.'),
    q('q-hsk2-l4-03','lesson-hsk2-u1-l4-health',3,'Câu nào phù hợp khi khuyên nghỉ ngơi?',['你应该休息。','你叫休息。','你是休息。','你在休息吗？'],0,'你应该休息 là bạn nên nghỉ ngơi.'),
  ],
  'lesson-hsk3-u1-l3-work-life': [
    q('q-hsk3-l3-01','lesson-hsk3-u1-l3-work-life',1,'“工作压力” nghĩa là gì?',['Kế hoạch làm việc','Áp lực công việc','Kinh nghiệm làm việc','Môi trường học'],1,'压力 là áp lực.'),
    q('q-hsk3-l3-02','lesson-hsk3-u1-l3-work-life',2,'“除了工作以外” mở rộng ý theo cách nào?',['Ngoài công việc ra','Trước khi làm việc','Sau khi nghỉ','Chỉ nói về công việc'],0,'除了…以外… nghĩa là ngoài... ra.'),
    q('q-hsk3-l3-03','lesson-hsk3-u1-l3-work-life',3,'Muốn nói “cân bằng công việc và cuộc sống” nên dùng từ nào?',['平衡','变化','经验','机会'],0,'平衡 là cân bằng.'),
  ],
  'lesson-hsk3-u1-l4-opinions': [
    q('q-hsk3-l4-01','lesson-hsk3-u1-l4-opinions',1,'“我觉得” thường dùng để làm gì?',['Nêu ý kiến','Nói giá','Chỉ địa điểm','Chào hỏi'],0,'我觉得 nghĩa là tôi cảm thấy/tôi cho rằng.'),
    q('q-hsk3-l4-02','lesson-hsk3-u1-l4-opinions',2,'Trong “因为…所以…”, 所以 giới thiệu gì?',['Nguyên nhân','Kết quả','Địa điểm','Thời gian'],1,'因为 giới thiệu nguyên nhân; 所以 giới thiệu kết quả.'),
    q('q-hsk3-l4-03','lesson-hsk3-u1-l4-opinions',3,'Cách phản hồi lịch sự khi không đồng ý là gì?',['我完全不同意，你错了。','我理解你的想法，不过我有不同的看法。','你别说了。','不知道。'],1,'Câu thứ hai thừa nhận quan điểm trước rồi nêu khác biệt một cách lịch sự.'),
  ],
  'lesson-hsk4-u1-l3-communication': [
    q('q-hsk4-l3-01','lesson-hsk4-u1-l3-communication',1,'“不但…而且…” biểu thị quan hệ gì?',['Điều kiện','Không những… mà còn…','Nguyên nhân','Thời gian'],1,'不但…而且… nối hai ý cùng tăng tiến.'),
    q('q-hsk4-l3-02','lesson-hsk4-u1-l3-communication',2,'Khi chưa hiểu yêu cầu, cách hỏi phù hợp là gì?',['你说什么？','不好意思，可以再说明一下吗？','我不管。','算了。'],1,'Cách hỏi thứ hai lịch sự và rõ ràng.'),
    q('q-hsk4-l3-03','lesson-hsk4-u1-l3-communication',3,'“确认信息” nghĩa là gì?',['Xóa thông tin','Xác nhận thông tin','Tạo thông tin','Dịch thông tin'],1,'确认 là xác nhận.'),
  ],
  'lesson-hsk4-u1-l4-environment': [
    q('q-hsk4-l4-01','lesson-hsk4-u1-l4-environment',1,'“环境保护” nghĩa là gì?',['Bảo vệ môi trường','Phát triển kinh tế','Giao thông công cộng','Quy hoạch đô thị'],0,'环境 là môi trường; 保护 là bảo vệ.'),
    q('q-hsk4-l4-02','lesson-hsk4-u1-l4-environment',2,'Khi trình bày một giải pháp, nên có gì?',['Lý do và tác động','Chỉ một từ','Không cần giải thích','Chỉ cảm xúc'],0,'Lý do và tác động giúp lập luận rõ ràng.'),
    q('q-hsk4-l4-03','lesson-hsk4-u1-l4-environment',3,'“公共交通” là gì?',['Giao thông công cộng','Xe cá nhân','Đường cao tốc','Bãi đỗ xe'],0,'公共交通 là giao thông công cộng.'),
  ],
  'lesson-hsk5-u1-l3-media': [
    q('q-hsk5-l3-01','lesson-hsk5-u1-l3-media',1,'“论点” nghĩa là gì?',['Luận điểm','Tiêu đề','Số liệu','Tác giả'],0,'论点 là luận điểm của bài viết.'),
    q('q-hsk5-l3-02','lesson-hsk5-u1-l3-media',2,'“证据” dùng để làm gì?',['Trang trí văn bản','Hỗ trợ luận điểm','Đổi chủ đề','Kết thúc bài'],1,'证据 là bằng chứng/dẫn chứng.'),
    q('q-hsk5-l3-03','lesson-hsk5-u1-l3-media',3,'Khi tóm tắt bài viết nên giữ gì?',['Ý chính và lập luận cốt lõi','Mọi câu chữ','Chỉ ví dụ','Chỉ tiêu đề'],0,'Tóm tắt tốt giữ lại ý chính và cấu trúc lập luận quan trọng.'),
  ],
  'lesson-hsk5-u1-l4-business': [
    q('q-hsk5-l4-01','lesson-hsk5-u1-l4-business',1,'“合作条件” nghĩa là gì?',['Điều kiện hợp tác','Chi phí vận chuyển','Kế hoạch nghỉ phép','Báo cáo tài chính'],0,'合作 là hợp tác; 条件 là điều kiện.'),
    q('q-hsk5-l4-02','lesson-hsk5-u1-l4-business',2,'“双方” chỉ ai?',['Một người','Hai bên','Khách hàng','Nhân viên mới'],1,'双方 nghĩa là hai bên.'),
    q('q-hsk5-l4-03','lesson-hsk5-u1-l4-business',3,'“达成协议” nghĩa là gì?',['Hủy thỏa thuận','Đạt được thỏa thuận','Thay đổi giá','Tạm dừng hợp tác'],1,'达成协议 là đạt được thỏa thuận.'),
  ],
  'lesson-hsk6-u1-l3-academic': [
    q('q-hsk6-l3-01','lesson-hsk6-u1-l3-academic',1,'“论证” trong văn học thuật gần nghĩa với gì?',['Lập luận/chứng minh','Kể chuyện','Chào hỏi','Miêu tả thời tiết'],0,'论证 là dùng lập luận và bằng chứng để chứng minh một quan điểm.'),
    q('q-hsk6-l3-02','lesson-hsk6-u1-l3-academic',2,'Paraphrase là gì?',['Chép nguyên văn','Diễn đạt lại bằng cách khác','Bỏ ý chính','Dịch từng chữ'],1,'Paraphrase là diễn đạt lại ý bằng ngôn ngữ khác nhưng giữ nghĩa.'),
    q('q-hsk6-l3-03','lesson-hsk6-u1-l3-academic',3,'Từ nối nào phù hợp để nêu kết quả?',['因此','虽然','首先','例如'],0,'因此 nghĩa là vì vậy/do đó.'),
  ],
  'lesson-hsk6-u1-l4-nuance': [
    q('q-hsk6-l4-01','lesson-hsk6-u1-l4-nuance',1,'“细微差别” nghĩa là gì?',['Khác biệt tinh tế','Lỗi ngữ pháp','Tốc độ nói','Cách phát âm'],0,'细微差别 là khác biệt nhỏ và tinh tế.'),
    q('q-hsk6-l4-02','lesson-hsk6-u1-l4-nuance',2,'Khi viết học thuật nên ưu tiên gì?',['Từ ngữ chính xác và trung tính','Tiếng lóng','Câu rất ngắn','Biểu tượng cảm xúc'],0,'Văn phong học thuật cần chính xác, rõ ràng và phù hợp ngữ cảnh.'),
    q('q-hsk6-l4-03','lesson-hsk6-u1-l4-nuance',3,'Chọn từ gần nghĩa nên dựa vào yếu tố nào?',['Ngữ cảnh và sắc thái','Độ dài từ','Số chữ','Màu chữ'],0,'Ngữ cảnh quyết định sắc thái và cách dùng tự nhiên.'),
  ],
};

const dialogue = (id: string, speaker: string, chinese: string, pinyin: string, translationVi: string): DialogueLine => ({ id, speaker, chinese, pinyin, translationVi });

export const EXPANDED_LESSON_DIALOGUES: Record<string, DialogueLine[]> = {
  'lesson-hsk1-u1-l3-family': [dialogue('h1l3-1','Lina 老师','这是你的家人吗？','Zhè shì nǐ de jiārén ma?','Đây là gia đình của bạn phải không?'),dialogue('h1l3-2','Học viên','是的，这是我的妈妈。','Shì de, zhè shì wǒ de māma.','Đúng vậy, đây là mẹ tôi.'),dialogue('h1l3-3','Lina 老师','你的哥哥叫什么名字？','Nǐ de gēge jiào shénme míngzi?','Anh trai bạn tên là gì?')],
  'lesson-hsk1-u1-l4-daily-time': [dialogue('h1l4-1','Lina 老师','今天星期几？','Jīntiān xīngqī jǐ?','Hôm nay thứ mấy?'),dialogue('h1l4-2','Học viên','今天星期五。我们三点见吧。','Jīntiān xīngqīwǔ. Wǒmen sān diǎn jiàn ba.','Hôm nay thứ Sáu. Chúng ta gặp lúc ba giờ nhé.'),dialogue('h1l4-3','Lina 老师','好，明天见！','Hǎo, míngtiān jiàn!','Được, hẹn gặp ngày mai!')],
  'lesson-hsk2-u1-l3-shopping': [dialogue('h2l3-1','顾客','这个比那个便宜吗？','Zhège bǐ nàge piányi ma?','Cái này rẻ hơn cái kia phải không?'),dialogue('h2l3-2','店员','是的，而且这个质量很好。','Shì de, érqiě zhège zhìliàng hěn hǎo.','Đúng vậy, hơn nữa chất lượng cái này rất tốt.'),dialogue('h2l3-3','顾客','好，我就买这个。','Hǎo, wǒ jiù mǎi zhège.','Được, tôi mua cái này.')],
  'lesson-hsk2-u1-l4-health': [dialogue('h2l4-1','Lina 老师','你今天感觉怎么样？','Nǐ jīntiān gǎnjué zěnmeyàng?','Hôm nay bạn cảm thấy thế nào?'),dialogue('h2l4-2','Học viên','我有点头疼。','Wǒ yǒudiǎn tóuténg.','Tôi hơi đau đầu.'),dialogue('h2l4-3','Lina 老师','你应该多休息，多喝水。','Nǐ yīnggāi duō xiūxi, duō hē shuǐ.','Bạn nên nghỉ ngơi nhiều và uống nhiều nước.')],
  'lesson-hsk3-u1-l3-work-life': [dialogue('h3l3-1','同事','最近工作压力大吗？','Zuìjìn gōngzuò yālì dà ma?','Gần đây áp lực công việc có lớn không?'),dialogue('h3l3-2','Học viên','有一点，所以我开始安排运动时间。','Yǒu yìdiǎn, suǒyǐ wǒ kāishǐ ānpái yùndòng shíjiān.','Có một chút, nên tôi bắt đầu sắp xếp thời gian tập thể dục.'),dialogue('h3l3-3','同事','这样可以帮助你平衡工作和生活。','Zhèyàng kěyǐ bāngzhù nǐ pínghéng gōngzuò hé shēnghuó.','Như vậy có thể giúp bạn cân bằng công việc và cuộc sống.')],
  'lesson-hsk3-u1-l4-opinions': [dialogue('h3l4-1','Lina 老师','你觉得这个办法怎么样？','Nǐ juéde zhège bànfǎ zěnmeyàng?','Bạn thấy cách này thế nào?'),dialogue('h3l4-2','Học viên','我觉得不错，因为比较简单。','Wǒ juéde búcuò, yīnwèi bǐjiào jiǎndān.','Tôi thấy khá tốt vì tương đối đơn giản.'),dialogue('h3l4-3','Lina 老师','我理解你的想法，不过我有一个不同的看法。','Wǒ lǐjiě nǐ de xiǎngfǎ, búguò wǒ yǒu yí ge bùtóng de kànfǎ.','Tôi hiểu ý bạn, nhưng tôi có một quan điểm khác.')],
  'lesson-hsk4-u1-l3-communication': [dialogue('h4l3-1','同事','这个项目需要你确认一下信息。','Zhège xiàngmù xūyào nǐ quèrèn yíxià xìnxī.','Dự án này cần bạn xác nhận lại thông tin.'),dialogue('h4l3-2','Học viên','不好意思，可以再说明一下吗？','Bù hǎoyìsi, kěyǐ zài shuōmíng yíxià ma?','Xin lỗi, bạn có thể giải thích lại một chút không?'),dialogue('h4l3-3','同事','当然可以，我们一步一步来。','Dāngrán kěyǐ, wǒmen yí bù yí bù lái.','Tất nhiên, chúng ta cùng làm từng bước.')],
  'lesson-hsk4-u1-l4-environment': [dialogue('h4l4-1','Lina 老师','你认为公共交通能减少污染吗？','Nǐ rènwéi gōnggòng jiāotōng néng jiǎnshǎo wūrǎn ma?','Bạn cho rằng giao thông công cộng có thể giảm ô nhiễm không?'),dialogue('h4l4-2','Học viên','我认为可以，但是需要更多人愿意使用。','Wǒ rènwéi kěyǐ, dànshì xūyào gèng duō rén yuànyì shǐyòng.','Tôi cho rằng có, nhưng cần nhiều người sẵn sàng sử dụng hơn.'),dialogue('h4l4-3','Lina 老师','你的观点有很清楚的理由。','Nǐ de guāndiǎn yǒu hěn qīngchu de lǐyóu.','Quan điểm của bạn có lý do rất rõ ràng.')],
  'lesson-hsk5-u1-l3-media': [dialogue('h5l3-1','Lina 老师','这篇文章的主要论点是什么？','Zhè piān wénzhāng de zhǔyào lùndiǎn shì shénme?','Luận điểm chính của bài viết là gì?'),dialogue('h5l3-2','Học viên','作者认为技术发展会改变工作方式。','Zuòzhě rènwéi jìshù fāzhǎn huì gǎibiàn gōngzuò fāngshì.','Tác giả cho rằng phát triển công nghệ sẽ thay đổi cách làm việc.'),dialogue('h5l3-3','Lina 老师','请找出支持这个观点的证据。','Qǐng zhǎo chū zhīchí zhège guāndiǎn de zhèngjù.','Hãy tìm bằng chứng hỗ trợ quan điểm này.')],
  'lesson-hsk5-u1-l4-business': [dialogue('h5l4-1','客户','我们希望进一步讨论合作条件。','Wǒmen xīwàng jìnyíbù tǎolùn hézuò tiáojiàn.','Chúng tôi muốn thảo luận thêm về điều kiện hợp tác.'),dialogue('h5l4-2','Học viên','我们可以调整交付时间。','Wǒmen kěyǐ tiáozhěng jiāofù shíjiān.','Chúng tôi có thể điều chỉnh thời gian giao hàng.'),dialogue('h5l4-3','客户','如果价格合适，我们可以达成协议。','Rúguǒ jiàgé héshì, wǒmen kěyǐ dáchéng xiéyì.','Nếu giá phù hợp, chúng ta có thể đạt thỏa thuận.')],
  'lesson-hsk6-u1-l3-academic': [dialogue('h6l3-1','Lina 老师','这段文字的核心论点是什么？','Zhè duàn wénzì de héxīn lùndiǎn shì shénme?','Luận điểm cốt lõi của đoạn văn là gì?'),dialogue('h6l3-2','Học viên','作者通过两个例子来支持这个结论。','Zuòzhě tōngguò liǎng ge lìzi lái zhīchí zhège jiélùn.','Tác giả dùng hai ví dụ để hỗ trợ kết luận này.'),dialogue('h6l3-3','Lina 老师','请你用自己的话重新表达。','Qǐng nǐ yòng zìjǐ de huà chóngxīn biǎodá.','Hãy diễn đạt lại bằng lời của bạn.')],
  'lesson-hsk6-u1-l4-nuance': [dialogue('h6l4-1','Lina 老师','这两个词意思很接近，但是语气不同。','Zhè liǎng ge cí yìsi hěn jiējìn, dànshì yǔqì bùtóng.','Hai từ này rất gần nghĩa nhưng sắc thái khác nhau.'),dialogue('h6l4-2','Học viên','我应该根据什么选择？','Wǒ yīnggāi gēnjù shénme xuǎnzé?','Tôi nên dựa vào gì để lựa chọn?'),dialogue('h6l4-3','Lina 老师','主要看语境、对象和表达目的。','Zhǔyào kàn yǔjìng, duìxiàng hé biǎodá mùdì.','Chủ yếu dựa vào ngữ cảnh, đối tượng và mục đích diễn đạt.')],
};

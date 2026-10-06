import type { Vocabulary } from '../types';

const word = (
  id:string, hanzi:string, pinyin:string, vietnamese:string, partOfSpeech:string,
  exampleChinese:string, examplePinyin:string, exampleVietnamese:string, category:string,
  difficulty:1|2|3|4|5
):Vocabulary => ({
  id, hanzi, pinyin, vietnamese, meaningVi:vietnamese, partOfSpeech,
  exampleChinese, examplePinyin, exampleVietnamese, example:exampleChinese,
  exampleVi:exampleVietnamese, hskLevel:1, category, audio:hanzi, difficulty
});

export const SPEAKING_VOCABULARY: Vocabulary[] = [
  word('xihuan','喜欢','xǐhuan','thích','động từ','我喜欢学中文。','Wǒ xǐhuan xué Zhōngwén.','Tôi thích học tiếng Trung.','preferences',1),
  word('jue-de','觉得','juéde','cảm thấy; thấy rằng','động từ','我觉得中文很有意思。','Wǒ juéde Zhōngwén hěn yǒuyìsi.','Tôi thấy tiếng Trung rất thú vị.','opinions',2),
  word('keyi','可以','kěyǐ','có thể; được','động từ','可以再说一次吗？','Kěyǐ zài shuō yí cì ma?','Có thể nói lại một lần không?','conversation',1),
  word('neng','能','néng','có thể','động từ','你能说慢一点吗？','Nǐ néng shuō màn yìdiǎn ma?','Bạn có thể nói chậm hơn một chút không?','conversation',2),
  word('yao','要','yào','muốn; cần; sẽ','động từ','我要一杯茶。','Wǒ yào yì bēi chá.','Tôi muốn một cốc trà.','needs',1),
  word('hai','还','hái','vẫn; còn; cũng','phó từ','我还想练习。','Wǒ hái xiǎng liànxí.','Tôi vẫn muốn luyện tập.','conversation',2),
  word('ye','也','yě','cũng','phó từ','我也喜欢咖啡。','Wǒ yě xǐhuan kāfēi.','Tôi cũng thích cà phê.','conversation',1),
  word('dou','都','dōu','đều','phó từ','我们都学习中文。','Wǒmen dōu xuéxí Zhōngwén.','Chúng tôi đều học tiếng Trung.','conversation',2),
  word('hen','很','hěn','rất','phó từ','今天很好。','Jīntiān hěn hǎo.','Hôm nay rất tốt.','describing',1),
  word('zhen','真','zhēn','thật; thực sự','phó từ','真的很好吃。','Zhēn de hěn hǎochī.','Thật sự rất ngon.','reaction',2),
  word('dui','对','duì','đúng; phải','tính từ','对，我明白了。','Duì, wǒ míngbai le.','Đúng, tôi hiểu rồi.','reaction',1),
  word('mingbai','明白','míngbai','hiểu','động từ','我明白了。','Wǒ míngbai le.','Tôi hiểu rồi.','conversation',1),
  word('dong','懂','dǒng','hiểu','động từ','我听懂了。','Wǒ tīng dǒng le.','Tôi nghe hiểu rồi.','listening',2),
  word('ting','听','tīng','nghe','động từ','我听你说。','Wǒ tīng nǐ shuō.','Tôi nghe bạn nói.','listening',1),
  word('shuo','说','shuō','nói','động từ','请说慢一点。','Qǐng shuō màn yìdiǎn.','Xin hãy nói chậm hơn một chút.','speaking',1),
  word('zai-shuo','再说','zài shuō','nói lại; nói tiếp','cụm từ','请再说一次。','Qǐng zài shuō yí cì.','Xin hãy nói lại một lần.','conversation',1),
  word('man','慢','màn','chậm','tính từ','请说慢一点。','Qǐng shuō màn yìdiǎn.','Xin hãy nói chậm hơn một chút.','conversation',1),
  word('kuai','快','kuài','nhanh','tính từ','他说得太快。','Tā shuō de tài kuài.','Anh ấy nói quá nhanh.','conversation',2),
  word('yidian','一点','yìdiǎn','một chút','lượng từ','请慢一点。','Qǐng màn yìdiǎn.','Xin chậm một chút.','conversation',1),
  word('zenme','怎么','zěnme','thế nào; làm sao','đại từ nghi vấn','这个怎么说？','Zhège zěnme shuō?','Cái này nói thế nào?','questions',1),
  word('weishenme','为什么','wèishénme','tại sao','đại từ nghi vấn','你为什么学中文？','Nǐ wèishénme xué Zhōngwén?','Tại sao bạn học tiếng Trung?','questions',2),
  word('zenmeyang','怎么样','zěnmeyàng','thế nào','cụm từ','今天怎么样？','Jīntiān zěnmeyàng?','Hôm nay thế nào?','questions',2),
  word('shenme-shihou','什么时候','shénme shíhou','khi nào','cụm từ','你什么时候学习？','Nǐ shénme shíhou xuéxí?','Bạn học khi nào?','questions',2),
  word('mang','忙','máng','bận','tính từ','我今天很忙。','Wǒ jīntiān hěn máng.','Hôm nay tôi rất bận.','routine',1),
  word('you-kong','有空','yǒu kòng','rảnh','cụm từ','你明天有空吗？','Nǐ míngtiān yǒu kòng ma?','Ngày mai bạn rảnh không?','routine',2),
  word('deng','等','děng','đợi','động từ','请等一下。','Qǐng děng yíxià.','Xin đợi một chút.','conversation',1),
  word('yixia','一下','yíxià','một chút; một lát','trợ từ','等一下。','Děng yíxià.','Đợi một chút.','conversation',1),
  word('yinwei','因为','yīnwèi','bởi vì','liên từ','因为我喜欢中文。','Yīnwèi wǒ xǐhuan Zhōngwén.','Bởi vì tôi thích tiếng Trung.','reasons',2),
  word('suoyi','所以','suǒyǐ','cho nên','liên từ','所以我每天练习。','Suǒyǐ wǒ měitiān liànxí.','Cho nên tôi luyện tập mỗi ngày.','reasons',2),
  word('meiyou','没有','méiyǒu','không có; chưa','động từ/phó từ','我没有时间。','Wǒ méiyǒu shíjiān.','Tôi không có thời gian.','negation',2),
  word('zhidao','知道','zhīdào','biết','động từ','我不知道。','Wǒ bù zhīdào.','Tôi không biết.','conversation',1),
  word('cuo','错','cuò','sai','tính từ','我说错了。','Wǒ shuō cuò le.','Tôi nói sai rồi.','correction',2),
  word('dui-bu-dui','对不对','duì bu duì','đúng không','cụm hỏi','这样说对不对？','Zhèyàng shuō duì bu duì?','Nói như vậy đúng không?','conversation',2),
  word('zheyang','这样','zhèyàng','như thế này','đại từ/trạng từ','这样说可以吗？','Zhèyàng shuō kěyǐ ma?','Nói như thế này có được không?','conversation',1),
  word('yidianr','一点儿','yìdiǎnr','một chút','cụm từ','我会说一点儿中文。','Wǒ huì shuō yìdiǎnr Zhōngwén.','Tôi biết nói một chút tiếng Trung.','speaking',2),
  word('lianxi','练习','liànxí','luyện tập','động từ/danh từ','我们一起练习吧。','Wǒmen yìqǐ liànxí ba.','Chúng ta cùng luyện tập nhé.','learning',1),
  word('yiqǐ','一起','yìqǐ','cùng nhau','phó từ','我们一起说。','Wǒmen yìqǐ shuō.','Chúng ta cùng nói.','conversation',1),
  word('duan','短','duǎn','ngắn','tính từ','我们练习一个短对话。','Wǒmen liànxí yí ge duǎn duìhuà.','Chúng ta luyện một đoạn hội thoại ngắn.','learning',2),
  word('duihua','对话','duìhuà','hội thoại','danh từ','我们做一个对话。','Wǒmen zuò yí ge duìhuà.','Chúng ta làm một đoạn hội thoại.','learning',2)
];

export const QUICK_SPEAKING_PROMPTS = [
  { id:'intro', label:'Giới thiệu', prompt:'你好！请介绍一下你自己。', vocabulary:['你好','叫','是','喜欢'] },
  { id:'coffee', label:'Quán cà phê', prompt:'你喜欢喝咖啡吗？为什么？', vocabulary:['喜欢','喝','咖啡','因为','所以'] },
  { id:'daily', label:'Hôm nay', prompt:'你今天做什么？', vocabulary:['今天','现在','学习','工作','忙'] },
  { id:'clarify', label:'Phản xạ', prompt:'听不懂的时候，你怎么请别人再说一次？', vocabulary:['听懂','再说','一次','慢一点'] },
  { id:'opinion', label:'Ý kiến', prompt:'你觉得学中文怎么样？', vocabulary:['觉得','有意思','为什么','因为'] },
  { id:'free', label:'Tự do', prompt:'请问我一个简单的问题，我用中文回答。', vocabulary:['可以','问题','回答','一起'] },
] as const;

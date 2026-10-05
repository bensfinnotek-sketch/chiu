import type { Vocabulary } from '../types';
import type { GrammarRecord, HskPath, StructuredLesson } from './types';
import { SPEAKING_VOCABULARY } from './speakingVocabulary';

const v = (id:string,hanzi:string,pinyin:string,vietnamese:string,partOfSpeech:string,exampleChinese:string,examplePinyin:string,exampleVietnamese:string,category:string,difficulty:1|2|3|4|5):Vocabulary => ({
  id, hanzi, pinyin, vietnamese, meaningVi:vietnamese, partOfSpeech, exampleChinese, examplePinyin, exampleVietnamese,
  example: exampleChinese, examplePinyin, exampleVi: exampleVietnamese, hskLevel:1, category, audio: hanzi, difficulty
});

export const HSK1_VOCABULARY: Vocabulary[] = [
v('nihao','你好','nǐ hǎo','xin chào','cụm từ','你好！','Nǐ hǎo!','Xin chào!','greetings',1),
v('hao','好','hǎo','tốt','tính từ','很好。','Hěn hǎo.','Rất tốt.','greetings',1),
v('wo','我','wǒ','tôi','đại từ','我是学生。','Wǒ shì xuéshēng.','Tôi là học sinh.','self',1),
v('ni','你','nǐ','bạn','đại từ','你好吗？','Nǐ hǎo ma?','Bạn khỏe không?','greetings',1),
v('shi','是','shì','là','động từ','我是越南人。','Wǒ shì Yuènán rén.','Tôi là người Việt Nam.','self',1),
v('jiao','叫','jiào','tên là; gọi là','động từ','我叫南。','Wǒ jiào Nán.','Tôi tên Nam.','self',1),
v('shenme','什么','shénme','gì; cái gì','đại từ nghi vấn','你叫什么名字？','Nǐ jiào shénme míngzi?','Bạn tên là gì?','questions',1),
v('mingzi','名字','míngzi','tên','danh từ','我的名字叫南。','Wǒ de míngzi jiào Nán.','Tên tôi là Nam.','self',1),
v('ren','人','rén','người','danh từ','我是中国人。','Wǒ shì Zhōngguó rén.','Tôi là người Trung Quốc.','self',1),
v('yue nan','越南','Yuènán','Việt Nam','danh từ riêng','我来自越南。','Wǒ láizì Yuènán.','Tôi đến từ Việt Nam.','self',1),
v('yi','一','yī','một','số từ','一个人。','Yí gè rén.','Một người.','numbers',1),
v('er','二','èr','hai','số từ','二十。','Èrshí.','Hai mươi.','numbers',1),
v('san','三','sān','ba','số từ','三个人。','Sān ge rén.','Ba người.','numbers',1),
v('shi-number','十','shí','mười','số từ','十个人。','Shí ge rén.','Mười người.','numbers',1),
v('jiu','九','jiǔ','chín','số từ','九点。','Jiǔ diǎn.','Chín giờ.','numbers',1),
v('jia-family','家','jiā','nhà; gia đình','danh từ','我家有四个人。','Wǒ jiā yǒu sì ge rén.','Gia đình tôi có bốn người.','family',1),
v('ba','爸爸','bàba','bố','danh từ','我爸爸很好。','Wǒ bàba hěn hǎo.','Bố tôi rất tốt.','family',1),
v('ma','妈妈','māma','mẹ','danh từ','我妈妈在家。','Wǒ māma zài jiā.','Mẹ tôi ở nhà.','family',1),
v('ge','个','gè','lượng từ chung','lượng từ','三个人。','Sān ge rén.','Ba người.','numbers',1),
v('chi','吃','chī','ăn','động từ','我喜欢吃米饭。','Wǒ xǐhuan chī mǐfàn.','Tôi thích ăn cơm.','food',1),
v('he','喝','hē','uống','động từ','我喝水。','Wǒ hē shuǐ.','Tôi uống nước.','drinks',1),
v('shui','水','shuǐ','nước','danh từ','请喝水。','Qǐng hē shuǐ.','Mời uống nước.','drinks',1),
v('cha','茶','chá','trà','danh từ','我喜欢喝茶。','Wǒ xǐhuan hē chá.','Tôi thích uống trà.','drinks',1),
v('kafei','咖啡','kāfēi','cà phê','danh từ','我喜欢喝咖啡。','Wǒ xǐhuan hē kāfēi.','Tôi thích uống cà phê.','drinks',1),
v('mifan','米饭','mǐfàn','cơm','danh từ','我吃米饭。','Wǒ chī mǐfàn.','Tôi ăn cơm.','food',1),
v('mian','面条','miàntiáo','mì','danh từ','我想吃面条。','Wǒ xiǎng chī miàntiáo.','Tôi muốn ăn mì.','food',1),
v('xiang','想','xiǎng','muốn; nghĩ','động từ','我想喝水。','Wǒ xiǎng hē shuǐ.','Tôi muốn uống nước.','food',1),
v('mai','买','mǎi','mua','động từ','我想买这个。','Wǒ xiǎng mǎi zhège.','Tôi muốn mua cái này.','shopping',1),
v('duo shao','多少','duōshao','bao nhiêu','đại từ nghi vấn','这个多少钱？','Zhège duōshao qián?','Cái này bao nhiêu tiền?','shopping',1),
v('qian','钱','qián','tiền','danh từ','多少钱？','Duōshao qián?','Bao nhiêu tiền?','shopping',1),
v('zhe','这','zhè','này; đây','đại từ','这个很好。','Zhège hěn hǎo.','Cái này rất tốt.','shopping',1),
v('na','那','nà','kia; đó','đại từ','那是什么？','Nà shì shénme?','Kia là gì?','questions',1),
v('ji dian','几点','jǐ diǎn','mấy giờ','cụm từ','现在几点？','Xiànzài jǐ diǎn?','Bây giờ mấy giờ?','time',1),
v('xianzai','现在','xiànzài','bây giờ','trạng từ','我现在学习。','Wǒ xiànzài xuéxí.','Bây giờ tôi học.','time',1),
v('jin tian','今天','jīntiān','hôm nay','danh từ thời gian','今天星期一。','Jīntiān xīngqīyī.','Hôm nay là thứ Hai.','time',1),
v('ming tian','明天','míngtiān','ngày mai','danh từ thời gian','明天见。','Míngtiān jiàn.','Hẹn gặp ngày mai.','time',1),
v('xuexi','学习','xuéxí','học','động từ','我学习中文。','Wǒ xuéxí Zhōngwén.','Tôi học tiếng Trung.','routine',1),
v('gong zuo','工作','gōngzuò','làm việc; công việc','động từ/danh từ','我在工作。','Wǒ zài gōngzuò.','Tôi đang làm việc.','routine',1),
v('hui','回','huí','về','động từ','我回家。','Wǒ huí jiā.','Tôi về nhà.','routine',1),
v('shui jiao','睡觉','shuìjiào','ngủ','động từ','我晚上睡觉。','Wǒ wǎnshang shuìjiào.','Buổi tối tôi ngủ.','routine',1),
v('ma-question','吗','ma','trợ từ nghi vấn','trợ từ','你喜欢咖啡吗？','Nǐ xǐhuan kāfēi ma?','Bạn thích cà phê không?','questions',1),
v('de','的','de','của; trợ từ định ngữ','trợ từ','这是我的书。','Zhè shì wǒ de shū.','Đây là sách của tôi.','grammar',1),
v('you','有','yǒu','có','động từ','我有一个哥哥。','Wǒ yǒu yí ge gēge.','Tôi có một anh trai.','family',1),
v('bu','不','bù','không','phó từ','我不喝咖啡。','Wǒ bù hē kāfēi.','Tôi không uống cà phê.','grammar',1),
v('zai','在','zài','ở; đang','động từ/giới từ','我在家。','Wǒ zài jiā.','Tôi ở nhà.','routine',1),
v('qing','请','qǐng','mời; xin vui lòng','động từ','请喝茶。','Qǐng hē chá.','Mời uống trà.','politeness',1),
v('xiexie','谢谢','xièxie','cảm ơn','cụm từ','谢谢你。','Xièxie nǐ.','Cảm ơn bạn.','greetings',1),
v('zaijian','再见','zàijiàn','tạm biệt','cụm từ','再见！','Zàijiàn!','Tạm biệt!','greetings',1),
v('dui bu qi','对不起','duìbuqǐ','xin lỗi','cụm từ','对不起。','Duìbuqǐ.','Xin lỗi.','greetings',1),
v('meiguanxi','没关系','méiguānxi','không sao','cụm từ','没关系。','Méi guānxi.','Không sao.','greetings',1),
  ...SPEAKING_VOCABULARY,
];

const by = (ids:string[]) => ids.map(id => HSK1_VOCABULARY.find(x=>x.id===id)!).filter(Boolean);
const g = (id:string,pattern:string,meaning:string,explanationVi:string,examples:Array<[string,string,string]>,commonMistakes:string[],practiceQuestions:string[]):GrammarRecord => ({id,pattern,meaning,explanationVi,examples:examples.map(([ch,p,v])=>({chinese:ch,pinyin:p,vietnamese:v})),commonMistakes,practiceQuestions});

const grammar: Record<string,GrammarRecord> = {
  shi: g('g-shi','A + 是 + B','A là B','Dùng 是 để nối chủ ngữ với danh từ chỉ người/vật hoặc thân phận.',[['我是学生。','Wǒ shì xuéshēng.','Tôi là học sinh.']],['Bỏ 是 khi câu cần nó để nối danh từ.'],['Hoàn thành: 我___越南人。']),
  jiao: g('g-jiao','主语 + 叫 + tên','Nói tên','叫 dùng để giới thiệu tên của mình hoặc hỏi tên.',[['我叫南。','Wǒ jiào Nán.','Tôi tên Nam.'],['你叫什么名字？','Nǐ jiào shénme míngzi?','Bạn tên là gì?']],['Nhầm 叫 với 是 trong câu giới thiệu tên.'],['Trả lời: 你叫什么名字？']),
  ma: g('g-ma','Câu + 吗？','Câu hỏi có/không','Đặt 吗 ở cuối câu trần thuật để tạo câu hỏi yes/no.',[['你喜欢咖啡吗？','Nǐ xǐhuan kāfēi ma?','Bạn thích cà phê không?']],['Dùng 吗 với câu hỏi đã có từ nghi vấn như 什么.'],['Đổi thành câu hỏi: 你喝茶。']),
  xiang: g('g-xiang','想 + Verb','Muốn làm gì','想 đứng trước động từ để nói mong muốn.',[['我想喝水。','Wǒ xiǎng hē shuǐ.','Tôi muốn uống nước.']],['Không đặt 想 sau động từ chính.'],['Nói “Tôi muốn ăn cơm”.']),
  de: g('g-de','A + 的 + B','B của A / B thuộc A','的 nối người/vật sở hữu với danh từ phía sau.',[['这是我的书。','Zhè shì wǒ de shū.','Đây là sách của tôi.']],['Bỏ 的 khi chưa có cấu trúc sở hữu cố định.'],['Nói “đây là nhà của tôi”.']),
  bu: g('g-bu','不 + Verb/Adj','Không','不 đứng trước động từ hoặc tính từ để phủ định hiện tại/thói quen.',[['我不喝咖啡。','Wǒ bù hē kāfēi.','Tôi không uống cà phê.']],['Đặt 不 sau động từ.'],['Nói “Tôi không uống trà”.']),
  zai: g('g-zai','在 + nơi chốn / 在 + Verb','Ở / đang','在 có thể chỉ vị trí hoặc hành động đang diễn ra tùy cấu trúc.',[['我在家。','Wǒ zài jiā.','Tôi ở nhà.'],['我在学习。','Wǒ zài xuéxí.','Tôi đang học.']],['Đồng nhất 在 với “đang” trong mọi câu.'],['Nói “Tôi đang học”.'])
};

const L = (n:number,title:string,objective:string,ids:string[],grammarIds:string[],dialogue:Array<[string,string,string,string]>,listening:string[],speaking:string[],roleTitle:string,scenario:string,prompt:string,expectedPatterns:string[],difficulty:1|2|3|4|5):StructuredLesson => ({
 id:`hsk1-lesson-${n}`,hskLevel:1,lessonNumber:n,title,objective,vocabulary:by(ids),grammar:grammarIds.map(x=>grammar[x]),dialogue:dialogue.map(([speaker,chinese,pinyin,vietnamese])=>({speaker: speaker as 'ai'|'learner',chinese,pinyin,vietnamese})),listening,speaking,
 roleplay:{title:roleTitle,scenario,prompt,expectedPatterns},review:['zh-vi','vi-zh','audio-meaning','pinyin-zh','zh-speak','listen-repeat','fill-blank','conversation'],difficulty
});

export const HSK1_LESSONS: StructuredLesson[] = [
L(1,'Chào hỏi','Chào hỏi, cảm ơn và tạm biệt trong tình huống cơ bản.',['nihao','hao','ni','xiexie','zaijian','dui bu qi','meiguanxi'],['shi'],
[['ai','你好！','Nǐ hǎo!','Xin chào!'],['learner','你好！','Nǐ hǎo!','Xin chào!'],['ai','你好吗？','Nǐ hǎo ma?','Bạn khỏe không?'],['learner','很好，谢谢！','Hěn hǎo, xièxie!','Rất tốt, cảm ơn!']] as any,
['Nghe 你好 và nhận diện nghĩa.','Nghe 谢谢 rồi chọn nghĩa tiếng Việt.'],['Đọc 你好 và 谢谢.','Nói một lời chào tự nhiên.'],'Gặp Lina','Bạn gặp Lina lần đầu.','Hãy chào Lina và hỏi thăm cô ấy.',['你好','你好吗'],1),
L(2,'Tự giới thiệu','Giới thiệu tên và quốc tịch bằng mẫu câu đơn giản.',['wo','ni','shi','jiao','shenme','mingzi','ren','yue nan'],['shi','jiao'],
[['ai','你好，你叫什么名字？','Nǐ hǎo, nǐ jiào shénme míngzi?','Xin chào, bạn tên là gì?'],['learner','我叫南。我是越南人。','Wǒ jiào Nán. Wǒ shì Yuènán rén.','Tôi tên Nam. Tôi là người Việt Nam.']] as any,
['Nghe câu hỏi tên và xác định từ 叫.','Nghe 我是越南人 và nhận diện quốc tịch.'],['Nói “Tôi tên …”.','Nói “Tôi là người Việt Nam”.'],'Gặp bạn mới','Bạn làm quen với một người bạn Trung Quốc.','Hãy tự giới thiệu tên và quốc tịch.',['我叫','我是越南人'],1),
L(3,'Số đếm','Đếm số và dùng lượng từ 个 trong câu đơn giản.',['yi','er','san','shi-number','jiu','ge'],[],[['ai','你有几个人？','Nǐ yǒu jǐ ge rén?','Bạn có mấy người?'],['learner','三个人。','Sān ge rén.','Ba người.']] as any,['Nghe số một, hai, ba.','Nghe 三个人 và nhận diện số.'],['Đếm từ 1 đến 10.','Trả lời số người.'],'Đếm người','Bạn cần nói số người trong nhóm.','Có ba người, hãy trả lời bằng tiếng Trung.',['三个人'],1),
L(4,'Gia đình','Nói về thành viên gia đình bằng 有 và 个.',['jia-family','ba','ma','ge','you','wo'],['de'],[['ai','你家有几个人？','Nǐ jiā yǒu jǐ ge rén?','Gia đình bạn có mấy người?'],['learner','我家有四个人。','Wǒ jiā yǒu sì ge rén.','Gia đình tôi có bốn người.']] as any,['Nghe 我家 và nhận diện “gia đình tôi”.','Nghe 爸爸 và 妈妈.'],['Nói số người trong gia đình.','Giới thiệu bố hoặc mẹ.'],'Hỏi về gia đình','Bạn đang trò chuyện về gia đình.','Hãy nói gia đình bạn có bao nhiêu người.',['我家有','个人'],1),
L(5,'Đồ ăn','Gọi món và nói món mình thích.',['chi','mifan','mian','xiang','hao','bu'],['xiang','bu'],[['ai','你想吃什么？','Nǐ xiǎng chī shénme?','Bạn muốn ăn gì?'],['learner','我想吃米饭。','Wǒ xiǎng chī mǐfàn.','Tôi muốn ăn cơm.']] as any,['Nghe 我想吃米饭 và hiểu mong muốn.','Nghe 面条.'],['Nói món bạn muốn ăn.','Nói một món bạn không muốn ăn.'],'Gọi món','Bạn đang gọi món ở quán ăn.','Hãy nói bạn muốn ăn cơm hay mì.',['我想吃','我不吃'],1),
L(6,'Đồ uống','Nói về nước, trà và cà phê; hỏi sở thích.',['he','shui','cha','kafei','xihuan','ma-question'],['ma','bu'],[['ai','你喜欢喝咖啡吗？','Nǐ xǐhuan hē kāfēi ma?','Bạn có thích uống cà phê không?'],['learner','我喜欢喝咖啡。','Wǒ xǐhuan hē kāfēi.','Tôi thích uống cà phê.']] as any,['Nghe câu hỏi có 吗.','Nghe 咖啡 và 茶.'],['Trả lời câu hỏi sở thích.','Nói bạn thích hoặc không thích một đồ uống.'],'Quán cà phê','Bạn gọi đồ uống tại quán.','Hãy trả lời Lina hỏi bạn có thích cà phê không.',['喜欢喝咖啡','不喝咖啡'],1),
L(7,'Mua sắm','Hỏi giá và nói muốn mua món đồ này.',['mai','duo shao','qian','zhe','na','xiang'],['xiang'],[['ai','这个多少钱？','Zhège duōshao qián?','Cái này bao nhiêu tiền?'],['learner','我想买这个。','Wǒ xiǎng mǎi zhège.','Tôi muốn mua cái này.']] as any,['Nghe 多少钱 và nhận diện câu hỏi giá.','Nghe 我想买这个.'],['Hỏi giá một món hàng.','Nói bạn muốn mua món này.'],'Cửa hàng','Bạn đang mua một món đồ.','Hãy hỏi giá rồi nói bạn muốn mua.',['多少钱','我想买'],2),
L(8,'Sinh hoạt hằng ngày','Nói về học, làm việc, về nhà và ngủ.',['xuexi','gong zuo','hui','shui jiao','zai','xianzai'],['zai'],[['ai','你现在做什么？','Nǐ xiànzài zuò shénme?','Bây giờ bạn đang làm gì?'],['learner','我在学习。','Wǒ zài xuéxí.','Tôi đang học.']] as any,['Nghe 我在学习 và nhận diện hành động.','Nghe 我回家.'],['Nói bạn đang học.','Nói một việc bạn làm buổi tối.'],'Một ngày của bạn','Bạn kể cho Lina nghe bạn đang làm gì.','Hãy nói bạn đang học hoặc đang làm việc.',['我在','学习','工作'],2),
L(9,'Thời gian và ngày tháng','Hỏi giờ và nói hôm nay/ngày mai.',['ji dian','xianzai','jin tian','ming tian','jiu'],[],[['ai','现在几点？','Xiànzài jǐ diǎn?','Bây giờ mấy giờ?'],['learner','九点。','Jiǔ diǎn.','Chín giờ.']] as any,['Nghe 九点.','Nghe 今天 và 明天.'],['Nói một giờ đơn giản.','Nói hôm nay hoặc ngày mai.'],'Hẹn giờ','Bạn và Lina cần hẹn thời gian.','Hãy nói giờ gặp nhau.',['九点','今天','明天'],2),
L(10,'Câu hỏi đơn giản','Kết hợp 什么, 吗 và mẫu hỏi tên/sở thích.',['shenme','ni','wo','xihuan','ma-question','mingzi'],['ma','jiao'],[['ai','你喜欢什么？','Nǐ xǐhuan shénme?','Bạn thích gì?'],['learner','我喜欢咖啡。','Wǒ xǐhuan kāfēi.','Tôi thích cà phê.']] as any,['Nghe 什么 và phân biệt với 吗.','Nghe câu hỏi sở thích.'],['Hỏi Lina một câu đơn giản.','Trả lời câu hỏi về sở thích.'],'Hội thoại ngắn','Bạn trò chuyện tự do với Lina.','Hãy hỏi tên hoặc sở thích của Lina.',['你叫什么名字','你喜欢什么'],2)
];

export const HSK_PATHS: HskPath[] = [1,2,3,4,5,6].map(level => ({
 level, title:`HSK ${level}`, status: level===1 ? 'active' : 'planned',
 lessonIds: level===1 ? HSK1_LESSONS.map(x=>x.id) : []
}));

export const getLesson = (id:string) => HSK1_LESSONS.find(x=>x.id===id);

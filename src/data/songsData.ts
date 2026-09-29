import { SongItem } from '../types';

const BASE_CHINESE_SONGS: SongItem[] = [
  {
    id: 'song-1',
    title: '月亮代表我的心',
    artist: '邓丽君 (Teresa Teng)',
    coverImage: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    difficulty: 'Beginner',
    hskLevel: 'HSK 1',
    duration: '3:20',
    lyrics: [
      { time: 0, chinese: '你问我爱你有多深', pinyin: 'Nǐ wèn wǒ ài nǐ yǒu duō shēn', translationVi: 'Anh hỏi em yêu anh sâu đậm dường nào' },
      { time: 5, chinese: '我爱你有几分', pinyin: 'Wǒ ài nǐ yǒu jǐ fēn', translationVi: 'Em yêu anh được mấy phần' },
      { time: 10, chinese: '我的情也真，我的爱也真', pinyin: 'Wǒ de qíng yě zhēn, wǒ de ài yě zhēn', translationVi: 'Tình cảm của em là thật, tình yêu của em cũng chân thành' },
      { time: 15, chinese: '月亮代表我的心', pinyin: 'Yuèliang dàibiǎo wǒ de xīn', translationVi: 'Ánh trăng kia sẽ thay lời trái tim em' },
      { time: 20, chinese: '轻轻的一个吻', pinyin: 'Qīngqīng de yí gè wěn', translationVi: 'Một nụ hôn nhẹ nhàng sâu lắng' },
      { time: 25, chinese: '已经打动我的心', pinyin: 'Yǐjīng dǎdòng wǒ de xīn', translationVi: 'Đã làm xao xuyến trái tim em' },
      { time: 30, chinese: '深深的一段情', pinyin: 'Shēnshēn de yí duàn qíng', translationVi: 'Một mối tình thắm thiết ngọt ngào' },
      { time: 35, chinese: '叫我思念到如今', pinyin: 'Jiào wǒ sīniàn dào rújīn', translationVi: 'Khiến em mãi nhung nhớ đến tận hôm nay' },
    ],
  },
  {
    id: 'song-2',
    title: '对面的女孩看过来',
    artist: '任贤齐 (Richie Jen)',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    difficulty: 'Beginner',
    hskLevel: 'HSK 2',
    duration: '3:10',
    lyrics: [
      { time: 0, chinese: '对面的女孩看过来', pinyin: 'Duìmiàn de nǚhái kàn guòlái', translationVi: 'Cô gái phía bên kia hãy nhìn qua đây' },
      { time: 5, chinese: '看过来，看过来', pinyin: 'Kàn guòlái, kàn guòlái', translationVi: 'Hãy nhìn qua đây, hãy nhìn qua đây nào' },
      { time: 10, chinese: '这里的表演很精彩', pinyin: 'Zhèlǐ de biǎoyǎn hěn jīngcǎi', translationVi: 'Màn biểu diễn ở đây vô cùng đặc sắc' },
      { time: 15, chinese: '请不要假装不理不睬', pinyin: 'Qǐng bú yào jiǎzhuāng bù lǐ bù cǎi', translationVi: 'Xin đừng vờ như không đoái hoài gì tới tôi' },
    ],
  },
  {
    id: 'song-3',
    title: '青花瓷 (Sứ Thanh Hoa)',
    artist: '周杰伦 (Jay Chou)',
    coverImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    difficulty: 'Intermediate',
    hskLevel: 'HSK 4',
    duration: '3:58',
    lyrics: [
      { time: 0, chinese: '素胚勾勒出青花笔锋浓转淡', pinyin: 'Sù pēi gōulè chū qīnghuā bǐfēng nóng zhuǎn dàn', translationVi: 'Nét bút men gốm phác họa hoa lam từ đậm chuyển sang thanh' },
      { time: 7, chinese: '瓶身描绘的牡丹一如你初妆', pinyin: 'Píng shēn miáohuì de mǔdān yì rú nǐ chū zhuāng', translationVi: 'Đóa mẫu đơn vẽ trên thân bình hệt như nét điểm trang thuở đầu của nàng' },
      { time: 14, chinese: '冉冉檀香透过窗心事我了然', pinyin: 'Rǎnrǎn tánxiāng tòuguò chuāng xīnshì wǒ liǎorán', translationVi: 'Hương trầm thoang thoảng qua ô cửa sổ, nỗi lòng nàng ta thấu tỏ' },
      { time: 21, chinese: '天青色等烟雨，而我在等你', pinyin: 'Tiān qīngsè děng yānyǔ, ér wǒ zài děng nǐ', translationVi: 'Sắc lam của trời mải miết đợi cơn mưa mù, còn ta thì mải miết đợi nàng' },
    ],
  },
  {
    id: 'song-4',
    title: '童话 (Đồng Thoại)',
    artist: '光良 (Michael Wong)',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    difficulty: 'Beginner',
    hskLevel: 'HSK 2',
    duration: '4:05',
    lyrics: [
      { time: 0, chinese: '忘了有多久，再没听到你', pinyin: 'Wàng le yǒu duōjiǔ, zài méi tīngdào nǐ', translationVi: 'Đã quên bao lâu rồi, không còn nghe thấy em' },
      { time: 6, chinese: '对我说你最爱的故事', pinyin: 'Duì wǒ shuō nǐ zuì ài de gùshi', translationVi: 'Kể cho anh nghe câu chuyện em yêu thích nhất' },
      { time: 12, chinese: '我想了很久，我开始慌了', pinyin: 'Wǒ xiǎng le hěnjiǔ, wǒ kāishǐ huāng le', translationVi: 'Anh suy nghĩ rất lâu, bắt đầu cảm thấy hoang mang' },
      { time: 18, chinese: '是不是我又做错了什么', pinyin: 'Shì bú shì wǒ yòu zuò cuò le shénme', translationVi: 'Có phải chăng anh lại làm sai điều gì rồi' },
    ],
  },
];

// Original Chiu learning songs: upbeat, short, and written for language practice.
// These avoid relying on unlicensed commercial lyrics while giving learners a larger music library.
const EXTRA_LEARNING_SONGS: SongItem[] = [
  {
    id: 'chiu-happy-01', title: '开心学中文', artist: 'Chiu Learning Studio',
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    difficulty: 'Beginner', hskLevel: 'HSK 1', duration: '1:42', mood: 'upbeat', bpm: 118,
    lyrics: [
      { time: 0, chinese: '你好你好，今天真开心', pinyin: 'Nǐ hǎo nǐ hǎo, jīntiān zhēn kāixīn', translationVi: 'Xin chào xin chào, hôm nay thật vui' },
      { time: 8, chinese: '一起学习，一起说中文', pinyin: 'Yìqǐ xuéxí, yìqǐ shuō Zhōngwén', translationVi: 'Cùng học tập, cùng nói tiếng Trung' },
      { time: 16, chinese: '你说一句，我说一句', pinyin: 'Nǐ shuō yí jù, wǒ shuō yí jù', translationVi: 'Bạn nói một câu, mình nói một câu' },
      { time: 24, chinese: '每天进步一点点', pinyin: 'Měitiān jìnbù yìdiǎndiǎn', translationVi: 'Mỗi ngày tiến bộ một chút' },
      { time: 32, chinese: '听一听，读一读', pinyin: 'Tīng yì tīng, dú yì dú', translationVi: 'Nghe một chút, đọc một chút' },
      { time: 40, chinese: '快乐学习不怕难', pinyin: 'Kuàilè xuéxí bú pà nán', translationVi: 'Học vui vẻ, không ngại khó' },
    ],
  },
  {
    id: 'chiu-morning-02', title: '早安新一天', artist: 'Chiu Learning Studio',
    coverImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&auto=format&fit=crop&q=80',
    difficulty: 'Beginner', hskLevel: 'HSK 1', duration: '1:50', mood: 'upbeat', bpm: 124,
    lyrics: [
      { time: 0, chinese: '早安朋友，新的一天', pinyin: 'Zǎo ān péngyou, xīn de yì tiān', translationVi: 'Chào buổi sáng bạn ơi, một ngày mới' },
      { time: 8, chinese: '太阳出来，笑一笑', pinyin: 'Tàiyáng chūlái, xiào yí xiào', translationVi: 'Mặt trời lên, hãy mỉm cười' },
      { time: 16, chinese: '喝杯水，再出发', pinyin: 'Hē bēi shuǐ, zài chūfā', translationVi: 'Uống một cốc nước rồi bắt đầu' },
      { time: 24, chinese: '今天我要说中文', pinyin: 'Jīntiān wǒ yào shuō Zhōngwén', translationVi: 'Hôm nay mình sẽ nói tiếng Trung' },
      { time: 32, chinese: '一个单词，一句话', pinyin: 'Yí ge dāncí, yí jù huà', translationVi: 'Một từ, một câu' },
      { time: 40, chinese: '小小努力有大变化', pinyin: 'Xiǎoxiǎo nǔlì yǒu dà biànhuà', translationVi: 'Nỗ lực nhỏ tạo nên thay đổi lớn' },
    ],
  },
  {
    id: 'chiu-friends-03', title: '一起走吧', artist: 'Chiu Learning Studio',
    coverImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80',
    difficulty: 'Beginner', hskLevel: 'HSK 2', duration: '1:56', mood: 'upbeat', bpm: 122,
    lyrics: [
      { time: 0, chinese: '一起走吧，一起笑吧', pinyin: 'Yìqǐ zǒu ba, yìqǐ xiào ba', translationVi: 'Cùng đi nhé, cùng cười nhé' },
      { time: 8, chinese: '今天的风刚刚好', pinyin: 'Jīntiān de fēng gānggāng hǎo', translationVi: 'Gió hôm nay thật vừa đẹp' },
      { time: 16, chinese: '你有时间吗，我们去公园', pinyin: 'Nǐ yǒu shíjiān ma, wǒmen qù gōngyuán', translationVi: 'Bạn có thời gian không, chúng ta đi công viên nhé' },
      { time: 24, chinese: '边走边说学到的新词', pinyin: 'Biān zǒu biān shuō xué dào de xīn cí', translationVi: 'Vừa đi vừa nói những từ mới đã học' },
      { time: 32, chinese: '说错没关系，再说一次', pinyin: 'Shuō cuò méi guānxi, zài shuō yí cì', translationVi: 'Nói sai không sao, nói lại một lần' },
      { time: 40, chinese: '朋友在身边，学习更有趣', pinyin: 'Péngyou zài shēnbiān, xuéxí gèng yǒuqù', translationVi: 'Có bạn bên cạnh, học tập thú vị hơn' },
    ],
  },
  {
    id: 'chiu-market-04', title: '去买东西', artist: 'Chiu Learning Studio',
    coverImage: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&auto=format&fit=crop&q=80',
    difficulty: 'Beginner', hskLevel: 'HSK 2', duration: '2:02', mood: 'upbeat', bpm: 116,
    lyrics: [
      { time: 0, chinese: '我要去商店买东西', pinyin: 'Wǒ yào qù shāngdiàn mǎi dōngxi', translationVi: 'Mình muốn đi cửa hàng mua đồ' },
      { time: 8, chinese: '这个多少，那个多少', pinyin: 'Zhège duōshao, nàge duōshao', translationVi: 'Cái này bao nhiêu, cái kia bao nhiêu' },
      { time: 16, chinese: '太贵了，可以便宜一点吗', pinyin: 'Tài guì le, kěyǐ piányi yìdiǎn ma', translationVi: 'Đắt quá, có thể rẻ hơn một chút không?' },
      { time: 24, chinese: '谢谢你，我买两个', pinyin: 'Xièxie nǐ, wǒ mǎi liǎng ge', translationVi: 'Cảm ơn bạn, mình mua hai cái' },
      { time: 32, chinese: '拿好东西，开心回家', pinyin: 'Ná hǎo dōngxi, kāixīn huí jiā', translationVi: 'Cầm đồ thật cẩn thận, vui vẻ về nhà' },
      { time: 40, chinese: '生活中文，马上会说', pinyin: 'Shēnghuó Zhōngwén, mǎshàng huì shuō', translationVi: 'Tiếng Trung đời sống, học là dùng được ngay' },
    ],
  },
  {
    id: 'chiu-travel-05', title: '出发去旅行', artist: 'Chiu Learning Studio',
    coverImage: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=600&auto=format&fit=crop&q=80',
    difficulty: 'Intermediate', hskLevel: 'HSK 3', duration: '2:08', mood: 'upbeat', bpm: 120,
    lyrics: [
      { time: 0, chinese: '背上背包，我们出发', pinyin: 'Bēi shàng bēibāo, wǒmen chūfā', translationVi: 'Đeo ba lô lên, chúng ta xuất phát' },
      { time: 8, chinese: '下一站会是什么地方', pinyin: 'Xià yí zhàn huì shì shénme dìfang', translationVi: 'Trạm tiếp theo sẽ là nơi nào nhỉ?' },
      { time: 16, chinese: '问问路，再看地图', pinyin: 'Wèn wen lù, zài kàn dìtú', translationVi: 'Hỏi đường rồi xem bản đồ' },
      { time: 24, chinese: '听懂一句，就多一份勇气', pinyin: 'Tīng dǒng yí jù, jiù duō yí fèn yǒngqì', translationVi: 'Hiểu thêm một câu là có thêm một phần tự tin' },
      { time: 32, chinese: '说出一句，朋友就来了', pinyin: 'Shuō chū yí jù, péngyou jiù lái le', translationVi: 'Nói ra một câu, bạn bè sẽ đến' },
      { time: 40, chinese: '边旅行，边学中文', pinyin: 'Biān lǚxíng, biān xué Zhōngwén', translationVi: 'Vừa du lịch, vừa học tiếng Trung' },
    ],
  },
  {
    id: 'chiu-work-06', title: '加油今天', artist: 'Chiu Learning Studio',
    coverImage: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&auto=format&fit=crop&q=80',
    difficulty: 'Intermediate', hskLevel: 'HSK 3', duration: '2:10', mood: 'motivational', bpm: 112,
    lyrics: [
      { time: 0, chinese: '今天还有很多事要做', pinyin: 'Jīntiān hái yǒu hěn duō shì yào zuò', translationVi: 'Hôm nay vẫn còn nhiều việc phải làm' },
      { time: 8, chinese: '一步一步，不要着急', pinyin: 'Yí bù yí bù, bú yào zháojí', translationVi: 'Từng bước một, đừng vội' },
      { time: 16, chinese: '先听清楚，再说清楚', pinyin: 'Xiān tīng qīngchu, zài shuō qīngchu', translationVi: 'Nghe rõ trước, rồi nói rõ' },
      { time: 24, chinese: '每天坚持，就会更好', pinyin: 'Měitiān jiānchí, jiù huì gèng hǎo', translationVi: 'Kiên trì mỗi ngày rồi sẽ tốt hơn' },
      { time: 32, chinese: '错了改，忘了再学', pinyin: 'Cuò le gǎi, wàng le zài xué', translationVi: 'Sai thì sửa, quên thì học lại' },
      { time: 40, chinese: '加油今天，我一定可以', pinyin: 'Jiāyóu jīntiān, wǒ yídìng kěyǐ', translationVi: 'Cố lên hôm nay, mình nhất định làm được' },
    ],
  },
  {
    id: 'chiu-weekend-07', title: '周末好开心', artist: 'Chiu Learning Studio',
    coverImage: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&auto=format&fit=crop&q=80',
    difficulty: 'Intermediate', hskLevel: 'HSK 4', duration: '2:14', mood: 'upbeat', bpm: 126,
    lyrics: [
      { time: 0, chinese: '周末到了，大家一起玩', pinyin: 'Zhōumò dào le, dàjiā yìqǐ wán', translationVi: 'Cuối tuần đến rồi, mọi người cùng chơi nhé' },
      { time: 8, chinese: '唱一首歌，跳一支舞', pinyin: 'Chàng yì shǒu gē, tiào yì zhī wǔ', translationVi: 'Hát một bài, nhảy một điệu' },
      { time: 16, chinese: '学会的新词今天用起来', pinyin: 'Xuéhuì de xīn cí jīntiān yòng qǐlái', translationVi: 'Từ mới đã học hôm nay đem ra dùng' },
      { time: 24, chinese: '说得自然，笑得更大声', pinyin: 'Shuō de zìrán, xiào de gèng dàshēng', translationVi: 'Nói tự nhiên, cười thật to' },
      { time: 32, chinese: '听一句，跟一句', pinyin: 'Tīng yí jù, gēn yí jù', translationVi: 'Nghe một câu, nói theo một câu' },
      { time: 40, chinese: '中文也可以这么好玩', pinyin: 'Zhōngwén yě kěyǐ zhème hǎowán', translationVi: 'Tiếng Trung cũng có thể vui đến thế' },
    ],
  },
  {
    id: 'chiu-night-08', title: '晚安小星星', artist: 'Chiu Learning Studio',
    coverImage: 'https://images.unsplash.com/photo-1534791547706-4f6f0b7e4c5d?w=600&auto=format&fit=crop&q=80',
    difficulty: 'Beginner', hskLevel: 'HSK 1', duration: '1:48', mood: 'chill', bpm: 88,
    lyrics: [
      { time: 0, chinese: '一天结束，月亮出来', pinyin: 'Yì tiān jiéshù, yuèliang chūlái', translationVi: 'Một ngày kết thúc, mặt trăng hiện lên' },
      { time: 8, chinese: '今天学了很多新词', pinyin: 'Jīntiān xué le hěn duō xīn cí', translationVi: 'Hôm nay đã học nhiều từ mới' },
      { time: 16, chinese: '听一遍，再说一遍', pinyin: 'Tīng yí biàn, zài shuō yí biàn', translationVi: 'Nghe một lần, nói lại một lần' },
      { time: 24, chinese: '慢慢学习，不要着急', pinyin: 'Mànmàn xuéxí, bú yào zháojí', translationVi: 'Học từ từ, đừng vội' },
      { time: 32, chinese: '明天醒来继续加油', pinyin: 'Míngtiān xǐng lái jìxù jiāyóu', translationVi: 'Ngày mai thức dậy tiếp tục cố gắng' },
      { time: 40, chinese: '晚安，做个好梦', pinyin: 'Wǎn ān, zuò ge hǎo mèng', translationVi: 'Chúc ngủ ngon, mơ đẹp nhé' },
    ],
  },
];

export const CHINESE_SONGS: SongItem[] = [...CHINESE_SONGS, ...EXTRA_LEARNING_SONGS];

export interface PronunciationAnalysis {
  overall:number|null; tones:number|null; initials:number|null; finals:number|null; fluency:number|null;
  feedback:string; limited:boolean;
}
export interface PronunciationService {
  analyzePronunciation(targetText:string,recognizedText:string,audioData?:Blob):Promise<PronunciationAnalysis>;
}
export const pronunciationService:PronunciationService={
  async analyzePronunciation(targetText,recognizedText){
    const target=targetText.trim(), heard=recognizedText.trim();
    if(!target||!heard)return {overall:null,tones:null,initials:null,finals:null,fluency:null,feedback:'Chưa đủ dữ liệu để đánh giá chính xác.',limited:true};
    return {overall:null,tones:null,initials:null,finals:null,fluency:null,feedback:target===heard?'Nhận diện đúng nội dung. Chưa thể đánh giá chính xác chất lượng âm thanh.':'Nội dung nhận diện khác mục tiêu. Chưa thể đánh giá chính xác phát âm.',limited:true};
  }
};

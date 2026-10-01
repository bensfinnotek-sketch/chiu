export interface PronunciationAnalysis { overall:number|null; tones:number|null; initials:number|null; finals:number|null; fluency:number|null; feedback:string; limited:boolean; }
export interface PronunciationService { analyzePronunciation(targetText:string,recognizedText:string,audioData?:Blob):Promise<PronunciationAnalysis>; }
export const pronunciationService:PronunciationService={
  async analyzePronunciation(targetText,recognizedText){
    const target=targetText.trim(), heard=recognizedText.trim();
    if(!target||!heard)return {overall:null,tones:null,initials:null,finals:null,fluency:null,feedback:'Chưa đủ dữ liệu để nhận xét phát âm.',limited:true};
    return {overall:null,tones:null,initials:null,finals:null,fluency:null,feedback:target===heard?'Nhận diện câu trùng với mục tiêu. Đây chỉ là kiểm tra văn bản, chưa phải chấm âm học.':'Câu nhận diện khác mục tiêu. Hãy thử nói chậm hơn và rõ từng âm tiết.',limited:true};
  }
};
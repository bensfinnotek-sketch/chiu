// Lightweight browser-native music engine for Chiu learning songs.
// It creates a real melody, bass pulse, and percussion-like rhythm with Web Audio,
// so the Music page is not limited to speech synthesis of the lyrics.

type StopHandle = () => void;

const NOTE: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880,
  B5: 987.77,
};

const MELODIES: Record<string, string[]> = {
  'chiu-happy-01': ['C5','E5','G5','G5','A5','G5','E5','D5','C5','E5','G5','A5','G5','E5','D5','C5'],
  'chiu-morning-02': ['G4','A4','B4','D5','B4','A4','G4','E4','G4','A4','B4','D5','E5','D5','B4','G4'],
  'chiu-friends-03': ['C5','C5','E5','G5','E5','D5','C5','D5','E5','G5','A5','G5','E5','D5','C5','C5'],
  'chiu-market-04': ['G4','B4','D5','D5','B4','A4','G4','A4','B4','D5','E5','D5','B4','A4','G4','G4'],
  'chiu-travel-05': ['E4','G4','A4','B4','A4','G4','E4','G4','A4','C5','B4','A4','G4','E4','D4','E4'],
  'chiu-work-06': ['C5','C5','G4','A4','G4','E4','F4','G4','A4','C5','B4','A4','G4','E4','D4','C4'],
  'chiu-weekend-07': ['D5','F5','A5','A5','G5','F5','E5','D5','F5','A5','C5','B5','A5','G5','F5','D5'],
  'chiu-night-08': ['E4','G4','B4','A4','G4','E4','D4','E4','G4','A4','G4','E4','D4','C4','D4','E4'],
};

const CHORDS: Record<string, string[][]> = {
  upbeat: [['C4','E4','G4'],['F4','A4','C5'],['G4','B4','D5'],['C4','E4','G4']],
  motivational: [['C4','E4','G4'],['G4','B4','D5'],['A4','C5','E5'],['F4','A4','C5']],
  chill: [['C4','E4','G4'],['A4','C5','E5'],['F4','A4','C5'],['G4','B4','D5']],
  romantic: [['C4','E4','G4'],['A4','C5','E5'],['F4','A4','C5'],['G4','B4','D5']],
};

class MusicService {
  private context: AudioContext | null = null;
  private timer: number | null = null;
  private activeSources: OscillatorNode[] = [];
  private gainNodes: GainNode[] = [];

  private ensureContext() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      this.context = new AudioContextClass();
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }

  public play(songId: string, bpm = 120, mood: 'upbeat'|'chill'|'romantic'|'motivational' = 'upbeat', onEnd?: () => void): StopHandle {
    this.stop();
    const ctx = this.ensureContext();
    if (!ctx) return () => {};

    const melody = MELODIES[songId] || MELODIES['chiu-happy-01'];
    const chords = CHORDS[mood] || CHORDS.upbeat;
    const beat = 60 / bpm;
    let step = 0;

    const playTone = (freq: number, duration: number, type: OscillatorType, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.03);
      this.activeSources.push(osc);
      this.gainNodes.push(gain);
    };

    const tick = () => {
      const note = NOTE[melody[step % melody.length]];
      if (note) playTone(note, beat * 0.82, 'triangle', 0.055);

      if (step % 4 === 0) {
        const chord = chords[Math.floor(step / 4) % chords.length];
        chord.forEach(name => {
          const freq = NOTE[name];
          if (freq) playTone(freq / 2, beat * 3.7, 'sine', 0.018);
        });
      }

      // A soft pulse gives the melody a song-like groove without using a recorded track.
      if (step % 2 === 0) playTone(90, beat * 0.12, 'sine', 0.018);

      step += 1;
      if (step >= melody.length * 4) {
        onEnd?.();
        this.stop();
        return;
      }
      this.timer = window.setTimeout(tick, beat * 1000);
    };

    tick();
    return () => this.stop();
  }

  public stop() {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.activeSources.forEach(source => {
      try { source.stop(); } catch { /* already stopped */ }
    });
    this.activeSources = [];
    this.gainNodes = [];
  }
}

export const musicService = new MusicService();

// Synthesized Audio using Web Audio API - Kid-friendly & Cheerful

class SoundEffects {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  // Wooden xylophone / candy block pop when ball tumbles
  public playTumbleClick(pitchVariation: number = 1) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Cheerful marimba notes around C5-G5
      const baseFreq = 523.25 * pitchVariation;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.06);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  // Magical ascending sparkle when starting spin
  public playSpinStart() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73]; // A major sparkle

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.08, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.22);
      });
    } catch {}
  }

  // Cartoon pop / boing when ball falls through chute
  public playBallDrop() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Pop / Boing effect
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {}
  }

  // Joyful kid fanfare / celebration bells
  public playRevealChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Joyful chime arpeggio: C5, E5, G5, B5, C6 + celebration bell
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];

      notes.forEach((freq, index) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.07);

        gain.gain.setValueAtTime(0.15, now + index * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + index * 0.07);
        osc.stop(now + index * 0.07 + 0.65);
      });
    } catch {}
  }
}

export const sound = new SoundEffects();

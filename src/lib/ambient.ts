import { type Emotion } from "@/data/locations";

interface EmotionPreset {
  filterType: BiquadFilterType;
  filterFreq: number;
  filterQ: number;
  noiseGain: number;
  droneNotes: number[];
  droneType: OscillatorType;
  droneGain: number;
  lfoRate: number;
  lfoDepth: number;
  masterGain: number;
}

const PRESETS: Record<Emotion, EmotionPreset> = {
  // Slow, low, urgent — Amazon, reefs, etc.
  critical: {
    filterType: "lowpass",
    filterFreq: 380,
    filterQ: 1.2,
    noiseGain: 0.18,
    droneNotes: [55, 82.4, 110], // A1, E2, A2
    droneType: "sawtooth",
    droneGain: 0.05,
    lfoRate: 0.08,
    lfoDepth: 120,
    masterGain: 0.35,
  },
  // Cold wind, melancholy — Arctic, Antarctica, Venice
  sad: {
    filterType: "lowpass",
    filterFreq: 600,
    filterQ: 0.8,
    noiseGain: 0.22,
    droneNotes: [73.4, 110, 146.8], // D2, A2, D3
    droneType: "sine",
    droneGain: 0.06,
    lfoRate: 0.05,
    lfoDepth: 200,
    masterGain: 0.38,
  },
  // Ocean swell, calm — Pacific, Sahara, Mariana
  calm: {
    filterType: "lowpass",
    filterFreq: 800,
    filterQ: 0.6,
    noiseGain: 0.25,
    droneNotes: [98, 146.8, 196], // G2, D3, G3
    droneType: "sine",
    droneGain: 0.04,
    lfoRate: 0.12,
    lfoDepth: 250,
    masterGain: 0.32,
  },
  // Soft forest hush, hopeful — Congo, Iceland, Galápagos
  healing: {
    filterType: "highpass",
    filterFreq: 400,
    filterQ: 0.5,
    noiseGain: 0.14,
    droneNotes: [130.8, 196, 261.6], // C3, G3, C4
    droneType: "triangle",
    droneGain: 0.05,
    lfoRate: 0.15,
    lfoDepth: 180,
    masterGain: 0.34,
  },
  // City hum, restless — Tokyo, NYC, Dubai
  angry: {
    filterType: "bandpass",
    filterFreq: 1200,
    filterQ: 2.5,
    noiseGain: 0.16,
    droneNotes: [87.3, 116.5, 174.6], // F2, A#2, F3
    droneType: "square",
    droneGain: 0.03,
    lfoRate: 0.2,
    lfoDepth: 400,
    masterGain: 0.3,
  },
};

class AmbientBed {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private drones: { osc: OscillatorNode; gain: GainNode }[] = [];
  private currentEmotion: Emotion | null = null;
  private muted = false;

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private makePinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const seconds = 4;
    const buffer = ctx.createBuffer(
      1,
      ctx.sampleRate * seconds,
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    // Voss-McCartney approximation
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private teardownVoices() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.drones.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.8);
        osc.stop(t + 0.9);
      } catch {
        /* noop */
      }
    });
    this.drones = [];
    if (this.noise) {
      try {
        this.noise.stop(t + 0.9);
      } catch {
        /* noop */
      }
      this.noise = null;
    }
    if (this.lfo) {
      try {
        this.lfo.stop(t + 0.9);
      } catch {
        /* noop */
      }
      this.lfo = null;
    }
    this.lfoGain = null;
    this.filter = null;
  }

  setEmotion(emotion: Emotion | null) {
    if (emotion === this.currentEmotion) return;
    this.currentEmotion = emotion;

    if (!emotion) {
      // Fade out everything
      if (this.ctx && this.master) {
        const t = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.setValueAtTime(this.master.gain.value, t);
        this.master.gain.linearRampToValueAtTime(0, t + 1.2);
      }
      setTimeout(() => this.teardownVoices(), 1300);
      return;
    }

    const ctx = this.ensureCtx();
    const preset = PRESETS[emotion];

    // Crossfade: fade master down briefly, swap voices, fade back in.
    const t = ctx.currentTime;
    const master = this.master!;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0, t + 0.6);

    setTimeout(() => {
      if (this.currentEmotion !== emotion || !this.ctx) return;
      this.teardownVoices();
      const c = this.ctx;
      const now = c.currentTime;

      // Filter
      const filter = c.createBiquadFilter();
      filter.type = preset.filterType;
      filter.frequency.value = preset.filterFreq;
      filter.Q.value = preset.filterQ;
      this.filter = filter;

      // LFO modulating filter freq
      const lfo = c.createOscillator();
      lfo.frequency.value = preset.lfoRate;
      const lfoGain = c.createGain();
      lfoGain.gain.value = preset.lfoDepth;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();
      this.lfo = lfo;
      this.lfoGain = lfoGain;

      // Pink noise → filter → master
      const noise = c.createBufferSource();
      noise.buffer = this.makePinkNoiseBuffer(c);
      noise.loop = true;
      const noiseGain = c.createGain();
      noiseGain.gain.value = preset.noiseGain;
      noise.connect(noiseGain).connect(filter).connect(master);
      noise.start();
      this.noise = noise;

      // Drone chord
      preset.droneNotes.forEach((freq) => {
        const osc = c.createOscillator();
        osc.type = preset.droneType;
        osc.frequency.value = freq;
        // Subtle detune for warmth
        osc.detune.value = (Math.random() - 0.5) * 8;
        const g = c.createGain();
        g.gain.value = 0;
        g.gain.linearRampToValueAtTime(preset.droneGain, now + 1.5);
        osc.connect(g).connect(master);
        osc.start();
        this.drones.push({ osc, gain: g });
      });

      // Fade master back up
      const target = this.muted ? 0 : preset.masterGain;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(target, now + 1.8);
    }, 650);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const target = muted
      ? 0
      : this.currentEmotion
        ? PRESETS[this.currentEmotion].masterGain
        : 0;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(target, t + 0.6);
  }

  isMuted() {
    return this.muted;
  }

  dispose() {
    this.teardownVoices();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.master = null;
    }
  }
}

let bedSingleton: AmbientBed | null = null;
export function getAmbientBed(): AmbientBed {
  if (!bedSingleton) bedSingleton = new AmbientBed();
  return bedSingleton;
}

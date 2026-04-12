'use client';

// ─── Notification Sound Engine ──────────────────────────────
// Primary sound: Real "Fahhh" MP3 from YouTube (TajAzT3CVJc)
// Fallback: Synthesized alternatives using Web Audio API
// Trending meme sounds: Hindi/Bangla favorites synthesized via Web Audio

type SoundType = 'fahhh' | 'ding' | 'airhorn' | 'vine-boom' | 'mlg-horn' | 'bruuh' | 'tutu' | 'oh-no' | 'sheesh' | 'sad-violin' | 'meme-bass' | 'bangla-beat';

interface SoundSettings {
  enabled: boolean;
  volume: number;       // 0.0 - 1.0
  soundType: SoundType;
}

const SETTINGS_KEY = 'pu-alrms-sound-settings';

const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 0.8,
  soundType: 'fahhh',
};

// ─── Audio Elements (HTML5 Audio for MP3 files) ────────────
let fahhhAudio: HTMLAudioElement | null = null;

function getFahhhAudio(): HTMLAudioElement {
  if (!fahhhAudio) {
    fahhhAudio = new Audio('/sounds/fahhh.mp3');
    fahhhAudio.preload = 'auto';
  }
  fahhhAudio.currentTime = 0;
  return fahhhAudio;
}

// ─── Audio Context (lazy init for synthesized sounds) ───────
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ─── Real "Fahhh" Sound Playback ───────────────────────────

function playFahhh(vol: number) {
  try {
    const audio = getFahhhAudio();
    audio.volume = vol;
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {
        setTimeout(() => {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }, 100);
      });
    }
  } catch {}
}

// ─── Synthesized Meme Sounds ───────────────────────────────

/** Pleasant ding notification sound */
function playDing(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(vol, now + 0.01);
  master.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
  master.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1320, now);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(vol * 0.5, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

  const osc2Gain = ctx.createGain();
  osc2Gain.gain.setValueAtTime(vol * 0.3, now);
  osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  osc.connect(oscGain).connect(master);
  osc2.connect(osc2Gain).connect(master);

  osc.start(now);
  osc.stop(now + 1.5);
  osc2.start(now);
  osc2.stop(now + 1.0);
}

/** Air horn meme sound */
function playAirhorn(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;
  const duration = 0.7;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(vol * 0.8, now + 0.02);
  master.gain.setValueAtTime(vol * 0.8, now + duration - 0.1);
  master.gain.linearRampToValueAtTime(0, now + duration);
  master.connect(ctx.destination);

  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(523, now);
  const osc2 = ctx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(530, now);
  const osc3 = ctx.createOscillator();
  osc3.type = 'sawtooth';
  osc3.frequency.setValueAtTime(660, now);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1000;
  filter.Q.value = 2;

  const g1 = ctx.createGain(); g1.gain.value = vol * 0.4;
  const g2 = ctx.createGain(); g2.gain.value = vol * 0.4;
  const g3 = ctx.createGain(); g3.gain.value = vol * 0.3;

  osc1.connect(g1).connect(filter).connect(master);
  osc2.connect(g2).connect(filter).connect(master);
  osc3.connect(g3).connect(filter).connect(master);

  osc1.start(now); osc1.stop(now + duration);
  osc2.start(now); osc2.stop(now + duration);
  osc3.start(now); osc3.stop(now + duration);
}

/** Vine Boom - deep impact bass sound */
function playVineBoom(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;
  const duration = 1.5;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(vol, now + 0.005);
  master.gain.exponentialRampToValueAtTime(0.001, now + duration);
  master.connect(ctx.destination);

  const bass = ctx.createOscillator();
  bass.type = 'sine';
  bass.frequency.setValueAtTime(80, now);
  bass.frequency.exponentialRampToValueAtTime(30, now + 0.3);
  bass.frequency.setValueAtTime(30, now + 0.3);

  const bassGain = ctx.createGain();
  bassGain.gain.setValueAtTime(vol, now);
  bassGain.gain.exponentialRampToValueAtTime(vol * 0.3, now + 0.1);
  bassGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const bufferSize = ctx.sampleRate * 0.3;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) noiseData[i] = (Math.random() * 2 - 1);
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(500, now);
  noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.2);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(vol * 0.8, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  const mid = ctx.createOscillator();
  mid.type = 'triangle';
  mid.frequency.setValueAtTime(150, now);
  mid.frequency.exponentialRampToValueAtTime(60, now + 0.5);
  const midGain = ctx.createGain();
  midGain.gain.setValueAtTime(vol * 0.5, now);
  midGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  bass.connect(bassGain).connect(master);
  noise.connect(noiseFilter).connect(noiseGain).connect(master);
  mid.connect(midGain).connect(master);

  bass.start(now); bass.stop(now + duration);
  noise.start(now); noise.stop(now + 0.3);
  mid.start(now); mid.stop(now + 1.0);
}

/** MLG Horn - the classic MLG hitmarker sound combined with a horn */
function playMLGHorn(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1800 + i * 200;
    const gain = ctx.createGain();
    const t = now + i * 0.08;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol * 0.3, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.15);
  }
  setTimeout(() => playAirhorn(ctx, vol * 0.7), 300);
}

// ─── Trending Meme Sounds (Hindi/Bangla/Global) ──────────

/** Bruh - the classic "bruh" descending tone meme */
function playBruh(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(vol * 0.9, now + 0.02);
  master.gain.setValueAtTime(vol * 0.9, now + 0.6);
  master.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  master.connect(ctx.destination);

  // Descending "bruuuh" pitch
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(280, now);
  osc.frequency.linearRampToValueAtTime(120, now + 0.8);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.linearRampToValueAtTime(300, now + 0.8);
  filter.Q.value = 5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol * 0.5, now);
  gain.gain.exponentialRampToValueAtTime(vol * 0.2, now + 0.6);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

  // Add vibrato for that cartoonish bruh feel
  const vibrato = ctx.createOscillator();
  vibrato.type = 'sine';
  vibrato.frequency.value = 6;
  const vibratoGain = ctx.createGain();
  vibratoGain.gain.value = 15;
  vibrato.connect(vibratoGain).connect(osc.frequency);
  vibrato.start(now);
  vibrato.stop(now + 1.2);

  osc.connect(filter).connect(gain).connect(master);
  osc.start(now); osc.stop(now + 1.2);
}

/** Tu Tu Tu Tu - the Hindi meme "tu tu" sound (two-tone siren) */
function playTutu(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(vol * 0.7, now + 0.02);

  // Two-tone alternating pattern
  for (let i = 0; i < 6; i++) {
    const freq = i % 2 === 0 ? 880 : 1100;
    const t = now + i * 0.15;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol * 0.4, t + 0.01);
    gain.gain.setValueAtTime(vol * 0.4, t + 0.1);
    gain.gain.linearRampToValueAtTime(0, t + 0.14);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 3;

    osc.connect(filter).connect(gain).connect(master);
    osc.start(t); osc.stop(t + 0.14);
  }

  master.gain.linearRampToValueAtTime(0, now + 1.0);
  master.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
}

/** Oh No No No - the Hindi "oh no" dramatic sound */
function playOhNo(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;

  // Three descending "oh no" tones
  const notes = [440, 370, 330];
  for (let i = 0; i < 3; i++) {
    const t = now + i * 0.25;
    const duration = 0.3;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(notes[i], t);
    osc.frequency.linearRampToValueAtTime(notes[i] * 0.85, t + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol * 0.5, t + 0.02);
    gain.gain.setValueAtTime(vol * 0.5, t + duration * 0.6);
    gain.gain.linearRampToValueAtTime(0, t + duration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t); osc.stop(t + duration);
  }

  // Dramatic bass drop at the end
  const bassTime = now + 0.75;
  const bass = ctx.createOscillator();
  bass.type = 'sine';
  bass.frequency.setValueAtTime(200, bassTime);
  bass.frequency.exponentialRampToValueAtTime(60, bassTime + 0.5);

  const bassGain = ctx.createGain();
  bassGain.gain.setValueAtTime(vol * 0.6, bassTime);
  bassGain.gain.exponentialRampToValueAtTime(0.001, bassTime + 0.5);

  bass.connect(bassGain).connect(ctx.destination);
  bass.start(bassTime); bass.stop(bassTime + 0.5);
}

/** Sheesh - the "sheesh" cool meme sound */
function playSheesh(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;
  const duration = 0.6;

  // Quick ascending "shhh" whistle
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2000, now);
  osc.frequency.exponentialRampToValueAtTime(4000, now + 0.1);
  osc.frequency.setValueAtTime(4000, now + 0.15);
  osc.frequency.exponentialRampToValueAtTime(3500, now + duration);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(3000, now);
  osc2.frequency.exponentialRampToValueAtTime(5000, now + 0.1);
  osc2.frequency.exponentialRampToValueAtTime(4200, now + duration);

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(vol * 0.35, now + 0.03);
  master.gain.setValueAtTime(vol * 0.35, now + duration * 0.5);
  master.gain.exponentialRampToValueAtTime(0.001, now + duration);
  master.connect(ctx.destination);

  const g1 = ctx.createGain(); g1.gain.value = vol * 0.3;
  const g2 = ctx.createGain(); g2.gain.value = vol * 0.2;

  osc.connect(g1).connect(master);
  osc2.connect(g2).connect(master);

  osc.start(now); osc.stop(now + duration);
  osc2.start(now); osc2.stop(now + duration);

  // Noise burst for "sh" sound
  const bufSize = ctx.sampleRate * 0.15;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  const src = ctx.createBufferSource();
  src.buffer = buf;

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 5000;
  bp.Q.value = 1;

  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(vol * 0.25, now);
  nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  src.connect(bp).connect(nGain).connect(ctx.destination);
  src.start(now); src.stop(now + 0.15);
}

/** Sad Violin - the Despacito-era sad meme violin */
function playSadViolin(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;

  // Minor descending notes (D minor arpeggio)
  const notes = [
    { freq: 587, start: 0, dur: 0.4 },    // D5
    { freq: 440, start: 0.35, dur: 0.4 },  // A4
    { freq: 349, start: 0.7, dur: 0.4 },   // F4
    { freq: 294, start: 1.05, dur: 0.5 },  // D4
    { freq: 262, start: 1.5, dur: 0.6 },   // C4
  ];

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(vol * 0.5, now + 0.05);
  master.gain.linearRampToValueAtTime(vol * 0.5, now + 1.8);
  master.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
  master.connect(ctx.destination);

  for (const note of notes) {
    const t = now + note.start;

    // Main tone (triangle for softer feel)
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note.freq, t);
    osc.frequency.linearRampToValueAtTime(note.freq * 0.97, t + note.dur);

    // Vibrato
    const vib = ctx.createOscillator();
    vib.type = 'sine';
    vib.frequency.value = 5;
    const vibGain = ctx.createGain();
    vibGain.gain.value = 3;
    vib.connect(vibGain).connect(osc.frequency);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * 0.4, t + 0.03);
    g.gain.setValueAtTime(vol * 0.4, t + note.dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, t + note.dur);

    // Light reverb simulation via delayed quiet copy
    const delay = ctx.createDelay(0.5);
    delay.delayTime.value = 0.15;
    const dGain = ctx.createGain();
    dGain.gain.value = vol * 0.15;

    osc.connect(g).connect(master);
    osc.connect(delay).connect(dGain).connect(master);
    vib.start(t); vib.stop(t + note.dur);
    osc.start(t); osc.stop(t + note.dur);
  }
}

/** Meme Bass Drop - the trending bass boosted meme drop */
function playMemeBass(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;

  // Quick ascending buildup
  const buildNotes = [200, 300, 400, 500];
  for (let i = 0; i < buildNotes.length; i++) {
    const t = now + i * 0.08;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(buildNotes[i], t);

    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 400;
    osc.connect(f).connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.08);
  }

  // THE DROP - massive bass
  const dropTime = now + 0.35;
  const bass = ctx.createOscillator();
  bass.type = 'sine';
  bass.frequency.setValueAtTime(100, dropTime);
  bass.frequency.exponentialRampToValueAtTime(35, dropTime + 0.3);

  const bassGain = ctx.createGain();
  bassGain.gain.setValueAtTime(vol, dropTime);
  bassGain.gain.exponentialRampToValueAtTime(0.001, dropTime + 1.2);

  // Distortion noise
  const nBuf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
  const nData = nBuf.getChannelData(0);
  for (let i = 0; i < nData.length; i++) nData[i] = (Math.random() * 2 - 1);
  const nSrc = ctx.createBufferSource();
  nSrc.buffer = nBuf;

  const nFilter = ctx.createBiquadFilter();
  nFilter.type = 'lowpass';
  nFilter.frequency.setValueAtTime(300, dropTime);
  nFilter.frequency.exponentialRampToValueAtTime(60, dropTime + 0.2);

  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(vol * 0.6, dropTime);
  nGain.gain.exponentialRampToValueAtTime(0.001, dropTime + 0.3);

  bass.connect(bassGain).connect(ctx.destination);
  nSrc.connect(nFilter).connect(nGain).connect(ctx.destination);
  bass.start(dropTime); bass.stop(dropTime + 1.2);
  nSrc.start(dropTime); nSrc.stop(dropTime + 0.2);

  // Sub bass rumble
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(45, dropTime);
  sub.frequency.exponentialRampToValueAtTime(25, dropTime + 0.8);
  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(vol * 0.7, dropTime);
  subGain.gain.exponentialRampToValueAtTime(0.001, dropTime + 1.0);
  sub.connect(subGain).connect(ctx.destination);
  sub.start(dropTime); sub.stop(dropTime + 1.0);
}

/** Bangla Beat - upbeat dhol-style beat (Bangla meme) */
function playBanglaBeat(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;

  // Dhol kick pattern
  const kicks = [0, 0.25, 0.5, 1.0, 1.25, 1.5];
  for (const t of kicks) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now + t);
    osc.frequency.exponentialRampToValueAtTime(40, now + t + 0.1);

    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.7, now + t);
    g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.12);

    osc.connect(g).connect(ctx.destination);
    osc.start(now + t); osc.stop(now + t + 0.12);
  }

  // Hi-hat pattern (noise bursts)
  const hatTimes = [0.125, 0.375, 0.625, 0.75, 0.875, 1.125, 1.375, 1.625, 1.75];
  for (const t of hatTimes) {
    const bufSize = Math.floor(ctx.sampleRate * 0.04);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;

    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.2, now + t);
    g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.04);

    src.connect(hp).connect(g).connect(ctx.destination);
    src.start(now + t); src.stop(now + t + 0.05);
  }

  // Melody (simple pentatonic)
  const melodyNotes = [523, 587, 659, 784, 659, 587, 523, 440];
  for (let i = 0; i < melodyNotes.length; i++) {
    const t = now + i * 0.2;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(melodyNotes[i], t);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * 0.15, t + 0.02);
    g.gain.linearRampToValueAtTime(vol * 0.15, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.2);
  }
}

// ─── Sound Dispatcher ─────────────────────────────────────

/** Play the configured notification sound */
export function playNotificationSound(): void {
  const settings = getSoundSettings();
  if (!settings.enabled) return;

  try {
    if (settings.soundType === 'fahhh') {
      playFahhh(settings.volume);
    } else {
      const ctx = getAudioContext();
      const synthMap: Record<string, (ctx: AudioContext, vol: number) => void> = {
        ding: playDing,
        airhorn: playAirhorn,
        'vine-boom': playVineBoom,
        'mlg-horn': playMLGHorn,
        bruuh: playBruh,
        tutu: playTutu,
        'oh-no': playOhNo,
        sheesh: playSheesh,
        'sad-violin': playSadViolin,
        'meme-bass': playMemeBass,
        'bangla-beat': playBanglaBeat,
      };
      synthMap[settings.soundType]?.(ctx, settings.volume);
    }
  } catch (e) {
    console.warn('Notification sound failed:', e);
  }
}

/** Play a specific sound type (for preview) */
export function previewSound(type: SoundType): void {
  try {
    if (type === 'fahhh') {
      playFahhh(getSoundSettings().volume);
    } else {
      const ctx = getAudioContext();
      const vol = getSoundSettings().volume;
      const synthMap: Record<string, (ctx: AudioContext, vol: number) => void> = {
        ding: playDing,
        airhorn: playAirhorn,
        'vine-boom': playVineBoom,
        'mlg-horn': playMLGHorn,
        bruuh: playBruh,
        tutu: playTutu,
        'oh-no': playOhNo,
        sheesh: playSheesh,
        'sad-violin': playSadViolin,
        'meme-bass': playMemeBass,
        'bangla-beat': playBanglaBeat,
      };
      synthMap[type]?.(ctx, vol);
    }
  } catch (e) {
    console.warn('Sound preview failed:', e);
  }
}

// ─── Settings Management ───────────────────────────────────

export function getSoundSettings(): SoundSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveSoundSettings(settings: Partial<SoundSettings>): SoundSettings {
  const current = getSoundSettings();
  const updated = { ...current, ...settings };
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  }
  return updated;
}

// ─── Sound Info for UI ────────────────────────────────────

export interface SoundOption {
  id: SoundType;
  label: string;
  emoji: string;
  description: string;
  category: string;
  isRealAudio?: boolean;
}

export const SOUND_OPTIONS: SoundOption[] = [
  // Original
  { id: 'fahhh', label: 'Fahhh', emoji: '💨', description: 'The original meme sound (from YouTube)', category: 'Original', isRealAudio: true },

  // Classic Meme
  { id: 'ding', label: 'Ding', emoji: '🔔', description: 'Clean pleasant notification', category: 'Classic' },
  { id: 'airhorn', label: 'Air Horn', emoji: '📯', description: 'Loud air horn blast', category: 'Classic' },
  { id: 'vine-boom', label: 'Vine Boom', emoji: '💥', description: 'Deep bass impact boom', category: 'Classic' },
  { id: 'mlg-horn', label: 'MLG Horn', emoji: '🎮', description: 'Hitmarker + air horn combo', category: 'Classic' },
  { id: 'bruuh', label: 'Bruuh', emoji: '😐', description: 'The classic bruh descending tone', category: 'Trending' },
  { id: 'sheesh', label: 'Sheesh', emoji: '😎', description: 'Cool sheesh whistle sound', category: 'Trending' },

  // Hindi Meme
  { id: 'tutu', label: 'Tu Tu Tu', emoji: '🤣', description: 'Hindi two-tone siren meme', category: 'Hindi' },
  { id: 'oh-no', label: 'Oh No No', emoji: '😮', description: 'Dramatic oh no descending', category: 'Hindi' },
  { id: 'sad-violin', label: 'Sad Violin', emoji: '🎻', description: 'Emotional sad violin tune', category: 'Hindi' },

  // Bangla / Desi Meme
  { id: 'meme-bass', label: 'Bass Drop', emoji: '🔊', description: 'Massive bass drop meme', category: 'Bangla' },
  { id: 'bangla-beat', label: 'Bangla Beat', emoji: '🥁', description: 'Upbeat dhol-style beat', category: 'Bangla' },
];

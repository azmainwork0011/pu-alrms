'use client';

// ─── Notification Sound Engine ──────────────────────────────
// Uses Web Audio API to synthesize meme-style notification sounds.
// No external audio files needed!

type SoundType = 'fart' | 'bruh' | 'ding' | 'airhorn' | 'vine-boom' | 'mlg-horn';

interface SoundSettings {
  enabled: boolean;
  volume: number;       // 0.0 - 1.0
  soundType: SoundType;
}

const SETTINGS_KEY = 'pu-alrms-sound-settings';

const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 0.6,
  soundType: 'fart',
};

// ─── Audio Context (lazy init) ─────────────────────────────
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

// ─── Sound Synthesizers ────────────────────────────────────

/** The classic "faaaa" fart meme sound - descending low-frequency sweep with noise */
function playFart(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;
  const duration = 0.8;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(vol, now + 0.05);
  master.gain.exponentialRampToValueAtTime(0.001, now + duration);
  master.connect(ctx.destination);

  // Main oscillator - sweeps from ~300Hz down to ~60Hz
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
  osc.frequency.exponentialRampToValueAtTime(60, now + duration);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(vol * 0.7, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Second oscillator for body
  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(150, now);
  osc2.frequency.exponentialRampToValueAtTime(40, now + duration * 0.7);

  const osc2Gain = ctx.createGain();
  osc2Gain.gain.setValueAtTime(vol * 0.5, now);
  osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);

  // Noise layer for texture
  const bufferSize = ctx.sampleRate * duration;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.3;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(800, now);
  noiseFilter.frequency.exponentialRampToValueAtTime(200, now + duration);
  noiseFilter.Q.value = 5;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(vol * 0.3, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.9);

  // Connect everything
  osc.connect(oscGain).connect(master);
  osc2.connect(osc2Gain).connect(master);
  noise.connect(noiseFilter).connect(noiseGain).connect(master);

  // Play
  osc.start(now);
  osc.stop(now + duration);
  osc2.start(now);
  osc2.stop(now + duration);
  noise.start(now);
  noise.stop(now + duration);
}

/** "Bruh" meme sound - descending tone with vibrato */
function playBruh(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;
  const duration = 1.2;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(vol, now + 0.03);
  master.gain.setValueAtTime(vol, now + 0.1);
  master.gain.linearRampToValueAtTime(vol * 0.8, now + 0.6);
  master.gain.exponentialRampToValueAtTime(0.001, now + duration);
  master.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(280, now);
  osc.frequency.linearRampToValueAtTime(120, now + 0.6);
  osc.frequency.linearRampToValueAtTime(80, now + duration);

  // Add vibrato for that voice-like quality
  const vibrato = ctx.createOscillator();
  vibrato.type = 'sine';
  vibrato.frequency.value = 6;
  const vibratoGain = ctx.createGain();
  vibratoGain.gain.value = 15;
  vibrato.connect(vibratoGain).connect(osc.frequency);

  const oscGain = ctx.createGain();
  oscGain.gain.value = vol * 0.6;

  // Add some harmonics
  const osc2 = ctx.createOscillator();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(560, now);
  osc2.frequency.linearRampToValueAtTime(240, now + 0.6);
  osc2.frequency.linearRampToValueAtTime(160, now + duration);
  const osc2Gain = ctx.createGain();
  osc2Gain.gain.setValueAtTime(vol * 0.15, now);
  osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, now);
  filter.frequency.linearRampToValueAtTime(800, now + duration);

  osc.connect(oscGain).connect(filter).connect(master);
  osc2.connect(osc2Gain).connect(filter).connect(master);

  vibrato.start(now);
  osc.start(now);
  osc.stop(now + duration);
  osc2.start(now);
  osc2.stop(now + duration);
  vibrato.stop(now + duration);
}

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

  // Two slightly detuned sawtooth waves for that air horn wobble
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

  const gain1 = ctx.createGain();
  gain1.gain.value = vol * 0.4;
  const gain2 = ctx.createGain();
  gain2.gain.value = vol * 0.4;
  const gain3 = ctx.createGain();
  gain3.gain.value = vol * 0.3;

  osc1.connect(gain1).connect(filter).connect(master);
  osc2.connect(gain2).connect(filter).connect(master);
  osc3.connect(gain3).connect(filter).connect(master);

  osc1.start(now);
  osc1.stop(now + duration);
  osc2.start(now);
  osc2.stop(now + duration);
  osc3.start(now);
  osc3.stop(now + duration);
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

  // Deep bass impact
  const bass = ctx.createOscillator();
  bass.type = 'sine';
  bass.frequency.setValueAtTime(80, now);
  bass.frequency.exponentialRampToValueAtTime(30, now + 0.3);
  bass.frequency.setValueAtTime(30, now + 0.3);

  const bassGain = ctx.createGain();
  bassGain.gain.setValueAtTime(vol, now);
  bassGain.gain.exponentialRampToValueAtTime(vol * 0.3, now + 0.1);
  bassGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Noise burst for impact
  const bufferSize = ctx.sampleRate * 0.3;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    noiseData[i] = (Math.random() * 2 - 1);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(500, now);
  noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.2);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(vol * 0.8, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  // Mid "boom" tone
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

  bass.start(now);
  bass.stop(now + duration);
  noise.start(now);
  noise.stop(now + 0.3);
  mid.start(now);
  mid.stop(now + 1.0);
}

/** MLG Horn - the classic MLG hitmarker sound combined with a horn */
function playMLGHorn(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;

  // First: Quick MLG hitmarker "ding ding ding"
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
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Then: Air horn follow-up
  playAirhorn(ctx, vol * 0.7);
}

// ─── Sound Dispatcher ─────────────────────────────────────

const soundFunctions: Record<SoundType, (ctx: AudioContext, vol: number) => void> = {
  fart: playFart,
  bruh: playBruh,
  ding: playDing,
  airhorn: playAirhorn,
  'vine-boom': playVineBoom,
  'mlg-horn': playMLGHorn,
};

/** Play the configured notification sound */
export function playNotificationSound(): void {
  const settings = getSoundSettings();
  if (!settings.enabled) return;

  try {
    const ctx = getAudioContext();
    soundFunctions[settings.soundType](ctx, settings.volume);
  } catch (e) {
    // Silently fail if audio is not supported
    console.warn('Notification sound failed:', e);
  }
}

/** Play a specific sound type (for preview) */
export function previewSound(type: SoundType): void {
  try {
    const ctx = getAudioContext();
    const vol = getSoundSettings().volume;
    soundFunctions[type](ctx, vol);
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
}

export const SOUND_OPTIONS: SoundOption[] = [
  { id: 'fart', label: 'Fart', emoji: '💨', description: 'The classic faaaa meme sound' },
  { id: 'bruh', label: 'Bruh', emoji: '😏', description: 'Deep descending bruh moment' },
  { id: 'ding', label: 'Ding', emoji: '🔔', description: 'Clean pleasant notification' },
  { id: 'airhorn', label: 'Air Horn', emoji: '📯', description: 'Loud air horn blast' },
  { id: 'vine-boom', label: 'Vine Boom', emoji: '💥', description: 'Deep bass impact boom' },
  { id: 'mlg-horn', label: 'MLG Horn', emoji: '🎮', description: 'Hitmarker + air horn combo' },
];

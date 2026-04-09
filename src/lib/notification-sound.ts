'use client';

// ─── Notification Sound Engine ──────────────────────────────
// Primary sound: Real "Fahhh" MP3 from YouTube (TajAzT3CVJc)
// Fallback: Synthesized alternatives using Web Audio API

type SoundType = 'fahhh' | 'ding' | 'airhorn' | 'vine-boom' | 'mlg-horn';

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
  // Reset to start if already played
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
    // Resume audio context if suspended (autoplay policy)
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch((err) => {
        console.warn('Fahhh play blocked:', err.message);
        // Fallback: try once more after short delay
        setTimeout(() => {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }, 100);
      });
    }
  } catch {
    // Audio not available
  }
}

// ─── Synthesized Fallback Sounds ───────────────────────────

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

/** Play the configured notification sound */
export function playNotificationSound(): void {
  const settings = getSoundSettings();
  if (!settings.enabled) return;

  try {
    if (settings.soundType === 'fahhh') {
      // Use real MP3 file for Fahhh sound
      playFahhh(settings.volume);
    } else {
      // Use synthesized sounds for other types
      const ctx = getAudioContext();
      const synthMap: Record<string, (ctx: AudioContext, vol: number) => void> = {
        ding: playDing,
        airhorn: playAirhorn,
        'vine-boom': playVineBoom,
        'mlg-horn': playMLGHorn,
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
  isRealAudio?: boolean;
}

export const SOUND_OPTIONS: SoundOption[] = [
  { id: 'fahhh', label: 'Fahhh', emoji: '💨', description: 'The original meme sound (from YouTube)', isRealAudio: true },
  { id: 'ding', label: 'Ding', emoji: '🔔', description: 'Clean pleasant notification' },
  { id: 'airhorn', label: 'Air Horn', emoji: '📯', description: 'Loud air horn blast' },
  { id: 'vine-boom', label: 'Vine Boom', emoji: '💥', description: 'Deep bass impact boom' },
  { id: 'mlg-horn', label: 'MLG Horn', emoji: '🎮', description: 'Hitmarker + air horn combo' },
];

// Web Audio API sound effects for Quick Quiz
// No external audio files needed - all synthesized in-browser

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15, delay = 0) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch { /* Audio not available */ }
}

function playChord(freqs: number[], duration: number, type: OscillatorType = 'sine', volume = 0.1) {
  freqs.forEach((f, i) => playTone(f, duration, type, volume, i * 0.05));
}

// ─── Correct Answer — bright ascending chime ──────────────────────
export function playCorrectAnswer(): void {
  playTone(523, 0.1, 'sine', 0.15);   // C5
  playTone(659, 0.1, 'sine', 0.15, 0.08); // E5
  playTone(784, 0.2, 'sine', 0.12, 0.16); // G5
  playTone(1047, 0.3, 'sine', 0.1, 0.24); // C6
}

// ─── Wrong Answer — descending buzz ────────────────────────────────
export function playWrongAnswer(): void {
  playTone(300, 0.15, 'sawtooth', 0.08);
  playTone(250, 0.15, 'sawtooth', 0.08, 0.12);
  playTone(200, 0.3, 'sawtooth', 0.06, 0.24);
}

// ─── Timer Warning Tick ───────────────────────────────────────────
export function playTimerWarning(): void {
  playTone(880, 0.05, 'square', 0.06);
}

// ─── Timer Tick (subtle) ──────────────────────────────────────────
export function playTimerTick(): void {
  playTone(600, 0.02, 'sine', 0.03);
}

// ─── Heart Lost — descending sad tone ─────────────────────────────
export function playHeartLost(): void {
  playTone(440, 0.15, 'triangle', 0.1);
  playTone(349, 0.15, 'triangle', 0.08, 0.15);
  playTone(262, 0.3, 'triangle', 0.06, 0.3);
}

// ─── Game Over — dramatic descending sequence ─────────────────────
export function playGameOver(): void {
  playTone(392, 0.2, 'sawtooth', 0.08);  // G4
  playTone(330, 0.2, 'sawtooth', 0.08, 0.2); // E4
  playTone(262, 0.2, 'sawtooth', 0.08, 0.4); // C4
  playTone(196, 0.4, 'sawtooth', 0.06, 0.6); // G3
}

// ─── Win Fanfare — triumphant ascending fanfare ───────────────────
export function playWinFanfare(): void {
  playChord([523, 659, 784], 0.15, 'sine', 0.1);  // C major
  playChord([587, 740, 880], 0.15, 'sine', 0.1, 0.2); // D major
  playChord([659, 830, 988], 0.15, 'sine', 0.1, 0.4); // E major
  playTone(1047, 0.5, 'sine', 0.12, 0.6); // C6
  playTone(1319, 0.5, 'sine', 0.1, 0.7); // E6
  playTone(1568, 0.8, 'sine', 0.08, 0.8); // G6
}

// ─── Perfect Score — special celebration sound ────────────────────
export function playPerfectScore(): void {
  const notes = [523, 659, 784, 1047, 1319, 1568];
  notes.forEach((n, i) => {
    playTone(n, 0.2, 'sine', 0.1, i * 0.1);
    playTone(n * 1.005, 0.2, 'sine', 0.05, i * 0.1); // slight detune for shimmer
  });
}

// ─── Streak Fire — rising whoosh + sparkle ────────────────────────
export function playStreakFire(): void {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch { /* Audio not available */ }
  playTone(1200, 0.15, 'sine', 0.06, 0.2);
  playTone(1500, 0.1, 'sine', 0.04, 0.3);
  playTone(1800, 0.1, 'sine', 0.03, 0.35);
}

// ─── XP Gain — subtle positive ping ───────────────────────────────
export function playXPGain(): void {
  playTone(880, 0.08, 'sine', 0.08);
  playTone(1100, 0.12, 'sine', 0.06, 0.06);
}

// ─── Button Press — subtle click ──────────────────────────────────
export function playButtonPress(): void {
  playTone(800, 0.03, 'sine', 0.05);
}

// ─── Option Select — soft tap ─────────────────────────────────────
export function playOptionSelect(): void {
  playTone(600, 0.04, 'triangle', 0.06);
}

// ─── Slide Transition — quick whoosh ──────────────────────────────
export function playSlideTransition(): void {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch { /* Audio not available */ }
}

// ─── KBC Intro — dramatic ascending chord ────────────────────────
export function playKBCIntro(): void {
  playTone(262, 0.3, 'sine', 0.08);
  playTone(330, 0.3, 'sine', 0.08, 0.1);
  playTone(392, 0.3, 'sine', 0.08, 0.2);
  playTone(523, 0.5, 'sine', 0.1, 0.3);
  playTone(659, 0.5, 'sine', 0.08, 0.4);
  playTone(784, 0.6, 'sine', 0.06, 0.5);
}

// ─── Question Reveal — quick ascending ding ───────────────────────
export function playQuestionReveal(): void {
  playTone(660, 0.08, 'sine', 0.1);
  playTone(880, 0.12, 'sine', 0.08, 0.06);
}

// ─── Lock Kiya Jaye (KBC lock sound) ──────────────────────────────
export function playLockKiyaJaye(): void {
  playTone(220, 0.15, 'square', 0.06);
  playTone(330, 0.1, 'square', 0.04, 0.1);
}

// ─── Lifeline Used — descending tone ──────────────────────────────
export function playLifelineUsed(): void {
  playTone(700, 0.1, 'triangle', 0.08);
  playTone(500, 0.15, 'triangle', 0.06, 0.1);
}

// ─── Countdown Beep ───────────────────────────────────────────────
export function playCountdownBeep(): void {
  playTone(1000, 0.1, 'sine', 0.1);
}

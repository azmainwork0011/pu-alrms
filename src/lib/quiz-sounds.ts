'use client';

// ─── KBC (Kaun Banega Crorepati) Style Sound System ─────────────────
// All sounds synthesized with Web Audio API — no audio files needed.
// Inspired by the iconic Indian KBC game show experience.

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3, startDelay = 0) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);
  gain.gain.setValueAtTime(volume, ctx.currentTime + startDelay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + startDelay);
  osc.stop(ctx.currentTime + startDelay + duration);
}

// Helper: white noise burst (for percussion, whooshes, crackles)
function playNoise(duration: number, volume = 0.1, startDelay = 0) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime + startDelay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(ctx.currentTime + startDelay);
}

// Helper: frequency-modulated tone with vibrato for richness
function playRichTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.3,
  startDelay = 0,
  vibratoRate = 0,
  vibratoDepth = 0,
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);
  // Apply vibrato if specified
  if (vibratoRate > 0 && vibratoDepth > 0) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(vibratoRate, ctx.currentTime + startDelay);
    lfoGain.gain.setValueAtTime(vibratoDepth, ctx.currentTime + startDelay);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(ctx.currentTime + startDelay);
    lfo.stop(ctx.currentTime + startDelay + duration);
  }
  gain.gain.setValueAtTime(0.001, ctx.currentTime + startDelay);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startDelay + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + startDelay);
  osc.stop(ctx.currentTime + startDelay + duration);
}

// Helper: descending sweep (for dramatic drops)
function playSweep(startFreq: number, endFreq: number, duration: number, type: OscillatorType = 'sawtooth', volume = 0.2, startDelay = 0) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, ctx.currentTime + startDelay);
  osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), ctx.currentTime + startDelay + duration);
  gain.gain.setValueAtTime(volume, ctx.currentTime + startDelay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + startDelay);
  osc.stop(ctx.currentTime + startDelay + duration);
}

// Helper: ascending sweep (for rising tension)
function playAscSweep(startFreq: number, endFreq: number, duration: number, type: OscillatorType = 'sine', volume = 0.2, startDelay = 0) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, ctx.currentTime + startDelay);
  osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), ctx.currentTime + startDelay + duration);
  gain.gain.setValueAtTime(0.001, ctx.currentTime + startDelay);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startDelay + duration * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + startDelay);
  osc.stop(ctx.currentTime + startDelay + duration);
}

// ═══════════════════════════════════════════════════════════════════
// KBC-INSPIRED SOUND FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

// ─── 1. KBC Intro: Dramatic ascending theme ───────────────────────
// The iconic "Tan tan tan... taaan!" opening in minor key
export function playKBCIntro() {
  // Deep bass foundation — ascending minor arpeggio
  playTone(110, 0.6, 'sine', 0.25, 0);           // A2 deep root
  playTone(110, 0.6, 'triangle', 0.1, 0);        // A2 layered
  playTone(131, 0.5, 'sine', 0.15, 0.3);         // C3 minor third
  playTone(165, 0.5, 'sine', 0.15, 0.55);        // E3 perfect fifth
  playTone(220, 0.4, 'triangle', 0.2, 0.8);      // A4 octave — tension builds
  // Brass-like overtones using sawtooth
  playTone(440, 0.3, 'sawtooth', 0.06, 1.05);    // A4 brass overtone
  playTone(330, 0.3, 'sawtooth', 0.04, 1.05);    // E4 brass overtone
  // The iconic final "TAAAN!" — dramatic resolve
  playTone(220, 0.8, 'sine', 0.3, 1.2);          // A3 powerful bass note
  playTone(220, 0.8, 'triangle', 0.15, 1.2);     // Layered richness
  playTone(440, 0.7, 'triangle', 0.12, 1.25);    // A4 octave
  playTone(660, 0.6, 'sine', 0.08, 1.3);         // E5 upper harmony
  playTone(880, 0.5, 'sine', 0.05, 1.35);        // A5 shimmer
}

// ─── 2. Question Reveal: Suspenseful rising drone ─────────────────
// "Dum... dum... DUM" — low drone that rises with dramatic pause
export function playQuestionReveal() {
  // Low rumbling drone
  playTone(82, 0.8, 'sine', 0.2, 0);            // E2 sub-bass
  playTone(82, 0.8, 'triangle', 0.1, 0);         // Layered
  // Rising tension
  playAscSweep(110, 220, 0.6, 'sine', 0.15, 0.3);
  playAscSweep(130, 260, 0.5, 'triangle', 0.08, 0.5);
  // The dramatic "DUM" hit
  playTone(165, 0.6, 'sine', 0.3, 0.9);          // E3 dramatic
  playTone(165, 0.5, 'triangle', 0.15, 0.9);     // Layered
  playTone(330, 0.4, 'triangle', 0.1, 0.95);     // E4 overtone
  playTone(440, 0.3, 'sine', 0.06, 1.0);         // A4 sparkle
}

// ─── 3. Option Select: Staccato clicking ──────────────────────────
// Quick ticking sound when Amitabh reads an option
export function playOptionSelect() {
  // Quick staccato clicks — like a typewriter or tick
  playTone(800, 0.03, 'square', 0.08, 0);
  playTone(900, 0.03, 'square', 0.06, 0.04);
  playTone(1000, 0.04, 'triangle', 0.07, 0.08);
  // Soft confirmation tone
  playTone(1200, 0.06, 'sine', 0.05, 0.12);
}

// ─── 4. Lock Kiya Jaye: THE MOST ICONIC KBC SOUND ────────────────
// Dramatic drum roll building over 2 seconds with crescendo
export function playLockKiyaJaye() {
  // Rapid percussive beats that crescendo — the KBC heartbeat
  for (let i = 0; i < 16; i++) {
    const delay = i * 0.12;
    const vol = 0.05 + (i / 16) * 0.25; // Crescendo
    const freq = 100 + (i / 16) * 60;     // Slightly rising pitch
    playTone(freq, 0.08, 'square', vol, delay);
    playNoise(0.05, vol * 0.4, delay);
  }

  // High tension pitch rising
  playAscSweep(300, 600, 1.5, 'sawtooth', 0.04, 0.5);
  playAscSweep(200, 500, 1.8, 'triangle', 0.06, 0.3);

  // Dramatic pause beat (accented hits)
  playTone(150, 0.15, 'sine', 0.25, 1.8);
  playNoise(0.1, 0.12, 1.8);

  playTone(180, 0.15, 'sine', 0.3, 1.95);
  playNoise(0.1, 0.15, 1.95);

  // THE FINAL DRAMATIC HIT — deep bass impact
  playTone(80, 0.8, 'sine', 0.4, 2.1);          // Sub-bass impact
  playTone(80, 0.6, 'triangle', 0.2, 2.1);       // Layered
  playTone(160, 0.5, 'sine', 0.2, 2.12);         // Octave
  playTone(320, 0.3, 'triangle', 0.1, 2.15);      // Brass overtone
  playNoise(0.2, 0.15, 2.1);                      // Impact noise
}

// ─── 5. Correct Answer: Triumphant celebration ────────────────────
// Bright ascending major chord — "ding ding ding DING!"
export function playCorrectAnswer() {
  // Opening bright ding
  playTone(1047, 0.12, 'sine', 0.3, 0);           // C6
  playTone(1047, 0.12, 'triangle', 0.1, 0);       // Layered

  // Rising dings
  playTone(1319, 0.12, 'sine', 0.25, 0.1);        // E6
  playTone(1568, 0.15, 'sine', 0.28, 0.2);        // G6

  // THE BIG DING — satisfying resolve
  playTone(2093, 0.5, 'sine', 0.35, 0.32);        // C7
  playTone(2093, 0.4, 'triangle', 0.15, 0.32);     // Layered
  playTone(2637, 0.35, 'sine', 0.12, 0.35);        // E7 sparkle
  playTone(3136, 0.3, 'sine', 0.08, 0.38);         // G7 high sparkle

  // Sparkle tail
  playTone(4186, 0.4, 'sine', 0.05, 0.45);         // C8 shimmer
}

// ─── 6. Wrong Answer: Sad descending tones ────────────────────────
// "Wah wah wah" — descending minor melody with bass drop
export function playWrongAnswer() {
  // Low buzz start
  playTone(220, 0.2, 'sawtooth', 0.08, 0);        // A3 buzz
  playTone(220, 0.2, 'square', 0.05, 0);           // Grating overtone

  // Descending "wah wah wah" — minor second drops
  playTone(294, 0.3, 'sine', 0.18, 0.2);           // D4
  playTone(262, 0.3, 'sine', 0.16, 0.45);          // C4 — down
  playTone(220, 0.4, 'triangle', 0.18, 0.7);       // A3 — further down

  // Dramatic bass drop
  playSweep(200, 60, 0.6, 'sawtooth', 0.12, 1.0);
  playTone(80, 0.8, 'sine', 0.2, 1.1);             // Deep rumble
  playNoise(0.15, 0.06, 1.0);                       // Static
}

// ─── 7. Timer Tick: Quick clock tick ──────────────────────────────
export function playTimerTick() {
  playTone(1200, 0.03, 'sine', 0.1);               // High sharp tick
}

// ─── 8. Timer Warning: Urgent fast beeping ────────────────────────
// Fast pulsing alert when time < 5s
export function playTimerWarning() {
  // Fast double beep
  playTone(880, 0.06, 'square', 0.12, 0);          // Sharp alert
  playTone(880, 0.06, 'square', 0.12, 0.1);        // Repeat
  // Low undertone urgency
  playTone(220, 0.15, 'sawtooth', 0.04, 0);
}

// ─── 9. Lifeline Used: Magical sparkle ────────────────────────────
// Ethereal ascending chime with sparkle
export function playLifelineUsed() {
  // Ascending magical chime
  playTone(660, 0.15, 'sine', 0.2, 0);             // E5
  playTone(880, 0.15, 'sine', 0.2, 0.1);           // A5
  playTone(1100, 0.15, 'sine', 0.2, 0.2);          // C#6
  // Sparkle shimmer
  playTone(1320, 0.2, 'triangle', 0.15, 0.3);      // E6
  playTone(1760, 0.25, 'sine', 0.12, 0.35);        // A6
  playTone(2200, 0.3, 'sine', 0.08, 0.4);          // C#7
  // Magic dust
  playTone(2640, 0.35, 'sine', 0.04, 0.5);         // E7 high sparkle
}

// ─── 10. Heart Lost: Dramatic heartbreak ──────────────────────────
// Low rumble + crack sound
export function playHeartLost() {
  // Low rumbling bass
  playTone(150, 0.4, 'sawtooth', 0.15, 0);         // Deep rumble
  playTone(100, 0.5, 'sine', 0.2, 0.05);           // Sub-bass
  // The "crack" — sharp noise burst
  playNoise(0.08, 0.2, 0.2);                        // Crack
  playTone(300, 0.05, 'square', 0.15, 0.2);        // Sharp crack overtone
  // Sad descending tail
  playSweep(250, 80, 0.8, 'sawtooth', 0.08, 0.3);
  playTone(110, 0.6, 'triangle', 0.1, 0.5);        // Mournful low
}

// ─── 11. Game Over: Long descending sad notes ─────────────────────
export function playGameOver() {
  // Descending minor melody — very sad
  const melody = [440, 392, 349, 330, 294, 262, 220];
  melody.forEach((freq, i) => {
    playTone(freq, 0.4, 'sine', 0.15, i * 0.25);
    playTone(freq * 0.5, 0.4, 'triangle', 0.05, i * 0.25); // Bass shadow
  });
  // Final low rumble
  playTone(110, 1.2, 'sine', 0.15, 1.8);
  playNoise(0.3, 0.04, 1.8);
}

// ─── 12. Win Fanfare: Triumphant ascending fanfare ────────────────
export function playWinFanfare() {
  // Triumphant major chord arpeggio ascending
  const fanfare = [523, 659, 784, 1047, 1319, 1568];
  fanfare.forEach((freq, i) => {
    playTone(freq, 0.2, 'sine', 0.15 + i * 0.02, i * 0.1);
    playTone(freq * 0.5, 0.2, 'triangle', 0.05, i * 0.1); // Bass root
  });
  // Final sustained chord
  playTone(523, 0.6, 'sine', 0.2, 0.65);
  playTone(659, 0.6, 'sine', 0.15, 0.65);
  playTone(784, 0.6, 'sine', 0.15, 0.65);
  playTone(1047, 0.5, 'triangle', 0.12, 0.65);
}

// ─── 13. Perfect Score: Full orchestral celebration ───────────────
// Extra special — layered celebration
export function playPerfectScore() {
  // Part 1: Ascending major scale with sparkle
  const scale = [523, 587, 659, 784, 880, 1047, 1175, 1319];
  scale.forEach((freq, i) => {
    playTone(freq, 0.15, 'sine', 0.12 + i * 0.015, i * 0.08);
    playTone(freq * 2, 0.1, 'sine', 0.04, i * 0.08 + 0.02); // High sparkle
  });

  // Part 2: Triumphant chord held
  const chord = [523, 659, 784, 1047, 1319, 1568];
  chord.forEach((freq, i) => {
    playRichTone(freq, 0.8, 'sine', 0.1, 0.7, 5, 3); // With vibrato
  });

  // Part 3: Cascading sparkles
  const sparkles = [2093, 2637, 3136, 3520, 4186];
  sparkles.forEach((freq, i) => {
    playTone(freq, 0.3, 'sine', 0.06, 0.9 + i * 0.08);
  });
}

// ─── 14. Streak Fire: Rapid ascending pings ───────────────────────
export function playStreakFire() {
  // Rapid fire ascending pings — like a flame rising
  const pings = [880, 1047, 1319, 1568, 2093, 2637, 3136];
  pings.forEach((freq, i) => {
    playTone(freq, 0.06, 'sine', 0.15 + i * 0.01, i * 0.04);
    playTone(freq * 1.5, 0.04, 'triangle', 0.05, i * 0.04 + 0.01); // Overtone
  });
  // Top sparkle
  playTone(4186, 0.15, 'sine', 0.08, 0.3);
}

// ─── 15. XP Gain: Quick pleasant chime ────────────────────────────
export function playXPGain() {
  playTone(880, 0.06, 'sine', 0.15, 0);             // Quick ding
  playTone(1100, 0.06, 'sine', 0.18, 0.04);         // Ascend
  playTone(1320, 0.1, 'sine', 0.2, 0.08);           // Final chime
}

// ─── 16. Button Press: Soft UI click ──────────────────────────────
export function playButtonPress() {
  playTone(800, 0.03, 'sine', 0.08, 0);             // Soft click
  playTone(1000, 0.02, 'sine', 0.06, 0.015);        // Subtle tap
}

// ─── 17. Slide Transition: Quick whoosh ───────────────────────────
export function playSlideTransition() {
  playNoise(0.1, 0.08, 0);                          // Whoosh noise
  playSweep(600, 200, 0.1, 'sine', 0.06, 0);        // Descending whoosh tone
}

// ─── 18. Countdown Beep (3, 2, 1, GO!) ───────────────────────────
export function playCountdownBeep(count: number) {
  if (count > 0) {
    // Descending tone for countdown numbers — gets more urgent
    const freq = 660 - (3 - count) * 80; // 500, 580, 660
    playTone(freq, 0.12, 'sine', 0.2, 0);
    playTone(freq * 0.5, 0.1, 'triangle', 0.05, 0); // Bass shadow
  } else {
    // GO! — Bright triumphant hit
    playTone(1047, 0.1, 'sine', 0.3, 0);            // C6 bright
    playTone(1319, 0.15, 'sine', 0.25, 0.05);       // E6
    playTone(1568, 0.3, 'triangle', 0.2, 0.1);      // G6 full
    playTone(2093, 0.25, 'sine', 0.12, 0.15);       // C7 sparkle
  }
}


// ═══════════════════════════════════════════════════════════════════
// LEGACY EXPORTS — Aliases for backward compatibility
// ═══════════════════════════════════════════════════════════════════

// KBC Start / Dramatic Opening
export const playKBCStartSound = playKBCIntro;

// Correct answer
export const playCorrectSound = playCorrectAnswer;

// Wrong answer
export const playWrongSound = playWrongAnswer;

// Timer tick
export const playTimerTickSound = playTimerTick;

// Timer warning
export const playTimeWarningSound = playTimerWarning;

// XP gain
export const playXPGainSound = playXPGain;

// Streak / combo
export const playStreakSound = playStreakFire;

// Heart lost
export const playHeartLostSound = playHeartLost;

// Game over
export const playGameOverSound = playGameOver;

// Level up / win
export const playLevelUpSound = playWinFanfare;

// Perfect score
export const playPerfectSound = playPerfectScore;

// Button press
export const playButtonSound = playButtonPress;

// Slide transition
export const playSlideSound = playSlideTransition;

// XP bonus (end of quiz) — use the full win fanfare
export const playXPBonusSound = playWinFanfare;

// Lifeline sound
export const playLifelineSound = playLifelineUsed;

// Victory / win
export const playWinSound = playWinFanfare;

// Lose / defeat
export const playLoseSound = playWrongAnswer;

// Tick sound (for bot thinking)
export const playTickSound = playTimerTick;

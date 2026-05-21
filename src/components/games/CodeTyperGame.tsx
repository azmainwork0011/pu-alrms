'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Zap,
  Target,
  Clock,
  Star,
  Trophy,
  ChevronRight,
  Keyboard,
  Flame,
  Check,
  X,
  Type,
  Code2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  type CodeTyperChallenge,
  getRandomCodeTyperChallenge,
} from '@/lib/coding-games-data';

// ══════════════════════════════════════════════════════════════
// Props
// ══════════════════════════════════════════════════════════════

interface CodeTyperGameProps {
  onBack: () => void;
  onXP: (amount: number) => void;
  challenge?: CodeTyperChallenge;
}

// ══════════════════════════════════════════════════════════════
// Types & Constants
// ══════════════════════════════════════════════════════════════

type GamePhase = 'start' | 'typing' | 'results';

interface TypingStats {
  wpm: number;
  accuracy: number;
  charactersTyped: number;
  errors: number;
  elapsedSeconds: number;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700',
  HARD: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-700',
};

const LANGUAGE_ICONS: Record<string, string> = {
  python: '\uD83D\uDC0D',
  javascript: '\u26A1',
  java: '\u2615',
  cpp: '\uD83D\uDD27',
  typescript: '\uD83D\uDCD8',
  csharp: '\uD83E\uDD89',
  rust: '\uD83E\uDD80',
  go: '\uD83D\uDC19',
  ruby: '\uD83D\uDC8E',
  swift: '\uD83E\uDD85',
};

// ══════════════════════════════════════════════════════════════
// Animation Variants
// ══════════════════════════════════════════════════════════════

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const slideUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const starPop = {
  initial: { opacity: 0, scale: 0, rotate: -180 },
  animate: { opacity: 1, scale: 1, rotate: 0 },
};

// ══════════════════════════════════════════════════════════════
// Helper: compute stats
// ══════════════════════════════════════════════════════════════

function computeStats(typed: string, target: string, elapsedSec: number): TypingStats {
  const charactersTyped = typed.length;
  const errors = typed.split('').filter((ch, i) => i < target.length && ch !== target[i]).length;
  const correct = Math.max(0, charactersTyped - errors);
  const elapsedMin = Math.max(elapsedSec / 60, 1 / 60); // prevent division by 0
  const wpm = Math.round((correct / 5) / elapsedMin);
  const accuracy = charactersTyped > 0 ? Math.round((correct / charactersTyped) * 100) : 100;
  return { wpm, accuracy, charactersTyped, errors, elapsedSeconds: elapsedSec };
}

function computeXPEarned(accuracy: number, wpm: number): number {
  let xp = 20;
  if (accuracy > 90) xp += 5;
  if (accuracy > 95) xp += 10;
  if (wpm > 30) xp += 5;
  if (wpm > 60) xp += 10;
  return xp;
}

function computeStars(accuracy: number, wpm: number): number {
  if (accuracy >= 98 && wpm >= 50) return 3;
  if (accuracy >= 90 && wpm >= 25) return 2;
  if (accuracy >= 70) return 1;
  return 1;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ══════════════════════════════════════════════════════════════
// Sub-components
// ══════════════════════════════════════════════════════════════

function StatPill({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700/50">
      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${color}`}>{icon}</div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium leading-none">
          {label}
        </span>
        <span className="text-sm font-bold text-foreground leading-tight mt-0.5">
          {value}
          {unit && <span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>}
        </span>
      </div>
    </div>
  );
}

function StarRating({ stars, size = 32 }: { stars: number; size?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          {...starPop}
          transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Star
            className={`${size === 32 ? 'w-8 h-8' : 'w-5 h-5'} ${
              i <= stars
                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                : 'fill-gray-200 dark:fill-gray-700 text-gray-300 dark:text-gray-600'
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

export default function CodeTyperGame({ onBack, onXP, challenge: initialChallenge }: CodeTyperGameProps) {
  // ── Challenge ──
  const [challenge, setChallenge] = useState<CodeTyperChallenge | null>(
    initialChallenge ?? null
  );

  // ── Game phase ──
  const [phase, setPhase] = useState<GamePhase>('start');

  // ── Typing state ──
  const [typed, setTyped] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // ── Refs ──
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Load random challenge if none provided ──
  useEffect(() => {
    if (!initialChallenge) {
      const challenges = getRandomCodeTyperChallenge();
      if (challenges.length > 0) queueMicrotask(() => setChallenge(challenges[0]));
    }
  }, [initialChallenge]);

  const targetCode = challenge?.code ?? '';

  // ── Derived stats ──
  const stats = useMemo(
    () => computeStats(typed, targetCode, elapsed),
    [typed, targetCode, elapsed]
  );
  const xpEarned = useMemo(() => computeXPEarned(stats.accuracy, stats.wpm), [stats.accuracy, stats.wpm]);
  const starCount = useMemo(() => computeStars(stats.accuracy, stats.wpm), [stats.accuracy, stats.wpm]);

  // ── Progress percentage ──
  const progressPct = targetCode.length > 0 ? Math.min((typed.length / targetCode.length) * 100, 100) : 0;

  // ── Timer ──
  useEffect(() => {
    if (phase !== 'typing' || startTime === null || isComplete) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 200);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, startTime, isComplete]);

  // ── Auto-scroll the code display to keep current position visible ──
  useEffect(() => {
    if (scrollRef.current) {
      const activeChar = scrollRef.current.querySelector('[data-active="true"]');
      if (activeChar) {
        activeChar.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [typed]);

  // ── Check completion ──
  useEffect(() => {
    if (phase === 'typing' && typed.length >= targetCode.length && targetCode.length > 0 && !isComplete) {
      queueMicrotask(() => {
        setIsComplete(true);
      });
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Delay before showing results for a satisfying moment
      const timeout = setTimeout(() => {
        onXP(xpEarned);
        setPhase('results');
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [typed, targetCode.length, phase, isComplete, xpEarned, onXP]);

  // ── Handlers ──
  const handleStart = useCallback(() => {
    setTyped('');
    setElapsed(0);
    setStartTime(null);
    setIsComplete(false);
    setPhase('typing');
    // Focus input after render
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;

      // Don't allow pasting or typing beyond the target length
      if (value.length > targetCode.length) return;

      // Start timer on first keystroke
      if (startTime === null && value.length > 0) {
        setStartTime(Date.now());
      }

      setTyped(value);
    },
    [targetCode.length, startTime]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Prevent typing beyond target
      if (
        typed.length >= targetCode.length &&
        e.key !== 'Backspace' &&
        e.key !== 'Delete' &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();
      }
    },
    [typed.length, targetCode.length]
  );

  const handleNextChallenge = useCallback(() => {
    const challenges = getRandomCodeTyperChallenge();
    if (challenges.length > 0) setChallenge(challenges[0]);
    setTyped('');
    setElapsed(0);
    setStartTime(null);
    setIsComplete(false);
    setPhase('start');
  }, []);

  const handleRetry = useCallback(() => {
    setTyped('');
    setElapsed(0);
    setStartTime(null);
    setIsComplete(false);
    setPhase('typing');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleKeyDownGlobal = useCallback(
    (e: KeyboardEvent) => {
      // During typing phase, if the textarea isn't focused, focus it on any printable key
      if (phase === 'typing' && !isComplete) {
        if (
          document.activeElement !== inputRef.current &&
          e.key.length === 1 &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    },
    [phase, isComplete]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDownGlobal);
    return () => window.removeEventListener('keydown', handleKeyDownGlobal);
  }, [handleKeyDownGlobal]);

  // ── Guard ──
  if (!challenge) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-gray-400">Loading challenge...</div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: START SCREEN
  // ══════════════════════════════════════════════════════════════

  function renderStart() {
    return (
      <motion.div
        {...fadeIn}
        className="flex flex-col items-center text-center max-w-lg mx-auto"
      >
        {/* Back button */}
        <div className="w-full flex justify-start mb-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-gray-500">
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Button>
        </div>

        {/* Header icon */}
        <motion.div
          {...scaleIn}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-6"
        >
          <Keyboard className="w-10 h-10 text-white" />
        </motion.div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Code Typer</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Type the code as fast and accurately as you can
        </p>

        {!challenge ? (
          <Card className="p-8 text-center text-gray-500">
            <p>Loading challenge...</p>
          </Card>
        ) : (
        <>
        {/* Challenge info card */}
        <Card className="w-full border-0 shadow-lg mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 sm:p-6 rounded-t-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{LANGUAGE_ICONS[challenge!.language] ?? '\uD83D\uDCBB'}</span>
              <span className="text-white font-semibold capitalize">{challenge!.language}</span>
            </div>
            {/* Code preview */}
            <div className="bg-gray-950/80 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm text-gray-300 overflow-x-auto text-left">
              <pre className="whitespace-pre-wrap break-all">{challenge!.code}</pre>
            </div>
          </div>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="outline" className={DIFFICULTY_STYLES[challenge.difficulty] ?? DIFFICULTY_STYLES.EASY}>
                {challenge.difficulty}
              </Badge>
              <Badge variant="outline" className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                <Code2 className="w-3 h-3 mr-1" />
                {challenge.category}
              </Badge>
              <Badge variant="outline" className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                <Zap className="w-3 h-3 mr-1 text-amber-500" />
                {challenge.points} XP
              </Badge>
              <Badge variant="outline" className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                <Type className="w-3 h-3 mr-1" />
                {challenge.code.length} chars
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2.5">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-0.5">Accuracy</div>
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">&gt;90% = 2\u2605</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5">
                <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-0.5">Speed</div>
                <div className="text-sm font-bold text-amber-700 dark:text-amber-300">&gt;25 WPM = 2\u2605</div>
              </div>
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-2.5">
                <div className="text-xs text-violet-600 dark:text-violet-400 font-medium mb-0.5">Max XP</div>
                <div className="text-sm font-bold text-violet-700 dark:text-violet-300">45 XP</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Start button */}
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full">
          <Button
            onClick={handleStart}
            size="lg"
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 gap-2"
          >
            <Play className="w-5 h-5" />
            Start Typing
          </Button>
        </motion.div>
        </>
        )}
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: TYPING SCREEN
  // ══════════════════════════════════════════════════════════════

  function renderTyping() {
    const characters = targetCode.split('');
    const typedChars = typed.split('');

    return (
      <motion.div
        {...fadeIn}
        className="flex flex-col max-w-3xl mx-auto w-full"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={() => setPhase('start')} className="gap-1.5 text-gray-500">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Quit</span>
          </Button>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl">{LANGUAGE_ICONS[challenge!.language] ?? '\uD83D\uDCBB'}</span>
            <Badge variant="outline" className={DIFFICULTY_STYLES[challenge!.difficulty] ?? DIFFICULTY_STYLES.EASY}>
              {challenge!.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm font-medium tabular-nums">{formatTime(elapsed)}</span>
          </div>
        </div>

        {/* Live stats row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <StatPill
            icon={<Flame className="w-3.5 h-3.5 text-orange-500" />}
            label="WPM"
            value={stats.wpm}
            color="bg-orange-100 dark:bg-orange-900/30"
          />
          <StatPill
            icon={<Target className="w-3.5 h-3.5 text-emerald-500" />}
            label="Accuracy"
            value={`${stats.accuracy}%`}
            color="bg-emerald-100 dark:bg-emerald-900/30"
          />
          <StatPill
            icon={<Type className="w-3.5 h-3.5 text-blue-500" />}
            label="Chars"
            value={`${typed.length}/${targetCode.length}`}
            color="bg-blue-100 dark:bg-blue-900/30"
          />
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-1.5">
            <span>Progress</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <Progress
            value={progressPct}
            className="h-2 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-emerald-400 [&>[data-slot=progress-indicator]]:to-teal-500"
          />
        </div>

        {/* Code display */}
        <Card className="border-0 shadow-lg mb-4 overflow-hidden">
          <div className="bg-gray-950 rounded-t-xl p-3 sm:p-4 overflow-x-auto">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-800">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-500 ml-2 font-mono">
                {challenge!.language}.{challenge!.category === 'basics' ? 'py' : challenge!.category}
              </span>
            </div>
            <div
              ref={scrollRef}
              className="font-mono text-sm sm:text-base leading-relaxed tracking-wide"
            >
              {characters.map((char, i) => {
                let colorClass = 'text-gray-600 dark:text-gray-500'; // untyped
                let bgClass = '';
                const isActive = i === typed.length;

                if (i < typed.length) {
                  if (typedChars[i] === char) {
                    colorClass = 'text-emerald-400'; // correct
                    bgClass = 'bg-emerald-500/10';
                  } else {
                    colorClass = 'text-rose-400'; // incorrect
                    bgClass = 'bg-rose-500/15';
                  }
                }

                // Display character (visualize special chars)
                const displayChar = char === '\n' ? '\u21B5' : char === ' ' ? '\u00B7' : char;
                const isSpecial = char === '\n' || char === ' ';

                return (
                  <span
                    key={i}
                    className={`${colorClass} ${bgClass} ${isActive ? 'relative' : ''} ${isSpecial ? 'text-gray-500' : ''}`}
                    data-active={isActive || undefined}
                  >
                    {displayChar}
                    {isActive && (
                      <motion.span
                        className="absolute left-0 top-0 w-[2px] h-full bg-emerald-400 animate-pulse"
                        layoutId="cursor"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Input area */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Keyboard className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type here
              </span>
              {isComplete && (
                <motion.div
                  {...scaleIn}
                  className="ml-auto flex items-center gap-1 text-emerald-500 text-xs font-semibold"
                >
                  <Check className="w-4 h-4" />
                  Complete!
                </motion.div>
              )}
            </div>
            <textarea
              ref={inputRef}
              value={typed}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isComplete}
              placeholder={isComplete ? 'Challenge complete!' : 'Start typing the code above...'}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className={`w-full min-h-[100px] sm:min-h-[120px] bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 font-mono text-sm sm:text-base text-gray-800 dark:text-gray-200 resize-none outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 ${
                isComplete
                  ? 'opacity-60 cursor-default'
                  : 'focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50'
              }`}
            />

            {/* Inline accuracy indicator */}
            {!isComplete && typed.length > 0 && (
              <motion.div
                {...fadeIn}
                className="flex items-center justify-between mt-2 text-xs"
              >
                <span className="text-gray-400">
                  {typed.length} of {targetCode.length} characters
                </span>
                <span
                  className={`font-medium ${
                    stats.accuracy >= 95
                      ? 'text-emerald-500'
                      : stats.accuracy >= 80
                        ? 'text-amber-500'
                        : 'text-rose-500'
                  }`}
                >
                  {stats.errors === 0 ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3" /> No errors
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <X className="w-3 h-3" /> {stats.errors} error{stats.errors !== 1 ? 's' : ''}
                    </span>
                  )}
                </span>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Completion overlay */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              {...scaleIn}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            >
              <Card className="mx-4 border-0 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                  >
                    <Trophy className="w-12 h-12 text-white mx-auto mb-2 drop-shadow-lg" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-white">Challenge Complete!</h2>
                </div>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-500 text-center mb-1">Loading results...</p>
                  <div className="flex justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: RESULTS SCREEN
  // ══════════════════════════════════════════════════════════════

  function renderResults() {
    return (
      <motion.div
        {...fadeIn}
        className="flex flex-col items-center max-w-lg mx-auto w-full"
      >
        {/* Star rating */}
        <motion.div {...slideUp} className="mb-6 text-center">
          <StarRating stars={starCount} />
          <h2 className="text-xl sm:text-2xl font-bold mt-3 mb-1">
            {starCount === 3
              ? 'Perfect Run!'
              : starCount === 2
                ? 'Great Job!'
                : 'Keep Practicing!'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {starCount === 3
              ? 'Flawless accuracy and blazing speed.'
              : starCount === 2
                ? 'Solid performance! You can do even better.'
                : 'Practice makes perfect. Try again!'}
          </p>
        </motion.div>

        {/* Main stats card */}
        <Card className="w-full border-0 shadow-lg overflow-hidden mb-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 sm:p-6">
            <motion.div {...stagger} className="grid grid-cols-2 gap-4">
              <motion.div {...slideUp} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">{stats.wpm}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">
                  Words/Min
                </div>
              </motion.div>
              <motion.div {...slideUp} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-emerald-400">
                  {stats.accuracy}%
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">
                  Accuracy
                </div>
              </motion.div>
              <motion.div {...slideUp} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">
                  {formatTime(stats.elapsedSeconds)}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">
                  Time
                </div>
              </motion.div>
              <motion.div {...slideUp} className="text-center">
                <div className={`text-3xl sm:text-4xl font-bold ${stats.errors === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stats.errors}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">
                  Error{stats.errors !== 1 ? 's' : ''}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </Card>

        {/* XP earned card */}
        <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="w-full mb-4">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">XP Earned</div>
                  <div className="flex items-center gap-2">
                    <motion.span
                      {...scaleIn}
                      transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                      className="text-2xl font-bold text-amber-500"
                    >
                      +{xpEarned}
                    </motion.span>
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400 space-y-0.5">
                  <div>Base: 20 XP</div>
                  {(stats.accuracy > 90 || stats.accuracy > 95) && (
                    <div className="text-emerald-500">
                      +{stats.accuracy > 95 ? 10 : 5} accuracy bonus
                    </div>
                  )}
                  {(stats.wpm > 30 || stats.wpm > 60) && (
                    <div className="text-emerald-500">
                      +{stats.wpm > 60 ? 10 : 5} speed bonus
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Character breakdown */}
        <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="w-full mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Breakdown
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-sm">Correct characters</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {Math.max(0, stats.charactersTyped - stats.errors)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-rose-500" />
                    <span className="text-sm">Incorrect characters</span>
                  </div>
                  <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                    {stats.errors}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-gray-400 dark:bg-gray-600" />
                    <span className="text-sm">Total characters</span>
                  </div>
                  <span className="text-sm font-semibold">{targetCode.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          {...fadeIn}
          transition={{ delay: 0.5 }}
          className="w-full flex flex-col sm:flex-row gap-3"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
            <Button
              onClick={handleRetry}
              size="lg"
              variant="outline"
              className="w-full h-11 gap-2 border-gray-200 dark:border-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
            <Button
              onClick={handleNextChallenge}
              size="lg"
              className="w-full h-11 gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20"
            >
              Next Challenge
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.6 }} className="w-full mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="w-full text-gray-500 gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <AnimatePresence mode="wait">
        {phase === 'start' && <motion.div key="start" {...fadeIn}>{renderStart()}</motion.div>}
        {phase === 'typing' && <motion.div key="typing" {...fadeIn}>{renderTyping()}</motion.div>}
        {phase === 'results' && <motion.div key="results" {...fadeIn}>{renderResults()}</motion.div>}
      </AnimatePresence>
    </div>
  );
}

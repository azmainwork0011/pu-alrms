'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug,
  Search,
  AlertTriangle,
  Check,
  X,
  Shield,
  Clock,
  ChevronRight,
  Trophy,
  Zap,
  RotateCcw,
  ArrowLeft,
  Target,
  Eye,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  getRandomErrorHunterChallenge,
  type ErrorHunterChallenge,
} from '@/lib/coding-games-data';

// ─── Local Types ──────────────────────────────────────
type ErrorType = 'SyntaxError' | 'RuntimeError' | 'LogicError' | 'TypeError' | 'ReferenceError';
type ErrorHunterDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

// ══════════════════════════════════════════════════════════════
// Props
// ══════════════════════════════════════════════════════════════

interface ErrorHunterGameProps {
  onBack: () => void;
  onXP: (amount: number) => void;
}

// ══════════════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════════════

const TOTAL_ROUNDS = 10;
const TIMER_PER_QUESTION = 20;
const XP_PER_LINE_CORRECT = 10;
const XP_PER_CLASSIFICATION_CORRECT = 15;

type GamePhase = 'start' | 'playing' | 'find' | 'classify' | 'result' | 'done';

const ERROR_TYPE_CONFIG: Record<
  ErrorType,
  { color: string; bg: string; border: string; icon: React.ReactNode; desc: string }
> = {
  SyntaxError: {
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-300 dark:border-red-700',
    icon: <X className="w-4 h-4" />,
    desc: 'Code structure violation',
  },
  RuntimeError: {
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-300 dark:border-orange-700',
    icon: <AlertTriangle className="w-4 h-4" />,
    desc: 'Fails during execution',
  },
  LogicError: {
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-300 dark:border-amber-700',
    icon: <Bug className="w-4 h-4" />,
    desc: 'Wrong result, no crash',
  },
  TypeError: {
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-300 dark:border-purple-700',
    icon: <Shield className="w-4 h-4" />,
    desc: 'Wrong type operation',
  },
  ReferenceError: {
    color: 'text-sky-500',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    border: 'border-sky-300 dark:border-sky-700',
    icon: <Search className="w-4 h-4" />,
    desc: 'Undeclared variable',
  },
};

const DIFFICULTY_CONFIG: Record<
  ErrorHunterDifficulty,
  { label: string; color: string; bg: string; description: string }
> = {
  EASY: {
    label: 'Easy',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700',
    description: 'Common mistakes, straightforward bugs',
  },
  MEDIUM: {
    label: 'Medium',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700',
    description: 'Subtle bugs requiring deeper analysis',
  },
  HARD: {
    label: 'Hard',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700',
    description: 'Complex scenarios, edge cases, advanced concepts',
  },
};

// ══════════════════════════════════════════════════════════════
// Animation Variants
// ══════════════════════════════════════════════════════════════

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.92 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const shakeAnim = {
  animate: { x: [0, -6, 6, -4, 4, -2, 2, 0] },
};

// ══════════════════════════════════════════════════════════════
// Sub-Components
// ══════════════════════════════════════════════════════════════

function TimerCircle({
  timeLeft,
  maxTime,
}: {
  timeLeft: number;
  maxTime: number;
}) {
  const pct = (timeLeft / maxTime) * 100;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const isLow = timeLeft <= 5;
  const size = 52;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-gray-200 dark:stroke-gray-700"
          strokeWidth={4}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={isLow ? 'stroke-red-500' : 'stroke-amber-500'}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.4 }}
        />
      </svg>
      <span
        className={`absolute text-sm font-bold tabular-nums ${
          isLow ? 'text-red-500' : 'text-foreground'
        }`}
      >
        {timeLeft}
      </span>
    </div>
  );
}

function CodeBlock({
  code,
  selectedLine,
  revealedLine,
  correctLine,
  disabled,
  onLineClick,
}: {
  code: string;
  selectedLine: number | null;
  revealedLine: number | null;
  correctLine: number | null;
  disabled: boolean;
  onLineClick: (line: number) => void;
}) {
  const lines = code.split('\n');

  return (
    <div className="rounded-xl overflow-hidden border border-gray-800 dark:border-gray-700">
      {/* Window chrome */}
      <div className="bg-gray-800 dark:bg-gray-900 px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-xs text-gray-400 ml-2 font-mono">code.py</span>
      </div>

      {/* Code content */}
      <div className="bg-gray-950 text-gray-200 p-3 sm:p-4 font-mono text-xs sm:text-sm overflow-x-auto max-h-[400px] overflow-y-auto">
        {lines.map((line, i) => {
          const lineNum = i + 1;
          const isSelected = selectedLine === lineNum;
          const isCorrectReveal =
            revealedLine !== null && correctLine === lineNum;
          const isWrongReveal =
            revealedLine !== null && selectedLine === lineNum && correctLine !== lineNum;
          const isCorrectHighlight =
            revealedLine !== null && correctLine === lineNum;

          let lineClasses =
            'flex transition-all duration-200 rounded-md px-1 -mx-1 ';

          if (isCorrectHighlight) {
            lineClasses += 'bg-emerald-500/15 border-l-2 border-emerald-400 -ml-0 pl-3 ';
          } else if (isWrongReveal) {
            lineClasses += 'bg-red-500/15 border-l-2 border-red-400 -ml-0 pl-3 ';
          } else if (isSelected) {
            lineClasses +=
              'bg-amber-500/20 border-l-2 border-amber-400 -ml-0 pl-3 ';
          } else if (!disabled) {
            lineClasses +=
              'hover:bg-gray-800/60 active:bg-gray-800/80 cursor-pointer ';
          } else {
            lineClasses += 'cursor-default ';
          }

          return (
            <div
              key={i}
              onClick={() => !disabled && onLineClick(lineNum)}
              className={`${lineClasses} ${i > 0 ? 'mt-0.5' : ''}`}
            >
              <span className="w-7 sm:w-9 text-right mr-3 sm:mr-4 text-gray-500 select-none text-[10px] sm:text-xs leading-5 sm:leading-6 shrink-0 tabular-nums">
                {lineNum}
              </span>
              <span className="whitespace-pre break-all min-w-0">{line}</span>
              {isCorrectHighlight && (
                <motion.span
                  className="ml-2 shrink-0"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                </motion.span>
              )}
              {isWrongReveal && (
                <motion.span
                  className="ml-2 shrink-0"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <X className="w-4 h-4 text-red-400" />
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ErrorTypeButton({
  errorType,
  selected,
  revealed,
  isCorrect,
  disabled,
  onClick,
}: {
  errorType: ErrorType;
  selected: boolean;
  revealed: boolean;
  isCorrect: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const config = ERROR_TYPE_CONFIG[errorType];

  let classes = `w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all flex items-center gap-3 cursor-pointer `;

  if (revealed) {
    if (selected && isCorrect) {
      classes += 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 ';
    } else if (selected && !isCorrect) {
      classes += 'bg-red-50 dark:bg-red-900/30 border-red-500 ';
    } else if (!selected && isCorrect) {
      classes += 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 ';
    } else {
      classes += 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 opacity-50 ';
    }
  } else if (selected) {
    classes += `${config.bg} ${config.border} `;
  } else {
    classes +=
      'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 ';
  }

  return (
    <motion.button
      whileHover={!disabled && !revealed ? { scale: 1.01, y: -1 } : {}}
      whileTap={!disabled && !revealed ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled || revealed}
      className={classes}
    >
      <span
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${
          revealed && selected && isCorrect
            ? 'bg-emerald-500 text-white'
            : revealed && selected && !isCorrect
              ? 'bg-red-500 text-white'
              : revealed && isCorrect
                ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300'
                : selected
                  ? config.bg + ' ' + config.color
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        }`}
      >
        {revealed && selected && isCorrect ? (
          <Check className="w-4 h-4" />
        ) : revealed && selected && !isCorrect ? (
          <X className="w-4 h-4" />
        ) : (
          config.icon
        )}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{errorType}</div>
        <div className="text-[11px] text-gray-500 dark:text-gray-400">
          {config.desc}
        </div>
      </div>
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════

export default function ErrorHunterGame({ onBack, onXP }: ErrorHunterGameProps) {
  // ── Core State ──
  const [phase, setPhase] = useState<GamePhase>('start');
  const [difficulty, setDifficulty] = useState<ErrorHunterDifficulty>('MEDIUM');
  const [challenges, setChallenges] = useState<ErrorHunterChallenge[]>([]);
  const [currentRound, setCurrentRound] = useState(0);

  // ── Per-Question State ──
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [selectedErrorType, setSelectedErrorType] = useState<ErrorType | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timer, setTimer] = useState(TIMER_PER_QUESTION);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Scores ──
  const [lineCorrect, setLineCorrect] = useState(0);
  const [classificationCorrect, setClassificationCorrect] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);

  // ── Derived ──
  const currentChallenge = challenges[currentRound] || null;

  // ── Start Game ──
  const startGame = useCallback(() => {
    const newChallenges = getRandomErrorHunterChallenge(difficulty, TOTAL_ROUNDS);
    setChallenges(newChallenges);
    setCurrentRound(0);
    setSelectedLine(null);
    setSelectedErrorType(null);
    setRevealed(false);
    setTimer(TIMER_PER_QUESTION);
    setLineCorrect(0);
    setClassificationCorrect(0);
    setTotalXP(0);
    setPhase('playing');
    // Small delay before showing first question for clean transition
    setTimeout(() => setPhase('find'), 100);
  }, [difficulty]);

  // ── Handle Timeout ──
  const handleTimeout = useCallback(() => {
    if (!currentChallenge) return;
    setRevealed(true);
    setShakeKey((k) => k + 1);
  }, [currentChallenge]);

  // ── Timer ──
  useEffect(() => {
    if (phase !== 'find' && phase !== 'classify') return;
    if (revealed) return;

    if (timer <= 0) {
      // Time's up — reveal answer
      const t = setTimeout(() => {
        handleTimeout();
      }, 0);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timer, revealed, handleTimeout]);

  // ── Handle Line Selection ──
  const handleLineClick = useCallback(
    (line: number) => {
      if (phase !== 'find' || revealed) return;
      setSelectedLine(line);
      setPhase('classify');
      // Reset timer for classification phase
      setTimer(TIMER_PER_QUESTION);
    },
    [phase, revealed],
  );

  // ── Handle Error Type Selection ──
  const handleErrorTypeClick = useCallback(
    (errorType: ErrorType) => {
      if (phase !== 'classify' || revealed || !currentChallenge) return;
      setSelectedErrorType(errorType);

      const isLineRight = selectedLine === currentChallenge.errorLine;
      const isTypeRight = errorType === currentChallenge.errorType;

      if (isLineRight) setLineCorrect((c) => c + 1);
      if (isTypeRight) setClassificationCorrect((c) => c + 1);

      // Calculate XP
      let xpEarned = 0;
      if (isLineRight) xpEarned += XP_PER_LINE_CORRECT;
      if (isTypeRight) xpEarned += XP_PER_CLASSIFICATION_CORRECT;
      // Bonus for getting both right
      if (isLineRight && isTypeRight) xpEarned += 10;

      if (xpEarned > 0) {
        setTotalXP((x) => x + xpEarned);
        onXP(xpEarned);
      }

      if (!isLineRight || !isTypeRight) {
        setShakeKey((k) => k + 1);
      }

      setRevealed(true);

      // Clear any timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    [phase, revealed, currentChallenge, selectedLine, onXP],
  );

  // ── Next Round ──
  const nextRound = useCallback(() => {
    if (currentRound + 1 >= TOTAL_ROUNDS) {
      setPhase('done');
      return;
    }
    setCurrentRound((r) => r + 1);
    setSelectedLine(null);
    setSelectedErrorType(null);
    setRevealed(false);
    setTimer(TIMER_PER_QUESTION);
    setPhase('find');
  }, [currentRound]);

  // ── Play Again ──
  const playAgain = useCallback(() => {
    setPhase('start');
  }, []);

  // ══════════════════════════════════════════════════════════════
  // RENDER: Start Screen
  // ══════════════════════════════════════════════════════════════

  function renderStartScreen() {
    return (
      <motion.div
        key="start"
        {...fadeInUp}
        className="space-y-6 max-w-lg mx-auto"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-amber-500/30"
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Bug className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Error Hunter
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-sm mx-auto">
            Find the buggy line, classify the error type, and sharpen your
            debugging skills across {TOTAL_ROUNDS} rounds.
          </p>
        </div>

        {/* How to Play */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              How to Play
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <Search className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Step 1: Find the Error</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Click the line in the code snippet that contains the bug.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Step 2: Classify It</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select the correct error type (SyntaxError, RuntimeError,
                  LogicError, TypeError, or ReferenceError).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Earn XP</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Earn XP for each correct answer. Bonus XP for getting both
                  steps right!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Difficulty Selector */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(DIFFICULTY_CONFIG) as ErrorHunterDifficulty[]).map(
              (d) => {
                const config = DIFFICULTY_CONFIG[d];
                const isActive = difficulty === d;
                return (
                  <motion.button
                    key={d}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setDifficulty(d)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      isActive
                        ? `${config.bg} border-current ${config.color}`
                        : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="text-sm font-bold">{config.label}</div>
                  </motion.button>
                );
              },
            )}
          </div>
          <p className="text-xs text-gray-400 text-center">
            {DIFFICULTY_CONFIG[difficulty].description}
          </p>
        </div>

        {/* Scoring Info */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {XP_PER_LINE_CORRECT}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              Line found
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {XP_PER_CLASSIFICATION_CORRECT}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              Type correct
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              +10
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              Both bonus
            </div>
          </div>
        </div>

        {/* Start Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={startGame}
            size="lg"
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-base shadow-lg shadow-amber-500/25 h-12"
          >
            <Bug className="w-5 h-5 mr-2" />
            Start Hunting
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </motion.div>

        {/* Back */}
        <Button
          variant="ghost"
          className="w-full text-gray-500"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: Playing Screen (find + classify phases)
  // ══════════════════════════════════════════════════════════════

  function renderPlayingScreen() {
    if (!currentChallenge) return null;

    const progressPct = ((currentRound + (revealed ? 1 : 0)) / TOTAL_ROUNDS) * 100;

    return (
      <motion.div
        key={`round-${currentRound}`}
        {...fadeInUp}
        className="space-y-4 max-w-2xl mx-auto"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={playAgain}
            className="text-gray-500 shrink-0"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Quit
          </Button>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="font-mono text-xs tabular-nums"
            >
              {currentRound + 1} / {TOTAL_ROUNDS}
            </Badge>
            <Badge
              className={`text-xs border ${DIFFICULTY_CONFIG[currentChallenge.difficulty].bg}`}
            >
              {DIFFICULTY_CONFIG[currentChallenge.difficulty].label}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-xs tabular-nums">
              <Zap className="w-3 h-3 mr-1" />
              {totalXP} XP
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        <Progress
          value={progressPct}
          className="h-1.5"
        />

        {/* Phase indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            {...fadeIn}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              {phase === 'find' && (
                <>
                  <Search className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Click the line with the error
                  </span>
                </>
              )}
              {phase === 'classify' && !revealed && (
                <>
                  <Shield className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    Now classify the error type
                  </span>
                </>
              )}
              {(phase === 'classify' || phase === 'find') && revealed && (
                <>
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Result
                  </span>
                </>
              )}
            </div>
            {!revealed && (
              <TimerCircle timeLeft={timer} maxTime={TIMER_PER_QUESTION} />
            )}
            {revealed && timer <= 0 && (
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Time&apos;s up!
              </Badge>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Challenge Info */}
        <motion.div {...fadeInUp} transition={{ delay: 0.05 }}>
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{currentChallenge.language}</span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">
                      {currentChallenge.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {currentChallenge.title}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {currentChallenge.language}
                </Badge>
              </div>
            </div>

            {/* Code Block */}
            <CardContent className="p-3 sm:p-4">
              <motion.div key={shakeKey} {...shakeAnim} transition={{ duration: 0.5 }}>
                <CodeBlock
                  code={currentChallenge.code}
                  selectedLine={selectedLine}
                  revealedLine={revealed ? currentChallenge.errorLine : null}
                  correctLine={revealed ? currentChallenge.errorLine : null}
                  disabled={revealed || phase === 'classify'}
                  onLineClick={handleLineClick}
                />
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Type Classification */}
        <AnimatePresence>
          {(phase === 'classify' || (phase === 'find' && revealed)) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4" />
                Error Type
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentChallenge.options.map((et) => (
                  <ErrorTypeButton
                    key={et}
                    errorType={et as ErrorType}
                    selected={selectedErrorType === et}
                    revealed={revealed}
                    isCorrect={et === currentChallenge.errorType}
                    disabled={phase === 'find' && !revealed}
                    onClick={() => handleErrorTypeClick(et as ErrorType)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Explanation (shown after reveal) */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card
                className={`border-2 overflow-hidden ${
                  selectedLine === currentChallenge.errorLine &&
                  selectedErrorType === currentChallenge.errorType
                    ? 'border-emerald-300 dark:border-emerald-700'
                    : 'border-amber-300 dark:border-amber-700'
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Result Summary */}
                  <div className="flex items-center gap-2">
                    {selectedLine === currentChallenge.errorLine &&
                    selectedErrorType === currentChallenge.errorType ? (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                        >
                          <Check className="w-5 h-5 text-emerald-500" />
                        </motion.div>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          Perfect! Both correct!
                        </span>
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 ml-auto">
                          +{XP_PER_LINE_CORRECT + XP_PER_CLASSIFICATION_CORRECT + 10} XP
                        </Badge>
                      </>
                    ) : (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                        >
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </motion.div>
                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                          Partially correct
                        </span>
                        {selectedLine === currentChallenge.errorLine &&
                          selectedErrorType !== currentChallenge.errorType && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ml-auto">
                              +{XP_PER_LINE_CORRECT} XP
                            </Badge>
                          )}
                        {selectedLine !== currentChallenge.errorLine &&
                          selectedErrorType === currentChallenge.errorType && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ml-auto">
                              +{XP_PER_CLASSIFICATION_CORRECT} XP
                            </Badge>
                          )}
                        {selectedLine !== currentChallenge.errorLine &&
                          selectedErrorType !== currentChallenge.errorType && (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 ml-auto">
                              +0 XP
                            </Badge>
                          )}
                      </>
                    )}
                  </div>

                  {/* Explanation */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Bug className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Explanation
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {currentChallenge.fix}
                    </p>
                  </div>

                  {/* Fix */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        The Fix
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {currentChallenge.fix}
                    </p>
                  </div>

                  {/* Next Button */}
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      onClick={nextRound}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold"
                    >
                      {currentRound + 1 >= TOTAL_ROUNDS
                        ? 'See Results'
                        : `Next Round (${currentRound + 2}/${TOTAL_ROUNDS})`}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: Results Screen
  // ══════════════════════════════════════════════════════════════

  function renderResultsScreen() {
    const linePct = Math.round((lineCorrect / TOTAL_ROUNDS) * 100);
    const classPct = Math.round((classificationCorrect / TOTAL_ROUNDS) * 100);
    const overallPct = Math.round(
      ((lineCorrect + classificationCorrect) / (TOTAL_ROUNDS * 2)) * 100,
    );

    const getGrade = () => {
      if (overallPct >= 90) return { grade: 'S', label: 'Master Debugger', color: 'text-amber-500', bg: 'from-amber-400 to-yellow-500' };
      if (overallPct >= 75) return { grade: 'A', label: 'Expert Hunter', color: 'text-emerald-500', bg: 'from-emerald-400 to-teal-500' };
      if (overallPct >= 60) return { grade: 'B', label: 'Skilled Inspector', color: 'text-blue-500', bg: 'from-blue-400 to-indigo-500' };
      if (overallPct >= 40) return { grade: 'C', label: 'Junior Developer', color: 'text-purple-500', bg: 'from-purple-400 to-fuchsia-500' };
      return { grade: 'D', label: 'Keep Practicing', color: 'text-gray-500', bg: 'from-gray-400 to-gray-500' };
    };

    const gradeInfo = getGrade();

    return (
      <motion.div
        key="results"
        {...scaleIn}
        className="space-y-6 max-w-lg mx-auto"
      >
        {/* Trophy Header */}
        <div className="text-center space-y-4">
          <motion.div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br shadow-xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          >
            <div
              className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradeInfo.bg} flex items-center justify-center`}
            >
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={`text-5xl font-black ${gradeInfo.color}`}>
              {gradeInfo.grade}
            </div>
            <div className="text-lg font-bold mt-1">{gradeInfo.label}</div>
          </motion.div>
        </div>

        {/* Score Cards */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Line Finding Score */}
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold">
                    Line Detection
                  </span>
                </div>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {lineCorrect}/{TOTAL_ROUNDS}
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${linePct}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">
                {linePct}% accuracy
              </div>
            </CardContent>
          </Card>

          {/* Classification Score */}
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold">
                    Error Classification
                  </span>
                </div>
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                  {classificationCorrect}/{TOTAL_ROUNDS}
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${classPct}%` }}
                  transition={{ duration: 1, delay: 0.7, ease: 'easeOut' }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">
                {classPct}% accuracy
              </div>
            </CardContent>
          </Card>

          {/* Overall */}
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold">
                    Overall Performance
                  </span>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {overallPct}%
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${overallPct}%` }}
                  transition={{ duration: 1.2, delay: 0.9, ease: 'easeOut' }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* XP Earned */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white overflow-hidden">
            <CardContent className="p-5 text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <div className="text-3xl font-black">{totalXP}</div>
              <div className="text-sm opacity-80 mt-1">Total XP Earned</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              onClick={startGame}
              size="lg"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-amber-500/25"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Play Again
            </Button>
          </motion.div>

          <Button
            variant="ghost"
            className="w-full text-gray-500"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: Main
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {phase === 'start' && renderStartScreen()}
          {(phase === 'playing' || phase === 'find' || phase === 'classify') &&
            renderPlayingScreen()}
          {phase === 'done' && renderResultsScreen()}
        </AnimatePresence>
      </div>
    </div>
  );
}

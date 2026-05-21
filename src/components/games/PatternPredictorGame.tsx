'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Check, X, Clock, Trophy, ArrowLeft, Play, RotateCcw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { PatternChallenge } from '@/lib/coding-games-data';
import { getRandomPatternChallenge } from '@/lib/coding-games-data';

// ─── Circular Timer Component ──────────────────────────
function CircularTimer({ timerPercent, timer, revealed }: { timerPercent: number; timer: number; revealed: boolean }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timerPercent / 100) * circumference;
  const isLow = timer <= 5 && timer > 0;
  const color = isLow
    ? 'text-red-500'
    : revealed
      ? 'text-muted-foreground'
      : timerPercent > 50
        ? 'text-emerald-500'
        : 'text-amber-500';

  return (
    <div className="relative flex items-center justify-center">
      <svg width={68} height={68} className="-rotate-90">
        <circle
          cx={34}
          cy={34}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          className="text-muted-foreground/20"
        />
        <circle
          cx={34}
          cy={34}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-1000 ${color}`}
        />
      </svg>
      <div className="absolute flex items-center justify-center">
        <Clock className={`h-4 w-4 ${color}`} />
      </div>
      <span className={`absolute -bottom-6 text-xs font-bold tabular-nums ${color}`}>
        {timer}s
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
interface PatternPredictorGameProps {
  onBack: () => void;
  onXP: (amount: number) => void;
}

// ─── Types ─────────────────────────────────────────────
type GamePhase = 'start' | 'playing' | 'result';

interface RoundResult {
  challenge: PatternChallenge;
  selectedAnswer: number | null;
  isCorrect: boolean;
  timeLeft: number;
  earnedXP: number;
}

// ─── Constants ─────────────────────────────────────────
const TOTAL_ROUNDS = 10;
const XP_PER_CORRECT = 10;
const AUTO_ADVANCE_DELAY = 2000;

const TIMER_LIMITS: Record<'Easy' | 'Medium' | 'Hard', number> = {
  Easy: 15,
  Medium: 20,
  Hard: 25,
};

const DIFFICULTY_COLORS: Record<'Easy' | 'Medium' | 'Hard', string> = {
  Easy: 'from-emerald-500 to-green-500',
  Medium: 'from-amber-500 to-yellow-500',
  Hard: 'from-red-500 to-orange-500',
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

// ─── Animation Variants ────────────────────────────────
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4 },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
};

const shakeAnim = {
  animate: {
    x: [0, -8, 8, -8, 8, 0],
    transition: { duration: 0.5 },
  },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
} as const;

const staggerItem = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
} as const;

// ─── Helper ────────────────────────────────────────────
function computeTimeBonus(timeLeft: number, maxTime: number): number {
  return Math.round((timeLeft / maxTime) * 5);
}

// ═══════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════
export default function PatternPredictorGame({ onBack, onXP }: PatternPredictorGameProps) {
  // ── State ─────────────────────────────────────────────
  const [phase, setPhase] = useState<GamePhase>('start');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [questions, setQuestions] = useState<PatternChallenge[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timer, setTimer] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentRound] ?? null;
  const maxTime = TIMER_LIMITS[difficulty];
  const timerPercent = maxTime > 0 ? (timer / maxTime) * 100 : 0;

  // ── Handlers ──────────────────────────────────────────
  const handleAnswer = useCallback(
    (answer: number | null) => {
      if (revealed || !currentQuestion) return;

      setSelectedAnswer(answer);
      setRevealed(true);

      const correctIdx = 'ABCD'.indexOf(currentQuestion.correctAnswer);
      const isCorrect = answer === correctIdx;
      const earnedXP = isCorrect ? XP_PER_CORRECT + computeTimeBonus(timer, maxTime) : 0;

      const roundResult: RoundResult = {
        challenge: currentQuestion,
        selectedAnswer: answer,
        isCorrect,
        timeLeft: timer,
        earnedXP,
      };

      setResults((prev) => [...prev, roundResult]);
      if (isCorrect) setScore((s) => s + 1);

      // Auto-advance
      autoAdvanceRef.current = setTimeout(() => {
        if (currentRound + 1 >= TOTAL_ROUNDS) {
          // Game over — calculate total XP
          const allResults = [...results, roundResult];
          const xp = allResults.reduce((sum, r) => sum + r.earnedXP, 0);
          setTotalXP(xp);
          onXP(xp);
          setPhase('result');
        } else {
          setCurrentRound((r) => r + 1);
          setSelectedAnswer(null);
          setRevealed(false);
          setTimer(TIMER_LIMITS[difficulty]);
        }
      }, AUTO_ADVANCE_DELAY);
    },
    [
      revealed,
      currentQuestion,
      timer,
      maxTime,
      currentRound,
      results,
      difficulty,
      onXP,
    ],
  );

  const handleStart = useCallback(() => {
    const qs = getRandomPatternChallenge(difficulty, TOTAL_ROUNDS);
    setQuestions(qs);
    setCurrentRound(0);
    setScore(0);
    setSelectedAnswer(null);
    setRevealed(false);
    setTimer(TIMER_LIMITS[difficulty]);
    setResults([]);
    setTotalXP(0);
    setPhase('playing');
  }, [difficulty]);

  // ── Timer Effect ──────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || revealed || !currentQuestion) return;

    if (timer <= 0) {
      // Time's up — treat as wrong
      queueMicrotask(() => handleAnswer(null));
      return;
    }

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, timer, revealed, currentQuestion, handleAnswer]);

  // ── Cleanup ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  const handlePlayAgain = useCallback(() => {
    setPhase('start');
  }, []);

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════

  // ── Start Screen ──────────────────────────────────────
  if (phase === 'start') {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-4">
        <motion.div
          {...fadeIn}
          className="flex flex-col items-center text-center"
        >
          {/* Logo */}
          <motion.div
            {...scaleIn}
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30"
          >
            <Brain className="h-10 w-10 text-white" />
          </motion.div>

          {/* Title */}
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Pattern Predictor
          </h1>
          <p className="mb-8 max-w-md text-muted-foreground">
            Predict the output of code snippets. Sharpen your logical thinking and code tracing
            skills across multiple languages and difficulty levels.
          </p>

          {/* Difficulty Selector */}
          <div className="mb-8 flex gap-3">
            {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
              <motion.button
                key={d}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficulty(d)}
                className={`relative rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                  difficulty === d
                    ? `bg-gradient-to-r ${DIFFICULTY_COLORS[d]} text-white shadow-lg`
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {difficulty === d && (
                  <motion.div
                    layoutId="difficulty-indicator"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r shadow-lg"
                    style={{
                      backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{d}</span>
              </motion.button>
            ))}
          </div>

          {/* Timer info */}
          <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {TIMER_LIMITS[difficulty]}s per question · {TOTAL_ROUNDS} rounds · {XP_PER_CORRECT} XP
              per correct + time bonus
            </span>
          </div>

          {/* Start Button */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              size="lg"
              onClick={handleStart}
              className="h-12 bg-gradient-to-r from-violet-500 to-fuchsia-500 px-10 text-base font-semibold text-white shadow-lg shadow-violet-500/30 hover:from-violet-600 hover:to-fuchsia-600"
            >
              <Play className="mr-2 h-5 w-5" />
              Start Game
            </Button>
          </motion.div>

          {/* Back */}
          <Button variant="ghost" onClick={onBack} className="mt-4 text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Playing Screen ────────────────────────────────────
  if (phase === 'playing' && currentQuestion) {
    return (
      <div className="mx-auto min-h-[80vh] max-w-3xl px-4 py-6">
        {/* Top Bar */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Quit
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>{score}</span>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4 text-violet-500" />
              <span>
                {results.reduce((sum, r) => sum + r.earnedXP, 0)} XP
              </span>
            </div>

            <Badge
              variant="outline"
              className="text-xs"
            >
              {currentRound + 1}/{TOTAL_ROUNDS}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress
          value={((currentRound + (revealed ? 1 : 0)) / TOTAL_ROUNDS) * 100}
          className="mb-6 h-2 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-violet-500 [&>[data-slot=progress-indicator]]:to-fuchsia-500"
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentRound}
            {...fadeIn}
            className="space-y-6"
          >
            {/* Question Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Badge
                    className={`bg-gradient-to-r ${DIFFICULTY_COLORS[currentQuestion.difficulty]} text-white border-0 text-xs`}
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {currentQuestion.language}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold">{currentQuestion.question}</h2>
              </div>

              {/* Timer */}
              <div className="flex-shrink-0 pt-1">
                <CircularTimer timerPercent={timerPercent} timer={timer} revealed={revealed} />
              </div>
            </div>

            {/* Code Block */}
            <div className="relative overflow-hidden rounded-xl border border-muted-foreground/10 bg-[#1e1e2e] shadow-xl">
              {/* Window controls */}
              <div className="flex items-center gap-2 border-b border-white/5 bg-[#181825] px-4 py-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-white/30">
                  {currentQuestion.language}
                </span>
              </div>
              {/* Code */}
              <pre className="overflow-x-auto p-5 text-sm leading-relaxed text-gray-200">
                <code>{currentQuestion.code}</code>
              </pre>
            </div>

            {/* Options */}
            <motion.div
              {...staggerContainer}
              className="grid gap-3 sm:grid-cols-2"
            >
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                const correctIdx = 'ABCD'.indexOf(currentQuestion.correctAnswer);
                const isCorrectOption = correctIdx === idx;
                const isWrong = revealed && isSelected && !isCorrectOption;

                let optionClass =
                  'relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all';

                if (!revealed) {
                  optionClass += ' border-muted-foreground/15 bg-card hover:border-violet-500/50 hover:bg-violet-500/5 cursor-pointer';
                } else if (isCorrectOption) {
                  optionClass += ' border-emerald-500 bg-emerald-500/10';
                } else if (isWrong) {
                  optionClass += ' border-red-500 bg-red-500/10';
                } else {
                  optionClass += ' border-muted-foreground/10 bg-card/50 opacity-50';
                }

                return (
                  <motion.button
                    key={idx}
                    {...staggerItem}
                    disabled={revealed}
                    onClick={() => handleAnswer(idx)}
                    className={optionClass}
                  >
                    {/* Option label */}
                    <span
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        revealed && isCorrectOption
                          ? 'bg-emerald-500 text-white'
                          : revealed && isWrong
                            ? 'bg-red-500 text-white'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {revealed && isCorrectOption ? (
                        <Check className="h-4 w-4" />
                      ) : revealed && isWrong ? (
                        <X className="h-4 w-4" />
                      ) : (
                        OPTION_LABELS[idx]
                      )}
                    </span>

                    <span className="pt-0.5 text-sm font-medium leading-relaxed">
                      {option}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Feedback */}
            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {selectedAnswer === 'ABCD'.indexOf(currentQuestion.correctAnswer) ? (
                    <motion.div
                      {...shakeAnim.animate && {}}
                      className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"
                    >
                      <div className="mb-2 flex items-center gap-2 text-emerald-400">
                        <Check className="h-5 w-5" />
                        <span className="font-semibold">Correct!</span>
                        <Badge className="ml-auto border-0 bg-emerald-500/20 text-emerald-400">
                          +{results[results.length - 1]?.earnedXP ?? 0} XP
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {currentQuestion.explanation}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      animate={{
                        x: [0, -6, 6, -6, 6, 0],
                        transition: { duration: 0.4 },
                      }}
                      className="rounded-xl border border-red-500/20 bg-red-500/5 p-4"
                    >
                      <div className="mb-2 flex items-center gap-2 text-red-400">
                        <X className="h-5 w-5" />
                        <span className="font-semibold">
                          {selectedAnswer === null ? "Time's up!" : 'Incorrect'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {currentQuestion.explanation}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── Results Screen ────────────────────────────────────
  if (phase === 'result') {
    const accuracy = results.length > 0 ? Math.round((score / TOTAL_ROUNDS) * 100) : 0;
    const grade =
      accuracy >= 90
        ? { label: 'Outstanding!', color: 'from-amber-400 to-yellow-300', emoji: '🏆' }
        : accuracy >= 70
          ? { label: 'Great Job!', color: 'from-emerald-400 to-green-300', emoji: '🎯' }
          : accuracy >= 50
            ? { label: 'Good Effort!', color: 'from-blue-400 to-cyan-300', emoji: '💪' }
            : { label: 'Keep Practicing!', color: 'from-violet-400 to-fuchsia-300', emoji: '📚' };

    return (
      <div className="mx-auto min-h-[80vh] max-w-3xl px-4 py-8">
        <motion.div
          {...fadeIn}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <motion.div
              {...scaleIn}
              className="mb-4 text-6xl"
            >
              {grade.emoji}
            </motion.div>

            <h1 className="mb-1 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              {grade.label}
            </h1>
            <p className="text-muted-foreground">
              You completed the Pattern Predictor challenge
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                icon: <Trophy className="h-5 w-5" />,
                label: 'Score',
                value: `${score}/${TOTAL_ROUNDS}`,
                gradient: 'from-amber-500 to-yellow-500',
              },
              {
                icon: <Brain className="h-5 w-5" />,
                label: 'Accuracy',
                value: `${accuracy}%`,
                gradient: 'from-violet-500 to-fuchsia-500',
              },
              {
                icon: <Zap className="h-5 w-5" />,
                label: 'XP Earned',
                value: `${totalXP}`,
                gradient: 'from-emerald-500 to-green-500',
              },
              {
                icon: <Clock className="h-5 w-5" />,
                label: 'Difficulty',
                value: difficulty,
                gradient: DIFFICULTY_COLORS[difficulty],
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                {...staggerItem}
                className="flex flex-col items-center rounded-xl border border-muted-foreground/10 bg-card p-4 text-center"
              >
                <div
                  className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${stat.gradient} text-white shadow-md`}
                >
                  {stat.icon}
                </div>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className="text-xl font-bold">{stat.value}</span>
              </motion.div>
            ))}
          </div>

          {/* Round Summary */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
              Round Summary
            </h3>

            <div className="rounded-xl border border-muted-foreground/10 bg-card">
              <div className="divide-y divide-muted-foreground/5">
                {results.map((r, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {/* Status Icon */}
                    <div
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                        r.isCorrect
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-red-500/15 text-red-500'
                      }`}
                    >
                      {r.isCorrect ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">
                        {r.challenge.question}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.challenge.language} · {r.challenge.difficulty}
                        {r.isCorrect && (
                          <span className="ml-1 text-emerald-500">
                            · +{r.earnedXP} XP
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Answer */}
                    {r.selectedAnswer !== null ? (
                      <span className="flex-shrink-0 text-xs text-muted-foreground">
                        {OPTION_LABELS[r.selectedAnswer]}
                      </span>
                    ) : (
                      <span className="flex-shrink-0 text-xs text-muted-foreground italic">
                        timed out
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                onClick={handlePlayAgain}
                className="h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 px-8 font-semibold text-white shadow-lg shadow-violet-500/30 hover:from-violet-600 hover:to-fuchsia-600"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Play Again
              </Button>
            </motion.div>

            <Button
              variant="outline"
              size="lg"
              onClick={onBack}
              className="h-11 px-8"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Fallback (should never reach here)
  return null;
}

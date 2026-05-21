'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Check,
  X,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Trophy,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { CodeCompletionChallenge } from '@/lib/coding-games-data';

// ══════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════

interface CodeCompletionGameProps {
  onBack: () => void;
  onXP: (amount: number) => void;
  challenge?: CodeCompletionChallenge;
}

type GamePhase = 'start' | 'playing' | 'results';
type BlankFeedback = 'none' | 'correct' | 'incorrect';

interface BlankSegment {
  type: 'code' | 'blank';
  content: string;
  blankIndex?: number;
}

// ══════════════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════════════

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  HARD: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

const LANG_ICONS: Record<string, string> = {
  python: '\uD83D\uDC0D',
  javascript: '\u26A1',
  java: '\u2615',
  cpp: '\uD83D\uDD27',
  typescript: '\uD83D\uDCD8',
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
  animate: { transition: { staggerChildren: 0.07 } },
};

const staggerChild = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const shakeVariant = {
  animate: {
    x: [0, -6, 6, -4, 4, -2, 2, 0],
    transition: { duration: 0.4 },
  },
};

const correctFlash = {
  animate: {
    backgroundColor: ['rgba(34,197,94,0.2)', 'rgba(34,197,94,0.4)', 'rgba(34,197,94,0.2)'],
    transition: { duration: 0.6 },
  },
};

const incorrectFlash = {
  animate: {
    backgroundColor: ['rgba(239,68,68,0.2)', 'rgba(239,68,68,0.4)', 'rgba(239,68,68,0.2)'],
    transition: { duration: 0.6 },
  },
};

// ══════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════

/** Split a code string into code and blank segments */
function parseCodeSegments(code: string): BlankSegment[] {
  const segments: BlankSegment[] = [];
  const placeholder = '____';
  let blankIndex = 0;
  let remaining = code;

  while (remaining.length > 0) {
    const idx = remaining.indexOf(placeholder);
    if (idx === -1) {
      segments.push({ type: 'code', content: remaining });
      break;
    }
    if (idx > 0) {
      segments.push({ type: 'code', content: remaining.slice(0, idx) });
    }
    segments.push({ type: 'blank', content: placeholder, blankIndex });
    blankIndex++;
    remaining = remaining.slice(idx + placeholder.length);
  }

  return segments;
}

/** Calculate XP earned based on points and wrong answers */
function calculateXP(basePoints: number, wrongCount: number): number {
  return Math.max(5, basePoints - wrongCount * 5);
}

// ══════════════════════════════════════════════════════════════
// Default challenge (used when no challenge prop is provided)
// ══════════════════════════════════════════════════════════════

const DEFAULT_CHALLENGE: CodeCompletionChallenge = {
  id: 'cc-default-1',
  language: 'python',
  difficulty: 'EASY',
  topic: 'basics',
  code: '____ "Hello, World!"',
  blanks: ['print'],
  options: [['print', 'echo', 'console.log', 'write']],
  explanation: 'Python uses print() to output text to the console. Unlike many other languages, Python has a built-in print function that is the standard way to display output.',
  points: 20,
};

// ══════════════════════════════════════════════════════════════
// Sub-components
// ══════════════════════════════════════════════════════════════

/** Renders a single blank slot in the code */
function BlankSlot({
  isActive,
  selectedAnswer,
  correctAnswer,
  feedback,
  revealed,
}: {
  isActive: boolean;
  selectedAnswer: string | null;
  correctAnswer: string;
  feedback: BlankFeedback;
  revealed: boolean;
}) {
  const displayText = revealed
    ? selectedAnswer || '?'
    : selectedAnswer || '____';

  const borderColor = revealed
    ? feedback === 'correct'
      ? 'border-emerald-400 bg-emerald-500/15'
      : feedback === 'incorrect'
        ? 'border-rose-400 bg-rose-500/15'
        : 'border-gray-600'
    : isActive
      ? 'border-yellow-400 bg-yellow-500/10'
      : 'border-gray-600 bg-gray-800/40';

  const textColor = revealed
    ? feedback === 'correct'
      ? 'text-emerald-300'
      : feedback === 'incorrect'
        ? 'text-rose-300 line-through decoration-rose-400'
        : 'text-gray-300'
    : isActive
      ? 'text-yellow-300'
      : 'text-gray-400';

  return (
    <motion.span
      key={`blank-${displayText}`}
      className={`
        relative inline-flex items-center justify-center px-2 py-0.5
        rounded border-2 font-mono text-sm whitespace-nowrap
        transition-colors duration-200 min-w-[3rem]
        ${borderColor} ${textColor}
        ${isActive && !revealed ? 'animate-pulse' : ''}
      `}
      initial={feedback === 'incorrect' && revealed ? { x: 0 } : undefined}
      animate={
        feedback === 'correct' && revealed
          ? correctFlash.animate
          : feedback === 'incorrect' && revealed
            ? { ...shakeVariant.animate }
            : isActive && !revealed
              ? { scale: [1, 1.03, 1], transition: { duration: 1.2, repeat: Infinity } }
              : undefined
      }
      layout
    >
      {displayText}
      {isActive && !revealed && (
        <motion.span
          className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </motion.span>
  );
}

/** Renders the code block with parsed segments */
function CodeDisplay({
  segments,
  currentBlankIndex,
  selectedAnswers,
  blankFeedbacks,
  revealed,
  blanks,
}: {
  segments: BlankSegment[];
  currentBlankIndex: number;
  selectedAnswers: (string | null)[];
  blankFeedbacks: BlankFeedback[];
  revealed: boolean;
  blanks: string[];
}) {
  return (
    <div className="relative">
      {/* Line numbers + code */}
      <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border-b border-gray-800">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs text-gray-500 font-mono ml-2">solution.py</span>
        </div>

        {/* Code content */}
        <div className="p-4 sm:p-5 overflow-x-auto">
          <pre className="font-mono text-sm sm:text-base leading-relaxed">
            <code>
              {segments.map((seg, i) => {
                if (seg.type === 'blank') {
                  const bIdx = seg.blankIndex!;
                  return (
                    <BlankSlot
                      key={`blank-${bIdx}`}
                      isActive={bIdx === currentBlankIndex && !revealed}
                      selectedAnswer={selectedAnswers[bIdx]}
                      correctAnswer={blanks[bIdx]}
                      feedback={blankFeedbacks[bIdx]}
                      revealed={revealed}
                    />
                  );
                }
                return (
                  <span key={`code-${i}`} className="text-gray-200">
                    {seg.content}
                  </span>
                );
              })}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

/** Renders a single option button */
function OptionButton({
  label,
  text,
  isSelected,
  isCorrectAnswer,
  isRevealed,
  feedback,
  onClick,
}: {
  label: string;
  text: string;
  isSelected: boolean;
  isCorrectAnswer: boolean;
  isRevealed: boolean;
  feedback: BlankFeedback;
  onClick: () => void;
}) {
  const baseClasses =
    'w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border-2 transition-all duration-200 text-left';

  let styling = '';
  if (isRevealed) {
    if (isSelected && feedback === 'correct') {
      styling =
        'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 cursor-default';
    } else if (isSelected && feedback === 'incorrect') {
      styling =
        'border-rose-500 bg-rose-50 dark:bg-rose-900/30 cursor-default';
    } else if (isCorrectAnswer) {
      styling =
        'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 cursor-default';
    } else {
      styling = 'border-gray-200 dark:border-gray-700 opacity-50 cursor-default';
    }
  } else {
    styling =
      'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 cursor-pointer';
  }

  let iconBg = 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
  if (isRevealed) {
    if (isSelected && feedback === 'correct') {
      iconBg = 'bg-emerald-500 text-white';
    } else if (isSelected && feedback === 'incorrect') {
      iconBg = 'bg-rose-500 text-white';
    } else if (isCorrectAnswer) {
      iconBg = 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300';
    } else {
      iconBg = 'bg-gray-100 dark:bg-gray-700 text-gray-400';
    }
  }

  return (
    <motion.button
      className={`${baseClasses} ${styling}`}
      onClick={onClick}
      disabled={isRevealed}
      whileHover={!isRevealed ? { scale: 1.01, y: -1 } : undefined}
      whileTap={!isRevealed ? { scale: 0.98 } : undefined}
      layout
    >
      <span
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${iconBg}`}
      >
        {isRevealed && isSelected && feedback === 'correct' ? (
          <Check className="w-4 h-4" />
        ) : isRevealed && isSelected && feedback === 'incorrect' ? (
          <X className="w-4 h-4" />
        ) : (
          label
        )}
      </span>
      <span className="font-mono text-sm font-medium flex-1 truncate">
        {text}
      </span>
      {isRevealed && !isSelected && isCorrectAnswer && (
        <motion.span
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs text-emerald-600 dark:text-emerald-400 font-medium shrink-0"
        >
          correct
        </motion.span>
      )}
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

export default function CodeCompletionGame({
  onBack,
  onXP,
  challenge: challengeProp,
}: CodeCompletionGameProps) {
  // ── State ──
  const [phase, setPhase] = useState<GamePhase>('start');
  const [currentBlankIndex, setCurrentBlankIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>([]);
  const [blankFeedbacks, setBlankFeedbacks] = useState<BlankFeedback[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const codeContainerRef = useRef<HTMLDivElement>(null);

  // ── Derived data ──
  const challenge = challengeProp || DEFAULT_CHALLENGE;
  const blanks = challenge.blanks;
  const options = challenge.options;
  const totalBlanks = blanks.length;

  const segments = useMemo(
    () => parseCodeSegments(challenge.code),
    [challenge.code],
  );

  const progressPercent = useMemo(() => {
    if (revealed) return 100;
    if (totalBlanks === 0) return 100;
    return (currentBlankIndex / totalBlanks) * 100;
  }, [currentBlankIndex, totalBlanks, revealed]);

  const wrongCount = useMemo(
    () =>
      blankFeedbacks.filter((f) => f === 'incorrect').length,
    [blankFeedbacks],
  );

  const correctCount = useMemo(
    () =>
      blankFeedbacks.filter((f) => f === 'correct').length,
    [blankFeedbacks],
  );

  // ── Initialize / Reset ──
  const resetGame = useCallback(() => {
    setCurrentBlankIndex(0);
    setSelectedAnswers(Array(totalBlanks).fill(null));
    setBlankFeedbacks(Array(totalBlanks).fill('none'));
    setRevealed(false);
    setEarnedXP(0);
  }, [totalBlanks]);

  const startGame = useCallback(() => {
    resetGame();
    setPhase('playing');
  }, [resetGame]);

  // ── Handle option selection ──
  const handleOptionSelect = useCallback(
    (optionText: string) => {
      if (revealed) return;

      const isCorrect = optionText === blanks[currentBlankIndex];
      const newFeedback: BlankFeedback = isCorrect ? 'correct' : 'incorrect';

      setSelectedAnswers((prev) => {
        const next = [...prev];
        next[currentBlankIndex] = optionText;
        return next;
      });

      setBlankFeedbacks((prev) => {
        const next = [...prev];
        next[currentBlankIndex] = newFeedback;
        return next;
      });

      // After a brief delay, move to the next blank or finish
      if (currentBlankIndex + 1 < totalBlanks) {
        setTimeout(() => {
          setCurrentBlankIndex((i) => i + 1);
        }, 500);
      } else {
        // Last blank — reveal results
        setTimeout(() => {
          const newWrongCount =
            blankFeedbacks.filter((f) => f === 'incorrect').length +
            (isCorrect ? 0 : 1);
          const xp = calculateXP(challenge.points, newWrongCount);
          setEarnedXP(xp);
          onXP(xp);
          setRevealed(true);
          setPhase('results');
        }, 700);
      }
    },
    [
      revealed,
      currentBlankIndex,
      blanks,
      totalBlanks,
      blankFeedbacks,
      challenge.points,
      onXP,
    ],
  );

  // ── Scroll active blank into view ──
  useEffect(() => {
    if (phase !== 'playing' || revealed) return;
    // Brief delay to let the DOM update
    const timer = setTimeout(() => {
      const container = codeContainerRef.current;
      if (container) {
        const activeEl = container.querySelector('.animate-pulse');
        if (activeEl) {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentBlankIndex, phase, revealed]);

  // ── Language icon helper ──
  const langIcon = LANG_ICONS[challenge.language] || '\uD83D\uDCBB';
  const langName = challenge.language.charAt(0).toUpperCase() + challenge.language.slice(1);

  // ══════════════════════════════════════════════════════════════
  // RENDER: Start Screen
  // ══════════════════════════════════════════════════════════════

  function renderStart() {
    const previewSegments = parseCodeSegments(challenge.code);

    return (
      <motion.div
        key="start"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Code2 className="w-7 h-7 text-indigo-500" />
              Code Completion
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Fill in the blanks to complete the code
            </p>
          </div>
        </div>

        {/* Challenge Info Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 dark:from-indigo-700 dark:via-violet-700 dark:to-purple-800 p-5 sm:p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge className="bg-white/20 text-white border-0 text-xs">
                    {langIcon} {langName}
                  </Badge>
                  <Badge className={`${DIFFICULTY_STYLES[challenge.difficulty] || ''} border-0`}>
                    {challenge.difficulty}
                  </Badge>
                  <Badge className="bg-white/15 text-white border-0 text-xs capitalize">
                    {challenge.topic}
                  </Badge>
                </div>
                <p className="text-white/90 text-sm sm:text-base">
                  Complete the code below by filling in {totalBlanks} blank{totalBlanks !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-white/80 text-xs flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    {challenge.points} XP available
                  </span>
                  <span className="text-white/80 text-xs flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5" />
                    {totalBlanks} blank{totalBlanks !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <motion.div
                className="text-5xl sm:text-6xl shrink-0"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                {langIcon}
              </motion.div>
            </div>
          </div>
        </Card>

        {/* Code Preview */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Preview
            </CardTitle>
            <CardDescription>Here&apos;s the code with blanks to fill</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border-b border-gray-800">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs text-gray-500 font-mono ml-2">
                  {challenge.language === 'javascript' ? 'script.js' : challenge.language === 'python' ? 'solution.py' : challenge.language === 'java' ? 'Main.java' : challenge.language === 'cpp' ? 'main.cpp' : 'index.ts'}
                </span>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="font-mono text-sm sm:text-base leading-relaxed">
                  <code>
                    {previewSegments.map((seg, i) => {
                      if (seg.type === 'blank') {
                        return (
                          <span
                            key={`preview-blank-${seg.blankIndex}`}
                            className="inline-flex items-center px-2 py-0.5 rounded border-2 border-dashed border-yellow-400/60 text-yellow-300 font-mono text-sm bg-yellow-500/10 min-w-[3rem] justify-center"
                          >
                            ____
                          </span>
                        );
                      }
                      return (
                        <span key={`preview-code-${i}`} className="text-gray-400">
                          {seg.content}
                        </span>
                      );
                    })}
                  </code>
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Start Button */}
        <motion.div className="flex justify-center" variants={staggerChild}>
          <Button
            size="lg"
            onClick={startGame}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 px-8 text-base font-semibold h-12 rounded-xl"
          >
            Start Challenge
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: Game Screen
  // ══════════════════════════════════════════════════════════════

  function renderPlaying() {
    const currentOptions = options[currentBlankIndex] || [];

    return (
      <motion.div
        key="playing"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-5"
      >
        {/* Top Bar */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold truncate">Fill in the Blank</h2>
              <Badge variant="outline" className="shrink-0 text-xs">
                {langIcon} {langName}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={progressPercent} className="h-2 flex-1" />
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 font-medium">
                {Math.min(currentBlankIndex + 1, totalBlanks)}/{totalBlanks}
              </span>
            </div>
          </div>
        </div>

        {/* Instruction */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBlankIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <motion.div
              className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.4 }}
            >
              <span className="text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                {currentBlankIndex + 1}
              </span>
            </motion.div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Select the correct code for blank{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                #{currentBlankIndex + 1}
              </span>{' '}
              of {totalBlanks}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Code Display */}
        <div ref={codeContainerRef}>
          <CodeDisplay
            segments={segments}
            currentBlankIndex={currentBlankIndex}
            selectedAnswers={selectedAnswers}
            blankFeedbacks={blankFeedbacks}
            revealed={revealed}
            blanks={blanks}
          />
        </div>

        {/* Options */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`options-${currentBlankIndex}`}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-3"
          >
            {currentOptions.map((opt, optIdx) => (
              <motion.div key={`${currentBlankIndex}-${opt}`} variants={staggerChild}>
                <OptionButton
                  label={OPTION_LABELS[optIdx]}
                  text={opt}
                  isSelected={
                    selectedAnswers[currentBlankIndex] === opt
                  }
                  isCorrectAnswer={blanks[currentBlankIndex] === opt}
                  isRevealed={false}
                  feedback={blankFeedbacks[currentBlankIndex]}
                  onClick={() => handleOptionSelect(opt)}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: Results Screen
  // ══════════════════════════════════════════════════════════════

  function renderResults() {
    const accuracy = totalBlanks > 0 ? Math.round((correctCount / totalBlanks) * 100) : 0;
    const isPerfect = correctCount === totalBlanks;

    return (
      <motion.div
        key="results"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className={`w-6 h-6 ${isPerfect ? 'text-yellow-500' : 'text-gray-400'}`} />
            {isPerfect ? 'Perfect Score!' : accuracy >= 70 ? 'Great Job!' : 'Keep Practicing!'}
          </h2>
        </div>

        {/* Score Summary */}
        <motion.div variants={scaleIn} initial="initial" animate="animate">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div
              className={`p-5 sm:p-6 text-white ${
                isPerfect
                  ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500'
                  : accuracy >= 70
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600'
                    : 'bg-gradient-to-r from-slate-500 via-gray-600 to-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <motion.div
                    className="text-4xl sm:text-5xl font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  >
                    +{earnedXP}
                  </motion.div>
                  <div className="text-white/80 text-sm mt-1">XP earned</div>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-2 justify-end">
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span className="text-white font-semibold">{correctCount} correct</span>
                  </div>
                  {wrongCount > 0 && (
                    <div className="flex items-center gap-2 justify-end">
                      <X className="w-4 h-4 text-rose-300" />
                      <span className="text-white font-semibold">{wrongCount} wrong</span>
                    </div>
                  )}
                  <div className="text-white/70 text-xs">
                    {accuracy}% accuracy
                  </div>
                </div>
              </div>
              {isPerfect && (
                <motion.div
                  className="mt-4 flex items-center gap-2 text-sm font-medium"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Sparkles className="w-4 h-4" />
                  No mistakes — full points awarded!
                </motion.div>
              )}
              {!isPerfect && wrongCount > 0 && (
                <motion.div
                  className="mt-3 text-white/70 text-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  -{wrongCount * 5} XP penalty ({wrongCount} mistake{wrongCount !== 1 ? 's' : ''} x -5)
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Code with Answers */}
        <motion.div variants={fadeIn} initial="initial" animate="animate" transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-500" />
                Solution
              </CardTitle>
              <CardDescription>
                Correct answers in green, wrong answers in red
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <CodeDisplay
                segments={segments}
                currentBlankIndex={-1}
                selectedAnswers={selectedAnswers}
                blankFeedbacks={blankFeedbacks}
                revealed={true}
                blanks={blanks}
              />

              {/* Show correct answers for wrong blanks */}
              {wrongCount > 0 && (
                <motion.div
                  className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                    <X className="w-4 h-4" />
                    Corrections
                  </p>
                  <div className="space-y-1.5">
                    {blanks.map((correct, idx) => {
                      if (selectedAnswers[idx] !== correct) {
                        return (
                          <div key={idx} className="text-sm flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400">
                              Blank #{idx + 1}:
                            </span>
                            <span className="font-mono text-rose-500 line-through">
                              {selectedAnswers[idx]}
                            </span>
                            <span className="text-gray-400">&rarr;</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                              {correct}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Explanation */}
        <motion.div variants={fadeIn} initial="initial" animate="animate" transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Explanation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                {challenge.explanation}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 pt-2"
        >
          <Button
            variant="outline"
            onClick={startGame}
            className="flex-1 h-11 rounded-xl"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={onBack}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white"
          >
            Back to Games
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-6">
      <AnimatePresence mode="wait">
        {phase === 'start' && renderStart()}
        {phase === 'playing' && renderPlaying()}
        {phase === 'results' && renderResults()}
      </AnimatePresence>
    </div>
  );
}

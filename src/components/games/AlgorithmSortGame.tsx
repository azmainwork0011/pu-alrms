'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpDown, ListOrdered, GitBranch, Workflow,
  ArrowLeft, Play, RotateCcw, Trophy,
  Check, X, Clock, Zap, Target, ChevronRight,
  GripVertical, Undo2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AnimatedCounter } from '@/components/pu-helpers';
import type { AlgorithmSortChallenge } from '@/lib/coding-games-data';
import { getRandomAlgorithmSortChallenge, shuffleArray } from '@/lib/coding-games-data';

// ══════════════════════════════════════════════════════════════
// Animation Variants
// ══════════════════════════════════════════════════════════════

const fadeIn = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };
const scaleIn = { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 } };
const shakeAnim = { animate: { x: [0, -8, 8, -6, 6, -3, 3, 0] } };

const TOTAL_ROUNDS = 10;
const TIMER_PER_QUESTION = 30;

const diffColors: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  HARD: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

// ══════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════

interface AlgorithmSortGameProps {
  onBack: () => void;
  onXP: (amount: number) => void;
}

export default function AlgorithmSortGame({ onBack, onXP }: AlgorithmSortGameProps) {
  const [phase, setPhase] = useState<'start' | 'playing' | 'revealed' | 'results'>('start');
  const [challenges, setChallenges] = useState<AlgorithmSortChallenge[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(TIMER_PER_QUESTION);
  const [timerActive, setTimerActive] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  // Step ordering state
  const [availableSteps, setAvailableSteps] = useState<string[]>([]);
  const [userOrder, setUserOrder] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctOrder, setCorrectOrder] = useState<string[]>([]);

  const currentChallenge = challenges[currentRound] ?? null;

  // ── Start Game ──
  const startGame = useCallback(() => {
    const pool = getRandomAlgorithmSortChallenge(undefined, TOTAL_ROUNDS + 4);
    const picked = shuffleArray(pool).slice(0, TOTAL_ROUNDS);
    setChallenges(picked);
    setCurrentRound(0);
    setScore(0);

    const first = picked[0];
    // options are the shuffled steps, steps are the correct order
    const available = first.options.length > 0 ? [...first.options] : shuffleArray([...first.steps]);
    setAvailableSteps(available);
    setUserOrder([]);
    setCorrectOrder(first.steps);
    setIsCorrect(false);
    setTimer(TIMER_PER_QUESTION);
    setTimerActive(true);
    setPhase('playing');
    setXpEarned(0);
  }, []);

  // ── Timer ──
  useEffect(() => {
    if (phase !== 'playing' || !timerActive) return;
    if (timer <= 0) {
      queueMicrotask(() => {
        setTimerActive(false);
        setIsCorrect(false);
        setPhase('revealed');
      });
      return;
    }
    const t = setTimeout(() => setTimer(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timer, timerActive]);

  // ── Click a step to add it to user order ──
  const handleStepClick = useCallback((step: string) => {
    if (phase !== 'playing') return;
    if (userOrder.includes(step)) return;

    const newUserOrder = [...userOrder, step];
    setUserOrder(newUserOrder);

    if (newUserOrder.length === correctOrder.length) {
      setTimerActive(false);
      const correct = newUserOrder.every((s, i) => s === correctOrder[i]);
      setIsCorrect(correct);
      if (correct) setScore(s => s + 1);
      setPhase('revealed');
    }
  }, [phase, userOrder, correctOrder]);

  // ── Undo last step ──
  const handleUndo = useCallback(() => {
    if (phase !== 'playing' || userOrder.length === 0) return;
    setUserOrder(prev => prev.slice(0, -1));
  }, [phase, userOrder]);

  // ── Reset current question ──
  const handleResetOrder = useCallback(() => {
    if (phase !== 'playing') return;
    setUserOrder([]);
  }, [phase]);

  // ── Next round ──
  const handleNext = useCallback(() => {
    if (currentRound + 1 >= TOTAL_ROUNDS) {
      const xp = Math.round((score / TOTAL_ROUNDS) * 120);
      setXpEarned(xp);
      onXP(xp);
      setPhase('results');
    } else {
      const nextRound = currentRound + 1;
      const nextChallenge = challenges[nextRound];
      setCurrentRound(nextRound);
      const available = nextChallenge.options.length > 0 ? [...nextChallenge.options] : shuffleArray([...nextChallenge.steps]);
      setAvailableSteps(available);
      setUserOrder([]);
      setCorrectOrder(nextChallenge.steps);
      setIsCorrect(false);
      setTimer(TIMER_PER_QUESTION);
      setTimerActive(true);
      setPhase('playing');
    }
  }, [currentRound, score, challenges, onXP]);

  const playAgain = useCallback(() => startGame(), [startGame]);

  // ══════════════════════════════════════════════════════════════
  // RENDER: Start Screen
  // ══════════════════════════════════════════════════════════════

  if (phase === 'start') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div {...scaleIn} className="w-full max-w-md">
          <Card className="border-0 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-700 dark:to-purple-800 p-8 text-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-4"
              >
                <ListOrdered className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">Algorithm Sort</h1>
              <p className="text-indigo-100 text-sm">Arrange algorithm steps in the correct order</p>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-3">
                {[
                  { icon: <ArrowUpDown className="w-5 h-5 text-indigo-500" />, text: 'Click steps in the correct sequence' },
                  { icon: <GitBranch className="w-5 h-5 text-indigo-500" />, text: 'Sort algorithms: Bubble, Merge, Quick & more' },
                  { icon: <Workflow className="w-5 h-5 text-indigo-500" />, text: '10 rounds of algorithmic ordering' },
                  { icon: <Clock className="w-5 h-5 text-indigo-500" />, text: '30 seconds per question' },
                ].map((item, i) => (
                  <motion.div key={i} {...fadeIn} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">{item.icon}</div>
                    {item.text}
                  </motion.div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white" onClick={startGame}>
                  <Play className="w-4 h-4 mr-1" /> Start
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: Results Screen
  // ══════════════════════════════════════════════════════════════

  if (phase === 'results') {
    const accuracy = Math.round((score / TOTAL_ROUNDS) * 100);
    const emoji = accuracy >= 80 ? '🏆' : accuracy >= 50 ? '👍' : '💪';
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div {...scaleIn} className="w-full max-w-md">
          <Card className="border-0 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-700 dark:to-purple-800 p-8 text-center">
              <motion.div {...scaleIn} className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4 text-4xl">{emoji}</motion.div>
              <h1 className="text-2xl font-bold text-white mb-1">Game Complete!</h1>
              <p className="text-indigo-100">Here&apos;s how you did in Algorithm Sort</p>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="space-y-1">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400"><AnimatedCounter target={score} /></div>
                  <div className="text-xs text-gray-500">Correct</div>
                </motion.div>
                <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="space-y-1">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400"><AnimatedCounter target={accuracy} />%</div>
                  <div className="text-xs text-gray-500">Accuracy</div>
                </motion.div>
                <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="space-y-1">
                  <div className="text-3xl font-bold text-amber-500"><AnimatedCounter target={xpEarned} /></div>
                  <div className="text-xs text-gray-500">XP Earned</div>
                </motion.div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Score</span>
                  <span className="font-semibold">{score}/{TOTAL_ROUNDS}</span>
                </div>
                <Progress value={accuracy} className="h-2" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white" onClick={playAgain}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Play Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: Playing / Revealed Screen
  // ══════════════════════════════════════════════════════════════

  if (!currentChallenge) return null;
  const isRevealed = phase === 'revealed';

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-3 sm:p-4">
      <motion.div {...fadeIn} className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-500">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Badge className={diffColors[currentChallenge.difficulty]}>{currentChallenge.difficulty}</Badge>
            <Badge variant="outline" className="text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700">
              <Target className="w-3 h-3 mr-1" /> {score} pts
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Round {currentRound + 1} of {TOTAL_ROUNDS}</span>
            <span>{userOrder.length}/{correctOrder.length} steps selected</span>
          </div>
          <Progress value={(currentRound / TOTAL_ROUNDS) * 100} className="h-2" />
        </div>

        <Card className="border-0 shadow-xl overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-700 dark:to-purple-800 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-white/80 text-sm"><Workflow className="w-4 h-4" /> Algorithm Sort</div>
              <motion.div
                animate={timer <= 5 ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                  timer <= 5 ? 'bg-rose-500 text-white' : 'bg-white/20 text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> {timer}s
              </motion.div>
            </div>
          </div>

          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Algorithm name + description */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">{currentChallenge.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{currentChallenge.description}</p>
            </div>

            {/* User's ordered list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Your Order</h3>
                {!isRevealed && userOrder.length > 0 && (
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" onClick={handleUndo} className="h-7 px-2 text-xs text-gray-500">
                      <Undo2 className="w-3.5 h-3.5 mr-1" /> Undo
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleResetOrder} className="h-7 px-2 text-xs text-gray-500">
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
                    </Button>
                  </div>
                )}
              </div>
              <div className="min-h-[60px] rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-900/10 p-2 space-y-1.5">
                {userOrder.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">Click steps below in the correct order...</p>
                ) : (
                  <AnimatePresence>
                    {userOrder.map((step, idx) => {
                      const stepCorrect = isRevealed && idx < correctOrder.length && step === correctOrder[idx];
                      const stepWrong = isRevealed && (idx >= correctOrder.length || step !== correctOrder[idx]);
                      return (
                        <motion.div key={`user-${idx}`} {...fadeIn} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                          isRevealed ? stepCorrect ? 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700' : 'bg-rose-100 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-700' : 'bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700'
                        }`}>
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                            isRevealed ? stepCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white' : 'bg-indigo-500 text-white'
                          }`}>
                            {isRevealed && stepCorrect ? <Check className="w-3 h-3" /> : isRevealed && stepWrong ? <X className="w-3 h-3" /> : idx + 1}
                          </span>
                          <span className="flex-1 text-gray-700 dark:text-gray-200 text-xs sm:text-sm">{step}</span>
                          {!isRevealed && (
                            <button onClick={() => setUserOrder(prev => prev.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-rose-500 transition-colors shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Available steps */}
            {!isRevealed && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Available Steps</h3>
                <div className="space-y-1.5">
                  <AnimatePresence mode="popLayout">
                    {availableSteps.map((step) => {
                      const isUsed = userOrder.includes(step);
                      return (
                        <motion.button
                          key={step}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: isUsed ? 0.3 : 1, y: 0, scale: isUsed ? 0.97 : 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => handleStepClick(step)}
                          disabled={isUsed}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                            isUsed ? 'bg-gray-100 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50' : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 cursor-pointer'
                          }`}
                        >
                          <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-sm flex-1 text-gray-700 dark:text-gray-200">{step}</span>
                          {!isUsed && <Badge variant="outline" className="text-[10px] text-indigo-500 border-indigo-300 dark:border-indigo-700">Click</Badge>}
                          {isUsed && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Revealed: comparison */}
            {isRevealed && (
              <motion.div {...fadeIn} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <X className="w-3 h-3 text-rose-400" /> Your Order
                    </h4>
                    <div className="space-y-1">
                      {userOrder.map((step, idx) => (
                        <div key={`ru-${idx}`} className="flex items-start gap-1.5 text-xs p-1.5 rounded bg-gray-50 dark:bg-gray-800/50">
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            idx < correctOrder.length && step === correctOrder[idx] ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                          }`}>{idx + 1}</span>
                          <span className="text-gray-600 dark:text-gray-300">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Correct Order
                    </h4>
                    <div className="space-y-1">
                      {correctOrder.map((step, idx) => (
                        <div key={`rc-${idx}`} className="flex items-start gap-1.5 text-xs p-1.5 rounded bg-emerald-50 dark:bg-emerald-900/10">
                          <span className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</span>
                          <span className="text-gray-600 dark:text-gray-300">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border-2 ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isCorrect ? <motion.div {...scaleIn}><Trophy className="w-5 h-5 text-emerald-500" /></motion.div> : <motion.div {...shakeAnim}><X className="w-5 h-5 text-rose-500" /></motion.div>}
                    <span className={`font-bold ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                      {isCorrect ? 'Perfect Order!' : userOrder.length < correctOrder.length ? "Time's Up!" : 'Incorrect Order'}
                    </span>
                    {isCorrect && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 ml-auto"><Zap className="w-3 h-3 mr-1" /> +{currentChallenge.points} XP</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{currentChallenge.explanation}</p>
                </div>
              </motion.div>
            )}

            {/* Next */}
            <AnimatePresence>
              {isRevealed && (
                <motion.div {...fadeIn} className="pt-1">
                  <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white" onClick={handleNext}>
                    {currentRound + 1 >= TOTAL_ROUNDS ? 'View Results' : 'Next Round'} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

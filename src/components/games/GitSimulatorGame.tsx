'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch, GitCommit, GitMerge, Terminal,
  ArrowLeft, Play, RotateCcw, Trophy,
  Check, X, Clock, Zap, Target, ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AnimatedCounter } from '@/components/pu-helpers';
import type { GitChallenge } from '@/lib/coding-games-data';
import { getRandomGitChallenge, shuffleArray } from '@/lib/coding-games-data';

// ══════════════════════════════════════════════════════════════
// Animation Variants
// ══════════════════════════════════════════════════════════════

const fadeIn = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };
const scaleIn = { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 } };
const shakeAnim = { animate: { x: [0, -8, 8, -6, 6, -3, 3, 0] } };

const TOTAL_ROUNDS = 10;

const diffColors: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  HARD: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

const TIME_BY_DIFF: Record<string, number> = { EASY: 15, MEDIUM: 20, HARD: 25 };

function letterToIndex(letter: string): number {
  return letter.charCodeAt(0) - 65;
}

function stripOptionPrefix(opt: string): string {
  return opt.replace(/^[A-D]\)\s*/, '');
}

// ══════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════

interface GitSimulatorGameProps {
  onBack: () => void;
  onXP: (amount: number) => void;
}

export default function GitSimulatorGame({ onBack, onXP }: GitSimulatorGameProps) {
  const [phase, setPhase] = useState<'start' | 'playing' | 'revealed' | 'results'>('start');
  const [challenges, setChallenges] = useState<GitChallenge[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timer, setTimer] = useState(20);
  const [timerActive, setTimerActive] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const currentChallenge = challenges[currentRound] ?? null;

  // ── Start Game ──
  const startGame = useCallback(() => {
    const pool = getRandomGitChallenge(undefined, TOTAL_ROUNDS + 4);
    const picked = shuffleArray(pool).slice(0, TOTAL_ROUNDS);
    setChallenges(picked);
    setCurrentRound(0);
    setScore(0);
    setSelectedOption(null);
    setIsCorrect(false);
    setTimer(TIME_BY_DIFF[picked[0]?.difficulty ?? 'EASY']);
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
        setSelectedOption(-1);
        setIsCorrect(false);
        setPhase('revealed');
      });
      return;
    }
    const t = setTimeout(() => setTimer(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timer, timerActive]);

  // ── Handle selection ──
  const handleSelect = useCallback((idx: number) => {
    if (phase !== 'playing' || !currentChallenge) return;
    setTimerActive(false);
    setSelectedOption(idx);
    const correct = idx === letterToIndex(currentChallenge.correctAnswer);
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
    setPhase('revealed');
  }, [phase, currentChallenge]);

  // ── Next round ──
  const handleNext = useCallback(() => {
    if (currentRound + 1 >= TOTAL_ROUNDS) {
      const xp = Math.round((score / TOTAL_ROUNDS) * 100);
      setXpEarned(xp);
      onXP(xp);
      setPhase('results');
    } else {
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      setSelectedOption(null);
      setIsCorrect(false);
      setTimer(TIME_BY_DIFF[challenges[nextRound]?.difficulty ?? 'EASY']);
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
            <div className="bg-gradient-to-br from-green-500 to-orange-500 dark:from-green-700 dark:to-orange-700 p-8 text-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-4"
              >
                <Terminal className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">Git Simulator</h1>
              <p className="text-green-100 text-sm">Master Git commands through real-world scenarios</p>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-3">
                {[
                  { icon: <GitBranch className="w-5 h-5 text-green-500" />, text: '10 scenario-based questions' },
                  { icon: <GitCommit className="w-5 h-5 text-green-500" />, text: 'Commands styled like terminal output' },
                  { icon: <GitMerge className="w-5 h-5 text-green-500" />, text: 'Branching, merging, stashing & more' },
                  { icon: <Clock className="w-5 h-5 text-green-500" />, text: 'Timed rounds for each question' },
                ].map((item, i) => (
                  <motion.div key={i} {...fadeIn} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">{item.icon}</div>
                    {item.text}
                  </motion.div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-white" onClick={startGame}>
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
    const emoji = accuracy >= 80 ? '🏆' : accuracy >= 50 ? '👨‍💻' : '💪';
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div {...scaleIn} className="w-full max-w-md">
          <Card className="border-0 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-green-500 to-orange-500 dark:from-green-700 dark:to-orange-700 p-8 text-center">
              <motion.div {...scaleIn} className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4 text-4xl">{emoji}</motion.div>
              <h1 className="text-2xl font-bold text-white mb-1">Game Complete!</h1>
              <p className="text-green-100">Here&apos;s how you did in Git Simulator</p>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="space-y-1">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400"><AnimatedCounter target={score} /></div>
                  <div className="text-xs text-gray-500">Correct</div>
                </motion.div>
                <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="space-y-1">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400"><AnimatedCounter target={accuracy} />%</div>
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
                <Button className="flex-1 bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-white" onClick={playAgain}>
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
  const letters = ['A', 'B', 'C', 'D'];
  const isRevealed = phase === 'revealed';
  const correctIdx = letterToIndex(currentChallenge.correctAnswer);

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
            <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700">
              <Target className="w-3 h-3 mr-1" /> {score} pts
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Question {currentRound + 1} of {TOTAL_ROUNDS}</span>
            <span className="font-mono">{Math.round((currentRound / TOTAL_ROUNDS) * 100)}%</span>
          </div>
          <Progress value={(currentRound / TOTAL_ROUNDS) * 100} className="h-2" />
        </div>

        <Card className="border-0 shadow-xl overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-green-500 to-orange-500 dark:from-green-700 dark:to-orange-700 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/80 text-sm"><Terminal className="w-4 h-4" /> Git Simulator</div>
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
            {/* Scenario */}
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <GitBranch className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scenario</span>
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200">{currentChallenge.scenario}</p>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Choose the correct Git command:</p>

            {/* Command Options — terminal style */}
            <div className="space-y-2.5">
              <AnimatePresence mode="wait">
                {currentChallenge.options.map((option, idx) => {
                  const rawText = stripOptionPrefix(option);
                  const isSelected = selectedOption === idx;
                  const isAnsCorrect = idx === correctIdx;
                  let cardBorder = 'border-gray-700/80';
                  let cardBg = 'bg-gray-950 hover:border-green-500/60 hover:bg-gray-900';
                  if (isRevealed && isSelected && isAnsCorrect) { cardBorder = 'border-emerald-500'; cardBg = 'bg-emerald-950/30'; }
                  if (isRevealed && isSelected && !isAnsCorrect) { cardBorder = 'border-rose-500'; cardBg = 'bg-rose-950/30'; }
                  if (isRevealed && !isSelected && isAnsCorrect) { cardBorder = 'border-emerald-500/60'; cardBg = 'bg-emerald-950/20'; }

                  return (
                    <motion.button
                      key={idx}
                      whileHover={!isRevealed ? { scale: 1.01, x: 4 } : {}}
                      whileTap={!isRevealed ? { scale: 0.99 } : {}}
                      onClick={() => handleSelect(idx)}
                      disabled={isRevealed}
                      className={`w-full text-left rounded-xl border-2 transition-all overflow-hidden ${cardBorder} ${cardBg} ${isRevealed ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                        <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                          isRevealed && isSelected && isAnsCorrect ? 'bg-emerald-500 text-white' :
                          isRevealed && isSelected && !isAnsCorrect ? 'bg-rose-500 text-white' :
                          isRevealed && isAnsCorrect ? 'bg-emerald-900 text-emerald-300' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {isRevealed && isSelected && isAnsCorrect ? <Check className="w-3.5 h-3.5" /> :
                           isRevealed && isSelected && !isAnsCorrect ? <X className="w-3.5 h-3.5" /> : letters[idx]}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">~</span>
                      </div>
                      <div className="px-3 pb-3 pt-0.5">
                        <div className="font-mono text-xs sm:text-sm flex items-center gap-1.5">
                          <span className="text-green-400 shrink-0">$</span>
                          <code className={`break-all ${
                            isRevealed && isSelected && isAnsCorrect ? 'text-emerald-300' :
                            isRevealed && isSelected && !isAnsCorrect ? 'text-rose-300 line-through' :
                            isRevealed && isAnsCorrect ? 'text-emerald-400 font-semibold' :
                            'text-gray-200'
                          }`}>{rawText}</code>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {isRevealed && (
                <motion.div {...fadeIn} className={`p-4 rounded-xl border-2 ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isCorrect ? <motion.div {...scaleIn}><Trophy className="w-5 h-5 text-emerald-500" /></motion.div> : <motion.div {...shakeAnim}><X className="w-5 h-5 text-rose-500" /></motion.div>}
                    <span className={`font-bold ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                      {isCorrect ? 'Correct!' : selectedOption === -1 ? "Time's Up!" : 'Incorrect'}
                    </span>
                    {isCorrect && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 ml-auto"><Zap className="w-3 h-3 mr-1" /> +{currentChallenge.points} XP</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{currentChallenge.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Next */}
            <AnimatePresence>
              {isRevealed && (
                <motion.div {...fadeIn} className="pt-1">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-white" onClick={handleNext}>
                    {currentRound + 1 >= TOTAL_ROUNDS ? 'View Results' : 'Next Question'} <ChevronRight className="w-4 h-4 ml-1" />
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

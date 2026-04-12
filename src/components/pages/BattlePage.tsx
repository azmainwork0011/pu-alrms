'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Swords, Clock, Trophy, Zap, ChevronRight, Users,
  Loader2, Shield, Crown, ArrowLeft, Plus, Check, X, Bot,
  Flame, Target, Star, Timer,
} from 'lucide-react';
import {
  playCorrectSound, playWrongSound, playBattleStartSound,
  playVictorySound, playDefeatSound, playTickSound, playFightSound,
  playTimeWarningSound,
} from '@/lib/quiz-sounds';

// ─── Types ───────────────────────────────────────────────────────────────
interface BattleRoom {
  id: string;
  player1: { id: string; name: string; avatar?: string; batch?: string; department?: string };
  player2?: { id: string; name: string; avatar?: string };
  category?: { id: string; name: string; icon?: string; department?: string };
  status: string;
  player1Score: number;
  player2Score: number;
  totalQuestions: number;
  timePerQuestion: number;
  createdAt: string;
}

interface BattleQuestion {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  difficulty: string;
  points: number;
  explanation?: string;
}

// Prize ladder amounts
const PRIZE_LADDER = [0, 100, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000];

const OPTIONS = ['A', 'B', 'C', 'D'];
const OPTION_KEYS = ['optionA', 'optionB', 'optionC', 'optionD'] as const;

// Bot names for flavor
const BOT_NAMES = ['QuizMaster', 'BrainBot', 'ThinkFast', 'SmartyAI', 'MindBlitz'];

// ─── Particle System ─────────────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
  life: number;
}

// ─── Animated Score Component ────────────────────────────────────────────
function AnimatedScore({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const target = value;
    if (target === prevRef.current) return;
    const start = prevRef.current;
    const diff = target - start;
    const startTime = Date.now();
    const duration = 600;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      prevRef.current = current;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <span className={className}>{display}</span>;
}

// ─── Main Component ──────────────────────────────────────────────────────
function BattlePage() {
  const { user, token, setPage } = useAppStore();

  const [screen, setScreen] = useState<'lobby' | 'waiting' | 'vs' | 'fighting' | 'result'>('lobby');
  const [waitingRooms, setWaitingRooms] = useState<BattleRoom[]>([]);
  const [myRoom, setMyRoom] = useState<BattleRoom | null>(null);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [myCorrectCount, setMyCorrectCount] = useState(0);
  const [opponentCorrectCount, setOpponentCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [opponentOption, setOpponentOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [countdownLabel, setCountdownLabel] = useState('');
  const [botName, setBotName] = useState('');
  const [botThinking, setBotThinking] = useState(false);
  const [questionResults, setQuestionResults] = useState<{ q: number; correct: boolean; opponentCorrect: boolean }[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [battleMode, setBattleMode] = useState<'pvp' | 'solo'>('solo');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const particleIdRef = useRef(0);

  // ─── Particle Effects ────────────────────────────────────────────────
  const spawnParticles = useCallback((isCorrect: boolean) => {
    const newParticles: Particle[] = [];
    const colors = isCorrect
      ? ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b']
      : ['#ef4444', '#f87171', '#fca5a5'];

    for (let i = 0; i < (isCorrect ? 20 : 8); i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: 50 + (Math.random() - 0.5) * 30,
        y: 50 + (Math.random() - 0.5) * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 5,
        life: 1,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);

    // Clear particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, 1200);
  }, []);



  // ─── Fetch Waiting Rooms (polled in lobby) ────────────────────────
  useEffect(() => {
    if (screen !== 'lobby') return;
    let cancelled = false;
    async function load() {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/quiz/battle?type=waiting', { headers });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setWaitingRooms(data.rooms || []);
        }
      } catch { /* silent */ }
    }
    load();
    pollRef.current = setInterval(load, 5000);
    return () => { cancelled = true; if (pollRef.current) clearInterval(pollRef.current); };
  }, [screen, token]);

  // ─── Bot Simulation ──────────────────────────────────────────────────
  const simulateBotAnswer = useCallback((question: BattleQuestion, questionIndex: number, playerOption: string | null) => {
    // Bot thinks for 2-6 seconds
    setBotThinking(true);
    const thinkTime = 2000 + Math.random() * 4000;

    botTimerRef.current = setTimeout(() => {
      // 40-60% chance bot gets it right, adjusted by difficulty
      let botChance = 0.4 + Math.random() * 0.2;
      if (question.difficulty === 'EASY') botChance += 0.15;
      if (question.difficulty === 'HARD') botChance -= 0.15;

      const botCorrect = Math.random() < botChance;
      const botAnswer = botCorrect ? question.correctOption : OPTIONS[Math.floor(Math.random() * 4)];
      setOpponentOption(botAnswer);
      setBotThinking(false);

      if (botCorrect) {
        setOpponentScore(prev => prev + question.points);
        setOpponentCorrectCount(prev => prev + 1);
      }

      // Update question results (use playerOption instead of stale selectedOption)
      setQuestionResults(prev => [...prev, {
        q: questionIndex,
        correct: playerOption === question.correctOption,
        opponentCorrect: botCorrect,
      }]);
    }, thinkTime);
  }, []);

  // ─── Create Battle ────────────────────────────────────────────────
  const createBattle = useCallback(async (mode: 'solo' | 'pvp') => {
    setBattleMode(mode);
    setLoading(true);

    if (mode === 'solo') {
      // Solo mode: fight against a bot immediately
      setBotName(BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]);
      setMyRoom(null);
      setLoading(false);
      startBattleSequence();
      return;
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/quiz/battle', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'create' }),
      });
      if (res.ok) {
        const data = await res.json();
        setMyRoom(data.room);
        setScreen('waiting');
        toast.success('Battle room created! Waiting for opponent...');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create battle');
      }
    } catch { toast.error('Network error'); }
    setLoading(false);
  }, [token]);

  // ─── Fetch Battle Questions ──────────────────────────────────────────
  const fetchBattleQuestions = useCallback(async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const body: any = { action: 'get-questions', count: 10 };
      if (myRoom?.id) body.battleRoomId = myRoom.id;

      const res = await fetch('/api/quiz/battle', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.questions) setQuestions(data.questions);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [token, myRoom]);

  // ─── Battle Sequence ────────────────────────────────────────────────
  const startBattleSequence = useCallback(async () => {
    playBattleStartSound();

    // Show VS screen with countdown
    setScreen('vs');
    setCountdown(3);
    setCountdownLabel('3');
    playTickSound();

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        setCountdownLabel(String(count));
        playTickSound();
      } else if (count === 0) {
        setCountdown(0);
        setCountdownLabel('FIGHT!');
        playFightSound();
      } else {
        clearInterval(interval);
        // Fetch questions and start
        beginBattle();
      }
    }, 1000);
  }, []);

  // ─── Begin Battle ─────────────────────────────────────────────────
  const beginBattle = useCallback(async () => {
    setScreen('fighting');
    setCurrentQ(0);
    setMyScore(0);
    setOpponentScore(0);
    setMyCorrectCount(0);
    setOpponentCorrectCount(0);
    setSelectedOption(null);
    setOpponentOption(null);
    setIsAnswered(false);
    setIsRevealed(false);
    setTimeLeft(15);
    setQuestionResults([]);


    const success = await fetchBattleQuestions();
    if (!success) {
      toast.error('Failed to load questions');
      setScreen('lobby');
    }
  }, [fetchBattleQuestions]);

  // ─── Join Battle ──────────────────────────────────────────────────
  const joinBattle = useCallback(async (roomId: string) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/quiz/battle', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'join', battleRoomId: roomId }),
      });
      if (res.ok) {
        const data = await res.json();
        setMyRoom(data.room);
        setBattleMode('pvp');
        setBotName('');
        startBattleSequence();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to join');
      }
    } catch { toast.error('Network error'); }
    setLoading(false);
  }, [token, startBattleSequence]);

  // ─── Complete Battle ──────────────────────────────────────────────
  const completeBattle = useCallback(async () => {
    if (battleMode === 'pvp' && myRoom?.id) {
      setLoading(true);
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        await fetch('/api/quiz/battle', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'complete',
            battleRoomId: myRoom.id,
            player1Score: myScore,
            player2Score: opponentScore,
            player1Correct: myCorrectCount,
            player2Correct: opponentCorrectCount,
            winnerId: myScore >= opponentScore ? user?.id : myRoom.player1?.id,
          }),
        });
      } catch { /* silent */ }
      setLoading(false);
    }

    const won = myScore >= opponentScore;
    if (won) playVictorySound(); else playDefeatSound();
    setScreen('result');
  }, [myRoom, myScore, opponentScore, myCorrectCount, opponentCorrectCount, token, user, battleMode]);

  // ─── Timer Effect ─────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'fighting' || isAnswered || !questions[currentQ]) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 5 && next > 0) playTimeWarningSound();
        if (next <= 0) {
          setIsAnswered(true);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [screen, currentQ, isAnswered, questions]);

  // ─── Submit Answer ────────────────────────────────────────────────
  const submitAnswer = useCallback((option: string) => {
    if (isAnswered || !questions[currentQ]) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const q = questions[currentQ];
    const isCorrect = option === q.correctOption;

    // Start bot simulation for this question (pass current option to avoid stale closure)
    simulateBotAnswer(q, currentQ, option);

    // Delayed reveal
    setTimeout(() => {
      setIsRevealed(true);
      if (isCorrect) {
        playCorrectSound();
        spawnParticles(true);
        setMyScore(prev => prev + q.points);
        setMyCorrectCount(prev => prev + 1);
      } else {
        playWrongSound();
        spawnParticles(false);
      }
    }, battleMode === 'solo' ? 1500 : 800);
  }, [isAnswered, questions, currentQ, battleMode, simulateBotAnswer, spawnParticles]);

  // ─── Next Question ────────────────────────────────────────────────
  const nextQuestion = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    if (currentQ >= questions.length - 1) {
      completeBattle();
      return;
    }
    setCurrentQ(prev => prev + 1);
    setSelectedOption(null);
    setOpponentOption(null);
    setIsAnswered(false);
    setIsRevealed(false);
    setTimeLeft(15);
    setBotThinking(false);
  }, [currentQ, questions.length, completeBattle]);

  // ─── Difficulty Badge ─────────────────────────────────────────────
  const getDifficultyBadge = (difficulty: string) => {
    const config: Record<string, { label: string; className: string }> = {
      EASY: { label: 'Easy', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
      MEDIUM: { label: 'Medium', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
      HARD: { label: 'Hard', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    };
    const d = config[difficulty] || config.MEDIUM;
    return (
      <Badge className={`${d.className} text-[10px] h-5 px-1.5`}>
        {difficulty === 'EASY' && <><Zap className="w-2.5 h-2.5 mr-0.5" />{d.label}</>}
        {difficulty === 'MEDIUM' && <><Target className="w-2.5 h-2.5 mr-0.5" />{d.label}</>}
        {difficulty === 'HARD' && <><Flame className="w-2.5 h-2.5 mr-0.5" />{d.label}</>}
      </Badge>
    );
  };

  // ─── Current opponent name ───────────────────────────────────────
  const opponentName = battleMode === 'solo'
    ? botName
    : (myRoom?.player1?.id !== user?.id ? myRoom?.player1?.name : (myRoom?.player2?.name || 'Opponent'));

  // ─── Current question ────────────────────────────────────────────
  const currentQuestion = questions[currentQ];

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-8rem)] relative overflow-hidden">
      {/* Floating Particles */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: `${p.x}%`, y: `${p.y}%`, opacity: p.life, scale: 0 }}
            animate={{ x: `${p.x + p.vx * 8}%`, y: `${p.y + p.vy * 8}%`, opacity: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="fixed pointer-events-none rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              zIndex: 100,
            }}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ─── LOBBY ────────────────────────────────────────────── */}
        {screen === 'lobby' && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-center mb-8">
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200 dark:shadow-red-900/30">
                <Swords className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Battle Mode</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Challenge others in real-time quiz battles</p>
            </div>

            <div className="max-w-2xl mx-auto">
              {/* Solo vs PvP Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  onClick={() => createBattle('solo')}
                  disabled={loading}
                  className="h-16 text-base bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-2xl shadow-lg shadow-violet-200 dark:shadow-violet-900/30"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Bot className="w-5 h-5 mr-2" />Solo vs Bot</>}
                </Button>
                <Button
                  onClick={() => createBattle('pvp')}
                  disabled={loading}
                  className="h-16 text-base bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 rounded-2xl shadow-lg shadow-red-200 dark:shadow-red-900/30"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Users className="w-5 h-5 mr-2" />Create PvP Room</>}
                </Button>
              </div>

              {waitingRooms.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Open Rooms ({waitingRooms.length})
                  </h3>
                  <div className="space-y-2">
                    {waitingRooms.map((room, i) => (
                      <motion.div
                        key={room.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-red-300 dark:hover:border-red-700 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                            {room.player1.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{room.player1.name}</p>
                            <p className="text-[11px] text-gray-400">{room.player1.department || 'Ready'} {room.category ? `· ${room.category.name}` : ''}</p>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => joinBattle(room.id)} className="bg-red-500 hover:bg-red-600 rounded-lg">
                          <Swords className="w-3.5 h-3.5 mr-1" />Join
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── WAITING ───────────────────────────────────────────── */}
        {screen === 'waiting' && (
          <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-20 h-20 rounded-full border-4 border-red-200 dark:border-red-900 border-t-red-500 mx-auto mb-6" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Waiting for Opponent...</h2>
              <p className="text-sm text-gray-500 mb-4">Share your room or wait for someone to join</p>
              <Button variant="outline" onClick={() => { setScreen('lobby'); setMyRoom(null); }}>
                <ArrowLeft className="w-4 h-4 mr-1" />Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {/* ─── VS SCREEN ─────────────────────────────────────────── */}
        {screen === 'vs' && (
          <motion.div
            key="vs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-black"
          >
            {/* Animated background energy lines */}
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-[2px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent"
                  initial={{ x: '-100%', y: `${20 + i * 12}%` }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 1.5, delay: i * 0.15, repeat: Infinity, ease: 'linear' }}
                  style={{ width: '60%' }}
                />
              ))}
            </div>

            <div className="relative z-10 flex items-center gap-8 sm:gap-16">
              {/* Player */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="text-center"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold mx-auto mb-3 shadow-xl shadow-violet-500/30 ring-4 ring-violet-400/30">
                  {user?.name?.charAt(0)}
                </div>
                <p className="text-white font-bold text-sm sm:text-base">{user?.name}</p>
                <Badge className="bg-violet-500/30 text-violet-300 border-0 mt-1 text-xs">YOU</Badge>
              </motion.div>

              {/* VS / Countdown */}
              <div className="flex flex-col items-center">
                <AnimatePresence mode="wait">
                  {countdownLabel && (
                    <motion.div
                      key={countdownLabel}
                      initial={{ scale: 2.5, opacity: 0, rotate: -10 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: 'spring', damping: 8 }}
                      className={`font-black ${
                        countdownLabel === 'FIGHT!'
                          ? 'text-5xl sm:text-7xl bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent'
                          : 'text-6xl sm:text-8xl text-white'
                      }`}
                    >
                      {countdownLabel}
                    </motion.div>
                  )}
                </AnimatePresence>
                {countdownLabel !== 'FIGHT!' && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-sm text-gray-400 mt-2"
                  >
                    Get Ready...
                  </motion.div>
                )}
              </div>

              {/* Opponent */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="text-center"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold mx-auto mb-3 shadow-xl shadow-red-500/30 ring-4 ring-red-400/30">
                  {battleMode === 'solo' ? <Bot className="w-10 h-10" /> : (opponentName?.charAt(0) || '?')}
                </div>
                <p className="text-white font-bold text-sm sm:text-base">{battleMode === 'solo' ? botName : (opponentName || 'Opponent')}</p>
                <Badge className="bg-red-500/30 text-red-300 border-0 mt-1 text-xs">
                  {battleMode === 'solo' ? 'BOT' : 'OPPONENT'}
                </Badge>
              </motion.div>
            </div>

            {/* Prize Display */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center"
            >
              <div className="flex items-center gap-2 justify-center text-yellow-400">
                <Trophy className="w-5 h-5" />
                <span className="font-bold text-sm">Winner takes {PRIZE_LADDER[PRIZE_LADDER.length - 1].toLocaleString()} pts!</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ─── FIGHTING ──────────────────────────────────────────── */}
        {screen === 'fighting' && questions.length > 0 && currentQuestion && (
          <motion.div key="fighting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="max-w-3xl mx-auto">
              {/* Score Bar */}
              <div className="flex items-center justify-between mb-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800">
                <div className="text-center flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold mx-auto mb-1">
                    {user?.name?.charAt(0)}
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{user?.name?.split(' ')[0]}</p>
                  <p className="text-xl font-black text-violet-600 dark:text-violet-400">
                    <AnimatedScore value={myScore} />
                  </p>
                  <p className="text-[10px] text-gray-400">{myCorrectCount} correct</p>
                </div>

                <div className="flex flex-col items-center px-4">
                  <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 mb-1">
                    <Swords className="w-3 h-3 mr-1" />VS
                  </Badge>
                  <span className="text-[10px] text-gray-400">Q{currentQ + 1}/{questions.length}</span>
                </div>

                <div className="text-center flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold mx-auto mb-1">
                    {battleMode === 'solo' ? <Bot className="w-4 h-4" /> : (opponentName?.charAt(0) || '?')}
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {battleMode === 'solo' ? botName : (opponentName || 'Opponent')}
                    {botThinking && (
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} className="text-[10px] text-amber-500 ml-1">
                        thinking...
                      </motion.span>
                    )}
                  </p>
                  <p className="text-xl font-black text-red-600 dark:text-red-400">
                    <AnimatedScore value={opponentScore} />
                  </p>
                  <p className="text-[10px] text-gray-400">{opponentCorrectCount} correct</p>
                </div>
              </div>

              {/* Prize Ladder */}
              <div className="mb-3 p-2 rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 text-white overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-[10px] font-medium text-gray-400">Prize Pool</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-[280px] scrollbar-hide">
                    {PRIZE_LADDER.slice(0, questions.length + 1).map((prize, i) => {
                      const reached = i <= currentQ;
                      const reachedOpponent = i <= currentQ;
                      return (
                        <div key={i} className="flex items-center">
                          <div className={`flex flex-col items-center px-1.5 py-0.5 rounded transition-all ${
                            reached && isRevealed
                              ? 'bg-yellow-500/20 border border-yellow-500/50'
                              : 'opacity-40'
                          }`}>
                            <span className="text-[8px] text-gray-500">Q{i}</span>
                            <span className={`text-[10px] font-bold ${reached && isRevealed ? 'text-yellow-400' : 'text-gray-500'}`}>
                              {prize >= 1000 ? `${prize / 1000}K` : prize}
                            </span>
                          </div>
                          {i < PRIZE_LADDER.slice(0, questions.length + 1).length - 1 && (
                            <div className={`w-3 h-[1px] mx-0.5 ${i < currentQ ? 'bg-yellow-500/50' : 'bg-gray-700'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-[10px] font-bold text-yellow-400">
                      {myScore + opponentScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timer */}
              <div className="flex justify-center mb-3">
                <motion.div
                  animate={timeLeft <= 5 ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
                    timeLeft <= 5
                      ? 'bg-red-100 dark:bg-red-900/30 ring-4 ring-red-300 dark:ring-red-700 border-red-400'
                      : timeLeft <= 10
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <div className="relative w-10 h-10">
                    <Timer className="w-4 h-4 absolute top-1 left-1/2 -translate-x-1/2 text-gray-400" />
                    <span className={`text-xl font-mono font-bold absolute bottom-0.5 left-1/2 -translate-x-1/2 ${
                      timeLeft <= 5 ? 'text-red-500' : timeLeft <= 10 ? 'text-amber-600' : 'text-gray-700 dark:text-gray-300'
                    }`}>{timeLeft}</span>
                  </div>
                </motion.div>
              </div>

              {/* Question */}
              <Card className="border-0 shadow-lg dark:bg-gray-900 mb-3">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{currentQuestion.question}</h3>
                    {currentQuestion.difficulty && getDifficultyBadge(currentQuestion.difficulty)}
                  </div>
                  {currentQuestion.points && (
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" />{currentQuestion.points} points
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Both Players' Answer Selections Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {/* My Options */}
                <div>
                  <p className="text-[10px] font-semibold text-violet-500 mb-1.5 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    YOUR ANSWER
                  </p>
                  <div className="space-y-1.5">
                    {OPTION_KEYS.map((opt, i) => {
                      const optionLabel = OPTIONS[i];
                      const isSelected = selectedOption === optionLabel;
                      const isCorrect = optionLabel === currentQuestion.correctOption;
                      const isWrong = isSelected && !isCorrect;

                      let borderClass = 'border-gray-200 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700';
                      let bgClass = '';

                      if (isRevealed) {
                        if (isCorrect) {
                          borderClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
                          bgClass = 'bg-emerald-50 dark:bg-emerald-900/20';
                        } else if (isWrong) {
                          borderClass = 'border-red-500 bg-red-50 dark:bg-red-900/20';
                          bgClass = 'bg-red-50 dark:bg-red-900/20';
                        } else {
                          borderClass = 'border-gray-200 dark:border-gray-800 opacity-40';
                        }
                      } else if (isSelected) {
                        borderClass = 'border-violet-500 bg-violet-50 dark:bg-violet-900/20';
                        bgClass = 'bg-violet-50 dark:bg-violet-900/20';
                      } else if (isAnswered) {
                        borderClass = 'border-gray-200 dark:border-gray-800 opacity-50';
                      }

                      return (
                        <motion.button
                          key={opt}
                          whileHover={!isAnswered ? { scale: 1.01 } : {}}
                          whileTap={!isAnswered ? { scale: 0.99 } : {}}
                          onClick={() => submitAnswer(optionLabel)}
                          disabled={isAnswered}
                          className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left transition-all ${borderClass} ${bgClass}`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            isRevealed && isCorrect
                              ? 'bg-emerald-500 text-white'
                              : isRevealed && isWrong
                                ? 'bg-red-500 text-white'
                                : isSelected
                                  ? 'bg-violet-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                          }`}>
                            {isRevealed && isCorrect ? <Check className="w-3.5 h-3.5" /> :
                             isRevealed && isWrong ? <X className="w-3.5 h-3.5" /> : optionLabel}
                          </div>
                          <span className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 truncate flex-1">{currentQuestion[opt]}</span>
                          {isRevealed && isCorrect && <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Opponent Options */}
                <div>
                  <p className="text-[10px] font-semibold text-red-500 mb-1.5 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    {battleMode === 'solo' ? botName : (opponentName || 'OPPONENT')}
                  </p>
                  <div className="space-y-1.5">
                    {OPTION_KEYS.map((opt, i) => {
                      const optionLabel = OPTIONS[i];
                      const isOpponentSelected = opponentOption === optionLabel;
                      const isCorrect = optionLabel === currentQuestion.correctOption;

                      let borderClass = 'border-gray-200 dark:border-gray-800';
                      let bgClass = 'bg-gray-50 dark:bg-gray-900/50';

                      if (isRevealed && opponentOption) {
                        if (isOpponentSelected && isCorrect) {
                          borderClass = 'border-emerald-500';
                          bgClass = 'bg-emerald-50 dark:bg-emerald-900/20';
                        } else if (isOpponentSelected && !isCorrect) {
                          borderClass = 'border-red-500';
                          bgClass = 'bg-red-50 dark:bg-red-900/20';
                        } else if (isCorrect) {
                          borderClass = 'border-emerald-300 dark:border-emerald-700';
                          bgClass = 'bg-emerald-50/50 dark:bg-emerald-900/10';
                        } else {
                          borderClass = 'border-gray-200 dark:border-gray-800 opacity-40';
                        }
                      } else if (botThinking) {
                        if (isOpponentSelected) {
                          borderClass = 'border-amber-400';
                          bgClass = 'bg-amber-50 dark:bg-amber-900/20';
                        }
                      }

                      return (
                        <div
                          key={opt}
                          className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left transition-all ${borderClass} ${bgClass}`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            isRevealed && opponentOption && isOpponentSelected && isCorrect
                              ? 'bg-emerald-500 text-white'
                              : isRevealed && opponentOption && isOpponentSelected && !isCorrect
                                ? 'bg-red-500 text-white'
                                : botThinking && isOpponentSelected
                                  ? 'bg-amber-400 text-white animate-pulse'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                          }`}>
                            {isRevealed && opponentOption && isOpponentSelected
                              ? (isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />)
                              : botThinking && isOpponentSelected
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : optionLabel}
                          </div>
                          <span className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 truncate flex-1">{currentQuestion[opt]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Feedback Banner */}
              <AnimatePresence>
                {isRevealed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mb-3 p-3 rounded-xl border-2 ${
                      selectedOption === currentQuestion.correctOption
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {selectedOption === currentQuestion.correctOption
                        ? <><Check className="w-5 h-5 text-emerald-500" /><span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Correct! +{currentQuestion.points} points</span></>
                        : <><X className="w-5 h-5 text-red-500" /><span className="text-sm font-bold text-red-700 dark:text-red-300">Wrong! The answer was {currentQuestion.correctOption}</span></>
                      }
                    </div>
                    {currentQuestion.explanation && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">{currentQuestion.explanation}</p>
                    )}
                    {!opponentOption && botThinking && (
                      <p className="text-xs text-amber-500 mt-1 ml-7 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />Opponent is still thinking...
                      </p>
                    )}
                    {opponentOption && (
                      <p className={`text-xs mt-1 ml-7 ${
                        opponentOption === currentQuestion.correctOption
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {battleMode === 'solo' ? botName : 'Opponent'} chose {opponentOption} — {
                          opponentOption === currentQuestion.correctOption ? 'Correct! +{currentQuestion.points} pts' : 'Wrong!'
                        }
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Next Button */}
              {isAnswered && isRevealed && opponentOption && (
                <div className="flex justify-end">
                  <Button onClick={nextQuestion} className="bg-gradient-to-r from-red-500 to-orange-600 rounded-xl">
                    {currentQ >= questions.length - 1 ? 'Finish Battle' : 'Next'} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── RESULT ────────────────────────────────────────────── */}
        {screen === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center min-h-[60vh]">
            <Card className="border-0 shadow-xl dark:bg-gray-900 overflow-hidden max-w-md w-full">
              <div className={`bg-gradient-to-r ${myScore >= opponentScore ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-orange-600'} p-8 text-center text-white relative overflow-hidden`}>
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                  {myScore >= opponentScore && Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-white/20"
                      initial={{ y: 200, x: Math.random() * 100 }}
                      animate={{ y: -20, x: Math.random() * 100 }}
                      transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                    />
                  ))}
                </div>

                <div className="relative z-10">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                    {myScore >= opponentScore ? <Crown className="w-14 h-14 mx-auto mb-2" /> : <Shield className="w-14 h-14 mx-auto mb-2" />}
                  </motion.div>
                  <h2 className="text-2xl font-black">{myScore >= opponentScore ? 'Victory!' : 'Defeat'}</h2>
                  <p className="text-white/70 text-sm mt-1">
                    {myScore >= opponentScore ? 'You dominated the battle!' : 'Better luck next time!'}
                  </p>
                </div>
              </div>
              <CardContent className="p-6">
                {/* Score Comparison */}
                <div className="flex items-center justify-around py-4 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-black text-violet-600">{myScore}</p>
                    <p className="text-xs text-gray-500">You ({myCorrectCount}/{questions.length})</p>
                  </div>
                  <div className="text-gray-300 text-xl font-bold">vs</div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-red-600">{opponentScore}</p>
                    <p className="text-xs text-gray-500">{battleMode === 'solo' ? botName : 'Opponent'} ({opponentCorrectCount}/{questions.length})</p>
                  </div>
                </div>

                {/* Question Results Summary */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Question Breakdown</p>
                  <div className="flex gap-1 flex-wrap">
                    {questionResults.map((r, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                          r.correct && r.opponentCorrect
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : r.correct
                              ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                              : r.opponentCorrect
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                        title={`Q${i + 1}: You ${r.correct ? '✓' : '✗'} | Opp ${r.opponentCorrect ? '✓' : '✗'}`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-2 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-400" />Both correct</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-violet-400" />Only you</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-400" />Only opponent</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-gray-300" />Neither</span>
                  </div>
                </div>

                {/* Prize Won */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 border border-yellow-200 dark:border-yellow-800/30 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Prize Won</span>
                    </div>
                    <span className="text-lg font-black text-yellow-600 dark:text-yellow-400">
                      {myScore >= opponentScore
                        ? (myScore + opponentScore).toLocaleString()
                        : '0'} pts
                    </span>
                  </div>
                  {myScore >= opponentScore && (
                    <p className="text-[10px] text-yellow-600/60 dark:text-yellow-400/60 mt-1">Winner takes all!</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => { setScreen('lobby'); setMyRoom(null); }}>
                    <ArrowLeft className="w-4 h-4 mr-1" />Lobby
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-red-500 to-orange-600" onClick={() => createBattle(battleMode)}>
                    <Swords className="w-4 h-4 mr-1" />Rematch
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BattlePage;

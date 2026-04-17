'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, BookOpen, Swords, Gamepad2, Trophy, Users, User,
  Star, Flame, Zap, Target, Clock, ChevronRight, ChevronLeft,
  X, Check, RotateCcw, ArrowUp, ArrowDown,
  Plus, Send, TrendingUp, Award, Crown,
  Skull, Sparkles, Bug, Puzzle, Code2, Braces, Play,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AnimatedCounter } from '@/components/pu-helpers';
import { useAppStore } from '@/store/app';
import {
  LANGUAGES, LEVEL_THRESHOLDS, AVATARS,
  BUG_FINDER_CHALLENGES, CODE_PUZZLES, SYNTAX_MATCH_PAIRS,
  MOCK_LEADERBOARD,
  getTodayChallenge, getRandomQuestions, getLevelForXP, getNextLevel,
  shuffleArray, getLanguageById,
  type Question, type ProgrammingLanguage, type Topic, type Difficulty,
  type BugFinderData, type CodePuzzleData, type SyntaxMatchPair,
  type DailyChallenge,
} from '@/lib/cq-data';

// ══════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════

interface UserProfile {
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  battlesWon: number;
  battlesLost: number;
  questionsAnswered: number;
  correctAnswers: number;
  miniGamesPlayed: number;
  totalPlayTime: number;
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  level: number;
  xp: number;
}

type LearnStep = 'languages' | 'topics' | 'quiz' | 'results';
type BattleStatus = 'select' | 'battle' | 'roundResult' | 'end';
type MiniGameType = 'none' | 'bugfinder' | 'codepuzzle' | 'syntaxmatch';

// ══════════════════════════════════════════════════════════════
// Animation Variants
// ══════════════════════════════════════════════════════════════

const fadeIn = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };
const scaleIn = { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 } };
const slideInLeft = { initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 } };
const slideInRight = { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const shakeAnim = { animate: { x: [0, -8, 8, -6, 6, -3, 3, 0] } };
const pulse = { animate: { scale: [1, 1.05, 1], transition: { duration: 1.5, repeat: Infinity } } };

const diffColors: Record<Difficulty, string> = {
  EASY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  HARD: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

const diffBadge: Record<Difficulty, string> = {
  EASY: 'border-emerald-300 dark:border-emerald-600',
  MEDIUM: 'border-amber-300 dark:border-amber-600',
  HARD: 'border-rose-300 dark:border-rose-600',
};

// ══════════════════════════════════════════════════════════════
// Default Data
// ══════════════════════════════════════════════════════════════

const defaultProfile: UserProfile = {
  name: 'Player One',
  avatar: '🦊',
  xp: 450,
  streak: 7,
  battlesWon: 12,
  battlesLost: 5,
  questionsAnswered: 85,
  correctAnswers: 62,
  miniGamesPlayed: 8,
  totalPlayTime: 320,
};

const defaultFriends: Friend[] = [
  { id: 'f1', name: 'Alice', avatar: '🐉', online: true, level: 12, xp: 6500 },
  { id: 'f2', name: 'Bob', avatar: '🦁', online: true, level: 8, xp: 2300 },
  { id: 'f3', name: 'Charlie', avatar: '🐸', online: false, level: 15, xp: 12500 },
  { id: 'f4', name: 'Diana', avatar: '🦄', online: false, level: 6, xp: 800 },
  { id: 'f5', name: 'Eve', avatar: '🦋', online: true, level: 10, xp: 4000 },
];

const recentActivity = [
  { id: 'a1', text: 'Completed Python Control Flow quiz', xp: 45, time: '2h ago' },
  { id: 'a2', text: 'Won battle against CodeNinja', xp: 80, time: '5h ago' },
  { id: 'a3', text: 'Earned "Code Padawan" badge', xp: 100, time: '1d ago' },
  { id: 'a4', text: 'Played Bug Finder mini game', xp: 25, time: '1d ago' },
];

const TAB_ICONS: Record<string, React.ReactNode> = {
  home: <Home className="w-4 h-4" />,
  learn: <BookOpen className="w-4 h-4" />,
  battle: <Swords className="w-4 h-4" />,
  minigames: <Gamepad2 className="w-4 h-4" />,
  leaderboard: <Trophy className="w-4 h-4" />,
  friends: <Users className="w-4 h-4" />,
  profile: <User className="w-4 h-4" />,
};

// ══════════════════════════════════════════════════════════════
// Sub-components
// ══════════════════════════════════════════════════════════════

function CodeBlock({ code, highlightLine, onLineClick }: { code: string; highlightLine?: number; onLineClick?: (line: number) => void }) {
  const lines = code.split('\n');
  return (
    <div className="max-w-full overflow-hidden rounded-lg">
      <div className="bg-gray-950 text-gray-200 rounded-lg p-2.5 sm:p-4 font-mono text-xs sm:text-sm overflow-x-auto">
      {lines.map((line, i) => (
        <div
          key={i}
          onClick={() => onLineClick?.(i + 1)}
          className={`flex ${onLineClick ? 'cursor-pointer hover:bg-gray-800/60 active:bg-gray-800/80' : ''} ${
            i + 1 === highlightLine ? 'bg-emerald-500/20 border-l-2 border-emerald-400 -ml-1 pl-3' : 'pl-1'
          } ${i > 0 ? 'mt-0.5' : ''}`}
        >
          <span className="w-6 sm:w-8 text-right mr-2 sm:mr-4 text-gray-500 select-none text-[10px] sm:text-xs leading-5 sm:leading-6 shrink-0">{i + 1}</span>
          <span className="whitespace-pre break-all min-w-0">{line}</span>
        </div>
      ))}
      </div>
    </div>
  );
}

function HPBar({ hp, maxHp, label, color, side }: { hp: number; maxHp: number; label: string; color: string; side: 'left' | 'right' }) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const isLow = pct <= 25;
  return (
    <div className={`flex items-center gap-2 sm:gap-3 min-w-0 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
      <div className="text-sm font-bold min-w-[50px] sm:min-w-[60px] text-center shrink-0">
        <span className={isLow ? 'text-rose-500' : color}>{hp}</span>
        <span className="text-gray-400">/{maxHp}</span>
      </div>
      <div className="flex-1 h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative min-w-0">
        <motion.div
          className={`h-full rounded-full ${isLow ? 'bg-gradient-to-r from-rose-500 to-red-500' : `bg-gradient-to-r ${color}`}`}
          initial={{ width: pct + '%' }}
          animate={{ width: pct + '%' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {isLow && (
          <motion.div
            className="absolute inset-0 bg-rose-400/30 rounded-full"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </div>
      <div className="text-xs sm:text-sm font-semibold min-w-0 max-w-[100px] sm:max-w-[140px] text-center truncate">{label}</div>
    </div>
  );
}

function TimerCircle({ timeLeft, maxTime, size = 56 }: { timeLeft: number; maxTime: number; size?: number }) {
  const pct = (timeLeft / maxTime) * 100;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const isLow = timeLeft <= 3;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth={4} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          className={isLow ? 'stroke-rose-500' : 'stroke-emerald-500'}
          strokeWidth={4} strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.3 }}
        />
      </svg>
      <span className={`absolute text-lg font-bold ${isLow ? 'text-rose-500' : 'text-foreground'}`}>
        {timeLeft}
      </span>
    </div>
  );
}

function XPBar({ xp, showLabel = true }: { xp: number; showLabel?: boolean }) {
  const level = getLevelForXP(xp);
  const next = getNextLevel(xp);
  const currentLevelXP = level.xpRequired;
  const progressXP = xp - currentLevelXP;
  const neededXP = next.xpRequired - currentLevelXP;
  const pct = neededXP > 0 ? Math.min((progressXP / neededXP) * 100, 100) : 100;
  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold flex items-center gap-1.5">
            <span className="text-lg">{level.badge}</span>
            <span className="text-emerald-600 dark:text-emerald-400">Lv.{level.level}</span>
            <span className="text-gray-500 dark:text-gray-400">{level.title}</span>
          </span>
          <span className="text-gray-500 text-xs">
            {progressXP} / {neededXP} XP to Lv.{next.level}
          </span>
        </div>
      )}
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: pct + '%' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, suffix = '' }: { icon: React.ReactNode; label: string; value: number; color: string; suffix?: string }) {
  return (
    <motion.div {...fadeIn} className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 min-w-0 overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">
        <AnimatedCounter target={value} />
        {suffix && <span className="text-sm text-gray-400 ml-1">{suffix}</span>}
      </div>
    </motion.div>
  );
}

function QuestionOption({ option, index, selected, correct, revealed, onClick }: {
  option: string; index: number; selected: boolean; correct: boolean; revealed: boolean;
  onClick: () => void;
}) {
  const letter = String.fromCharCode(65 + index);
  let bg = 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20';
  if (revealed && selected && correct) bg = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300';
  if (revealed && selected && !correct) bg = 'bg-rose-50 dark:bg-rose-900/30 border-rose-500 text-rose-700 dark:text-rose-300';
  if (revealed && !selected && correct) bg = 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700';
  return (
    <motion.button
      whileHover={!revealed ? { scale: 1.01 } : {}}
      whileTap={!revealed ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={revealed}
      className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${bg} ${revealed ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
        revealed && selected && correct ? 'bg-emerald-500 text-white' :
        revealed && selected && !correct ? 'bg-rose-500 text-white' :
        revealed && correct ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300' :
        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
      }`}>
        {revealed && selected && correct ? <Check className="w-4 h-4" /> :
         revealed && selected && !correct ? <X className="w-4 h-4" /> : letter}
      </span>
      <span className="text-sm font-medium flex-1">{option}</span>
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

export default function LearnWithGame() {
  const appUser = useAppStore(s => s.user);

  const [activeTab, setActiveTab] = useState('home');

  // ── User State ──
  const [profile, setProfile] = useState<UserProfile>(() => ({
    ...defaultProfile,
    name: appUser?.name || defaultProfile.name,
  }));
  const addXP = useCallback((amount: number) => {
    setProfile(p => ({ ...p, xp: p.xp + amount }));
  }, []);

  // ── Learn State ──
  const [learnStep, setLearnStep] = useState<LearnStep>('languages');
  const [learnLang, setLearnLang] = useState<ProgrammingLanguage | null>(null);
  const [learnTopic, setLearnTopic] = useState<Topic | null>(null);
  const [learnQuestions, setLearnQuestions] = useState<Question[]>([]);
  const [learnQIndex, setLearnQIndex] = useState(0);
  const [learnAnswer, setLearnAnswer] = useState<string>('');
  const [learnRevealed, setLearnRevealed] = useState(false);
  const [learnCorrectCount, setLearnCorrectCount] = useState(0);
  const [learnTotalXP, setLearnTotalXP] = useState(0);
  const [learnTextAnswer, setLearnTextAnswer] = useState('');

  const startQuiz = useCallback((lang: ProgrammingLanguage, topic: Topic) => {
    const qs = getRandomQuestions(lang.id, topic.id, 5);
    if (qs.length === 0) return;
    setLearnQuestions(qs);
    setLearnQIndex(0);
    setLearnAnswer('');
    setLearnRevealed(false);
    setLearnCorrectCount(0);
    setLearnTotalXP(0);
    setLearnTextAnswer('');
    setLearnStep('quiz');
  }, []);

  // FIX #3: Daily challenge – use questions directly from the challenge object
  const startDailyChallenge = useCallback((challenge: DailyChallenge, lang: ProgrammingLanguage) => {
    if (challenge.questions.length === 0) return;
    setLearnQuestions(challenge.questions);
    setLearnQIndex(0);
    setLearnAnswer('');
    setLearnRevealed(false);
    setLearnCorrectCount(0);
    setLearnTotalXP(0);
    setLearnTextAnswer('');
    setLearnLang(lang);
    setLearnTopic(null);
    setLearnStep('quiz');
  }, []);

  const handleLearnAnswer = useCallback((ans: string) => {
    if (learnRevealed) return;
    const q = learnQuestions[learnQIndex];
    setLearnAnswer(ans);
    setLearnRevealed(true);
    const isCorrect = ans === q.correctAnswer;
    if (isCorrect) {
      setLearnCorrectCount(c => c + 1);
      setLearnTotalXP(xp => xp + q.points);
      addXP(q.points);
    }
  }, [learnRevealed, learnQuestions, learnQIndex, addXP]);

  const nextLearnQuestion = useCallback(() => {
    if (learnQIndex + 1 >= learnQuestions.length) {
      setLearnStep('results');
      setProfile(p => ({ ...p, questionsAnswered: p.questionsAnswered + learnQuestions.length, correctAnswers: p.correctAnswers + learnCorrectCount }));
    } else {
      setLearnQIndex(i => i + 1);
      setLearnAnswer('');
      setLearnRevealed(false);
      setLearnTextAnswer('');
    }
  }, [learnQIndex, learnQuestions.length, learnCorrectCount]);

  // ── Battle State ──
  const [battleStatus, setBattleStatus] = useState<BattleStatus>('select');
  const [battleLang, setBattleLang] = useState<string>('');
  const [battleP1HP, setBattleP1HP] = useState(100);
  const [battleP2HP, setBattleP2HP] = useState(100);
  const [battleRound, setBattleRound] = useState(0);
  const [battleTimer, setBattleTimer] = useState(12);
  const [battleQuestions, setBattleQuestions] = useState<Question[]>([]);
  const [battleCurrentQ, setBattleCurrentQ] = useState<Question | null>(null);
  const [battleAnswer, setBattleAnswer] = useState('');
  const [battleTextAnswer, setBattleTextAnswer] = useState('');
  const [battleRevealed, setBattleRevealed] = useState(false);
  const [battleDamage, setBattleDamage] = useState({ player: 0, opponent: 0 });
  const [battleShake, setBattleShake] = useState<'player' | 'opponent' | null>(null);
  const [battleGlow, setBattleGlow] = useState<'player' | 'opponent' | null>(null);
  const [battleEndMsg, setBattleEndMsg] = useState('');
  const [battleXP, setBattleXP] = useState(0);
  // FIX #7: Bot answer tracking
  const [battleBotAnswer, setBattleBotAnswer] = useState<string>('');
  const [battleBotCorrect, setBattleBotCorrect] = useState(false);
  const battleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startBattle = useCallback((langId: string) => {
    const qs = getRandomQuestions(langId, undefined, 10);
    if (qs.length < 5) return;
    setBattleLang(langId);
    setBattleQuestions(qs);
    setBattleP1HP(100);
    setBattleP2HP(100);
    setBattleRound(1);
    setBattleTimer(12);
    setBattleAnswer('');
    setBattleTextAnswer('');
    setBattleRevealed(false);
    setBattleDamage({ player: 0, opponent: 0 });
    setBattleBotAnswer('');
    setBattleBotCorrect(false);
    setBattleStatus('battle');
    setBattleCurrentQ(qs[0]);
    if (battleTimeoutRef.current) clearTimeout(battleTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (battleStatus !== 'battle' || battleRevealed) return;
    if (battleTimer <= 0) {
      // FIX #7 & #8: On timeout, bot also answers, then auto-advance after 2s
      const t = setTimeout(() => {
        setBattleRevealed(true);
        const dmg = 15;
        setBattleDamage({ player: dmg, opponent: 0 });
        setBattleShake('player');
        setTimeout(() => setBattleShake(null), 500);
        setBattleP1HP(h => Math.max(0, h - dmg));
        // Bot answers correctly ~70% of the time
        if (battleCurrentQ) {
          const botIsCorrect = Math.random() < 0.7;
          setBattleBotAnswer(botIsCorrect ? battleCurrentQ.correctAnswer : (battleCurrentQ.options ? battleCurrentQ.options[Math.floor(Math.random() * battleCurrentQ.options.length)] : '???'));
          setBattleBotCorrect(botIsCorrect);
          if (botIsCorrect) {
            const botDmg = Math.floor(Math.random() * 11) + 10;
            setBattleP1HP(h => Math.max(0, h - botDmg));
            setBattleDamage(prev => ({ ...prev, player: prev.player + botDmg }));
          }
        }
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setBattleTimer(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [battleStatus, battleTimer, battleRevealed, battleCurrentQ]);

  const handleBattleAnswer = useCallback((ans: string) => {
    if (battleRevealed || !battleCurrentQ) return;
    if (battleTimeoutRef.current) clearTimeout(battleTimeoutRef.current);
    setBattleAnswer(ans);
    setBattleRevealed(true);

    const isPlayerCorrect = ans === battleCurrentQ.correctAnswer;

    // FIX #7: Bot also answers with ~70% accuracy
    const botIsCorrect = Math.random() < 0.7;
    let botAns = '';
    if (botIsCorrect) {
      botAns = battleCurrentQ.correctAnswer;
    } else {
      botAns = battleCurrentQ.options
        ? battleCurrentQ.options[Math.floor(Math.random() * battleCurrentQ.options.length)]
        : '???';
    }
    setBattleBotAnswer(botAns);
    setBattleBotCorrect(botIsCorrect);

    // Player damage
    if (isPlayerCorrect) {
      const dmg = Math.floor(Math.random() * 11) + 10;
      setBattleDamage({ player: 0, opponent: dmg });
      setBattleShake('opponent');
      setBattleGlow('player');
      setBattleP2HP(h => Math.max(0, h - dmg));
    } else {
      const dmg = Math.floor(Math.random() * 6) + 5;
      setBattleDamage({ player: dmg, opponent: 0 });
      setBattleShake('player');
      setBattleP1HP(h => Math.max(0, h - dmg));
    }

    // Bot damage
    if (botIsCorrect) {
      const botDmg = Math.floor(Math.random() * 6) + 5;
      setBattleP1HP(h => Math.max(0, h - botDmg));
      setBattleDamage(prev => ({ ...prev, player: prev.player + botDmg }));
    }

    setTimeout(() => { setBattleShake(null); setBattleGlow(null); }, 500);
  }, [battleRevealed, battleCurrentQ]);

  const nextBattleRound = useCallback(() => {
    if (battleP1HP <= 0 || battleP2HP <= 0 || battleRound >= battleQuestions.length) {
      const won = battleP2HP <= 0;
      const xpEarned = won ? 100 + (battleRound * 15) : 30 + (battleRound * 5);
      setBattleXP(xpEarned);
      addXP(xpEarned);
      setBattleEndMsg(won ? 'Victory!' : 'Defeat!');
      setProfile(p => ({ ...p, battlesWon: p.battlesWon + (won ? 1 : 0), battlesLost: p.battlesLost + (won ? 0 : 1) }));
      setBattleStatus('end');
      return;
    }
    const nextQ = battleQuestions[battleRound];
    setBattleRound(r => r + 1);
    setBattleCurrentQ(nextQ);
    setBattleTimer(12);
    setBattleAnswer('');
    setBattleTextAnswer('');
    setBattleRevealed(false);
    setBattleDamage({ player: 0, opponent: 0 });
    setBattleBotAnswer('');
    setBattleBotCorrect(false);
  }, [battleP1HP, battleP2HP, battleRound, battleQuestions, addXP]);

  // FIX #8: Auto-advance after bot reveals on timeout
  useEffect(() => {
    if (battleStatus !== 'battle' || !battleRevealed) return;
    // Only auto-advance if this was a timeout (no player answer selected but revealed)
    if (battleAnswer === '' && battleBotAnswer !== '') {
      const t = setTimeout(() => {
        nextBattleRound();
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [battleStatus, battleRevealed, battleAnswer, battleBotAnswer, nextBattleRound]);

  // ── Mini Games State ──
  const [activeGame, setActiveGame] = useState<MiniGameType>('none');
  const [gameScore, setGameScore] = useState(0);
  const [gameTimer, setGameTimer] = useState(60);
  const [gameOver, setGameOver] = useState(false);

  // Bug Finder
  const [bfChallenge, setBfChallenge] = useState<BugFinderData | null>(null);
  const [bfSelected, setBfSelected] = useState<number | null>(null);
  const [bfRevealed, setBfRevealed] = useState(false);

  // Code Puzzle
  const [cpChallenge, setCpChallenge] = useState<CodePuzzleData | null>(null);
  const [cpOrder, setCpOrder] = useState<string[]>([]);
  const [cpRevealed, setCpRevealed] = useState(false);
  const [cpCorrect, setCpCorrect] = useState(false);

  // Syntax Match
  const [smPairs, setSmPairs] = useState<SyntaxMatchPair[]>([]);
  const [smConcepts, setSmConcepts] = useState<{ id: string; concept: string; matched: boolean }[]>([]);
  const [smSyntaxes, setSmSyntaxes] = useState<{ id: string; syntax: string; matched: boolean }[]>([]);
  const [smSelected, setSmSelected] = useState<{ type: 'concept' | 'syntax'; id: string } | null>(null);
  const [smMatched, setSmMatched] = useState<number>(0);
  const [smWrong, setSmWrong] = useState(false);

  useEffect(() => {
    if (activeGame === 'none' || gameOver) return;
    if (gameTimer <= 0) {
      const t = setTimeout(() => setGameOver(true), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setGameTimer(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [activeGame, gameTimer, gameOver]);

  const startBugFinder = useCallback(() => {
    const c = BUG_FINDER_CHALLENGES[Math.floor(Math.random() * BUG_FINDER_CHALLENGES.length)];
    setBfChallenge(c);
    setBfSelected(null);
    setBfRevealed(false);
    setGameScore(0);
    setGameTimer(60);
    setGameOver(false);
    setActiveGame('bugfinder');
  }, []);

  const handleBugFind = useCallback((line: number) => {
    if (bfRevealed || !bfChallenge) return;
    setBfSelected(line);
    setBfRevealed(true);
    if (line === bfChallenge.bugLine) {
      setGameScore(1);
      addXP(bfChallenge.points);
      setProfile(p => ({ ...p, miniGamesPlayed: p.miniGamesPlayed + 1 }));
    }
    setTimeout(() => setGameOver(true), 2000);
  }, [bfRevealed, bfChallenge, addXP]);

  // FIX #6: Always shuffle code puzzle lines, ensuring they differ from correct order
  const startCodePuzzle = useCallback(() => {
    const c = CODE_PUZZLES[Math.floor(Math.random() * CODE_PUZZLES.length)];
    setCpChallenge(c);
    let order = shuffleArray([...c.correctOrder]);
    // Ensure it's actually shuffled (different from correct)
    while (order.every((l, i) => l === c.correctOrder[i]) && c.correctOrder.length > 1) {
      order = shuffleArray([...c.correctOrder]);
    }
    setCpOrder(order);
    setCpRevealed(false);
    setCpCorrect(false);
    setGameScore(0);
    setGameTimer(90);
    setGameOver(false);
    setActiveGame('codepuzzle');
  }, []);

  const moveCpLine = useCallback((idx: number, dir: 'up' | 'down') => {
    if (cpRevealed || gameOver) return;
    const newOrder = [...cpOrder];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
    setCpOrder(newOrder);
  }, [cpOrder, cpRevealed, gameOver]);

  const checkCodePuzzle = useCallback(() => {
    if (!cpChallenge) return;
    const isCorrect = cpOrder.every((l, i) => l === cpChallenge.correctOrder[i]);
    setCpRevealed(true);
    setCpCorrect(isCorrect);
    if (isCorrect) {
      setGameScore(1);
      addXP(cpChallenge.points);
      setProfile(p => ({ ...p, miniGamesPlayed: p.miniGamesPlayed + 1 }));
    }
    setTimeout(() => setGameOver(true), 2500);
  }, [cpChallenge, cpOrder, addXP]);

  const startSyntaxMatch = useCallback(() => {
    const lang = LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];
    const concepts = ['Print to console', 'Define constant', 'For loop (1 to 5)', 'Function declaration'];
    const pairs = SYNTAX_MATCH_PAIRS.filter(p => p.languageId === lang.id && concepts.includes(p.concept)).slice(0, 4);
    if (pairs.length < 4) {
      const extras = SYNTAX_MATCH_PAIRS.filter(p => concepts.includes(p.concept) && !pairs.includes(p)).slice(0, 4 - pairs.length);
      pairs.push(...extras);
    }
    setSmPairs(pairs);
    setSmConcepts(shuffleArray(pairs.map(p => ({ id: p.id, concept: p.concept, matched: false }))));
    setSmSyntaxes(shuffleArray(pairs.map(p => ({ id: p.id, syntax: p.syntax, matched: false }))));
    setSmSelected(null);
    setSmMatched(0);
    setSmWrong(false);
    setGameScore(0);
    setGameTimer(60);
    setGameOver(false);
    setActiveGame('syntaxmatch');
  }, []);

  // FIX #1: Syntax Match – correct matching logic using concept and syntax values
  const handleSmSelect = useCallback((type: 'concept' | 'syntax', id: string) => {
    if (gameOver || gameTimer <= 0) return;
    if (smWrong) return;
    const items = type === 'concept' ? smConcepts : smSyntaxes;
    const item = items.find(i => i.id === id);
    if (!item || item.matched) return;

    if (!smSelected) {
      setSmSelected({ type, id });
      return;
    }

    if (smSelected.type === type) {
      setSmSelected({ type, id });
      return;
    }

    // Determine which id belongs to concept and which to syntax
    const conceptId = type === 'concept' ? id : smSelected.id;
    const syntaxId = type === 'syntax' ? id : smSelected.id;

    // Look up the actual concept/syntax strings from the items
    const conceptItem = smConcepts.find(c => c.id === conceptId);
    const syntaxItem = smSyntaxes.find(s => s.id === syntaxId);

    // Match by comparing concept and syntax values against the pair data
    const pair = smPairs.find(p => p.concept === conceptItem?.concept && p.syntax === syntaxItem?.syntax);

    if (pair) {
      setSmConcepts(prev => prev.map(i => i.id === conceptId ? { ...i, matched: true } : i));
      setSmSyntaxes(prev => prev.map(i => i.id === syntaxId ? { ...i, matched: true } : i));
      setSmMatched(m => m + 1);
      setGameScore(s => s + 1);
      addXP(10);
      if (smMatched + 1 >= Math.min(smPairs.length, 4)) {
        setProfile(p => ({ ...p, miniGamesPlayed: p.miniGamesPlayed + 1 }));
        setTimeout(() => setGameOver(true), 500);
      }
    } else {
      setSmWrong(true);
      setTimeout(() => setSmWrong(false), 600);
    }
    setSmSelected(null);
  }, [smSelected, smConcepts, smSyntaxes, smPairs, smMatched, smWrong, gameOver, gameTimer, addXP]);

  const resetGame = useCallback(() => {
    setActiveGame('none');
    setGameOver(false);
  }, []);

  // ── Friends State ──
  const [friends, setFriends] = useState<Friend[]>(defaultFriends);
  const [friendInput, setFriendInput] = useState('');
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [challengeFriend, setChallengeFriend] = useState<Friend | null>(null);

  const addFriend = useCallback(() => {
    if (!friendInput.trim()) return;
    const newFriend: Friend = {
      id: 'f' + Date.now(),
      name: friendInput.trim(),
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      online: Math.random() > 0.5,
      level: Math.floor(Math.random() * 10) + 1,
      xp: Math.floor(Math.random() * 5000),
    };
    setFriends(f => [...f, newFriend]);
    setFriendInput('');
  }, [friendInput]);

  const removeFriend = useCallback((id: string) => {
    setFriends(f => f.filter(fr => fr.id !== id));
  }, []);

  const challengeFriendFn = useCallback((friend: Friend) => {
    setChallengeFriend(friend);
    setChallengeDialogOpen(true);
  }, []);

  const startChallengeWithFriend = useCallback(() => {
    setChallengeDialogOpen(false);
    setActiveTab('battle');
    if (challengeFriend) {
      const lang = LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];
      startBattle(lang.id);
    }
  }, [challengeFriend, startBattle]);

  // ── Daily challenge ──
  const dailyChallenge = useMemo(() => getTodayChallenge(), []);

  // ══════════════════════════════════════════════════════════════
  // RENDER: HOME TAB
  // ══════════════════════════════════════════════════════════════

  function renderHome() {
    const accuracy = profile.questionsAnswered > 0 ? Math.round((profile.correctAnswers / profile.questionsAnswered) * 100) : 0;
    return (
      <motion.div {...fadeIn} className="space-y-6">
        {/* XP Bar */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-white/30 shrink-0">
                <AvatarFallback className="text-xl sm:text-2xl bg-white/20">{profile.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">{profile.name}</h2>
                <div className="text-emerald-100 text-xs sm:text-sm">{getLevelForXP(profile.xp).badge} {getLevelForXP(profile.xp).title}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl sm:text-3xl font-bold text-white">{profile.xp}</div>
                <div className="text-emerald-100 text-[10px] sm:text-xs">Total XP</div>
              </div>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${getNextLevel(profile.xp).xpRequired > 0 ? ((profile.xp - getLevelForXP(profile.xp).xpRequired) / (getNextLevel(profile.xp).xpRequired - getLevelForXP(profile.xp).xpRequired)) * 100 : 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-xs text-emerald-100 mt-1">
              <span>Level {getLevelForXP(profile.xp).level}</span>
              <span>Level {getNextLevel(profile.xp).level}</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 [&>*]:min-w-0">
          <StatCard icon={<Zap className="w-4 h-4 text-amber-500" />} label="Total XP" value={profile.xp} color="bg-amber-100 dark:bg-amber-900/30" />
          <StatCard icon={<Star className="w-4 h-4 text-emerald-500" />} label="Level" value={getLevelForXP(profile.xp).level} color="bg-emerald-100 dark:bg-emerald-900/30" />
          <StatCard icon={<Flame className="w-4 h-4 text-orange-500" />} label="Streak" value={profile.streak} color="bg-orange-100 dark:bg-orange-900/30" suffix="days" />
          <StatCard icon={<Swords className="w-4 h-4 text-rose-500" />} label="Battles Won" value={profile.battlesWon} color="bg-rose-100 dark:bg-rose-900/30" />
        </div>

        {/* Daily Challenge */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Daily Challenge
          </h3>
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="bg-gradient-to-r from-violet-500 to-fuchsia-600 dark:from-violet-700 dark:to-fuchsia-800 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Badge className="bg-white/20 text-white border-0 mb-2">{dailyChallenge.difficulty}</Badge>
                  <h3 className="text-base sm:text-lg font-bold text-white">{dailyChallenge.title}</h3>
                  <p className="text-xs sm:text-sm text-violet-100 mt-1 line-clamp-2">{dailyChallenge.description}</p>
                  <div className="flex items-center gap-3 sm:gap-4 mt-3">
                    <span className="text-white/80 text-xs flex items-center gap-1"><Zap className="w-3 h-3" />{dailyChallenge.points} XP</span>
                    <span className="text-white/80 text-xs flex items-center gap-1"><Target className="w-3 h-3" />{dailyChallenge.questions.length} Qs</span>
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl shrink-0">{getLanguageById(dailyChallenge.languageId)?.icon}</div>
              </div>
              {/* FIX #3: Use startDailyChallenge with direct questions */}
              <Button
                onClick={() => {
                  const lang = getLanguageById(dailyChallenge.languageId);
                  if (lang) startDailyChallenge(dailyChallenge, lang);
                }}
                className="mt-4 bg-white text-violet-600 hover:bg-white/90 font-semibold"
              >
                Start Challenge <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 [&>*]:min-w-0">
            {[
              { icon: <BookOpen className="w-5 h-5" />, label: 'Learn', desc: 'Start a quiz', color: 'from-emerald-500 to-teal-500', tab: 'learn' },
              { icon: <Swords className="w-5 h-5" />, label: 'Battle', desc: 'Challenge bot', color: 'from-rose-500 to-orange-500', tab: 'battle' },
              { icon: <Gamepad2 className="w-5 h-5" />, label: 'Mini Games', desc: 'Have fun!', color: 'from-violet-500 to-fuchsia-500', tab: 'minigames' },
              { icon: <Trophy className="w-5 h-5" />, label: 'Leaderboard', desc: 'Global ranks', color: 'from-amber-500 to-yellow-500', tab: 'leaderboard' },
            ].map(a => (
              <motion.button
                key={a.tab}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(a.tab)}
                className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 text-left hover:shadow-lg transition-shadow"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${a.color} flex items-center justify-center text-white mb-3`}>{a.icon}</div>
                <div className="font-semibold text-sm">{a.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.desc}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recent Activity
          </h3>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4 space-y-3">
              {recentActivity.map(a => (
                <div key={a.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs sm:text-sm truncate">{a.text}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500 shrink-0">
                    <span className="text-emerald-500 font-medium">+{a.xp} XP</span>
                    <span className="hidden sm:inline">{a.time}</span>
                    <span className="sm:hidden">{a.time.split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: LEARN TAB
  // ══════════════════════════════════════════════════════════════

  function renderLearn() {
    if (learnStep === 'languages') return renderLanguageGrid();
    if (learnStep === 'topics') return renderTopicList();
    if (learnStep === 'quiz') return renderQuiz();
    if (learnStep === 'results') return renderQuizResults();
    return null;
  }

  function renderLanguageGrid() {
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">Choose a Language</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{LANGUAGES.length} languages available</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 [&>*]:min-w-0">
          {LANGUAGES.map((lang, idx) => (
            <motion.div key={lang.id} {...fadeIn} transition={{ delay: idx * 0.05 }}>
              <Card
                className="cursor-pointer hover:shadow-xl transition-all border-0 overflow-hidden group"
                onClick={() => { setLearnLang(lang); setLearnStep('topics'); }}
              >
                <CardContent className="p-0">
                  <div className={`bg-gradient-to-br ${lang.gradient} p-4 text-white`}>
                    <div className="flex items-center justify-between">
                      <span className="text-4xl">{lang.icon}</span>
                      <Badge className="bg-white/20 text-white border-0">{lang.difficulty}</Badge>
                    </div>
                    <h3 className="text-lg font-bold mt-2">{lang.name}</h3>
                    <p className="text-sm opacity-80 line-clamp-2 mt-1">{lang.description}</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{lang.topics.length} topics</span>
                      <span className="flex items-center gap-1 text-emerald-500 font-medium">Explore <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  function renderTopicList() {
    if (!learnLang) return null;
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLearnStep('languages')}><ChevronLeft className="w-4 h-4" /> Back</Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{learnLang.icon}</span>
          <div>
            <h2 className="text-xl font-bold">{learnLang.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{learnLang.topics.length} topics available</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 [&>*]:min-w-0">
          {learnLang.topics.map((topic, idx) => (
            <motion.div key={topic.id} {...fadeIn} transition={{ delay: idx * 0.04 }}>
              <Card
                className="cursor-pointer hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700/50 group"
                onClick={() => { setLearnTopic(topic); startQuiz(learnLang, topic); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{topic.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{topic.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{topic.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`text-xs ${diffColors[topic.difficulty]} border ${diffBadge[topic.difficulty]}`}>{topic.difficulty}</Badge>
                        <span className="text-xs text-gray-400">{topic.questionCount} questions</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all mt-1" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  function renderQuiz() {
    const q = learnQuestions[learnQIndex];
    if (!q) return null;
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setLearnStep('topics')}><ChevronLeft className="w-4 h-4" /> Quit</Button>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {learnQIndex + 1} / {learnQuestions.length}
            </Badge>
            <Badge className={`${diffColors[q.difficulty]} border ${diffBadge[q.difficulty]}`}>{q.difficulty}</Badge>
            <Badge variant="outline" className="hidden sm:inline-flex">{q.type.replace('_', ' ')}</Badge>
          </div>
        </div>
        <Progress value={((learnQIndex + 1) / learnQuestions.length) * 100} className="h-1.5" />

        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">{q.question}</h3>
            {q.codeSnippet && <CodeBlock code={q.codeSnippet} />}
            {q.type === 'MCQ' && q.options && (
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <QuestionOption
                    key={i} option={opt} index={i}
                    selected={learnAnswer === String.fromCharCode(65 + i)}
                    correct={q.correctAnswer === String.fromCharCode(65 + i)}
                    revealed={learnRevealed}
                    onClick={() => handleLearnAnswer(String.fromCharCode(65 + i))}
                  />
                ))}
              </div>
            )}
            {(q.type === 'OUTPUT_PREDICTION' || q.type === 'CODE_FIXING') && (
              <div className="space-y-3">
                <Input
                  placeholder={q.type === 'OUTPUT_PREDICTION' ? 'Enter the output...' : 'Enter your fix...'}
                  value={learnTextAnswer}
                  onChange={e => setLearnTextAnswer(e.target.value)}
                  disabled={learnRevealed}
                  onKeyDown={e => { if (e.key === 'Enter' && learnTextAnswer.trim()) handleLearnAnswer(learnTextAnswer.trim()); }}
                  className="font-mono"
                />
                {!learnRevealed && (
                  <Button onClick={() => { if (learnTextAnswer.trim()) handleLearnAnswer(learnTextAnswer.trim()); }} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Send className="w-4 h-4 mr-2" /> Submit Answer
                  </Button>
                )}
              </div>
            )}
            {learnRevealed && (
              <motion.div {...fadeIn} className="space-y-3">
                <div className={`p-3 rounded-lg text-sm ${learnAnswer === q.correctAnswer ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'}`}>
                  <div className="font-semibold mb-1">{learnAnswer === q.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}</div>
                  <div>Correct answer: <code className="font-mono bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded">{q.correctAnswer}</code></div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-600 dark:text-gray-300">
                  💡 {q.explanation}
                </div>
                <Button onClick={nextLearnQuestion} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {learnQIndex + 1 >= learnQuestions.length ? 'See Results' : 'Next Question'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  function renderQuizResults() {
    const pct = Math.round((learnCorrectCount / learnQuestions.length) * 100);
    return (
      <motion.div {...scaleIn} className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
        <Card className="border-0 shadow-xl w-full max-w-md mx-4">
          <CardContent className="p-6 sm:p-8 text-center space-y-4">
            <motion.div
              animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5 }}
              className="text-6xl"
            >
              {pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'}
            </motion.div>
            <h2 className="text-2xl font-bold">Quiz Complete!</h2>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{learnCorrectCount}/{learnQuestions.length}</div>
              <div className="text-sm text-gray-500">({pct}% accuracy)</div>
            </div>
            <div className="flex justify-center gap-6 text-sm">
              <div className="text-center"><div className="text-lg font-bold text-emerald-500">{learnCorrectCount}</div>Correct</div>
              <div className="text-center"><div className="text-lg font-bold text-rose-500">{learnQuestions.length - learnCorrectCount}</div>Wrong</div>
              <div className="text-center"><div className="text-lg font-bold text-amber-500">+{learnTotalXP}</div>XP Earned</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setLearnStep('languages'); setLearnLang(null); }}>Back to Languages</Button>
              {learnLang && learnTopic && (
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => startQuiz(learnLang, learnTopic)}>Try Again</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: BATTLE TAB
  // ══════════════════════════════════════════════════════════════

  function renderBattle() {
    if (battleStatus === 'select') return renderBattleSelect();
    if (battleStatus === 'battle') return renderBattleArena();
    if (battleStatus === 'end') return renderBattleEnd();
    return null;
  }

  function renderBattleSelect() {
    return (
      <motion.div {...fadeIn} className="space-y-6">
        <div className="text-center space-y-2">
          <motion.div {...pulse} className="text-6xl inline-block">⚔️</motion.div>
          <h2 className="text-2xl font-bold">Quiz Battle</h2>
          <p className="text-gray-500 dark:text-gray-400">Choose a language and fight a bot in a quiz battle!</p>
          <div className="flex justify-center gap-4 text-sm text-gray-400">
            <span>🟢 100 HP each</span>
            <span>⚡ 10 rounds</span>
            <span>⏱️ 12s per question</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 [&>*]:min-w-0">
          {LANGUAGES.map(lang => (
            <motion.div key={lang.id} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Card
                className="cursor-pointer hover:shadow-xl transition-all border-0 overflow-hidden"
                onClick={() => startBattle(lang.id)}
              >
                <CardContent className="p-0">
                  <div className={`bg-gradient-to-r ${lang.gradient} p-4 text-white flex items-center gap-3`}>
                    <span className="text-3xl">{lang.icon}</span>
                    <div>
                      <h3 className="font-bold">{lang.name}</h3>
                      <p className="text-sm opacity-80">{lang.topics.reduce((s, t) => s + t.questionCount, 0)} questions</p>
                    </div>
                    <Swords className="w-6 h-6 ml-auto opacity-60" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  function renderBattleArena() {
    if (!battleCurrentQ) return null;
    return (
      <motion.div {...fadeIn} className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 font-semibold text-xs shrink-0">
            R{battleRound}/{Math.min(battleQuestions.length, 10)}
          </Badge>
          <TimerCircle timeLeft={battleTimer} maxTime={12} size={48} />
          <Button variant="ghost" size="sm" className="text-gray-400 shrink-0 text-xs" onClick={() => setBattleStatus('select')}>
            <X className="w-4 h-4" /><span className="sm:inline hidden"> Forfeit</span>
          </Button>
        </div>

        {/* HP Bars */}
        <div className="space-y-2">
          <motion.div animate={battleShake === 'player' ? { x: [0, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.4 }}>
            <HPBar hp={battleP1HP} maxHp={100} label={`👤 ${profile.name} (You)`} color="from-emerald-500 to-emerald-600" side="left" />
          </motion.div>
          <motion.div animate={battleShake === 'opponent' ? { x: [0, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.4 }}>
            <HPBar hp={battleP2HP} maxHp={100} label={`🤖 Bot (${getLanguageById(battleLang)?.name})`} color="from-rose-500 to-rose-600" side="right" />
          </motion.div>
        </div>

        <Progress value={(battleRound / Math.min(battleQuestions.length, 10)) * 100} className="h-1" />

        {/* Question */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
              <Badge variant="outline" className="text-xs">{getLanguageById(battleLang)?.icon} {getLanguageById(battleLang)?.name}</Badge>
              <Badge className={`text-xs ${diffColors[battleCurrentQ.difficulty]} border ${diffBadge[battleCurrentQ.difficulty]}`}>{battleCurrentQ.difficulty}</Badge>
            </div>
            <h3 className="text-base sm:text-lg font-semibold break-words">{battleCurrentQ.question}</h3>
            {battleCurrentQ.codeSnippet && <CodeBlock code={battleCurrentQ.codeSnippet} />}
            {/* FIX #2: Battle now handles all question types, not just MCQ */}
            {battleCurrentQ.type === 'MCQ' && battleCurrentQ.options && (
              <div className="space-y-2">
                {battleCurrentQ.options.map((opt, i) => (
                  <QuestionOption
                    key={i} option={opt} index={i}
                    selected={battleAnswer === String.fromCharCode(65 + i)}
                    correct={battleCurrentQ.correctAnswer === String.fromCharCode(65 + i)}
                    revealed={battleRevealed}
                    onClick={() => handleBattleAnswer(String.fromCharCode(65 + i))}
                  />
                ))}
              </div>
            )}
            {(battleCurrentQ.type === 'OUTPUT_PREDICTION' || battleCurrentQ.type === 'CODE_FIXING') && (
              <div className="space-y-3">
                <Input
                  placeholder={battleCurrentQ.type === 'OUTPUT_PREDICTION' ? 'Enter the output...' : 'Enter your fix...'}
                  value={battleTextAnswer}
                  onChange={e => setBattleTextAnswer(e.target.value)}
                  disabled={battleRevealed}
                  onKeyDown={e => { if (e.key === 'Enter' && battleTextAnswer.trim()) handleBattleAnswer(battleTextAnswer.trim()); }}
                  className="font-mono"
                />
                {!battleRevealed && (
                  <Button onClick={() => { if (battleTextAnswer.trim()) handleBattleAnswer(battleTextAnswer.trim()); }} className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-semibold">
                    <Send className="w-4 h-4 mr-2" /> Submit Answer
                  </Button>
                )}
              </div>
            )}
            {battleRevealed && (
              <motion.div {...fadeIn} className="space-y-3">
                {/* FIX #7: Show bot answer result */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 [&>*]:min-w-0">
                  <div className={`p-2.5 sm:p-3 rounded-lg text-center text-xs sm:text-sm ${
                    battleAnswer === battleCurrentQ.correctAnswer ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' :
                    battleAnswer === '' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' :
                    'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                  }`}>
                    <div className="text-xs font-semibold mb-1">👤 You</div>
                    <div className="font-bold break-words">
                      {battleAnswer === battleCurrentQ.correctAnswer ? (
                        <><Sparkles className="w-4 h-4 inline mr-1" /> Correct! -{battleDamage.opponent > 0 ? battleDamage.opponent : 0} HP</>
                      ) : (
                        <>{battleAnswer ? <><Skull className="w-4 h-4 inline mr-1" /> Wrong!</> : <><Clock className="w-4 h-4 inline mr-1" /> Time up!</>} -{battleDamage.player} HP</>
                      )}
                    </div>
                  </div>
                  <div className={`p-2.5 sm:p-3 rounded-lg text-center text-xs sm:text-sm ${
                    battleBotCorrect ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300' :
                    'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    <div className="text-xs font-semibold mb-1">🤖 Bot</div>
                    <div className="font-bold">
                      {battleBotCorrect ? (
                        <>Correct! -{battleDamage.player} HP to you</>
                      ) : (
                        <>Wrong! No damage</>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">💡 {battleCurrentQ.explanation}</p>
                <Button onClick={nextBattleRound} className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-semibold">
                  {battleP1HP <= 0 || battleP2HP <= 0 || battleRound >= battleQuestions.length ? 'See Results' : `Next Round →`}
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  function renderBattleEnd() {
    const won = battleEndMsg === 'Victory!';
    return (
      <motion.div {...scaleIn} className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
        <Card className="border-0 shadow-xl w-full max-w-md overflow-hidden mx-4">
          <div className={`p-6 sm:p-8 text-center ${won ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-orange-600'} text-white`}>
            <motion.div animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.6 }} className="text-7xl mb-2">
              {won ? '🏆' : '💀'}
            </motion.div>
            <h2 className="text-3xl font-bold">{battleEndMsg}</h2>
            <p className="opacity-80 mt-1">{won ? 'You defeated the bot!' : 'Better luck next time!'}</p>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center [&>*]:min-w-0">
              <div><div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{battleRound - 1}</div><div className="text-xs text-gray-500">Rounds</div></div>
              <div><div className="text-lg font-bold text-rose-500">{100 - Math.max(battleP1HP, 0)}</div><div className="text-xs text-gray-500">Damage Taken</div></div>
              <div><div className="text-lg font-bold text-amber-500">+{battleXP}</div><div className="text-xs text-gray-500">XP Earned</div></div>
            </div>
            <XPBar xp={profile.xp} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setBattleStatus('select')}>Back</Button>
              <Button className="flex-1 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white" onClick={() => startBattle(battleLang)}>
                <RotateCcw className="w-4 h-4 mr-1" /> Rematch
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: MINI GAMES TAB
  // ══════════════════════════════════════════════════════════════

  function renderMiniGames() {
    if (activeGame === 'bugfinder') return renderBugFinder();
    if (activeGame === 'codepuzzle') return renderCodePuzzle();
    if (activeGame === 'syntaxmatch') return renderSyntaxMatch();
    return renderGameHub();
  }

  function renderGameHub() {
    const games = [
      { id: 'bugfinder' as const, icon: <Bug className="w-8 h-8" />, title: 'Bug Finder', desc: 'Find the bug in the code snippet! Click on the line with the bug.', color: 'from-rose-500 to-orange-500', emoji: '🐛', count: BUG_FINDER_CHALLENGES.length },
      { id: 'codepuzzle' as const, icon: <Puzzle className="w-8 h-8" />, title: 'Code Puzzle', desc: 'Rearrange shuffled code lines into the correct order.', color: 'from-violet-500 to-fuchsia-500', emoji: '🧩', count: CODE_PUZZLES.length },
      { id: 'syntaxmatch' as const, icon: <Braces className="w-8 h-8" />, title: 'Syntax Match', desc: 'Match programming concepts with their syntax across languages.', color: 'from-cyan-500 to-teal-500', emoji: '🔗', count: SYNTAX_MATCH_PAIRS.length },
    ];
    return (
      <motion.div {...fadeIn} className="space-y-6">
        <div className="text-center space-y-2">
          <motion.div {...pulse} className="text-6xl inline-block">🎮</motion.div>
          <h2 className="text-2xl font-bold">Mini Games</h2>
          <p className="text-gray-500 dark:text-gray-400">Fun coding challenges to sharpen your skills!</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 [&>*]:min-w-0">
          {games.map((g, idx) => (
            <motion.div key={g.id} {...fadeIn} transition={{ delay: idx * 0.1 }}>
              <Card className="overflow-hidden border-0 shadow-lg cursor-pointer group" onClick={() => {
                if (g.id === 'bugfinder') startBugFinder();
                else if (g.id === 'codepuzzle') startCodePuzzle();
                else if (g.id === 'syntaxmatch') startSyntaxMatch();
              }}>
                <CardContent className="p-0">
                  <div className={`bg-gradient-to-br ${g.color} p-6 text-white`}>
                    <div className="flex items-start justify-between">
                      <span className="text-5xl">{g.emoji}</span>
                      <div className="bg-white/20 rounded-full p-2">{g.icon}</div>
                    </div>
                    <h3 className="text-xl font-bold mt-3">{g.title}</h3>
                    <p className="text-sm opacity-80 mt-1">{g.desc}</p>
                    <div className="flex items-center gap-3 mt-4">
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{g.count} challenges</span>
                      <Button className="bg-white text-gray-900 hover:bg-white/90 text-sm ml-auto font-semibold">
                        Play <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  function renderBugFinder() {
    if (!bfChallenge) return null;
    const codeLang = getLanguageById(bfChallenge.languageId);
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={resetGame}><ChevronLeft className="w-4 h-4" /> Back</Button>
          <div className="flex items-center gap-2">
            <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">🐛 Bug Finder</Badge>
            <Badge className={`${diffColors[bfChallenge.difficulty]} border ${diffBadge[bfChallenge.difficulty]}`}>{bfChallenge.difficulty}</Badge>
          </div>
          <TimerCircle timeLeft={gameTimer} maxTime={60} />
        </div>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">{bfChallenge.title}</CardTitle>
            <CardDescription>Find the bug! Click on the line you think contains the bug. ({codeLang?.icon} {codeLang?.name})</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock code={bfChallenge.code} highlightLine={bfRevealed ? bfChallenge.bugLine : undefined} onLineClick={!bfRevealed ? handleBugFind : undefined} />
            {bfRevealed && (
              <motion.div {...fadeIn} className="space-y-3">
                <div className={`p-3 rounded-lg ${bfSelected === bfChallenge.bugLine ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'}`}>
                  {bfSelected === bfChallenge.bugLine ? (
                    <div><span className="font-bold">✅ Correct!</span> Line {bfChallenge.bugLine}: {bfChallenge.bugDescription}</div>
                  ) : (
                    <div><span className="font-bold">❌ Wrong line!</span> The bug was on line {bfChallenge.bugLine}: {bfChallenge.bugDescription}</div>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm">
                  <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Fixed Code:</div>
                  <CodeBlock code={bfChallenge.fixedCode} />
                </div>
                <Button onClick={resetGame} className="w-full bg-rose-600 hover:bg-rose-700">Back to Games</Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  function renderCodePuzzle() {
    if (!cpChallenge) return null;
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={resetGame}><ChevronLeft className="w-4 h-4" /> Back</Button>
          <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">🧩 Code Puzzle</Badge>
          <TimerCircle timeLeft={gameTimer} maxTime={90} />
        </div>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">{cpChallenge.title}</CardTitle>
            <CardDescription>{cpChallenge.description}. Click arrows to reorder the lines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              {cpOrder.map((line, idx) => (
                <motion.div
                  key={`${line}-${idx}`}
                  layout
                  className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                    cpRevealed && line === cpChallenge.correctOrder[idx] ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' :
                    cpRevealed && line !== cpChallenge.correctOrder[idx] ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20' :
                    'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">{idx + 1}</span>
                  <code className="flex-1 text-sm font-mono">{line}</code>
                  {!cpRevealed && !gameOver && (
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button onClick={() => moveCpLine(idx, 'up')} disabled={idx === 0} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 disabled:opacity-30 min-w-[32px] min-h-[28px] flex items-center justify-center"><ArrowUp className="w-4 h-4" /></button>
                      <button onClick={() => moveCpLine(idx, 'down')} disabled={idx === cpOrder.length - 1} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 disabled:opacity-30 min-w-[32px] min-h-[28px] flex items-center justify-center"><ArrowDown className="w-4 h-4" /></button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            {!cpRevealed && !gameOver && (
              <Button onClick={checkCodePuzzle} className="w-full bg-violet-600 hover:bg-violet-700 font-semibold">
                <Check className="w-4 h-4 mr-2" /> Check Order
              </Button>
            )}
            {cpRevealed && (
              <motion.div {...fadeIn} className="space-y-3">
                <div className={`p-3 rounded-lg ${cpCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'}`}>
                  {cpCorrect ? '✅ Perfect! All lines are in the correct order!' : '❌ Some lines are out of order. Green = correct position, Red = wrong position.'}
                </div>
                <Button onClick={resetGame} className="w-full bg-violet-600 hover:bg-violet-700">Back to Games</Button>
              </motion.div>
            )}
            {gameOver && !cpRevealed && (
              <motion.div {...fadeIn}>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-center font-semibold">⏱️ Time's up!</div>
                <Button onClick={resetGame} className="w-full mt-3 bg-violet-600 hover:bg-violet-700">Back to Games</Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  function renderSyntaxMatch() {
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={resetGame}><ChevronLeft className="w-4 h-4" /> Back</Button>
          <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">🔗 Syntax Match</Badge>
          <TimerCircle timeLeft={gameTimer} maxTime={60} />
        </div>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Match Concepts with Syntax</CardTitle>
            <CardDescription>Click a concept card, then click its matching syntax card.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {smWrong && (
              <motion.div {...shakeAnim} transition={{ duration: 0.4 }}>
                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-center text-sm font-medium">No match! Try again.</div>
              </motion.div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Concepts */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase">Concepts</h4>
                {smConcepts.map(c => (
                  <motion.button
                    key={c.id}
                    whileHover={!c.matched && !gameOver ? { scale: 1.02 } : {}}
                    whileTap={!c.matched && !gameOver ? { scale: 0.98 } : {}}
                    onClick={() => !c.matched && !gameOver && handleSmSelect('concept', c.id)}
                    disabled={c.matched || gameOver}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                      c.matched ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                      smSelected?.type === 'concept' && smSelected.id === c.id ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20' :
                      'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-violet-300'
                    } ${c.matched ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {c.concept}
                  </motion.button>
                ))}
              </div>
              {/* Syntaxes */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase">Syntax</h4>
                {smSyntaxes.map(s => (
                  <motion.button
                    key={s.id}
                    whileHover={!s.matched && !gameOver ? { scale: 1.02 } : {}}
                    whileTap={!s.matched && !gameOver ? { scale: 0.98 } : {}}
                    onClick={() => !s.matched && !gameOver && handleSmSelect('syntax', s.id)}
                    disabled={s.matched || gameOver}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm font-mono ${
                      s.matched ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                      smSelected?.type === 'syntax' && smSelected.id === s.id ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20' :
                      'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-cyan-300'
                    } ${s.matched ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {s.syntax}
                  </motion.button>
                ))}
              </div>
            </div>
            {gameOver && (
              <motion.div {...fadeIn} className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-center font-semibold">
                  {smMatched >= Math.min(smPairs.length, 4) ? '🎉 All pairs matched!' : `⏱️ Time's up! ${smMatched} pairs matched.`}
                </div>
                <Button onClick={resetGame} className="w-full bg-cyan-600 hover:bg-cyan-700">Back to Games</Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: LEADERBOARD TAB
  // ══════════════════════════════════════════════════════════════

  function renderLeaderboard() {
    const top3 = MOCK_LEADERBOARD.slice(0, 3);
    const rest = MOCK_LEADERBOARD.slice(3);
    const rankStyles = [
      'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-amber-200 dark:shadow-amber-900',
      'bg-gradient-to-r from-gray-300 to-gray-400 text-white shadow-gray-200 dark:shadow-gray-800',
      'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-amber-200 dark:shadow-amber-900',
    ];
    const rankIcons = ['👑', '🥈', '🥉'];

    return (
      <motion.div {...fadeIn} className="space-y-6">
        <div className="text-center space-y-2">
          <motion.div {...pulse} className="text-6xl inline-block">🏆</motion.div>
          <h2 className="text-2xl font-bold">Global Leaderboard</h2>
          <p className="text-gray-500 dark:text-gray-400">Top coders from around the world</p>
        </div>

        {/* Top 3 Podium */}
        <div className="flex items-end justify-center gap-2 sm:gap-3">
          {[1, 0, 2].map((idx) => {
            const p = top3[idx];
            return (
              <motion.div key={p.rank} {...fadeIn} transition={{ delay: idx * 0.15 }} className="flex-1 max-w-[140px] sm:max-w-[160px]">
                <div className={`flex flex-col items-center ${idx === 0 ? 'order-2' : idx === 1 ? 'order-1' : 'order-3'}`}>
                  <Avatar className={`w-12 h-12 sm:w-16 sm:h-16 mb-1 sm:mb-2 border-3 ${idx === 0 ? 'border-amber-400' : idx === 1 ? 'border-gray-400' : 'border-amber-600'}`}>
                    <AvatarFallback className="text-lg sm:text-2xl bg-white dark:bg-gray-800">{p.avatar}</AvatarFallback>
                  </Avatar>
                  <div className={`px-2 sm:px-4 py-0.5 sm:py-1 rounded-t-xl text-xs sm:text-sm font-bold ${rankStyles[idx]}`}>{rankIcons[idx]}</div>
                  <div className={`w-full ${idx === 0 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : idx === 1 ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'} border-x border-t px-2 sm:px-4 py-2 sm:py-3 text-center`}>
                    <div className="font-bold text-xs sm:text-sm truncate">{p.name}</div>
                    <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">Lv.{p.level} • {p.xp.toLocaleString()} XP</div>
                    <div className="text-[10px] sm:text-xs text-gray-400">{p.accuracy}%</div>
                  </div>
                  <div className={`w-full ${idx === 0 ? 'h-12 bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' : idx === 1 ? 'h-8 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'h-6 bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800'} border border-t-0 rounded-b-xl`} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Rest of leaderboard */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase p-3 pl-4">Rank</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase p-3">Player</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase p-3 hidden sm:table-cell">Level</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase p-3 hidden md:table-cell">XP</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase p-3">Accuracy</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase p-3 hidden lg:table-cell">Battles Won</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((p, idx) => (
                  <motion.tr key={p.rank} {...fadeIn} transition={{ delay: idx * 0.05 }} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="p-3 pl-4 font-bold text-gray-400">#{p.rank}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-sm bg-gray-100 dark:bg-gray-700">{p.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center text-sm hidden sm:table-cell"><Badge variant="outline" className="text-xs">Lv.{p.level}</Badge></td>
                    <td className="p-3 text-center text-sm font-medium hidden md:table-cell">{p.xp.toLocaleString()}</td>
                    <td className="p-3 text-center text-sm"><span className="text-emerald-600 dark:text-emerald-400 font-semibold">{p.accuracy}%</span></td>
                    <td className="p-3 text-center text-sm hidden lg:table-cell">{p.battlesWon}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: FRIENDS TAB
  // ══════════════════════════════════════════════════════════════

  function renderFriends() {
    const onlineFriends = friends.filter(f => f.online);
    const offlineFriends = friends.filter(f => !f.online);
    return (
      <motion.div {...fadeIn} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Friends</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{friends.length} friends • {onlineFriends.length} online</p>
          </div>
        </div>

        {/* Add friend */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input placeholder="Enter friend's name..." value={friendInput} onChange={e => setFriendInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addFriend(); }} className="flex-1" />
              <Button onClick={addFriend} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
          </CardContent>
        </Card>

        {/* Online */}
        {onlineFriends.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online ({onlineFriends.length})
            </h3>
            <div className="space-y-2">
              {onlineFriends.map((f, idx) => (
                <motion.div key={f.id} {...fadeIn} transition={{ delay: idx * 0.05 }}>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-3 flex items-center gap-2 sm:gap-3">
                      <div className="relative shrink-0">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="text-lg bg-gray-100 dark:bg-gray-700">{f.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-800" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{f.name}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500 truncate">Lv.{f.level} • {f.xp.toLocaleString()} XP</div>
                      </div>
                      <Button size="sm" variant="outline" className="text-[10px] sm:text-xs border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 shrink-0" onClick={() => challengeFriendFn(f)}>
                        <Swords className="w-3 h-3 sm:mr-1" /><span className="hidden sm:inline"> Challenge</span>
                      </Button>
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-rose-500 shrink-0" onClick={() => removeFriend(f.id)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Offline */}
        {offlineFriends.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400" /> Offline ({offlineFriends.length})
            </h3>
            <div className="space-y-2">
              {offlineFriends.map((f, idx) => (
                <motion.div key={f.id} {...fadeIn} transition={{ delay: idx * 0.05 }} className="opacity-70">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-3 flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="text-lg bg-gray-100 dark:bg-gray-700 grayscale">{f.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{f.name}</div>
                        <div className="text-xs text-gray-500">Lv.{f.level} • Last seen recently</div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-rose-500" onClick={() => removeFriend(f.id)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {friends.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No friends yet</p>
            <p className="text-sm">Add friends to challenge them!</p>
          </div>
        )}

        {/* Challenge Dialog */}
        <Dialog open={challengeDialogOpen} onOpenChange={setChallengeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Challenge {challengeFriend?.name}?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12"><AvatarFallback className="text-xl">{challengeFriend?.avatar}</AvatarFallback></Avatar>
                <div>
                  <div className="font-bold">{challengeFriend?.name}</div>
                  <div className="text-sm text-gray-500">Lv.{challengeFriend?.level}</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">You'll be matched against a bot opponent in a quiz battle!</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setChallengeDialogOpen(false)}>Cancel</Button>
                <Button className="flex-1 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white" onClick={startChallengeWithFriend}>
                  <Swords className="w-4 h-4 mr-1" /> Start Battle
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: PROFILE TAB
  // ══════════════════════════════════════════════════════════════

  function renderProfile() {
    const level = getLevelForXP(profile.xp);
    const accuracy = profile.questionsAnswered > 0 ? Math.round((profile.correctAnswers / profile.questionsAnswered) * 100) : 0;
    const unlockedLevels = LEVEL_THRESHOLDS.filter(l => profile.xp >= l.xpRequired);

    return (
      <motion.div {...fadeIn} className="space-y-6">
        {/* Profile Header */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-800 h-24" />
          <CardContent className="p-6 -mt-10 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              <Avatar className="w-20 h-20 border-4 border-white dark:border-gray-800 shadow-lg">
                <AvatarFallback className="text-3xl bg-gray-100 dark:bg-gray-700">{profile.avatar}</AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left flex-1">
                {/* FIX #5: Use logged-in user's name from app store */}
                <h2 className="text-xl font-bold">{appUser?.name || profile.name}</h2>
                <div className="flex items-center gap-2 justify-center sm:justify-start mt-1">
                  <span className="text-lg">{level.badge}</span>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Level {level.level} — {level.title}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                const next = AVATARS[(AVATARS.indexOf(profile.avatar) + 1) % AVATARS.length];
                setProfile(p => ({ ...p, avatar: next }));
              }}>
                Change Avatar
              </Button>
            </div>
            <div className="mt-6">
              <XPBar xp={profile.xp} />
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Statistics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 [&>*]:min-w-0">
            <StatCard icon={<Swords className="w-4 h-4 text-rose-500" />} label="Battles Won" value={profile.battlesWon} color="bg-rose-100 dark:bg-rose-900/30" />
            <StatCard icon={<Skull className="w-4 h-4 text-gray-500" />} label="Battles Lost" value={profile.battlesLost} color="bg-gray-100 dark:bg-gray-800" />
            <StatCard icon={<Target className="w-4 h-4 text-emerald-500" />} label="Accuracy" value={accuracy} color="bg-emerald-100 dark:bg-emerald-900/30" suffix="%" />
            <StatCard icon={<Flame className="w-4 h-4 text-orange-500" />} label="Streak" value={profile.streak} color="bg-orange-100 dark:bg-orange-900/30" suffix="days" />
            <StatCard icon={<BookOpen className="w-4 h-4 text-violet-500" />} label="Questions" value={profile.questionsAnswered} color="bg-violet-100 dark:bg-violet-900/30" />
            <StatCard icon={<Gamepad2 className="w-4 h-4 text-cyan-500" />} label="Mini Games" value={profile.miniGamesPlayed} color="bg-cyan-100 dark:bg-cyan-900/30" />
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" /> Level Badges ({unlockedLevels.length}/{LEVEL_THRESHOLDS.length})
          </h3>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-3 [&>*]:min-w-0">
                {LEVEL_THRESHOLDS.map(l => {
                  const unlocked = profile.xp >= l.xpRequired;
                  return (
                    <motion.div
                      key={l.level}
                      whileHover={{ scale: 1.1 }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl ${
                        unlocked ? 'bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/10' : 'bg-gray-50 dark:bg-gray-800/50 opacity-40'
                      }`}
                    >
                      <span className="text-2xl">{l.badge}</span>
                      <span className="text-[10px] font-semibold text-center text-gray-600 dark:text-gray-400">Lv.{l.level}</span>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Title & Badge */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" /> Current Title
            </h3>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl sm:text-3xl shadow-lg shrink-0">
                {level.badge}
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold truncate">{level.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500">Level {level.level} • {profile.xp.toLocaleString()} XP</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">Next: {getNextLevel(profile.xp).xpNeeded} XP to {getNextLevel(profile.xp).xpNeeded === 0 ? 'Max Level' : `Level ${getNextLevel(profile.xp).level}`}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 min-w-0 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div {...fadeIn} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                Learn With Game
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Level up your coding skills</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Flame className="w-3 h-3 mr-1" /> {profile.streak} day streak
            </Badge>
            <Avatar className="w-8 h-8 cursor-pointer" onClick={() => setActiveTab('profile')}>
              <AvatarFallback className="text-sm bg-gray-100 dark:bg-gray-700">{profile.avatar}</AvatarFallback>
            </Avatar>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto -mx-4 px-4">
            <TabsList className="w-full min-w-0 bg-white dark:bg-gray-800/80 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 h-auto">
              {[
                { value: 'home', label: 'Home' },
                { value: 'learn', label: 'Learn' },
                { value: 'battle', label: 'Battle' },
                { value: 'minigames', label: 'Games' },
                { value: 'leaderboard', label: 'Ranks' },
                { value: 'friends', label: 'Friends' },
                { value: 'profile', label: 'Profile' },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg text-xs sm:text-sm px-3 sm:px-4 py-2 gap-1.5 transition-all"
                >
                  {TAB_ICONS[tab.value]}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="mt-4">
            <AnimatePresence mode="wait">
              <TabsContent value="home" forceMount={(activeTab === 'home') as unknown as true}>
                <AnimatePresence>{activeTab === 'home' && <motion.div {...fadeIn}>{renderHome()}</motion.div>}</AnimatePresence>
              </TabsContent>
              <TabsContent value="learn" forceMount={(activeTab === 'learn') as unknown as true}>
                <AnimatePresence>{activeTab === 'learn' && <motion.div {...fadeIn}>{renderLearn()}</motion.div>}</AnimatePresence>
              </TabsContent>
              <TabsContent value="battle" forceMount={(activeTab === 'battle') as unknown as true}>
                <AnimatePresence>{activeTab === 'battle' && <motion.div {...fadeIn}>{renderBattle()}</motion.div>}</AnimatePresence>
              </TabsContent>
              <TabsContent value="minigames" forceMount={(activeTab === 'minigames') as unknown as true}>
                <AnimatePresence>{activeTab === 'minigames' && <motion.div {...fadeIn}>{renderMiniGames()}</motion.div>}</AnimatePresence>
              </TabsContent>
              <TabsContent value="leaderboard" forceMount={(activeTab === 'leaderboard') as unknown as true}>
                <AnimatePresence>{activeTab === 'leaderboard' && <motion.div {...fadeIn}>{renderLeaderboard()}</motion.div>}</AnimatePresence>
              </TabsContent>
              <TabsContent value="friends" forceMount={(activeTab === 'friends') as unknown as true}>
                <AnimatePresence>{activeTab === 'friends' && <motion.div {...fadeIn}>{renderFriends()}</motion.div>}</AnimatePresence>
              </TabsContent>
              <TabsContent value="profile" forceMount={(activeTab === 'profile') as unknown as true}>
                <AnimatePresence>{activeTab === 'profile' && <motion.div {...fadeIn}>{renderProfile()}</motion.div>}</AnimatePresence>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

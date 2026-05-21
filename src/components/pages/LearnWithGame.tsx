'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Home, ChevronLeft, Zap, Star, Trophy, Clock, X, Check, RotateCcw,
  Play, ArrowRight, Award, Crown, Sparkles, Target, Swords, Shield, Heart,
  Volume2, VolumeX, Timer,
} from 'lucide-react';
import { useAppStore } from '@/store/app';
import {
  ALL_GAMES, CATEGORY_INFO, CATEGORY_ORDER, getGameById,
  getGamesByCategory, searchGames, getFeaturedGames, getPopularGames,
  type GameDefinition, type GameCategory,
} from '@/lib/games-data';
import {
  QUIZ_BANKS, MEMORY_BANKS, TYPING_BANKS, REACTION_BANKS,
  WORD_BANKS, DEFAULT_QUIZ_BANK, DEFAULT_MEMORY_BANK, DEFAULT_TYPING_BANK,
  DEFAULT_REACTION_BANK, DEFAULT_WORD_BANK,
  generateMathProblems, generatePatternSequences, shuffleArray,
  type QuizQuestion, type MemoryPair, type TypingSnippet, type ReactionChallenge,
  type MathProblem, type WordPuzzle, type PatternSequence,
} from '@/lib/games/game-banks';
import { playCorrectSound, playWrongSound, playClickSound, playVictorySound, playTickSound } from '@/lib/games/sounds';
import { AnimatedCounter } from '@/components/pu-helpers';

// ══════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════
type View = 'hub' | 'game' | 'leaderboard';

// ══════════════════════════════════════════════════════════════
// MAIN LEARN WITH GAME COMPONENT
// ══════════════════════════════════════════════════════════════
export default function LearnWithGame() {
  const { user, setPage } = useAppStore();
  const [view, setView] = useState<View>('hub');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  const openGame = useCallback((gameId: string) => {
    playClickSound();
    setActiveGameId(gameId);
    setView('game');
  }, []);

  const goBackToHub = useCallback(() => {
    playClickSound();
    setView('hub');
    setActiveGameId(null);
  }, []);

  const goBackToApp = useCallback(() => {
    playClickSound();
    setPage('dashboard');
  }, [setPage]);

  return (
    <div className="min-h-full">
      <AnimatePresence mode="wait">
        {view === 'hub' && <GameHub key="hub" onPlay={openGame} onLeaderboard={() => setView('leaderboard')} />}
        {view === 'game' && activeGameId && (
          <GamePlayerWrapper key={activeGameId} gameId={activeGameId} onBack={goBackToHub} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// GAME HUB - Catalog
// ══════════════════════════════════════════════════════════════
function GameHub({ onPlay, onLeaderboard }: { onPlay: (id: string) => void; onLeaderboard: () => void }) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<GameCategory | 'all'>('all');
  const { setPage } = useAppStore();
  const appUser = useAppStore(s => s.user);

  const filteredGames = useMemo(() => {
    let games = search ? searchGames(search) : ALL_GAMES;
    if (selectedCat !== 'all') games = games.filter(g => g.category === selectedCat);
    return games;
  }, [search, selectedCat]);

  const featured = useMemo(() => getFeaturedGames(), []);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setPage('dashboard')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Learn With Games</h1>
            <p className="text-xs text-muted-foreground">{ALL_GAMES.length} games available</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
            <Zap className="w-3 h-3 mr-1" />450 XP
          </Badge>
        </div>
      </div>

      {/* Search & Category Filters */}
      <div className="mb-6 space-y-3">
        <Input
          placeholder="Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 bg-background"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Button size="sm" variant={selectedCat === 'all' ? 'default' : 'outline'}
            className="shrink-0 h-8 text-xs rounded-full px-4" onClick={() => setSelectedCat('all')}>
            All ({ALL_GAMES.length})
          </Button>
          {CATEGORY_ORDER.map(cat => {
            const info = CATEGORY_INFO[cat];
            const count = getGamesByCategory(cat).length;
            return (
              <Button key={cat} size="sm" variant={selectedCat === cat ? 'default' : 'outline'}
                className={`shrink-0 h-8 text-xs rounded-full px-4 ${selectedCat === cat ? '' : 'border-dashed'}`}
                onClick={() => setSelectedCat(cat)}>
                {info.icon} {info.label} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Featured Games */}
      {!search && selectedCat === 'all' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />Featured
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {featured.map(g => <GameCard key={g.id} game={g} onClick={() => onPlay(g.id)} />)}
          </div>
        </div>
      )}

      {/* All Games Grid */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {selectedCat === 'all' ? 'All Games' : CATEGORY_INFO[selectedCat].label}
        </h3>
        {filteredGames.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No games found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredGames.map(g => <GameCard key={g.id} game={g} onClick={() => onPlay(g.id)} />)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// GAME CARD
// ══════════════════════════════════════════════════════════════
function GameCard({ game, onClick }: { game: GameDefinition; onClick: () => void }) {
  const diffColors = { EASY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', HARD: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' };
  return (
    <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Card className="overflow-hidden border shadow-sm hover:shadow-lg transition-all cursor-pointer h-full" onClick={onClick}>
        <div className={`relative h-20 bg-gradient-to-br ${CATEGORY_INFO[game.category].bgColor} flex items-center justify-center`}>
          <span className="text-3xl">{game.icon}</span>
          {game.isNew && <Badge className="absolute top-2 right-2 bg-white/20 text-white text-[9px] px-1.5 border-0 backdrop-blur-sm">NEW</Badge>}
        </div>
        <CardContent className="p-3">
          <h3 className="font-bold text-xs sm:text-sm truncate">{game.name}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{game.description}</p>
          <div className="flex items-center justify-between mt-2">
            <Badge className={`text-[9px] px-1.5 py-0 border-0 ${diffColors[game.difficulty]}`}>{game.difficulty}</Badge>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">+{game.xpReward} XP</Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// GAME PLAYER WRAPPER - Routes to correct engine
// ══════════════════════════════════════════════════════════════
function GamePlayerWrapper({ gameId, onBack }: { gameId: string; onBack: () => void }) {
  const game = getGameById(gameId);
  if (!game) return <div className="text-center py-12"><p>Game not found</p></div>;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <GameHeader game={game} onBack={onBack} />
      {game.engine === 'quiz' && <QuizGameEngine gameId={game.id} game={game} />}
      {game.engine === 'memory' && <MemoryGameEngine gameId={game.id} game={game} />}
      {game.engine === 'typing' && <TypingGameEngine gameId={game.id} game={game} />}
      {game.engine === 'reaction' && <ReactionGameEngine gameId={game.id} game={game} />}
      {game.engine === 'math' && <MathGameEngine gameId={game.id} game={game} />}
      {game.engine === 'word' && <WordGameEngine gameId={game.id} game={game} />}
      {game.engine === 'pattern' && <PatternGameEngine gameId={game.id} game={game} />}
      {(game.engine === 'battle' || game.engine === 'puzzle' || game.engine === 'creative' || game.engine === 'logic' || game.engine === 'music') && (
        <QuizGameEngine gameId={game.id} game={game} />
      )}
    </motion.div>
  );
}

function GameHeader({ game, onBack }: { game: GameDefinition; onBack: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4 gap-2">
      <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
        <ChevronLeft className="w-4 h-4 mr-1" />Back
      </Button>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg">{game.icon}</span>
        <div className="min-w-0">
          <h2 className="font-bold text-sm truncate">{game.name}</h2>
          <p className="text-[10px] text-muted-foreground truncate">{game.description}</p>
        </div>
      </div>
      <Badge variant="secondary" className="shrink-0 text-[10px]">
        <Zap className="w-3 h-3 mr-1" />+{game.xpReward} XP
      </Badge>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// QUIZ GAME ENGINE
// ══════════════════════════════════════════════════════════════
function QuizGameEngine({ gameId, game }: { gameId: string; game: GameDefinition }) {
  const [questions] = useState<QuizQuestion[]>(() => {
    const bank = QUIZ_BANKS[gameId] || DEFAULT_QUIZ_BANK;
    return shuffleArray(bank).slice(0, 8);
  });
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [timer, setTimer] = useState(15);
  const [soundOn, setSoundOn] = useState(true);

  const q = questions[qi];

  useEffect(() => {
    if (done || revealed || !q) return;
    const t = setTimeout(() => {
      setTimer(t => {
        const next = t - 1;
        if (next <= 0) { setRevealed(true); return 0; }
        if (soundOn && next <= 3) playTickSound();
        return next;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [timer, done, revealed, q, soundOn]);

  const handleAnswer = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (idx === q.correctIndex) {
      setScore(s => s + q.points || 10);
      setCorrect(c => c + 1);
      if (soundOn) playCorrectSound();
    } else {
      if (soundOn) playWrongSound();
    }
  };

  const next = () => {
    if (qi + 1 >= questions.length) {
      setDone(true);
      if (soundOn && correct >= questions.length / 2) playVictorySound();
    } else {
      setQi(i => i + 1);
      setSelected(null);
      setRevealed(false);
      setTimer(15);
    }
  };

  if (done) {
    const pct = Math.round((correct / questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
          {pct >= 70 ? '🏆' : pct >= 40 ? '👍' : '💪'}
        </motion.div>
        <h3 className="text-2xl font-bold mt-4">{pct >= 70 ? 'Excellent!' : pct >= 40 ? 'Good Try!' : 'Keep Practicing!'}</h3>
        <p className="text-muted-foreground mt-1">{correct} / {questions.length} correct</p>
        <div className="flex gap-4 mt-6">
          <div className="text-center"><div className="text-2xl font-bold text-amber-500">{score}</div><div className="text-xs text-muted-foreground">Score</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-emerald-500">{pct}%</div><div className="text-xs text-muted-foreground">Accuracy</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-primary">+{correct * game.xpReward / questions.length | 0}</div><div className="text-xs text-muted-foreground">XP Earned</div></div>
        </div>
        <Button className="mt-6" onClick={() => { setQi(0); setSelected(null); setRevealed(false); setScore(0); setCorrect(0); setDone(false); setTimer(15); }}>
          <RotateCcw className="w-4 h-4 mr-2" />Play Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress & Timer */}
      <div className="flex items-center justify-between">
        <Progress value={((qi) / questions.length) * 100} className="flex-1 mr-4 h-2" />
        <div className={`flex items-center gap-1 text-sm font-bold ${timer <= 3 ? 'text-rose-500' : 'text-foreground'}`}>
          <Clock className="w-4 h-4" />{timer}
        </div>
        <Button variant="ghost" size="icon" className="ml-2 h-8 w-8" onClick={() => setSoundOn(!soundOn)}>
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">Question {qi + 1} of {questions.length} | Score: {score}</div>

      {/* Question */}
      <Card className="p-4 sm:p-6">
        {q.codeSnippet && (
          <pre className="text-xs bg-muted rounded-lg p-3 mb-4 overflow-x-auto font-mono">{q.codeSnippet}</pre>
        )}
        <h3 className="font-bold text-base sm:text-lg">{q.question}</h3>
        <div className="grid gap-3 mt-4">
          {q.options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            let bg = 'bg-card border-border hover:border-primary/50';
            if (revealed && idx === q.correctIndex) bg = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-300';
            if (revealed && selected === idx && idx !== q.correctIndex) bg = 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-700 dark:text-rose-300';
            return (
              <motion.button key={idx} whileHover={!revealed ? { scale: 1.01 } : {}} whileTap={!revealed ? { scale: 0.99 } : {}}
                onClick={() => handleAnswer(idx)} disabled={revealed}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${bg} ${revealed ? 'cursor-default' : 'cursor-pointer'}`}>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${revealed && idx === q.correctIndex ? 'bg-emerald-500 text-white' : revealed && selected === idx ? 'bg-rose-500 text-white' : 'bg-muted'}`}>
                  {revealed && idx === q.correctIndex ? <Check className="w-3.5 h-3.5" /> : revealed && selected === idx ? <X className="w-3.5 h-3.5" /> : letter}
                </span>
                <span className="text-sm">{opt}</span>
              </motion.button>
            );
          })}
        </div>
      </Card>

      {revealed && (
        <Button className="w-full" onClick={next}>
          {qi + 1 >= questions.length ? 'See Results' : 'Next Question'} <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MEMORY GAME ENGINE
// ══════════════════════════════════════════════════════════════
function MemoryGameEngine({ gameId, game }: { gameId: string; game: GameDefinition }) {
  const [pairs] = useState<MemoryPair[]>(() => {
    const bank = MEMORY_BANKS[gameId] || DEFAULT_MEMORY_BANK;
    return shuffleArray(bank).slice(0, 6);
  });
  const [cardResetKey, setCardResetKey] = useState(0);
  const initialCards = useMemo(() => {
    const c: { id: string; pairId: string; content: string; type: 'left' | 'right'; flipped: boolean; matched: boolean }[] = [];
    pairs.forEach(p => {
      c.push({ id: p.id + '-l', pairId: p.id, content: p.left, type: 'left', flipped: false, matched: false });
      c.push({ id: p.id + '-r', pairId: p.id, content: p.right, type: 'right', flipped: false, matched: false });
    });
    return shuffleArray(c);
  }, [pairs, cardResetKey]);
  const [cards, setCards] = useState(initialCards);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [checking, setChecking] = useState(false);
  const [matched, setMatched] = useState(0);
  const [timer, setTimer] = useState(60);
  const [soundOn, setSoundOn] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => {
      setTimer(t => {
        if (t - 1 <= 0) { setDone(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [timer, done]);

  const handleFlip = (id: string) => {
    if (checking || done) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched || flipped.length >= 2) return;
    if (soundOn) playClickSound();
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    setCards(cs => cs.map(c => c.id === id ? { ...c, flipped: true } : c));

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const c1 = cards.find(c => c.id === newFlipped[0])!;
      const c2 = cards.find(c => c.id === newFlipped[1])!;
      if (c1.pairId === c2.pairId && c1.type !== c2.type) {
        setChecking(true);
        setTimeout(() => {
          setCards(cs => cs.map(c => c.pairId === c1.pairId ? { ...c, matched: true } : c));
          setFlipped([]);
          setChecking(false);
          const newMatched = matched + 1;
          setMatched(newMatched);
          if (soundOn) playCorrectSound();
          if (newMatched >= pairs.length) {
            setDone(true);
            if (soundOn) playVictorySound();
          }
        }, 500);
      } else {
        setChecking(true);
        if (soundOn) playWrongSound();
        setTimeout(() => {
          setCards(cs => cs.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
          setFlipped([]);
          setChecking(false);
        }, 800);
      }
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-5xl mb-4">🏆</motion.div>
        <h3 className="text-2xl font-bold">Completed!</h3>
        <p className="text-muted-foreground mt-1">{moves} moves | {timer}s remaining</p>
        <Badge className="mt-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">+{game.xpReward} XP</Badge>
        <Button className="mt-6" onClick={() => { setFlipped([]); setMoves(0); setChecking(false); setMatched(0); setTimer(60); setDone(false); setCardResetKey(k => k + 1); }}>
          <RotateCcw className="w-4 h-4 mr-2" />Play Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{matched}/{pairs.length} matched</div>
        <div className="text-sm font-medium">{moves} moves</div>
        <div className="flex items-center gap-2">
          <div className={`text-sm font-bold ${timer <= 10 ? 'text-rose-500' : ''}`}>{timer}s</div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSoundOn(!soundOn)}>
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
        {cards.map(card => (
          <motion.button key={card.id} whileHover={!card.flipped && !card.matched ? { scale: 1.05 } : {}} whileTap={!card.flipped ? { scale: 0.95 } : {}}
            onClick={() => handleFlip(card.id)}
            className={`aspect-square rounded-xl text-sm font-medium flex items-center justify-center p-2 transition-all ${card.matched ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300' : card.flipped ? 'bg-primary/10 border-2 border-primary/50' : 'bg-card border-2 border-border hover:border-primary/30 cursor-pointer'}`}>
            {card.flipped || card.matched ? (
              <span className="text-center text-xs sm:text-sm break-all">{card.content}</span>
            ) : (
              <span className="text-2xl">?</span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TYPING GAME ENGINE
// ══════════════════════════════════════════════════════════════
function TypingGameEngine({ gameId, game }: { gameId: string; game: GameDefinition }) {
  const [snippets] = useState<TypingSnippet[]>(() => TYPING_BANKS[gameId] || DEFAULT_TYPING_BANK);
  const [snippet, setSnippet] = useState<TypingSnippet>(() => snippets[Math.floor(Math.random() * snippets.length)]);
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const accuracy = snippet.code.length > 0 ? Math.round((input.split('').filter((c, i) => c === snippet.code[i]).length / input.length) * 100) : 100;

  const restart = () => {
    setSnippet(snippets[Math.floor(Math.random() * snippets.length)]);
    setInput('');
    setStartTime(null);
    setFinished(false);
    setWpm(0);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">{snippet.language}</Badge>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">Accuracy: {accuracy}%</Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSoundOn(!soundOn)}>
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-muted/50">
        <div className="font-mono text-sm whitespace-pre-wrap break-all leading-relaxed">
          {snippet.code.split('').map((char, i) => {
            let color = 'text-muted-foreground';
            if (i < input.length) {
              color = input[i] === char ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30';
            }
            return <span key={i} className={color}>{char}</span>;
          })}
        </div>
      </Card>

      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => {
          const v = e.target.value;
          if (!startTime && v.length > 0) setStartTime(Date.now());
          setInput(v);
          if (soundOn && v.length > input.length) playClickSound();
          if (v === snippet.code && !finished) {
            setFinished(true);
            if (startTime) {
              const elapsed = (Date.now() - startTime) / 1000;
              const words = snippet.code.length / 5;
              setWpm(Math.round(words / elapsed * 60));
            }
            if (soundOn) playVictorySound();
          }
        }}
        disabled={finished}
        placeholder={finished ? 'Completed!' : 'Start typing here...'}
        className="w-full h-28 p-4 rounded-xl bg-card border-2 border-border focus:border-primary font-mono text-sm resize-none"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />

      {finished && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
          <div className="text-4xl mb-2">⌨️</div>
          <h3 className="text-xl font-bold">{wpm} WPM</h3>
          <p className="text-muted-foreground">{accuracy}% accuracy</p>
          <Badge className="mt-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">+{Math.min(wpm, game.xpReward)} XP</Badge>
        </motion.div>
      )}

      <Button className="w-full" onClick={restart}>
        <RotateCcw className="w-4 h-4 mr-2" />New Snippet
      </Button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// REACTION GAME ENGINE
// ══════════════════════════════════════════════════════════════
function ReactionGameEngine({ gameId, game }: { gameId: string; game: GameDefinition }) {
  const [challenges] = useState<ReactionChallenge[]>(() => {
    const bank = REACTION_BANKS[gameId] || DEFAULT_REACTION_BANK;
    return shuffleArray(bank).slice(0, 10);
  });
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [timer, setTimer] = useState(5);
  const [soundOn, setSoundOn] = useState(true);

  const c = challenges[qi];

  useEffect(() => {
    if (done || !c || selected !== null) return;
    const t = setTimeout(() => {
      setTimer(t => {
        if (t - 1 <= 0) { setSelected(-1); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [timer, done, selected, c]);

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === c.correctIndex) { setScore(s => s + 10); setCorrect(co => co + 1); if (soundOn) playCorrectSound(); }
    else { if (soundOn) playWrongSound(); }
    setTimeout(() => {
      if (qi + 1 >= challenges.length) { setDone(true); if (soundOn) playVictorySound(); }
      else { setQi(i => i + 1); setSelected(null); setTimer(challenges[qi + 1]?.timeLimit || 5); }
    }, 600);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-5xl mb-4">⚡</motion.div>
        <h3 className="text-2xl font-bold">Round Complete!</h3>
        <p className="text-muted-foreground mt-1">{correct}/{challenges.length} correct | Score: {score}</p>
        <Badge className="mt-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">+{score} XP</Badge>
        <Button className="mt-6" onClick={() => { setQi(0); setScore(0); setCorrect(0); setDone(false); setSelected(null); setTimer(5); }}>
          <RotateCcw className="w-4 h-4 mr-2" />Play Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Progress value={((qi) / challenges.length) * 100} className="flex-1 mr-4 h-2" />
        <div className={`text-sm font-bold ${timer <= 2 ? 'text-rose-500 animate-pulse' : ''}`}>{timer}s</div>
        <Button variant="ghost" size="icon" className="ml-2 h-8 w-8" onClick={() => setSoundOn(!soundOn)}>
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
      </div>

      <Card className="p-6 text-center">
        <div className="text-3xl mb-3">{game.icon}</div>
        <h3 className="font-bold text-lg whitespace-pre-wrap">{c.prompt}</h3>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {c.options.map((opt, idx) => (
            <motion.button key={idx} whileHover={selected === null ? { scale: 1.03 } : {}} whileTap={selected === null ? { scale: 0.97 } : {}}
              onClick={() => handleAnswer(idx)}
              className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${selected !== null && idx === c.correctIndex ? 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700' : selected === idx && idx !== c.correctIndex ? 'bg-rose-100 dark:bg-rose-900/20 border-rose-500 text-rose-700' : 'bg-card border-border hover:border-primary/50'}`}>
              {opt}
            </motion.button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MATH GAME ENGINE
// ══════════════════════════════════════════════════════════════
function MathGameEngine({ gameId, game }: { gameId: string; game: GameDefinition }) {
  const [problems] = useState<MathProblem[]>(() => generateMathProblems(8, game.difficulty === 'EASY' ? 'easy' : game.difficulty === 'MEDIUM' ? 'medium' : 'hard'));
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const p = problems[qi];

  const handleAnswer = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (p.options[idx] === p.answer) { setScore(s => s + 10); setCorrect(c => c + 1); if (soundOn) playCorrectSound(); }
    else { if (soundOn) playWrongSound(); }
  };

  const next = () => {
    if (qi + 1 >= problems.length) { setDone(true); if (soundOn) playVictorySound(); }
    else { setQi(i => i + 1); setSelected(null); setRevealed(false); }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-5xl mb-4">🔢</motion.div>
        <h3 className="text-2xl font-bold">Math Complete!</h3>
        <p className="text-muted-foreground mt-1">{correct}/{problems.length} correct | Score: {score}</p>
        <Badge className="mt-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">+{score} XP</Badge>
        <Button className="mt-6" onClick={() => { setQi(0); setSelected(null); setRevealed(false); setScore(0); setCorrect(0); setDone(false); }}>
          <RotateCcw className="w-4 h-4 mr-2" />Play Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Progress value={((qi) / problems.length) * 100} className="flex-1 mr-4 h-2" />
        <Badge variant="outline" className="text-xs">{qi + 1}/{problems.length}</Badge>
      </div>
      <Card className="p-6 sm:p-8 text-center">
        <div className="text-4xl mb-2">🔢</div>
        <h3 className="text-2xl sm:text-3xl font-bold font-mono">{p.question}</h3>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {p.options.map((opt, idx) => (
            <motion.button key={idx} whileHover={!revealed ? { scale: 1.03 } : {}} whileTap={!revealed ? { scale: 0.97 } : {}}
              onClick={() => handleAnswer(idx)}
              className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${revealed && opt === p.answer ? 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700' : revealed && selected === idx ? 'bg-rose-100 dark:bg-rose-900/20 border-rose-500 text-rose-700' : 'bg-card border-border hover:border-primary/50'}`}>
              {opt}
            </motion.button>
          ))}
        </div>
      </Card>
      {revealed && <Button className="w-full" onClick={next}>{qi + 1 >= problems.length ? 'See Results' : 'Next'} <ArrowRight className="w-4 h-4 ml-2" /></Button>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// WORD GAME ENGINE (Wordle-style)
// ══════════════════════════════════════════════════════════════
function WordGameEngine({ gameId, game }: { gameId: string; game: GameDefinition }) {
  const [wordBank] = useState<WordPuzzle[]>(() => WORD_BANKS[gameId] || DEFAULT_WORD_BANK);
  const [puzzle] = useState(() => wordBank[Math.floor(Math.random() * wordBank.length)]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const maxGuesses = 6;

  const handleGuess = () => {
    if (currentGuess.length !== puzzle.word.length || done) return;
    const newGuesses = [...guesses, currentGuess.toUpperCase()];
    setGuesses(newGuesses);
    if (currentGuess.toUpperCase() === puzzle.word) {
      setDone(true); setWon(true); if (soundOn) playVictorySound();
    } else if (newGuesses.length >= maxGuesses) {
      setDone(true); setWon(false);
    } else {
      if (soundOn) playWrongSound();
    }
    setCurrentGuess('');
  };

  const getCharStatus = (char: string, index: number, guess: string) => {
    if (char === puzzle.word[index]) return 'correct';
    if (puzzle.word.includes(char)) return 'present';
    return 'absent';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">{puzzle.category}</Badge>
        <p className="text-xs text-muted-foreground">{puzzle.hint}</p>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSoundOn(!soundOn)}>
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex flex-col items-center gap-2">
        {Array.from({ length: maxGuesses }, (_, row) => {
          const guess = guesses[row];
          return (
            <div key={row} className="flex gap-1.5">
              {Array.from({ length: puzzle.word.length }, (_, col) => {
                const char = guess ? guess[col] : (row === guesses.length && currentGuess[col]) || '';
                const status = guess ? getCharStatus(char, col, guess) : 'empty';
                const bg = status === 'correct' ? 'bg-emerald-500 text-white' : status === 'present' ? 'bg-amber-500 text-white' : status === 'absent' ? 'bg-gray-600 text-white' : 'bg-muted border border-border';
                return (
                  <motion.div key={col} initial={guess ? { scale: 0, rotateY: 90 } : {}} animate={{ scale: 1, rotateY: 0 }}
                    transition={{ delay: col * 0.1, duration: 0.2 }}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-bold text-lg ${bg}`}>
                    {char}
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>

      {!done && (
        <div className="flex gap-2">
          <Input value={currentGuess} onChange={(e) => setCurrentGuess(e.target.value.toUpperCase().slice(0, puzzle.word.length))}
            placeholder={`Type ${puzzle.word.length} letters`} className="text-center font-bold tracking-[0.3em] uppercase" maxLength={puzzle.word.length}
            onKeyDown={(e) => e.key === 'Enter' && handleGuess()} />
          <Button onClick={handleGuess} disabled={currentGuess.length !== puzzle.word.length}>Go</Button>
        </div>
      )}

      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
          <div className="text-4xl mb-2">{won ? '🏆' : '😔'}</div>
          <h3 className="text-xl font-bold">{won ? 'Correct!' : `The word was: ${puzzle.word}`}</h3>
          <p className="text-muted-foreground mt-1">{won ? `Solved in ${guesses.length} tries` : 'Better luck next time!'}</p>
          <Button className="mt-4" onClick={() => { setGuesses([]); setCurrentGuess(''); setDone(false); setWon(false); }}>
            <RotateCcw className="w-4 h-4 mr-2" />New Word
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PATTERN GAME ENGINE
// ══════════════════════════════════════════════════════════════
function PatternGameEngine({ gameId, game }: { gameId: string; game: GameDefinition }) {
  const [sequences] = useState<PatternSequence[]>(() => generatePatternSequences(8));
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const seq = sequences[qi];

  const handleAnswer = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (seq.options[idx] === seq.answer) { setScore(s => s + 10); setCorrect(c => c + 1); if (soundOn) playCorrectSound(); }
    else { if (soundOn) playWrongSound(); }
  };

  const next = () => {
    if (qi + 1 >= sequences.length) { setDone(true); if (soundOn) playVictorySound(); }
    else { setQi(i => i + 1); setSelected(null); setRevealed(false); }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-5xl mb-4">🔮</motion.div>
        <h3 className="text-2xl font-bold">Pattern Master!</h3>
        <p className="text-muted-foreground mt-1">{correct}/{sequences.length} correct</p>
        <Badge className="mt-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">+{score} XP</Badge>
        <Button className="mt-6" onClick={() => { setQi(0); setSelected(null); setRevealed(false); setScore(0); setCorrect(0); setDone(false); }}>
          <RotateCcw className="w-4 h-4 mr-2" />Play Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Progress value={((qi) / sequences.length) * 100} className="flex-1 mr-4 h-2" />
        <Badge variant="outline" className="text-xs">{qi + 1}/{sequences.length}</Badge>
      </div>
      <Card className="p-6 text-center">
        <h3 className="text-sm text-muted-foreground mb-2">What comes next?</h3>
        <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
          {seq.sequence.map((item, idx) => (
            <div key={idx} className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center font-bold text-sm border">{item}</div>
          ))}
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border-2 border-dashed border-primary/30">?</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {seq.options.map((opt, idx) => (
            <motion.button key={idx} whileHover={!revealed ? { scale: 1.03 } : {}} onClick={() => handleAnswer(idx)}
              className={`p-3 rounded-xl border-2 font-bold transition-all ${revealed && opt === seq.answer ? 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700' : revealed && selected === idx ? 'bg-rose-100 dark:bg-rose-900/20 border-rose-500 text-rose-700' : 'bg-card border-border hover:border-primary/50'}`}>
              {opt}
            </motion.button>
          ))}
        </div>
      </Card>
      {revealed && seq.hint && <p className="text-xs text-muted-foreground text-center">💡 {seq.hint}</p>}
      {revealed && <Button className="w-full" onClick={next}>{qi + 1 >= sequences.length ? 'See Results' : 'Next'} <ArrowRight className="w-4 h-4 ml-2" /></Button>}
    </div>
  );
}

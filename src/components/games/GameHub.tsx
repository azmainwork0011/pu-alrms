'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronLeft, Gamepad2, Zap, Star, Flame, Swords, Sparkles, Users, SlidersHorizontal,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GAMES, GAME_CATEGORIES, type GameCategory, type GameDefinition, searchGames, getGamesByCategory } from '@/lib/games-data';
import { diffColors } from '@/components/games/GameShared';
import { useAppStore } from '@/store/app';
import { LEVEL_THRESHOLDS, getLevelForXP, getNextLevel, getTodayChallenge } from '@/lib/cq-data';
import { AnimatedCounter } from '@/components/pu-helpers';

interface GameHubProps {
  onSelectGame: (gameId: string) => void;
}

export default function GameHub({ onSelectGame }: GameHubProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const goBack = useAppStore(s => s.goBack);

  const filteredGames = useMemo(() => {
    let games = activeCategory === 'all' ? GAMES : getGamesByCategory(activeCategory as GameCategory);
    if (searchQuery.trim()) {
      games = searchGames(searchQuery);
    }
    return games;
  }, [activeCategory, searchQuery]);

  const categories = GAME_CATEGORIES;
  const totalGames = GAMES.length;
  const totalPlays = GAMES.reduce((sum, g) => sum + g.playsCount, 0);

  return (
    <div className="space-y-5">
      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-white dark:bg-gray-800/50"
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0 h-10" onClick={goBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Category Tabs */}
      <ScrollArea className="w-full -mx-1" horizontal>
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="bg-gray-100 dark:bg-gray-800/50 h-auto p-1 flex-wrap w-full gap-1">
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id}
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm px-3 py-1.5 text-xs rounded-lg">
                <span className="mr-1">{cat.icon}</span>
                <span className="hidden sm:inline">{cat.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </ScrollArea>

      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{filteredGames.length} games found</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Gamepad2 className="w-3 h-3" />{totalGames} total</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(totalPlays / 1000).toFixed(0)}K plays</span>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <AnimatePresence mode="popLayout">
          {filteredGames.map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.5) }}
              layout
            >
              <Card
                className="overflow-hidden border border-gray-200 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-all cursor-pointer h-full group"
                onClick={() => onSelectGame(game.id)}
              >
                <div className={`relative h-24 sm:h-28 bg-gradient-to-br ${categories.find(c => c.id === game.category)?.color || 'from-gray-500 to-gray-600'} p-3 flex items-center justify-center`}>
                  <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform">{game.icon}</span>
                  <div className="absolute top-2 right-2 flex gap-1">
                    {game.isNew && <Badge className="bg-white/90 text-[10px] px-1.5 py-0 text-emerald-700 font-bold">NEW</Badge>}
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <Badge className={`text-[10px] px-1.5 py-0 ${diffColors[game.difficulty]}`}>{game.difficulty}</Badge>
                  </div>
                </div>
                <CardContent className="p-2.5 sm:p-3">
                  <h3 className="font-bold text-xs sm:text-sm truncate">{game.name}</h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{game.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-[10px] text-gray-500">{game.rating}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{game.xpReward} XP</Badge>
                  </div>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {game.tags.slice(0, 2).map(t => (
                      <Badge key={t} variant="outline" className="text-[9px] px-1 py-0">{t}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredGames.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="text-5xl mb-3">🔍</div>
          <h3 className="font-bold text-lg">No games found</h3>
          <p className="text-sm text-gray-500 mt-1">Try a different search or category</p>
          <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}>Clear Filters</Button>
        </motion.div>
      )}
    </div>
  );
}

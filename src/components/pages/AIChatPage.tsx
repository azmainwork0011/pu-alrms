'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppStore } from '@/store/app';
import { aiApi } from '@/lib/api';
import { getInitials } from '@/components/pu-helpers';
import {
  Send, Trash2, Copy, Camera, Search, Check, Zap, ArrowLeft,
  Swords, ThumbsUp, Download, BrainCircuit,
  Sparkles, Cpu, Eye, Bot, RefreshCw, Wand2, CheckCircle2,
  ChevronRight, Rocket, Gem, Bolt, GraduationCap as GradCap,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// ─── AI Model Definitions (must match backend) ──────────────
const AI_MODELS = [
  { id: 'gpt4o', name: 'GPT-4o', provider: 'OpenAI', desc: 'Advanced reasoning & creative problem-solving', tag: 'General', icon: BrainCircuit, gradient: 'from-emerald-500 to-teal-600', tagBg: 'bg-emerald-100 dark:bg-emerald-900/30', tagText: 'text-emerald-700 dark:text-emerald-300' },
  { id: 'claude-35', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', desc: 'Nuanced understanding & academic writing excellence', tag: 'Writing', icon: Sparkles, gradient: 'from-orange-500 to-amber-600', tagBg: 'bg-orange-100 dark:bg-orange-900/30', tagText: 'text-orange-700 dark:text-orange-300' },
  { id: 'gemini-15', name: 'Gemini 1.5 Pro', provider: 'Google', desc: 'Large context & comprehensive explanations', tag: 'Research', icon: Gem, gradient: 'from-blue-500 to-cyan-600', tagBg: 'bg-blue-100 dark:bg-blue-900/30', tagText: 'text-blue-700 dark:text-blue-300' },
  { id: 'llama-31', name: 'LLaMA 3.1 405B', provider: 'Meta', desc: 'Open-source power & technical precision', tag: 'Technical', icon: Cpu, gradient: 'from-violet-500 to-purple-600', tagBg: 'bg-violet-100 dark:bg-violet-900/30', tagText: 'text-violet-700 dark:text-violet-300' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral AI', desc: 'Efficient & elegant multilingual reasoning', tag: 'Efficient', icon: Zap, gradient: 'from-rose-500 to-pink-600', tagBg: 'bg-rose-100 dark:bg-rose-900/30', tagText: 'text-rose-700 dark:text-rose-300' },
  { id: 'gpt5', name: 'GPT-5', provider: 'OpenAI', desc: 'Next-gen deep reasoning & cutting-edge knowledge', tag: 'Advanced', icon: Rocket, gradient: 'from-cyan-500 to-sky-600', tagBg: 'bg-cyan-100 dark:bg-cyan-900/30', tagText: 'text-cyan-700 dark:text-cyan-300' },
  { id: 'claude-4', name: 'Claude 4 Opus', provider: 'Anthropic', desc: 'Deep research mastery & analytical writing', tag: 'Research', icon: GradCap, gradient: 'from-amber-500 to-yellow-600', tagBg: 'bg-amber-100 dark:bg-amber-900/30', tagText: 'text-amber-700 dark:text-amber-300' },
  { id: 'gemini-2', name: 'Gemini 2.0 Flash', provider: 'Google', desc: 'Lightning fast & balanced intelligent responses', tag: 'Fast', icon: Bolt, gradient: 'from-teal-500 to-emerald-600', tagBg: 'bg-teal-100 dark:bg-teal-900/30', tagText: 'text-teal-700 dark:text-teal-300' },
];

type Tab = 'chat' | 'battle' | 'image';
type ChatPhase = 'select' | 'chatting'; // for single mode
type BattlePhase = 'select' | 'compare'; // for battle mode

interface ChatMessage {
  id: string; role: 'user' | 'assistant'; content: string;
  generatedImage?: string; image?: string; timestamp: number;
  modelName?: string; modelId?: string;
  battleResponses?: { label: string; content: string }[];
  battleId?: string; votedLabel?: string;
  battleReveals?: Record<string, { name: string; provider: string; id: string }>;
}

function AIChatPage() {
  const [tab, setTab] = useState<Tab>('chat');
  const [chatPhase, setChatPhase] = useState<ChatPhase>('select');
  const [battlePhase, setBattlePhase] = useState<BattlePhase>('select');
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const [battleModels, setBattleModels] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanPreview, setScanPreview] = useState<{ dataUrl: string; file: File } | null>(null);
  const [scanQ, setScanQ] = useState('');
  const [scanLoading, setScanLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLInputElement>(null);
  const { user } = useAppStore();
  const gid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const scroll = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight, behavior: 'smooth' }), 100);
  }, []);
  useEffect(() => { scroll(); }, [messages, loading, imageLoading, scroll]);

  // Listen for auth-expired events (token expired) and show message in chat
  useEffect(() => {
    const handleAuthExpired = () => {
      setLoading(false);
      setImageLoading(false);
      setScanLoading(false);
      setMessages(p => [...p, {
        id: gid(), role: 'assistant',
        content: '⚠️ Your session has expired. Please sign in again to continue chatting.',
        timestamp: Date.now(), modelName: 'System',
      }]);
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const clearChat = useCallback(async () => {
    try { await aiApi.clearChat(); } catch {}
    setMessages([]); toast.success('Cleared');
  }, []);

  const pickModel = useCallback((m: typeof AI_MODELS[0]) => {
    setSelectedModel(m);
    setMessages([]);
    setChatPhase('chatting');
  }, []);

  const backToSelect = useCallback(() => {
    setChatPhase('select');
    setMessages([]);
  }, []);

  const toggleBattleModel = useCallback((id: string) => {
    setBattleModels(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  }, []);

  const startBattle = useCallback(() => {
    if (battleModels.length < 2) { toast.error('Select at least 2 models'); return; }
    setBattlePhase('compare');
    setMessages([]);
  }, [battleModels]);

  const backToBattleSelect = useCallback(() => {
    setBattlePhase('select');
    setMessages([]);
  }, []);

  // ─── Send Single ──────────────────────────────────────
  const sendSingle = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setMessages(p => [...p, { id: gid(), role: 'user', content: msg, timestamp: Date.now() }]);
    setInput(''); setLoading(true); scroll();
    try {
      const r = await aiApi.chat(msg, 'single', selectedModel.id);
      setMessages(p => [...p, { id: gid(), role: 'assistant', content: r.response || 'No response.', timestamp: Date.now(), modelName: r.modelName || selectedModel.name, modelId: r.modelId || selectedModel.id }]);
    } catch (e: any) {
      const errMsg = e?.message || 'Failed to get response';
      toast.error(errMsg.includes('HTTP') ? 'Session expired. Please sign in again.' : errMsg);
      setMessages(p => [...p, { id: gid(), role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: Date.now(), modelName: selectedModel.name, modelId: selectedModel.id }]);
    }
    finally { setLoading(false); scroll(); }
  }, [input, loading, selectedModel, scroll]);

  // ─── Send Battle ──────────────────────────────────────
  const sendBattle = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setMessages(p => [...p, { id: gid(), role: 'user', content: msg, timestamp: Date.now() }]);
    setInput(''); setLoading(true); scroll();
    try {
      const r = await aiApi.chat(msg, 'battle', undefined, battleModels);
      setMessages(p => [...p, { id: gid(), role: 'assistant', content: '', timestamp: Date.now(), battleResponses: r.responses || [], battleId: r.battleId }]);
    } catch (e: any) {
      const errMsg = e?.message || 'Battle failed';
      toast.error(errMsg.includes('HTTP') ? 'Session expired. Please sign in again.' : errMsg);
    }
    finally { setLoading(false); scroll(); }
  }, [input, loading, battleModels, scroll]);

  // ─── Vote ─────────────────────────────────────────────
  const handleVote = useCallback(async (msgId: string, battleId: string, label: string) => {
    try {
      const r = await aiApi.voteBattle(battleId, label);
      setMessages(p => p.map(m => m.id === msgId ? { ...m, votedLabel: label, battleReveals: r.reveals } : m));
      toast.success('Vote recorded! Models revealed.');
    } catch { toast.error('Vote failed'); }
  }, []);

  // ─── Image Gen ────────────────────────────────────────
  const genImage = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || imageLoading) return;
    setMessages(p => [...p, { id: gid(), role: 'user', content: msg, timestamp: Date.now() }]);
    setInput(''); setImageLoading(true); scroll();
    try {
      const r = await aiApi.generateImage(msg);
      setMessages(p => [...p, { id: gid(), role: 'assistant', content: `Generated: "${msg}"`, generatedImage: r.image, timestamp: Date.now(), modelName: 'AI Image Gen' }]);
    } catch (e: any) {
      const errMsg = e?.message || 'Image gen failed';
      toast.error(errMsg.includes('HTTP') ? 'Session expired. Please sign in again.' : errMsg);
    }
    finally { setImageLoading(false); scroll(); }
  }, [input, imageLoading, scroll]);

  // ─── Scanner ──────────────────────────────────────────
  const handleScan = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = (ev) => { setScanPreview({ dataUrl: ev.target?.result as string, file: f }); setScanOpen(true); };
    r.readAsDataURL(f);
    e.target.value = '';
  }, []);

  const submitScan = useCallback(async () => {
    if (!scanPreview || scanLoading) return;
    setScanLoading(true);
    setMessages(p => [...p, { id: gid(), role: 'user', content: scanQ ? `Analyze: "${scanQ}"` : 'Analyze this image', image: scanPreview.dataUrl, timestamp: Date.now() }]);
    setScanOpen(false); setScanPreview(null); setScanQ('');
    try {
      const r = await aiApi.scanImage(scanPreview.dataUrl, scanQ || 'Describe this image');
      setMessages(p => [...p, { id: gid(), role: 'assistant', content: r.response || 'Done.', timestamp: Date.now(), modelName: 'Vision AI' }]);
    } catch (e: any) {
      const errMsg = e?.message || 'Scan failed';
      toast.error(errMsg.includes('HTTP') ? 'Session expired. Please sign in again.' : errMsg);
    }
    finally { setScanLoading(false); scroll(); }
  }, [scanPreview, scanQ, scanLoading, scroll]);

  const copyMsg = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => { setCopiedId(id); toast.success('Copied!'); setTimeout(() => setCopiedId(null), 2000); });
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'battle') sendBattle();
    else if (tab === 'image') genImage();
    else sendSingle();
  }, [tab, sendBattle, genImage, sendSingle]);

  const ft = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const hasMsgs = messages.length > 0;
  const curModel = AI_MODELS.find(m => m.id === selectedModel.id) || AI_MODELS[0];

  // ─── RENDER ───────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-h-[calc(100vh-8.5rem)] sm:h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-8rem)] min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-purple-600 text-white flex items-center justify-center shadow-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <BrainCircuit className="w-4.5 h-4.5" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-base font-bold bg-gradient-to-r from-emerald-600 to-purple-600 dark:from-emerald-400 dark:to-purple-400 bg-clip-text text-transparent flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">Lucky Strick AI</span>
            </h1>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:block">
              {tab === 'chat' && chatPhase === 'chatting' ? `Chatting with ${curModel.name}` : tab === 'chat' ? 'Choose an AI model to chat with' : tab === 'battle' && battlePhase === 'compare' ? 'Battle Arena' : tab === 'battle' ? 'Select models to compare' : 'AI Image Generator'}
            </p>
          </div>
        </div>
        {hasMsgs && (
          <div className="flex items-center gap-1.5">
            {(chatPhase === 'chatting' || battlePhase === 'compare') && (
              <Button variant="ghost" size="sm" onClick={chatPhase === 'chatting' ? backToSelect : backToBattleSelect} className="text-xs h-11 px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <ArrowLeft className="w-3 h-3 mr-1" />Back
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={clearChat} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 text-xs h-11 px-3">
              <Trash2 className="w-3 h-3 mr-1" />Clear
            </Button>
          </div>
        )}
      </div>

      <Card className="border dark:border-gray-800 flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Tabs */}
        <div className="flex items-center border-b dark:border-gray-800 px-2 pt-1 shrink-0 gap-0.5 bg-white dark:bg-gray-900 overflow-x-auto">
          {([
            { key: 'chat' as Tab, label: 'Chat', icon: <MessageCircle className="w-3.5 h-3.5" /> },
            { key: 'battle' as Tab, label: 'Battle', icon: <Swords className="w-3.5 h-3.5" /> },
            { key: 'image' as Tab, label: 'Image', icon: <Wand2 className="w-3.5 h-3.5" /> },
          ]).map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setMessages([]); setChatPhase('select'); setBattlePhase('select'); }}
              className={`px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${tab === t.key ? (t.key === 'chat' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : t.key === 'battle' ? 'border-violet-500 text-violet-600 dark:text-violet-400' : 'border-pink-500 text-pink-600 dark:text-pink-400') : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
              {t.icon}<span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
          <div className="flex-1" />
          {tab === 'chat' && chatPhase === 'chatting' && (
            <Badge className={`mr-2 text-[10px] shrink-0 ${curModel.tagBg} ${curModel.tagText} border border-transparent`}>
              {curModel.icon && <curModel.icon className="w-2.5 h-2.5 mr-1" />}{curModel.name}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">

          {/* ═══════════ CHAT TAB ═══════════ */}
          {tab === 'chat' && chatPhase === 'select' && (
            <ModelSelectGrid models={AI_MODELS} onSelect={pickModel} />
          )}

          {tab === 'chat' && chatPhase === 'chatting' && !hasMsgs && (
            <ChatWelcome model={curModel} onPrompt={sendSingle} />
          )}

          {tab === 'chat' && chatPhase === 'chatting' && hasMsgs && (
            <ChatMessages messages={messages} curModel={curModel} copiedId={copiedId} onCopy={copyMsg} onRegen={sendSingle} loading={loading} />
          )}

          {/* ═══════════ BATTLE TAB ═══════════ */}
          {tab === 'battle' && battlePhase === 'select' && (
            <BattleModelSelect models={AI_MODELS} selected={battleModels} onToggle={toggleBattleModel} onStart={startBattle} />
          )}

          {tab === 'battle' && battlePhase === 'compare' && !hasMsgs && (
            <BattleWelcome selectedModels={battleModels.map(id => AI_MODELS.find(m => m.id === id)!).filter(Boolean)} onPrompt={sendBattle} />
          )}

          {tab === 'battle' && battlePhase === 'compare' && hasMsgs && (
            <BattleMessages messages={messages} copiedId={copiedId} onCopy={copyMsg} onVote={handleVote} loading={loading} />
          )}

          {/* ═══════════ IMAGE TAB ═══════════ */}
          {tab === 'image' && !hasMsgs && (
            <ImageWelcome onPrompt={genImage} />
          )}

          {tab === 'image' && hasMsgs && (
            <ImageMessages messages={messages} copiedId={copiedId} onCopy={copyMsg} loading={imageLoading} />
          )}

          {/* Loading indicator (any mode) */}
          {(loading || imageLoading) && (chatPhase === 'chatting' || battlePhase === 'compare' || tab === 'image') && hasMsgs && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5 p-3 sm:p-4">
              <Avatar className="w-7 h-7"><AvatarFallback className="bg-gradient-to-br from-emerald-100 to-purple-100 text-purple-700 text-[10px] font-bold dark:from-emerald-900/30 dark:to-purple-900/30 dark:text-purple-300">AI</AvatarFallback></Avatar>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-md px-3.5 py-3 flex items-center gap-2">
                <div className="flex gap-1">{[0, 1, 2].map(i => <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500" animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />)}</div>
                <span className="text-xs text-gray-400">{tab === 'battle' ? 'Generating battle responses...' : imageLoading ? 'Creating image...' : `${curModel.name} is thinking...`}</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input (only when in chat/battle/image phase) */}
        {(chatPhase === 'chatting' || battlePhase === 'compare' || tab === 'image') && (
          <div className="border-t dark:border-gray-800 p-2.5 sm:p-3 shrink-0 bg-white dark:bg-gray-900">
            <form onSubmit={handleSubmit} className="flex items-end gap-1.5 sm:gap-2">
              <input ref={scanRef} type="file" className="hidden" accept="image/*" onChange={handleScan} />
              {tab !== 'image' && (
                <TooltipProvider delayDuration={300}><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="shrink-0 text-gray-400 hover:text-purple-600 dark:text-gray-500 dark:hover:text-purple-400 h-11 w-11" onClick={() => scanRef.current?.click()} disabled={loading}><Camera className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent side="top"><p className="text-xs">Scanner</p></TooltipContent></Tooltip></TooltipProvider>
              )}
              <div className="flex-1 min-w-0">
                <Input value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder={tab === 'battle' ? 'Ask a question to compare models...' : tab === 'image' ? 'Describe the image to generate...' : `Ask ${curModel.name} anything...`}
                  disabled={loading || imageLoading} className="dark:bg-gray-800 dark:border-gray-700 text-sm h-9"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) e.preventDefault(); }} />
              </div>
              <Button type="submit" disabled={loading || imageLoading || !input.trim()}
                className={`text-white shrink-0 h-11 w-11 p-0 shadow-sm bg-gradient-to-r ${tab === 'battle' ? 'from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700' : tab === 'image' ? 'from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700' : `${curModel.gradient} hover:opacity-90`}`}>
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
            <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-2">
              {tab === 'battle' ? 'One prompt → Compare responses → Vote for the best' : tab === 'image' ? 'Describe any image to generate with AI' : `Chatting with ${curModel.name} by ${curModel.provider}`}
            </p>
          </div>
        )}
      </Card>

      {/* Scan Dialog */}
      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent className="dark:bg-gray-900 dark:border-gray-800 sm:max-w-md">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-emerald-500 flex items-center justify-center"><Camera className="w-4 h-4 text-white" /></div>
            <div><h3 className="text-base font-semibold">Smart Scanner</h3><p className="text-[10px] text-gray-400">AI-powered image analysis</p></div>
          </div>
          {scanPreview && (
            <div className="space-y-3">
              <div className="flex justify-center rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 p-2"><img src={scanPreview.dataUrl} alt="" className="max-h-[200px] rounded-lg object-contain" /></div>
              <textarea value={scanQ} onChange={(e) => setScanQ(e.target.value)} placeholder="e.g., Solve this problem, What is in this image?" className="w-full p-2.5 text-sm rounded-lg border dark:border-gray-700 dark:bg-gray-800 resize-none" rows={2} />
            </div>
          )}
          <div className="flex gap-2 justify-end mt-3">
            <Button variant="outline" onClick={() => { setScanOpen(false); setScanPreview(null); setScanQ(''); }} className="dark:bg-gray-800 dark:border-gray-700 text-sm">Cancel</Button>
            <Button onClick={submitScan} disabled={scanLoading} className="bg-gradient-to-r from-purple-600 to-emerald-600 text-white text-sm">
              {scanLoading ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />Analyzing...</> : <><Search className="w-3.5 h-3.5 mr-1.5" />Analyze</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════

function MessageCircle(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>; }

// ─── Model Select Grid ─────────────────────────────────────
function ModelSelectGrid({ models, onSelect }: { models: typeof AI_MODELS; onSelect: (m: typeof AI_MODELS[0]) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
      <motion.div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-purple-500 flex items-center justify-center shadow-xl mb-4" animate={{ rotate: [0, 3, -3, 0] }} transition={{ duration: 4, repeat: Infinity }}>
        <Bot className="w-7 h-7 text-white" />
      </motion.div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">Choose Your AI</h3>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-md">Select a model to start chatting. Each has unique strengths and style.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 w-full max-w-3xl">
        {models.map((m, i) => (
          <motion.button key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
            onClick={() => onSelect(m)}
            className="group text-left p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50 hover:shadow-md transition-all">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${m.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                <m.icon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{m.name}</span>
                  <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors shrink-0" />
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">{m.provider}</span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">{m.desc}</p>
              </div>
            </div>
            <div className="mt-2">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${m.tagBg} ${m.tagText}`}>{m.tag}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Chat Welcome (after selecting model) ──────────────────
function ChatWelcome({ model, onPrompt }: { model: typeof AI_MODELS[0]; onPrompt: (t: string) => void }) {
  const prompts = ['Help me with my assignment', 'Explain binary search trees', 'Write a lab report structure', 'Review my code for bugs'];
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
      <motion.div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${model.gradient} flex items-center justify-center shadow-xl mb-4`} initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
        <model.icon className="w-7 h-7 text-white" />
      </motion.div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">{model.name}</h3>
      <p className="text-[10px] text-gray-400 mb-1">{model.provider}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 max-w-sm">{model.desc}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
        {prompts.map((p, i) => (
          <motion.button key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.08 }}
            onClick={() => onPrompt(p)} className="flex items-center gap-2 text-xs text-left p-2.5 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400">
            <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />{p}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Chat Messages ─────────────────────────────────────────
function ChatMessages({ messages, curModel, copiedId, onCopy, onRegen, loading }: any) {
  const { user } = useAppStore();
  const ft = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const MIcon = curModel.icon;
  return (
    <div className="p-3 sm:p-4 space-y-4">
      <AnimatePresence mode="popLayout">
        {messages.map((msg: ChatMessage) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} layout className={msg.role === 'user' ? 'flex gap-2.5 flex-row-reverse' : ''}>
            {msg.role === 'user' ? (
              <>
                <Avatar className="w-7 h-7 shrink-0 mt-0.5"><AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px] font-semibold">{getInitials(user?.name || 'U')}</AvatarFallback></Avatar>
                <div className="max-w-[85%] sm:max-w-[70%] flex flex-col items-end">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 mr-1">{ft(msg.timestamp)}</span>
                  <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-md px-3.5 py-2.5 text-sm shadow-sm">
                    {msg.image && <img src={msg.image} alt="" className="max-w-[160px] sm:max-w-[200px] max-h-[150px] rounded-lg mb-2 object-cover" />}
                    {msg.content}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Avatar className="w-7 h-7 shrink-0 mt-0.5"><AvatarFallback className={`bg-gradient-to-br ${curModel.gradient} text-white text-[10px] font-bold`}>{MIcon ? <MIcon className="w-3.5 h-3.5" /> : 'AI'}</AvatarFallback></Avatar>
                <div className="max-w-[85%] sm:max-w-[75%] min-w-0">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 block ml-1">{ft(msg.timestamp)}</span>
                  <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm shadow-sm">
                    {msg.generatedImage && (<div className="mb-3"><img src={msg.generatedImage} alt="" className="max-w-full rounded-lg shadow-md max-h-[350px] object-contain" /><a href={msg.generatedImage} download="lucky-strick.png" className="inline-flex items-center gap-1.5 mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"><Download className="w-3 h-3" />Download</a></div>)}
                    <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2.5 dark:prose-invert text-sm"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  </div>
                  {msg.modelName && (
                    <div className="flex items-center gap-1.5 mt-1.5 ml-1">
                      <div className={`w-3.5 h-3.5 rounded bg-gradient-to-br ${curModel.gradient} flex items-center justify-center`}><Cpu className="w-2 h-2 text-white" /></div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{msg.modelName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-0.5 mt-1 ml-1">
                    <button onClick={() => onCopy(msg.id, msg.content)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">{copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}</button>
                    <button onClick={() => { const last = [...messages].reverse().find((m: ChatMessage) => m.role === 'user'); if (last) { onRegen(last.content); } }} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" disabled={loading}><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /></button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Battle Model Select ───────────────────────────────────
function BattleModelSelect({ models, selected, onToggle, onStart }: { models: typeof AI_MODELS; selected: string[]; onToggle: (id: string) => void; onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
      <motion.div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl mb-4" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
        <Swords className="w-7 h-7 text-white" />
      </motion.div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">Battle Arena</h3>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 max-w-md">Select 2-3 AI models to compare. Send one prompt, see who answers best!</p>
      <p className="text-[10px] text-violet-500 font-medium mb-4">Selected: {selected.length}/3</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 w-full max-w-3xl mb-5">
        {models.map((m, i) => {
          const isSelected = selected.includes(m.id);
          return (
            <motion.button key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 + i * 0.03 }}
              onClick={() => onToggle(m.id)}
              className={`group text-left p-3 rounded-xl border-2 transition-all ${isSelected ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-md' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${m.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                  <m.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">{m.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0" />}
                  </div>
                  <span className="text-[10px] text-gray-400">{m.provider} &middot; {m.tag}</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
      <Button onClick={onStart} disabled={selected.length < 2} className={`bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 shadow-md ${selected.length < 2 ? 'opacity-50' : ''}`}>
        <Swords className="w-4 h-4 mr-2" />Start Battle{selected.length > 0 && ` (${selected.length} models)`}
      </Button>
    </div>
  );
}

// ─── Battle Welcome ────────────────────────────────────────
function BattleWelcome({ selectedModels, onPrompt }: { selectedModels: typeof AI_MODELS; onPrompt: (t: string) => void }) {
  const prompts = ['Explain quantum computing', 'Write a sorting algorithm', 'What is machine learning?', 'Solve: integral of x^2'];
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
      <motion.div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl mb-4">
        <Swords className="w-7 h-7 text-white" />
      </motion.div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Battle Ready!</h3>
      <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
        {selectedModels.map(m => (
          <Badge key={m.id} className={`${m.tagBg} ${m.tagText} border border-transparent text-[10px]`}>{m.icon && <m.icon className="w-2.5 h-2.5 mr-1" />}{m.name}</Badge>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Send a prompt — all models will answer. You decide who wins!</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
        {prompts.map((p, i) => (
          <motion.button key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.07 }}
            onClick={() => onPrompt(p)} className="flex items-center gap-2 text-xs text-left p-2.5 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400">
            <Sparkles className="w-3 h-3 text-violet-400 shrink-0" />{p}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Battle Messages ───────────────────────────────────────
function BattleMessages({ messages, copiedId, onCopy, onVote, loading }: any) {
  const labelGrad: Record<string, string> = { A: 'from-blue-500 to-cyan-500', B: 'from-emerald-500 to-teal-500', C: 'from-amber-500 to-orange-500' };
  return (
    <div className="p-3 sm:p-4 space-y-4">
      <AnimatePresence mode="popLayout">
        {messages.map((msg: ChatMessage) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} layout className={msg.role === 'user' ? 'flex gap-2.5 flex-row-reverse' : ''}>
            {msg.role === 'user' ? (
              <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-md px-3.5 py-2.5 text-sm shadow-sm max-w-[85%] sm:max-w-[70%]">{msg.content}</div>
            ) : msg.battleResponses ? (
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"><Swords className="w-3 h-3 text-white" /></div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Battle Results</span>
                  <Badge variant="outline" className="text-[10px]">{msg.battleResponses.length} responses</Badge>
                </div>
                <div className={`grid ${msg.battleResponses.length >= 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'} gap-3`}>
                  {msg.battleResponses.map((resp: { label: string; content: string }) => {
                    const reveal = msg.battleReveals?.[resp.label];
                    const revModel = reveal ? AI_MODELS.find(m => m.id === reveal.id) : null;
                    return (
                      <Card key={resp.label} className={`overflow-hidden border dark:border-gray-700 ${msg.votedLabel === resp.label ? 'ring-2 ring-emerald-400' : ''}`}>
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/80">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${labelGrad[resp.label] || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>{resp.label}</div>
                            {reveal && revModel ? (
                              <div className="flex items-center gap-1.5">
                                <div className={`w-4 h-4 rounded bg-gradient-to-br ${revModel.gradient} flex items-center justify-center`}><revModel.icon className="w-2.5 h-2.5 text-white" /></div>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{reveal.name}</span>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-gray-500">Response {resp.label}</span>
                            )}
                          </div>
                          <button onClick={() => onCopy(`${msg.id}-${resp.label}`, resp.content)} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                            {copiedId === `${msg.id}-${resp.label}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                          </button>
                        </div>
                        <div className="p-3 max-h-64 lg:max-h-80 overflow-y-auto prose prose-sm max-w-none prose-p:my-1.5 dark:prose-invert text-sm"><ReactMarkdown>{resp.content}</ReactMarkdown></div>
                        {reveal && revModel && (
                          <div className="px-3 py-1.5 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-1.5">
                            <Badge className={`text-[10px] ${revModel.tagBg} ${revModel.tagText} border border-transparent`}>{revModel.provider}</Badge>
                          </div>
                        )}
                        <div className="px-3 py-2 border-t dark:border-gray-700">
                          <Button size="sm" variant={msg.votedLabel === resp.label ? 'default' : 'outline'} className={`w-full text-xs h-11 ${msg.votedLabel === resp.label ? 'bg-emerald-600' : 'dark:bg-gray-700/50 dark:border-gray-600'}`} onClick={() => msg.battleId && onVote(msg.id, msg.battleId, resp.label)} disabled={!!msg.votedLabel}>
                            {msg.votedLabel === resp.label ? <><Check className="w-3.5 h-3.5 mr-1" />Voted Best</> : <><ThumbsUp className="w-3.5 h-3.5 mr-1" />Best Answer</>}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                {msg.votedLabel && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                    <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs text-emerald-700 dark:text-emerald-400">You voted for <strong>Response {msg.votedLabel}</strong>. All models revealed!</span>
                  </motion.div>
                )}
              </div>
            ) : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Image Welcome ─────────────────────────────────────────
function ImageWelcome({ onPrompt }: { onPrompt: (t: string) => void }) {
  const prompts = ['A futuristic university campus at sunset', 'A robotic arm assembling a circuit board', 'An abstract visualization of neural networks', 'A cozy study desk with books and coffee'];
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
      <motion.div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-xl mb-4" animate={{ rotate: [0, 3, -3, 0] }} transition={{ duration: 4, repeat: Infinity }}>
        <Wand2 className="w-7 h-7 text-white" />
      </motion.div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">AI Image Studio</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 max-w-md">Describe any image and I&apos;ll create it. Be creative and specific!</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {prompts.map((p, i) => (
          <motion.button key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.07 }}
            onClick={() => onPrompt(p)} className="flex items-center gap-2 text-xs text-left p-2.5 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400">
            <Sparkles className="w-3 h-3 text-pink-400 shrink-0" />{p}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Image Messages ────────────────────────────────────────
function ImageMessages({ messages, copiedId, onCopy, loading }: any) {
  const { user } = useAppStore();
  const ft = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="p-3 sm:p-4 space-y-4">
      <AnimatePresence mode="popLayout">
        {messages.map((msg: ChatMessage) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} layout className={msg.role === 'user' ? 'flex gap-2.5 flex-row-reverse' : ''}>
            {msg.role === 'user' ? (
              <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-md px-3.5 py-2.5 text-sm shadow-sm max-w-[85%]">{msg.content}</div>
            ) : (
              <>
                <Avatar className="w-7 h-7 shrink-0 mt-0.5"><AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-600 text-white text-[10px] font-bold"><Wand2 className="w-3.5 h-3.5" /></AvatarFallback></Avatar>
                <div className="max-w-[85%] sm:max-w-[75%] min-w-0">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm shadow-sm">
                    {msg.generatedImage && (<div className="mb-2"><img src={msg.generatedImage} alt="" className="max-w-full rounded-lg shadow-md max-h-[400px] object-contain" /></div>)}
                    <div className="prose prose-sm max-w-none dark:prose-invert text-sm"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  </div>
                  <div className="flex items-center gap-0.5 mt-1 ml-1">
                    {msg.generatedImage && <a href={msg.generatedImage} download="lucky-strick.png" className="inline-flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 hover:underline mr-2"><Download className="w-3 h-3" />Download</a>}
                    <button onClick={() => onCopy(msg.id, msg.content)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">{copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}</button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default AIChatPage;

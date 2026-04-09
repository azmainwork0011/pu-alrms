'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppStore } from '@/store/app';
import { aiApi } from '@/lib/api';
import { getInitials } from '@/components/pu-helpers';
import {
  Send, Trash2, Copy, Camera, Search, Check, Zap,
  Swords, ThumbsUp, Download, BrainCircuit, GraduationCap, FileText,
  MessageCircle, Sparkles, Cpu, Eye, EyeOff, Bot, RefreshCw, Wand2,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type ChatMode = 'single' | 'battle' | 'image';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  generatedImage?: string;
  image?: string;
  timestamp: number;
  model?: string;
  modelRevealed?: boolean;
  battleResponses?: { label: string; content: string }[];
  battleId?: string;
  votedLabel?: string;
  battleReveals?: Record<string, string>;
}

function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('single');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scanPreview, setScanPreview] = useState<{ dataUrl: string; file: File } | null>(null);
  const [scanQuestion, setScanQuestion] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scanFileRef = useRef<HTMLInputElement>(null);
  const { user } = useAppStore();
  const gid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const scroll = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight, behavior: 'smooth' }), 100);
  }, []);
  useEffect(() => { scroll(); }, [messages, loading, imageLoading, scroll]);

  const ctaButtons = [
    { label: 'Assignment Help', icon: <FileText className="w-4 h-4" />, prompt: 'Help me with my university assignment. What approach should I take?' },
    { label: 'Lab Report', icon: <GraduationCap className="w-4 h-4" />, prompt: 'How should I structure a proper university lab report?' },
    { label: 'Code Debug', icon: <Sparkles className="w-4 h-4" />, prompt: 'Review this code for bugs, performance issues, and best practices.' },
    { label: 'Exam Prep', icon: <BrainCircuit className="w-4 h-4" />, prompt: 'Give me effective study strategies for computer science exams.' },
  ];
  const quickPrompts = ['Explain binary search trees', 'Help me write a lab report', 'Solve this math problem', 'Review my code for bugs'];

  const revealModel = useCallback((msgId: string) => {
    setMessages(p => p.map(m => m.id === msgId ? { ...m, modelRevealed: true } : m));
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setMessages(p => [...p, { id: gid(), role: 'user', content: msg, timestamp: Date.now() }]);
    setInput(''); setLoading(true); scroll();
    try {
      const r = await aiApi.chat(msg, 'single');
      setMessages(p => [...p, { id: gid(), role: 'assistant', content: r.response || 'No response.', timestamp: Date.now(), model: r.model || 'AI', modelRevealed: false }]);
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    finally { setLoading(false); scroll(); }
  }, [input, loading, scroll]);

  const sendBattle = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setMessages(p => [...p, { id: gid(), role: 'user', content: msg, timestamp: Date.now() }]);
    setInput(''); setLoading(true); scroll();
    try {
      const r = await aiApi.chat(msg, 'battle');
      setMessages(p => [...p, { id: gid(), role: 'assistant', content: '', timestamp: Date.now(), battleResponses: r.responses || [], battleId: r.battleId }]);
    } catch (e: any) { toast.error(e.message || 'Battle failed'); }
    finally { setLoading(false); scroll(); }
  }, [input, loading, scroll]);

  const handleVote = useCallback(async (msgId: string, battleId: string, label: string) => {
    try {
      const r = await aiApi.voteBattle(battleId, label);
      setMessages(p => p.map(m => m.id === msgId ? { ...m, votedLabel: label, battleReveals: r.reveals } : m));
      toast.success(`Voted for Response ${label}! Models revealed.`);
    } catch { toast.error('Vote failed'); }
  }, []);

  const genImage = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || imageLoading) return;
    setMessages(p => [...p, { id: gid(), role: 'user', content: msg, timestamp: Date.now() }]);
    setInput(''); setImageLoading(true); scroll();
    try {
      const r = await aiApi.generateImage(msg);
      setMessages(p => [...p, { id: gid(), role: 'assistant', content: `Generated: "${msg}"`, generatedImage: r.image, timestamp: Date.now(), model: 'AI Image Gen', modelRevealed: true }]);
    } catch { toast.error('Image generation failed'); }
    finally { setImageLoading(false); scroll(); }
  }, [input, imageLoading, scroll]);

  const handleScanSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setScanPreview({ dataUrl: ev.target?.result as string, file: f }); setScanDialogOpen(true); };
    reader.readAsDataURL(f);
    e.target.value = '';
  }, []);

  const submitScan = useCallback(async () => {
    if (!scanPreview || scanLoading) return;
    setScanLoading(true);
    const q = scanQuestion;
    setMessages(p => [...p, { id: gid(), role: 'user', content: q ? `Analyze: "${q}"` : 'Analyze this image', image: scanPreview.dataUrl, timestamp: Date.now() }]);
    setScanDialogOpen(false); setScanPreview(null); setScanQuestion('');
    try {
      const r = await aiApi.scanImage(scanPreview.dataUrl, q || 'Describe this image');
      setMessages(p => [...p, { id: gid(), role: 'assistant', content: r.response || 'Done.', timestamp: Date.now(), model: 'Vision AI', modelRevealed: true }]);
    } catch { toast.error('Scan failed'); }
    finally { setScanLoading(false); scroll(); }
  }, [scanPreview, scanQuestion, scanLoading, scroll]);

  const copyMsg = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => { setCopiedId(id); toast.success('Copied!'); setTimeout(() => setCopiedId(null), 2000); });
  }, []);

  const clearChat = useCallback(async () => {
    try { await aiApi.clearChat(); } catch { /* ignore */ }
    setMessages([]); toast.success('Chat cleared');
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (chatMode === 'battle') sendBattle();
    else if (chatMode === 'image') genImage();
    else sendMessage();
  }, [chatMode, sendBattle, genImage, sendMessage]);

  const ft = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const labelGrad: Record<string, string> = { A: 'from-blue-500 to-cyan-500', B: 'from-emerald-500 to-teal-500', C: 'from-amber-500 to-orange-500' };
  const modeCfg: Record<ChatMode, { label: string; icon: React.ReactNode; hint: string; grad: string }> = {
    single: { label: 'Single', icon: <MessageCircle className="w-3.5 h-3.5" />, hint: '1-on-1 AI chat', grad: 'from-emerald-600 to-teal-600' },
    battle: { label: 'Battle', icon: <Swords className="w-3.5 h-3.5" />, hint: 'Compare AI responses', grad: 'from-violet-600 to-purple-600' },
    image: { label: 'Image Gen', icon: <Wand2 className="w-3.5 h-3.5" />, hint: 'Generate images', grad: 'from-pink-600 to-rose-600' },
  };
  const mode = modeCfg[chatMode];
  const hasMsgs = messages.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-h-[calc(100vh-8.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <motion.div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-purple-600 text-white flex items-center justify-center shadow-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <BrainCircuit className="w-4.5 h-4.5" />
          </motion.div>
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-emerald-600 to-purple-600 dark:from-emerald-400 dark:to-purple-400 bg-clip-text text-transparent flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />Lucky Strick AI
            </h1>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:block">{mode.label} &middot; {mode.hint}</p>
          </div>
        </div>
        {hasMsgs && (
          <Button variant="outline" size="sm" onClick={clearChat} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 text-xs h-8">
            <Trash2 className="w-3 h-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Main Card */}
      <Card className="border dark:border-gray-800 flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Tabs */}
        <div className="flex items-center border-b dark:border-gray-800 px-2 pt-1 shrink-0 gap-0.5 bg-white dark:bg-gray-900">
          {(Object.entries(modeCfg) as [ChatMode, typeof mode.single][]).map(([k, c]) => (
            <button key={k} onClick={() => setChatMode(k)} className={`px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${chatMode === k ? (k === 'single' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : k === 'battle' ? 'border-violet-500 text-violet-600 dark:text-violet-400' : 'border-pink-500 text-pink-600 dark:text-pink-400') : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
              {c.icon}<span className="hidden sm:inline">{c.label}</span>
            </button>
          ))}
          <div className="flex-1" />
          <Badge variant="outline" className={`mr-2 text-[10px] shrink-0 ${chatMode === 'battle' ? 'border-violet-200 text-violet-600 dark:text-violet-400 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20' : chatMode === 'image' ? 'border-pink-200 text-pink-600 dark:text-pink-400 dark:border-pink-800 bg-pink-50 dark:bg-pink-900/20' : 'border-emerald-200 text-emerald-600 dark:text-emerald-400 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'}`}>
            {chatMode === 'battle' ? '3 AI Responses' : chatMode === 'image' ? 'Text to Image' : '1-on-1 Chat'}
          </Badge>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
          {!hasMsgs ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
              <motion.div className="relative mb-5">
                <motion.div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-purple-500 flex items-center justify-center shadow-xl" animate={{ rotate: [0, 3, -3, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                  <Bot className="w-8 h-8 text-white" />
                </motion.div>
                <motion.div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </motion.div>
              </motion.div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
                {chatMode === 'battle' ? 'AI Battle Arena' : chatMode === 'image' ? 'AI Image Studio' : 'Hey there!'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                {chatMode === 'battle' ? 'Send one prompt, get 3 AI responses. Vote for the best — models are hidden until you vote!' : chatMode === 'image' ? 'Describe any image and I\'ll create it. Be creative for best results.' : 'Ask me about assignments, coding, lab reports, math, or any subject!'}
              </p>
              {chatMode !== 'image' && (
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs mb-5">
                  {ctaButtons.map((c, i) => (
                    <motion.button key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }} onClick={() => chatMode === 'battle' ? sendBattle(c.prompt) : sendMessage(c.prompt)} className="group flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all text-left">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">{c.icon}</div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{c.label}</span>
                    </motion.button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 w-full max-w-md">
                {quickPrompts.map((p, i) => (
                  <motion.button key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.05 }} onClick={() => chatMode === 'battle' ? sendBattle(p) : chatMode === 'image' ? genImage(p) : sendMessage(p)} className="flex items-center gap-2 text-xs text-left p-2.5 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400">
                    <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />{p}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} layout className={msg.role === 'user' ? 'flex gap-2.5 flex-row-reverse' : ''}>
                    {msg.role === 'user' ? (
                      <>
                        <Avatar className="w-7 h-7 shrink-0 mt-0.5"><AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px] font-semibold">{getInitials(user?.name || 'U')}</AvatarFallback></Avatar>
                        <div className="max-w-[85%] sm:max-w-[70%] flex flex-col items-end">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 mr-1">{ft(msg.timestamp)}</span>
                          <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-md px-3.5 py-2.5 text-sm shadow-sm">
                            {msg.image && <img src={msg.image} alt="" className="max-w-[200px] max-h-[150px] rounded-lg mb-2 object-cover" />}
                            {msg.content}
                          </div>
                        </div>
                      </>
                    ) : msg.battleResponses ? (
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"><Swords className="w-3 h-3 text-white" /></div>
                          <div><span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Battle Results</span><p className="text-[10px] text-gray-400">Vote to reveal AI models</p></div>
                        </div>
                        <div className={`grid ${msg.battleResponses.length >= 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'} gap-3`}>
                          {msg.battleResponses.map((resp) => (
                            <Card key={resp.label} className={`overflow-hidden border dark:border-gray-700 transition-all ${msg.votedLabel === resp.label ? 'ring-2 ring-emerald-400 dark:ring-emerald-500' : ''}`}>
                              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/80">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${labelGrad[resp.label] || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>{resp.label}</div>
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Response {resp.label}</span>
                                </div>
                                <button onClick={() => copyMsg(`${msg.id}-${resp.label}`, resp.content)} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                  {copiedId === `${msg.id}-${resp.label}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                                </button>
                              </div>
                              <div className="p-3 max-h-64 lg:max-h-80 overflow-y-auto prose prose-sm max-w-none prose-p:my-1.5 dark:prose-invert text-sm"><ReactMarkdown>{resp.content}</ReactMarkdown></div>
                              {msg.battleReveals?.[resp.label] && (
                                <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800/50 flex items-center gap-1.5">
                                  <div className="w-4 h-4 rounded-md bg-gradient-to-br from-emerald-500 to-purple-500 flex items-center justify-center"><Cpu className="w-2.5 h-2.5 text-white" /></div>
                                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">{msg.battleReveals[resp.label]}</span>
                                </div>
                              )}
                              <div className="px-3 py-2 border-t dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                                <Button size="sm" variant={msg.votedLabel === resp.label ? 'default' : 'outline'} className={`w-full text-xs h-8 ${msg.votedLabel === resp.label ? 'bg-emerald-600 hover:bg-emerald-700' : 'dark:bg-gray-700/50 dark:border-gray-600'}`} onClick={() => msg.battleId && handleVote(msg.id, msg.battleId, resp.label)} disabled={!!msg.votedLabel}>
                                  {msg.votedLabel === resp.label ? <><Check className="w-3.5 h-3.5 mr-1.5" />Voted</> : <><ThumbsUp className="w-3.5 h-3.5 mr-1.5" />Best</>}
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                        {msg.votedLabel && msg.battleReveals && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                            <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs text-emerald-700 dark:text-emerald-400">Voted for <strong>Response {msg.votedLabel}</strong>. All AI models revealed!</span>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <>
                        <Avatar className="w-7 h-7 shrink-0 mt-0.5"><AvatarFallback className="bg-gradient-to-br from-emerald-100 to-purple-100 text-purple-700 text-[10px] font-bold dark:from-emerald-900/30 dark:to-purple-900/30 dark:text-purple-300">AI</AvatarFallback></Avatar>
                        <div className="max-w-[85%] sm:max-w-[75%] min-w-0">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 block ml-1">{ft(msg.timestamp)}</span>
                          <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm shadow-sm">
                            {msg.generatedImage && (
                              <div className="mb-3">
                                <img src={msg.generatedImage} alt="" className="max-w-full rounded-lg shadow-md max-h-[350px] object-contain" />
                                <a href={msg.generatedImage} download="lucky-strick-ai.png" className="inline-flex items-center gap-1.5 mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"><Download className="w-3 h-3" />Download</a>
                              </div>
                            )}
                            <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2.5 dark:prose-invert text-sm"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                          </div>
                          {/* Model reveal after answer */}
                          {msg.model && !msg.modelRevealed && (
                            <button onClick={() => revealModel(msg.id)} className="group flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer mt-1.5 ml-1">
                              <EyeOff className="w-3 h-3" /><span>Tap to reveal AI model</span>
                            </button>
                          )}
                          {msg.modelRevealed && msg.model && (
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 mt-1.5 ml-1">
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="w-4 h-4 rounded-md bg-gradient-to-br from-emerald-500 to-purple-500 flex items-center justify-center"><Cpu className="w-2.5 h-2.5 text-white" /></motion.div>
                              <span className="text-[11px] text-gray-500 dark:text-gray-400">Powered by <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{msg.model}</span></span>
                            </motion.div>
                          )}
                          <div className="flex items-center gap-0.5 mt-1.5 ml-1">
                            <button onClick={() => copyMsg(msg.id, msg.content)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                              {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => { const last = [...messages].reverse().find(m => m.role === 'user'); if (last) { setMessages(p => p.slice(0, -1)); sendMessage(last.content); } }} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" disabled={loading}>
                              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {(loading || imageLoading) && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                  <Avatar className="w-7 h-7"><AvatarFallback className="bg-gradient-to-br from-emerald-100 to-purple-100 text-purple-700 text-[10px] font-bold dark:from-emerald-900/30 dark:to-purple-900/30 dark:text-purple-300">AI</AvatarFallback></Avatar>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-md px-3.5 py-3 flex items-center gap-2">
                    <div className="flex gap-1">{[0, 1, 2].map(i => <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500" animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />)}</div>
                    <span className="text-xs text-gray-400">{chatMode === 'battle' ? 'Generating 3 responses...' : imageLoading ? 'Creating image...' : 'Thinking...'}</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t dark:border-gray-800 p-2.5 sm:p-3 shrink-0 bg-white dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="flex items-end gap-1.5 sm:gap-2">
            <input ref={scanFileRef} type="file" className="hidden" accept="image/*" onChange={handleScanSelect} />
            {chatMode !== 'image' && (
              <TooltipProvider delayDuration={300}><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="shrink-0 text-gray-400 hover:text-purple-600 dark:text-gray-500 dark:hover:text-purple-400 h-9 w-9" onClick={() => scanFileRef.current?.click()} disabled={loading}><Camera className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent side="top"><p className="text-xs">Smart Scanner</p></TooltipContent></Tooltip></TooltipProvider>
            )}
            <div className="flex-1 min-w-0">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={chatMode === 'battle' ? 'Ask a question for battle mode...' : chatMode === 'image' ? 'Describe the image...' : 'Ask me anything...'} disabled={loading || imageLoading} className="dark:bg-gray-800 dark:border-gray-700 text-sm h-9" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) e.preventDefault(); }} />
            </div>
            <Button type="submit" disabled={loading || imageLoading || !input.trim()} className={`bg-gradient-to-r ${mode.grad} text-white shrink-0 h-9 w-9 p-0 shadow-sm`}>
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
          <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-2">
            {chatMode === 'battle' ? 'One prompt → 3 AI responses → Vote → Models revealed' : chatMode === 'image' ? 'Describe any image to generate' : 'Tap "reveal" after reading to see the AI model'}
          </p>
        </div>
      </Card>

      {/* Scan Dialog */}
      <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
        <DialogContent className="dark:bg-gray-900 dark:border-gray-800 sm:max-w-md">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-emerald-500 flex items-center justify-center"><Camera className="w-4 h-4 text-white" /></div>
            <div><h3 className="text-base font-semibold">Smart Scanner</h3><p className="text-[10px] text-gray-400">AI-powered image analysis</p></div>
          </div>
          {scanPreview && (
            <div className="space-y-3">
              <div className="flex justify-center rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 p-2"><img src={scanPreview.dataUrl} alt="" className="max-h-[200px] rounded-lg object-contain" /></div>
              <div><p className="text-sm font-medium mb-1.5">What would you like to know?</p><textarea value={scanQuestion} onChange={(e) => setScanQuestion(e.target.value)} placeholder="e.g., Solve this problem, What is in this image?" className="w-full p-2.5 text-sm rounded-lg border dark:border-gray-700 dark:bg-gray-800 resize-none" rows={2} /></div>
            </div>
          )}
          <div className="flex gap-2 justify-end mt-3">
            <Button variant="outline" onClick={() => { setScanDialogOpen(false); setScanPreview(null); setScanQuestion(''); }} className="dark:bg-gray-800 dark:border-gray-700 text-sm">Cancel</Button>
            <Button onClick={submitScan} disabled={scanLoading} className="bg-gradient-to-r from-purple-600 to-emerald-600 text-white text-sm">
              {scanLoading ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />Analyzing...</> : <><Search className="w-3.5 h-3.5 mr-1.5" />Analyze</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AIChatPage;

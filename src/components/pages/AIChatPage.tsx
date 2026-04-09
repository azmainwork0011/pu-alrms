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
import {
  Send, Trash2, Copy, RotateCcw,
  Paperclip, Image as ImageIcon, Camera, Search, Check, Zap, X,
  Swords, ThumbsUp, Download, BrainCircuit, GraduationCap, FileText,
  MessageCircle, Sparkles, Cpu,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getInitials } from '@/components/pu-helpers';

type ChatMode = 'single' | 'battle' | 'image';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  generatedImage?: string;
  fileName?: string;
  image?: string;
  timestamp: number;
  model?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanFileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAppStore();

  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, 100);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, imageLoading, scrollToBottom]);

  const ctaButtons = [
    { label: 'Assignment Help', icon: <FileText className="w-5 h-5" />, prompt: 'Help me with my university assignment. What approach should I take?', gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Lab Report', icon: <GraduationCap className="w-5 h-5" />, prompt: 'How should I structure a proper university lab report?', gradient: 'from-violet-500 to-purple-600' },
    { label: 'Code Debug', icon: <Sparkles className="w-5 h-5" />, prompt: 'Review this code for bugs, performance issues, and best practices.', gradient: 'from-orange-500 to-red-500' },
    { label: 'Exam Prep', icon: <BrainCircuit className="w-5 h-5" />, prompt: 'Give me effective study strategies for computer science exams.', gradient: 'from-rose-500 to-pink-500' },
  ];

  const quickPrompts = [
    'Explain binary search trees',
    'Help me write a lab report',
    'Solve this math problem',
    'Review my code for bugs',
  ];

  // ─── Send Single Message ─────────────────────────────────
  const sendMessage = useCallback(async (text?: string) => {
    const message = text || input.trim();
    if (!message || loading) return;

    const userMsg: ChatMessage = { id: genId(), role: 'user', content: message, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      const result = await aiApi.chat(message, 'single');
      const aiMsg: ChatMessage = {
        id: genId(),
        role: 'assistant',
        content: result.response || 'No response.',
        timestamp: Date.now(),
        model: result.model || 'Lucky Strick AI',
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to get response');
    } finally { setLoading(false); scrollToBottom(); }
  }, [input, loading, scrollToBottom]);

  // ─── Send Battle Mode Message ────────────────────────────
  const sendBattleMessage = useCallback(async (text?: string) => {
    const message = text || input.trim();
    if (!message || loading) return;

    const userMsg: ChatMessage = { id: genId(), role: 'user', content: message, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      const result = await aiApi.chat(message, 'battle');
      const aiMsg: ChatMessage = {
        id: genId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        battleResponses: result.responses || [],
        battleId: result.battleId,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error(err.message || 'Battle mode failed');
    } finally { setLoading(false); scrollToBottom(); }
  }, [input, loading, scrollToBottom]);

  // ─── Vote in Battle ──────────────────────────────────────
  const handleVote = useCallback(async (msgId: string, battleId: string, label: string) => {
    try {
      const result = await aiApi.voteBattle(battleId, label);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, votedLabel: label, battleReveals: result.reveals } : m));
      toast.success(`Voted for Response ${label}!`);
    } catch { toast.error('Vote failed'); }
  }, []);

  // ─── Generate Image ─────────────────────────────────────
  const generateImage = useCallback(async (prompt?: string) => {
    const text = prompt || input.trim();
    if (!text || imageLoading) return;
    const userMsg: ChatMessage = { id: genId(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setImageLoading(true);
    scrollToBottom();
    try {
      const result = await aiApi.generateImage(text);
      const aiMsg: ChatMessage = {
        id: genId(), role: 'assistant',
        content: `Generated image for: "${text}"`,
        generatedImage: result.image, timestamp: Date.now(),
        model: 'DALL-E 3',
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch { toast.error('Image generation failed'); }
    finally { setImageLoading(false); scrollToBottom(); }
  }, [input, imageLoading, scrollToBottom]);

  // ─── Image Scan ─────────────────────────────────────────
  const handleScanFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) { if (file) toast.error('Select an image'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setScanPreview({ dataUrl: ev.target?.result as string, file }); setScanDialogOpen(true); };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const submitScan = useCallback(async () => {
    if (!scanPreview || scanLoading) return;
    setScanLoading(true);
    const q = scanQuestion;
    setMessages(prev => [...prev, { id: genId(), role: 'user', content: q ? `Analyze: "${q}"` : 'Analyze this image', image: scanPreview.dataUrl, timestamp: Date.now() }]);
    setScanDialogOpen(false); setScanPreview(null); setScanQuestion('');
    try {
      const result = await aiApi.scanImage(scanPreview.dataUrl, q || 'Describe this image');
      setMessages(prev => [...prev, { id: genId(), role: 'assistant', content: result.response || 'Done.', timestamp: Date.now(), model: 'Gemini 1.5 Pro Vision' }]);
    } catch { toast.error('Scan failed'); }
    finally { setScanLoading(false); scrollToBottom(); }
  }, [scanPreview, scanQuestion, scanLoading, scrollToBottom]);

  const copyMessage = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => { setCopiedId(id); toast.success('Copied!'); setTimeout(() => setCopiedId(null), 2000); });
  }, []);

  const clearChat = useCallback(async () => {
    try { await aiApi.clearChat(); } catch { /* ignore */ }
    setMessages([]);
    toast.success('Chat cleared');
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (chatMode === 'battle') sendBattleMessage();
    else if (chatMode === 'image') generateImage();
    else sendMessage();
  }, [chatMode, sendBattleMessage, generateImage, sendMessage]);

  const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const labelColors: Record<string, string> = {
    A: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
    B: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700',
    C: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] md:h-[calc(100vh-8rem)]">
      {/* ─── Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30 shrink-0" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <BrainCircuit className="w-4.5 h-4.5" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-purple-600 dark:from-emerald-400 dark:to-purple-400 bg-clip-text text-transparent flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">Lucky Strick</span>
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">Premium AI Academic Assistant</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearChat} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 text-xs h-8 shrink-0">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* ─── Main Card ─────────────────────────────── */}
      <Card className="border dark:border-gray-800 flex-1 flex flex-col overflow-hidden min-h-0">
        {/* ─── Mode Tabs ──────────────────────────── */}
        <div className="flex items-center border-b dark:border-gray-800 px-3 pt-1.5 shrink-0 gap-0.5 overflow-x-auto">
          {([
            { key: 'single' as ChatMode, label: 'Single', icon: <MessageCircle className="w-3.5 h-3.5" /> },
            { key: 'battle' as ChatMode, label: 'Battle', icon: <Swords className="w-3.5 h-3.5" /> },
            { key: 'image' as ChatMode, label: 'Image Gen', icon: <ImageIcon className="w-3.5 h-3.5" /> },
          ]).map((tab) => (
            <button key={tab.key} onClick={() => setChatMode(tab.key)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${chatMode === tab.key
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              <span className="flex items-center gap-1.5">{tab.icon}{tab.label}</span>
            </button>
          ))}
          {chatMode === 'battle' && (
            <Badge variant="outline" className="ml-auto text-[10px] border-violet-300 text-violet-600 dark:text-violet-400 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 shrink-0">
              <Swords className="w-2.5 h-2.5 mr-1" /> Compare AI Responses
            </Badge>
          )}
        </div>

        {/* ─── Messages ───────────────────────────── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 min-h-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <motion.div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-purple-100 dark:from-emerald-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                <BrainCircuit className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </motion.div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                {chatMode === 'battle' ? 'Battle Mode: Compare AI Responses' : chatMode === 'image' ? 'Generate Images with AI' : 'How can I help you today?'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5 max-w-sm">
                {chatMode === 'battle' ? 'Send one prompt, get multiple responses. Vote for the best!' : chatMode === 'image' ? 'Describe any image and I will create it for you.' : 'I can help with assignments, programming, lab reports, and academic questions.'}
              </p>
              {chatMode !== 'image' && (
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm mb-5">
                  {ctaButtons.map((cta, i) => (
                    <motion.button key={cta.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                      onClick={() => chatMode === 'battle' ? sendBattleMessage(cta.prompt) : sendMessage(cta.prompt)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br ${cta.gradient} text-white hover:opacity-90 transition-all shadow-md hover:-translate-y-0.5`}>
                      {cta.icon}<span className="text-[11px] font-medium">{cta.label}</span>
                    </motion.button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 w-full max-w-lg">
                {quickPrompts.map((p, i) => (
                  <motion.button key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.05 }}
                    onClick={() => chatMode === 'battle' ? sendBattleMessage(p) : chatMode === 'image' ? generateImage(p) : sendMessage(p)}
                    className="flex items-center gap-2 text-xs text-left p-2.5 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-gray-700 dark:text-gray-300">
                    <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400 shrink-0" />{p}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  className={msg.role === 'user' ? 'flex gap-2.5 flex-row-reverse' : ''}>

                  {msg.role === 'user' ? (
                    <>
                      <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">{getInitials(user?.name || 'U')}</AvatarFallback>
                      </Avatar>
                      <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">{fmtTime(msg.timestamp)}</span>
                        <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm">
                          {msg.image && <img src={msg.image} alt="" className="max-w-[180px] max-h-[130px] rounded-lg mb-2 object-cover" />}
                          {msg.fileName && <div className="flex items-center gap-1 mb-1 text-xs opacity-80"><FileText className="w-3 h-3" /><span className="truncate max-w-[180px]">{msg.fileName}</span></div>}
                          {msg.content}
                        </div>
                      </div>
                    </>
                  ) : msg.battleResponses ? (
                    /* ─── Battle Mode Responses ─────────────── */
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Swords className="w-4 h-4 text-violet-500" />
                        <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">Battle Results</span>
                        <Badge variant="outline" className="text-[10px]">{msg.battleResponses.length} responses</Badge>
                      </div>
                      <div className={`grid ${msg.battleResponses.length >= 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'} gap-3`}>
                        {msg.battleResponses.map((resp) => (
                          <Card key={resp.label} className={`border dark:border-gray-700 overflow-hidden ${msg.votedLabel === resp.label ? 'ring-2 ring-emerald-500 dark:ring-emerald-400' : ''}`}>
                            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                              <Badge className={`${labelColors[resp.label] || ''} text-xs font-bold`}>
                                Response {resp.label}
                              </Badge>
                              <div className="flex items-center gap-0.5">
                                <button onClick={() => copyMessage(`${msg.id}-${resp.label}`, resp.content)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Copy">
                                  {copiedId === `${msg.id}-${resp.label}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                                </button>
                              </div>
                            </div>
                            <CardContent className="p-3 max-h-64 lg:max-h-80 overflow-y-auto">
                              <div className="prose prose-sm max-w-none prose-p:my-1 dark:prose-invert text-sm">
                                <ReactMarkdown>{resp.content}</ReactMarkdown>
                              </div>
                            </CardContent>
                            {/* Model reveal after vote */}
                            {msg.battleReveals && msg.battleReveals[resp.label] && (
                              <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800/50">
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                  <Cpu className="w-2.5 h-2.5" />{msg.battleReveals[resp.label]}
                                </span>
                              </div>
                            )}
                            <div className="px-3 py-1.5 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                              <Button size="sm" variant={msg.votedLabel === resp.label ? 'default' : 'outline'}
                                className={`w-full text-xs h-7 ${msg.votedLabel === resp.label ? 'bg-emerald-600 hover:bg-emerald-700' : 'dark:bg-gray-700 dark:border-gray-600'}`}
                                onClick={() => msg.battleId && handleVote(msg.id, msg.battleId, resp.label)}
                                disabled={!!msg.votedLabel}>
                                <ThumbsUp className="w-3 h-3 mr-1" />
                                {msg.votedLabel === resp.label ? 'Voted!' : 'Best Answer'}
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* ─── Single Mode Response ──────────────── */
                    <>
                      <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-purple-100 text-purple-700 text-[10px] dark:from-emerald-900/30 dark:to-purple-900/30 dark:text-purple-300">LS</AvatarFallback>
                      </Avatar>
                      <div className="max-w-[85%] sm:max-w-[75%] min-w-0">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 block">{fmtTime(msg.timestamp)}</span>
                        <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm">
                          {msg.generatedImage && (
                            <div className="mb-2">
                              <img src={msg.generatedImage} alt="" className="max-w-full rounded-lg shadow-md max-h-[300px] object-contain" />
                              <a href={msg.generatedImage} download="lucky-strick.png" className="inline-flex items-center gap-1 mt-1.5 text-xs text-purple-600 dark:text-purple-400 hover:underline"><Download className="w-3 h-3" />Download Image</a>
                            </div>
                          )}
                          <div className="prose prose-sm max-w-none prose-p:my-1 dark:prose-invert"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                        </div>
                        {/* ─── Model Name Badge (shown after response) ─── */}
                        {msg.model && (
                          <div className="mt-1 ml-1">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                              <Cpu className="w-2.5 h-2.5" />Powered by {msg.model}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-0.5 mt-1 ml-1">
                          <button onClick={() => copyMessage(msg.id, msg.content)} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => { const last = [...messages].reverse().find(m => m.role === 'user'); if (last) { setMessages(prev => prev.slice(0, prev.length - 1)); sendMessage(last.content); } }} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" disabled={loading}>
                            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {(loading || imageLoading) && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                  <Avatar className="w-7 h-7"><AvatarFallback className="bg-gradient-to-br from-emerald-100 to-purple-100 text-purple-700 text-[10px] dark:from-emerald-900/30 dark:to-purple-900/30 dark:text-purple-300">LS</AvatarFallback></Avatar>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {chatMode === 'battle' ? 'Generating multiple responses...' : imageLoading ? 'Creating image...' : 'Thinking...'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* ─── Input Area ──────────────────────────── */}
        <div className="border-t dark:border-gray-800 p-2.5 sm:p-3 shrink-0">
          <form onSubmit={handleSubmit} className="flex items-end gap-1.5 sm:gap-2">
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.txt,.doc,.docx,.py,.js,.ts,.java,.cpp,.c" onChange={() => toast.info('File upload coming soon!')} />
            <input ref={scanFileInputRef} type="file" className="hidden" accept="image/*" onChange={handleScanFileSelect} />
            {chatMode !== 'image' && (
              <TooltipProvider delayDuration={300}>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="shrink-0 text-gray-400 hover:text-purple-600 dark:text-gray-500 dark:hover:text-purple-400 h-8 w-8" onClick={() => scanFileInputRef.current?.click()} disabled={loading}><Camera className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent side="top"><p className="text-xs">Smart Scanner</p></TooltipContent></Tooltip>
              </TooltipProvider>
            )}
            <div className="flex-1 min-w-0">
              <Input value={input} onChange={(e) => setInput(e.target.value)}
                placeholder={chatMode === 'battle' ? 'Enter a prompt for battle mode...' : chatMode === 'image' ? 'Describe the image to generate...' : 'Ask me anything...'}
                disabled={loading || imageLoading} className="dark:bg-gray-800 dark:border-gray-700 text-sm h-9"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) e.preventDefault(); }} />
            </div>
            <Button type="submit" disabled={loading || imageLoading || !input.trim()}
              className={`${chatMode === 'battle' ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700' : chatMode === 'image' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'bg-gradient-to-r from-emerald-600 to-purple-600 hover:from-emerald-700 hover:to-purple-700'} text-white shrink-0 h-9 w-9 p-0`}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-1.5">
            {chatMode === 'battle' ? 'One prompt → Multiple responses → Vote for the best' : chatMode === 'image' ? 'Describe any image to generate with AI' : 'Lucky Strick AI • Ask about assignments, coding, lab reports'}
          </p>
        </div>
      </Card>

      {/* ─── Scan Dialog ─────────────────────────── */}
      <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
        <DialogContent className="dark:bg-gray-900 dark:border-gray-800 sm:max-w-md">
          <div className="flex items-center gap-2 mb-3"><Camera className="w-5 h-5 text-purple-600 dark:text-purple-400" /><h3 className="text-base font-semibold">Smart Scanner</h3></div>
          {scanPreview && (
            <div className="space-y-3">
              <div className="flex justify-center rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 p-2"><img src={scanPreview.dataUrl} alt="" className="max-h-[220px] rounded-lg object-contain" /></div>
              <div><p className="text-sm font-medium mb-1.5">What would you like to know?</p><textarea value={scanQuestion} onChange={(e) => setScanQuestion(e.target.value)} placeholder="e.g., What is in this image?" className="w-full p-2 text-sm rounded-lg border dark:border-gray-700 dark:bg-gray-800 resize-none" rows={2} /></div>
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

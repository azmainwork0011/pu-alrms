'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send, Copy, Check, Trash2, RefreshCw, Square,
  Sparkles, Clover, StopCircle, ArrowUp, Loader2,
} from 'lucide-react';
import ModelSelector from './ModelSelector';
import { useAppStore } from '@/store/app';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: string;
  error?: boolean;
}

interface AIChatProps {
  user?: { name?: string; avatar?: string } | null;
}

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const STARTER_PROMPTS: Record<string, string[]> = {
  academic: [
    'Help me write an assignment introduction',
    'Explain quantum computing simply',
    'Summarize the key theories of machine learning',
    'How do I write a literature review?',
  ],
  coding: [
    'Write a Python sorting function',
    'Debug this code: arr = [1,2,3]; print(arr[3])',
    'Explain Big O notation with examples',
    'Create a REST API with Node.js',
  ],
  math: [
    'Solve: 2x + 5 = 15 step by step',
    'Find the derivative of x\u00B3 + 2x',
    'Explain the chain rule with an example',
    'What is the integral of sin(x)?',
  ],
  assignment: [
    'Structure a lab report on Ohm\'s Law',
    'Write an essay on climate change',
    'How to write a good thesis statement?',
    'Format a research paper in APA style',
  ],
  labReport: [
    'Lab report format for physics',
    'How to write a good abstract',
    'Explain the methodology section',
    'How to present data in a lab report?',
  ],
  fastChat: [
    'Quick: what is recursion?',
    'Summarize Newton\'s laws',
    'What is the speed of light?',
    'Define photosynthesis in one line',
  ],
  reasoning: [
    'Compare ML and deep learning',
    'Logical fallacies in this argument: "Everyone uses it, so it must be good"',
    'Explain the Monty Hall problem',
    'What is the scientific method?',
  ],
  bangla: [
    '\u09A1\u09BF\u09AB\u09BE\u09B0\u09C7\u09A8\u09CD\u09B6\u09BF\u09AF\u09BC\u09BE\u09B2 \u09B8\u09AE\u09C0\u0995\u09B0\u09A3 \u0995\u09BF?',
    '\u09B2\u09CD\u09AF\u09BE\u09AC \u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F \u0995\u09BF\u09AD\u09BE\u09AC\u09C7 \u09B2\u09BF\u0996\u09AC',
    '\u0995\u09CB\u09AF\u09BC\u09BE\u09A8\u09CD\u099F\u09BE\u09AE \u0995\u09AE\u09CD\u09AA\u09BF\u0989\u099F\u09BF\u0982 \u0995\u09BF?',
    '\u09AA\u09A6\u09BE\u09B0\u09CD\u09A5 \u09AC\u09BF\u099C\u09CD\u099E\u09BE\u09A8 \u0995\u09C0?',
  ],
};

const MAX_MESSAGES = 50;

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function gid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name?: string): string {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAuthToken(): string | null {
  try { return localStorage.getItem('token'); } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════
// CODE BLOCK COMPONENT
// ═══════════════════════════════════════════════════════════════

function CodeBlock({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const codeStr = typeof children === 'string' ? children : String(children).replace(/<[^>]*>/g, '');

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [codeStr]);

  // Inline code
  if (!className && typeof children === 'string' && children.length < 200) {
    return (
      <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-rose-600 dark:text-rose-400 text-[13px] font-mono" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 text-gray-300 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          {lang && <span className="ml-1.5 font-medium uppercase tracking-wider text-[11px]">{lang}</span>}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-200"
        >
          {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>}
        </button>
      </div>
      <div className="overflow-x-auto bg-gray-900 dark:bg-gray-950">
        <pre className="p-4 text-sm leading-relaxed">
          <code className={className} {...props} style={{ color: '#e2e8f0' }}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MARKDOWN COMPONENTS
// ═══════════════════════════════════════════════════════════════

const markdownComponents = {
  code: CodeBlock as any,
  p: ({ children }: any) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  h1: ({ children }: any) => <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-base font-bold mt-3 mb-1.5 first:mt-0">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-sm font-bold mt-2 mb-1 first:mt-0">{children}</h3>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  table: ({ children }: any) => <div className="overflow-x-auto my-2"><table className="w-full text-sm border-collapse">{children}</table></div>,
  th: ({ children }: any) => <th className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 font-semibold text-left">{children}</th>,
  td: ({ children }: any) => <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5">{children}</td>,
  blockquote: ({ children }: any) => <blockquote className="border-l-3 border-emerald-500 pl-3 my-2 text-gray-600 dark:text-gray-400 italic">{children}</blockquote>,
  a: ({ href, children }: any) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 underline hover:no-underline">{children}</a>,
  strong: ({ children }: any) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
};

// ═══════════════════════════════════════════════════════════════
// WELCOME SCREEN
// ═══════════════════════════════════════════════════════════════

function WelcomeScreen({
  mode,
  onPromptClick,
}: {
  mode: string;
  onPromptClick: (prompt: string) => void;
}) {
  const prompts = STARTER_PROMPTS[mode] || STARTER_PROMPTS.academic;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/40 mb-4"
      >
        <Sparkles className="w-8 h-8" />
      </motion.div>

      <motion.h2
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5"
      >
        Gemini Academic Assistant
        <Sparkles className="w-4 h-4 text-amber-400" />
      </motion.h2>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-xs"
      >
        Ask me anything about your studies. Powered by Gemini AI with persistent memory.
      </motion.p>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md space-y-2"
      >
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Try asking
        </p>
        {prompts.map((prompt, i) => (
          <motion.button
            key={i}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPromptClick(prompt)}
            className="w-full text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5 text-emerald-500 inline mr-2 -mt-0.5" />
            {prompt}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════

function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
        </div>
      </div>
      <div className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800/60 animate-pulse mb-4" />
      <div className="flex-1 space-y-4 p-2">
        {[1, 2, 3].map(i => (
          <div key={i} className={`flex gap-2.5 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse shrink-0" />
            <div className="max-w-[70%] space-y-2">
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
              <div className="h-16 w-56 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AIChat({ user }: AIChatProps) {
  const { token } = useAppStore();

  // ─── State ──────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [currentMode, setCurrentMode] = useState('academic');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Mount ──────────────────────────────────────────────
  useEffect(() => { setMounted(true); }, []);

  // ─── Load chat history from database on mount ───────────
  const fetchHistory = useCallback(async () => {
    try {
      const authToken = token || getAuthToken();
      if (!authToken) return;

      const res = await fetch('/api/ai/chat', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.messages?.length > 0) {
        const loaded = data.messages.map((msg: any) => ({
          id: msg.id || gid(),
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: new Date(msg.createdAt).getTime(),
          mode: msg.subject || 'academic',
        }));
        setMessages(loaded);
        // Use the last session ID
        if (data.sessions?.length > 0) {
          setSessionId(data.sessions[0].sessionId);
        }
      }
      setHistoryLoaded(true);
    } catch {
      setHistoryLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    if (mounted) {
      fetchHistory();
      inputRef.current?.focus();
    }
  }, [mounted, fetchHistory]);

  // ─── Auto scroll ────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // ─── Clear chat (clears DB too) ─────────────────────────
  const clearChat = useCallback(async () => {
    try {
      const authToken = token || getAuthToken();
      if (authToken) {
        await fetch('/api/ai/chat', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
      }
    } catch { /* ignore */ }
    setMessages([]);
    setSessionId('');
    setLoading(false);
    inputRef.current?.focus();
    toast.success('Chat history cleared');
  }, [token]);

  // ─── Copy message ──────────────────────────────────────
  const copyMsg = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  // ─── Retry failed message ──────────────────────────────
  const retryMessage = useCallback((failedMsg: ChatMessage) => {
    const failedIndex = messages.findIndex(m => m.id === failedMsg.id);
    if (failedIndex < 1) return;
    const userMsg = messages[failedIndex - 1];
    if (userMsg.role !== 'user') return;
    setMessages(prev => prev.filter(m => m.id !== failedMsg.id));
    setTimeout(() => sendMessage(userMsg.content), 100);
  }, [messages]);

  // ─── Send message (non-streaming via Gemini) ────────────
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsgId = gid();
    const aiMsgId = gid();

    // Optimistic UI: show user message immediately
    setMessages(prev => [
      ...prev.slice(-(MAX_MESSAGES - 2)),
      { id: userMsgId, role: 'user', content: msg, timestamp: Date.now(), mode: currentMode },
      { id: aiMsgId, role: 'assistant', content: '', timestamp: Date.now(), mode: currentMode },
    ]);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      const authToken = token || getAuthToken();
      if (!authToken) {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: 'Please sign in to use the AI assistant.', error: true } : m));
        setLoading(false);
        return;
      }

      // Build history for context (last 20 messages)
      const history = messages
        .filter(m => m.content && !m.error)
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          message: msg,
          mode: currentMode,
          history,
          sessionId: sessionId || undefined,
        }),
      });

      if (!response.ok) {
        let errorMsg = "I couldn't connect right now. Please try again.";
        if (response.status === 401) errorMsg = 'Your session has expired. Please sign in again.';
        else if (response.status === 429) errorMsg = 'Too many requests. Please wait a moment and try again.';
        else if (response.status >= 500) errorMsg = 'AI server is busy. Please try again in a moment.';

        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: errorMsg, error: true } : m));
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success && data.reply) {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: data.reply } : m));
        if (data.sessionId) setSessionId(data.sessionId);
      } else {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: data.error || 'Failed to get response.', error: true } : m));
      }
    } catch (e: any) {
      const errMsg = e?.message || 'Connection issue';
      if (errMsg.includes('401') || errMsg.includes('HTTP')) {
        toast.error('Session expired. Please sign in again.');
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: 'Your session has expired. Please sign in again.', error: true } : m));
      } else {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: 'Connection issue. Please try again!', error: true } : m));
      }
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [input, loading, currentMode, messages, token, sessionId, scrollToBottom]);

  // ─── Handle form submit ────────────────────────────────
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  }, [sendMessage]);

  // ─── Handle mode change ────────────────────────────────
  const handleModeChange = useCallback((mode: string) => {
    setCurrentMode(mode);
  }, []);

  // ─── Compute ───────────────────────────────────────────
  const hasMessages = messages.length > 0;
  const lastMsg = messages[messages.length - 1];

  if (!mounted) return <ChatSkeleton />;

  // ═════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full min-w-0 overflow-hidden">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/40"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-4.5 h-4.5" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <span className="truncate">Gemini AI Assistant</span>
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            </h1>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:block">
              Academic AI &middot; {currentMode} mode &middot; DB Memory
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {hasMessages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-xs h-9 px-2.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />Clear
            </Button>
          )}
        </div>
      </div>

      {/* ─── Mode Selector ──────────────────────────────── */}
      <div className="shrink-0 mb-3">
        <ModelSelector
          currentMode={currentMode}
          onModeChange={handleModeChange}
          disabled={loading}
        />
      </div>

      {/* ─── Chat Container ─────────────────────────────── */}
      <Card className="border dark:border-gray-800 flex-1 flex flex-col overflow-hidden min-h-0">
        {/* ─── Messages Area ───────────────────────────── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
          {!historyLoaded ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
            </div>
          ) : hasMessages ? (
            <div className="p-3 sm:p-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => {
                  const isLastStreaming = loading && msg.id === lastMsg?.id && msg.role === 'assistant' && !msg.content;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      layout
                      className={msg.role === 'user' ? 'flex gap-2.5 flex-row-reverse' : 'flex gap-2.5'}
                    >
                      {msg.role === 'user' ? (
                        <>
                          <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px] font-semibold">
                              {getInitials(user?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="max-w-[85%] sm:max-w-[70%] flex flex-col items-end">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 mr-1">
                              {formatTime(msg.timestamp)}
                            </span>
                            <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-md px-3.5 py-2.5 text-sm shadow-sm">
                              {msg.content}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                              <Sparkles className="w-3.5 h-3.5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="max-w-[85%] sm:max-w-[75%] min-w-0">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 block ml-1">
                              {formatTime(msg.timestamp)}
                            </span>
                            <div className="bg-gray-50 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm shadow-sm">
                              {msg.content ? (
                                <>
                                  <div className="prose prose-sm max-w-none dark:prose-invert text-sm">
                                    <ReactMarkdown components={markdownComponents}>
                                      {msg.content}
                                    </ReactMarkdown>
                                  </div>
                                  {isLastStreaming && <span className="inline-block w-[3px] h-[18px] ml-0.5 bg-emerald-500 rounded-full animate-pulse align-text-bottom" />}
                                </>
                              ) : isLastStreaming ? (
                                <div className="flex items-center gap-2 py-1">
                                  <div className="flex gap-1">
                                    {[0, 1, 2].map(i => (
                                      <motion.div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                                        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-gray-400">Gemini is thinking...</span>
                                </div>
                              ) : null}
                            </div>

                            {/* Action buttons — only when complete */}
                            {msg.content && !(loading && msg.id === lastMsg?.id) && (
                              <div className="flex items-center gap-0.5 mt-1 ml-1">
                                <button
                                  onClick={() => copyMsg(msg.id, msg.content)}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  title="Copy message"
                                >
                                  {copiedId === msg.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {msg.error && (
                                  <button
                                    onClick={() => retryMessage(msg)}
                                    className="p-1.5 rounded-md text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                                    title="Retry"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <WelcomeScreen mode={currentMode} onPromptClick={sendMessage} />
          )}
        </div>

        {/* ─── Loading indicator ──────────────────────────── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex justify-center pb-1"
            >
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                Generating with Gemini AI...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Input Area ──────────────────────────────── */}
        <div className="border-t dark:border-gray-800 p-2.5 sm:p-3 shrink-0 bg-white dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="flex items-end gap-1.5 sm:gap-2">
            <div className="flex-1 min-w-0 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about ${currentMode}...`}
                disabled={loading}
                className="dark:bg-gray-800 dark:border-gray-700 text-sm h-10 pr-10"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) e.preventDefault(); }}
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <StopCircle className={`w-3.5 h-3.5 transition-colors ${loading ? 'text-red-400' : 'text-gray-400 dark:text-gray-500'} opacity-60`} />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="text-white shrink-0 h-10 w-10 p-0 shadow-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-2">
            Gemini AI &middot; {currentMode} mode &middot; Bangla &amp; English &middot; Memory saved to database
          </p>
        </div>
      </Card>
    </div>
  );
}

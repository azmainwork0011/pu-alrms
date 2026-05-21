'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/app';
import { luckyStrickApi } from '@/lib/api';
import { getInitials } from '@/components/pu-helpers';
import {
  Send, Copy, Check, ChevronLeft, Clock, MessageSquare, Trash2,
  BarChart3, History, X, Globe, Calculator, Code, Zap, Briefcase,
  Atom, FlaskConical, Clover, RefreshCw, BookOpen, GraduationCap,
  Sparkles, ArrowRight, TrendingUp,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════

type LucideIcon = React.ComponentType<{ className?: string }>;

const SUBJECTS = [
  { id: 'general', label: 'General', icon: Globe, color: 'emerald', starterPrompts: ['Help me write an assignment introduction', 'Explain quantum computing simply'] },
  { id: 'math', label: 'Mathematics', icon: Calculator, color: 'blue', starterPrompts: ['Solve step by step: 2x + 5 = 15', 'Find the derivative of f(x) = x³ + 2x'] },
  { id: 'cs', label: 'Computer Science', icon: Code, color: 'violet', starterPrompts: ['Write a Python function to sort a list', 'Explain Big O notation with examples'] },
  { id: 'ee', label: 'Electrical Engineering', icon: Zap, color: 'amber', starterPrompts: ['Analyze this RC circuit step by step', 'Explain Kirchhoff\'s laws with examples'] },
  { id: 'business', label: 'Business', icon: Briefcase, color: 'rose', starterPrompts: ['Create a SWOT analysis for a startup', 'Explain the marketing mix (4Ps)'] },
  { id: 'physics', label: 'Physics', icon: Atom, color: 'cyan', starterPrompts: ['Derive the kinematic equations', 'Explain Newton\'s laws with real examples'] },
  { id: 'chemistry', label: 'Chemistry', icon: FlaskConical, color: 'orange', starterPrompts: ['Balance the equation: Fe + O₂ → Fe₂O₃', 'Explain acid-base titration step by step'] },
] as const;

type SubjectId = (typeof SUBJECTS)[number]['id'];

const SUBJECT_COLOR_MAP: Record<string, { bg: string; text: string; border: string; pill: string; pillText: string }> = {
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', pill: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', pillText: 'text-emerald-600 dark:text-emerald-400' },
  blue: { bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800', pill: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800', pillText: 'text-sky-600 dark:text-sky-400' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800', pill: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800', pillText: 'text-violet-600 dark:text-violet-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', pill: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', pillText: 'text-amber-600 dark:text-amber-400' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', pill: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', pillText: 'text-rose-600 dark:text-rose-400' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800', pill: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800', pillText: 'text-cyan-600 dark:text-cyan-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', pill: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800', pillText: 'text-orange-600 dark:text-orange-400' },
};

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  subject?: string;
}

interface HistorySession {
  sessionId: string;
  subject: string;
  preview: string;
  messageCount: number;
  lastMessageAt: string;
  totalTokens: number;
}

interface StatsData {
  totalMessages: number;
  totalTokens: number;
  totalSessions: number;
  subjectStats: { subject: string; count: number; tokens: number }[];
  dailyActivity: Record<string, number>;
  recentQueries: { preview: string; subject: string; date: string }[];
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function gid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getSubjectConfig(id: string) {
  return SUBJECTS.find(s => s.id === id) || SUBJECTS[0];
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function groupSessionsByDate(sessions: HistorySession[]): { label: string; sessions: HistorySession[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; sessions: HistorySession[]; priority: number }[] = [
    { label: 'Today', sessions: [], priority: 0 },
    { label: 'Yesterday', sessions: [], priority: 1 },
    { label: 'This Week', sessions: [], priority: 2 },
    { label: 'Older', sessions: [], priority: 3 },
  ];

  for (const sess of sessions) {
    const d = new Date(sess.lastMessageAt);
    if (d >= today) groups[0].sessions.push(sess);
    else if (d >= yesterday) groups[1].sessions.push(sess);
    else if (d >= weekAgo) groups[2].sessions.push(sess);
    else groups[3].sessions.push(sess);
  }

  return groups.filter(g => g.sessions.length > 0);
}

// ═══════════════════════════════════════════════════════════════════
// CUSTOM CODE BLOCK COMPONENT
// ═══════════════════════════════════════════════════════════════════

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

  // Inline code (no language)
  if (!className && typeof children === 'string' && children.length < 200) {
    return (
      <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-rose-600 dark:text-rose-400 text-[13px] font-mono" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header bar */}
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
      {/* Code content */}
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

// Markdown components
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

// ═══════════════════════════════════════════════════════════════════
// STREAMING CURSOR
// ═══════════════════════════════════════════════════════════════════

function StreamingCursor() {
  return (
    <span className="inline-block w-[3px] h-[18px] ml-0.5 bg-emerald-500 rounded-full animate-pulse align-text-bottom" />
  );
}

// ═══════════════════════════════════════════════════════════════════
// CLOVER BRAND ICON
// ═══════════════════════════════════════════════════════════════════

function CloverBrand({ className = 'w-5 h-5' }: { className?: string }) {
  return <Clover className={className} />;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function AIChatPage() {
  const { user } = useAppStore();

  // ─── State ──────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<SubjectId>('general');
  const [sessionId, setSessionId] = useState<string>(() => generateSessionId());

  // Panels
  const [historyOpen, setHistoryOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Data
  const [historySessions, setHistorySessions] = useState<HistorySession[]>([]);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [historyTotalMessages, setHistoryTotalMessages] = useState(0);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Computed ───────────────────────────────────────────
  const activeSubjectConfig = useMemo(() => getSubjectConfig(activeSubject), [activeSubject]);
  const activeColors = useMemo(() => SUBJECT_COLOR_MAP[activeSubjectConfig.color], [activeSubjectConfig]);
  const hasMessages = messages.length > 0;

  // ─── Scroll to bottom ──────────────────────────────────
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // ─── Auth expired listener ─────────────────────────────
  useEffect(() => {
    const handleAuthExpired = () => {
      setLoading(false);
      setMessages(p => [...p, {
        id: gid(), role: 'assistant',
        content: '⚠️ Your session has expired. Please sign in again to continue.',
        timestamp: Date.now(),
      }]);
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  // ─── Load History ──────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await luckyStrickApi.getHistory();
      setHistorySessions(data.sessions || []);
      setHistoryTotalMessages(data.totalMessages || 0);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (historyOpen) loadHistory();
  }, [historyOpen, loadHistory]);

  // ─── Load Stats ────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await luckyStrickApi.getStats();
      setStatsData(data);
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (statsOpen) loadStats();
  }, [statsOpen, loadStats]);

  // ─── Delete session ────────────────────────────────────
  const deleteSession = useCallback(async (sid: string) => {
    try {
      await luckyStrickApi.deleteHistory(sid);
      setHistorySessions(prev => prev.filter(s => s.sessionId !== sid));
      toast.success('Session deleted');
    } catch {
      toast.error('Failed to delete session');
    }
  }, []);

  // ─── Clear all history ─────────────────────────────────
  const clearAllHistory = useCallback(async () => {
    try {
      await luckyStrickApi.deleteHistory();
      setHistorySessions([]);
      setHistoryTotalMessages(0);
      toast.success('All history cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  }, []);

  // ─── Clear chat ────────────────────────────────────────
  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(generateSessionId());
    inputRef.current?.focus();
  }, []);

  // ─── Send message (streaming) ─────────────────────────
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsgId = gid();
    const aiMsgId = gid();

    setMessages(p => [...p, { id: userMsgId, role: 'user', content: msg, timestamp: Date.now(), subject: activeSubject }]);
    setMessages(p => [...p, { id: aiMsgId, role: 'assistant', content: '', timestamp: Date.now(), subject: activeSubject }]);
    setInput('');
    setLoading(true);
    scrollToBottom();

    // Build conversation history (last 20 messages for context)
    const history = messages
      .filter(m => m.content)
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const response = await luckyStrickApi.chatStream(msg, {
        subject: activeSubject,
        history,
        sessionId,
      });

      // Extract session ID from response headers
      const serverSessionId = response.headers.get('X-Session-Id');
      const serverSubject = response.headers.get('X-Subject');
      if (serverSessionId) setSessionId(serverSessionId);
      if (serverSubject && SUBJECTS.some(s => s.id === serverSubject)) {
        setActiveSubject(serverSubject as SubjectId);
      }

      // Handle non-streaming error responses
      if (!response.ok || !response.body) {
        let errorMsg = "I couldn't connect right now. Please try again!";
        if (response.status === 429) errorMsg = 'Too many requests. Please wait a moment and try again.';
        else if (response.status === 401) errorMsg = '⚠️ Your session has expired. Please sign in again.';
        setMessages(p => p.map(m => m.id === aiMsgId ? { ...m, content: errorMsg } : m));
        setLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              setMessages(p => p.map(m => m.id === aiMsgId ? { ...m, content: parsed.error } : m));
              setLoading(false);
              return;
            }
            if (parsed.content) {
              accumulated += parsed.content;
              setMessages(p => p.map(m => m.id === aiMsgId ? { ...m, content: accumulated } : m));
            }
          } catch {
            // Skip malformed chunks
          }
        }
        scrollToBottom();
      }

      // If no content was streamed
      if (!accumulated.trim()) {
        setMessages(p => p.map(m => m.id === aiMsgId ? { ...m, content: "I couldn't generate a response just now. Please try rephrasing your question!" } : m));
      }
    } catch (e: any) {
      const errMsg = e?.message || 'Connection issue';
      if (errMsg.includes('HTTP') || errMsg.includes('401')) {
        toast.error('Session expired. Please sign in again.');
        setMessages(p => p.map(m => m.id === aiMsgId ? { ...m, content: '⚠️ Your session has expired. Please sign in again.' } : m));
      } else {
        toast.error('Connection issue. Retrying...');
        setMessages(p => p.map(m => m.id === aiMsgId ? { ...m, content: "I couldn't connect right now. Please try rephrasing your question — I'll respond as soon as possible!" } : m));
      }
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [input, loading, activeSubject, sessionId, messages, scrollToBottom]);

  // ─── Starter prompt (subject card click) ──────────────
  const handleStarterPrompt = useCallback((subjectId: SubjectId, prompt: string) => {
    setActiveSubject(subjectId);
    // Small delay so subject state updates, then send
    setTimeout(() => {
      setInput('');
      // Call sendMessage with the prompt text directly
      const userMsgId = gid();
      const aiMsgId = gid();

      setMessages(p => [...p, { id: userMsgId, role: 'user', content: prompt, timestamp: Date.now(), subject: subjectId }]);
      setMessages(p => [...p, { id: aiMsgId, role: 'assistant', content: '', timestamp: Date.now(), subject: subjectId }]);
      setLoading(true);

      luckyStrickApi.chatStream(prompt, {
        subject: subjectId,
        sessionId,
        history: [],
      }).then(async (response) => {
        const serverSessionId = response.headers.get('X-Session-Id');
        if (serverSessionId) setSessionId(serverSessionId);

        if (!response.ok || !response.body) {
          setMessages(p => p.map(m => m.id === aiMsgId ? { ...m, content: "I couldn't connect right now. Please try again!" } : m));
          setLoading(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulated += parsed.content;
                setMessages(p => p.map(m => m.id === aiMsgId ? { ...m, content: accumulated } : m));
              }
            } catch { /* skip */ }
          }
          scrollToBottom();
        }

        if (!accumulated.trim()) {
          setMessages(p => p.map(m => m.id === aiMsgId ? { ...m, content: "I couldn't generate a response. Please try again!" } : m));
        }
      }).catch(() => {
        setMessages(p => p.map(m => m.id === aiMsgId ? { ...m, content: "Connection issue. Please try again!" } : m));
      }).finally(() => {
        setLoading(false);
        scrollToBottom();
      });
    }, 0);
  }, [sessionId, scrollToBottom]);

  // ─── Copy message ──────────────────────────────────────
  const copyMsg = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  // ─── Form submit ───────────────────────────────────────
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  }, [sendMessage]);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-h-[calc(100vh-8.5rem)] sm:h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-8rem)] min-w-0 overflow-hidden">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Brand icon */}
          <motion.div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/40"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Clover className="w-4.5 h-4.5" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <span className="truncate">Lucky Strick</span>
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            </h1>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:block">
                Academic AI Assistant
              </p>
              {hasMessages && (
                <Badge variant="outline" className={`text-[10px] h-5 px-1.5 border ${activeColors.pill} ${activeColors.pillText}`}>
                  <activeSubjectConfig.icon className="w-2.5 h-2.5 mr-0.5" />
                  {activeSubjectConfig.label}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {hasMessages && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs h-9 px-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <Trash2 className="w-3.5 h-3.5 mr-1" />Clear
            </Button>
          )}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)} className="text-xs h-9 px-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <History className="w-3.5 h-3.5 mr-1" />History
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p className="text-xs">Chat history</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => setStatsOpen(true)} className="text-xs h-9 px-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <BarChart3 className="w-3.5 h-3.5 mr-1" />Stats
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p className="text-xs">Usage analytics</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* ─── Subject Selector (always visible) ───────────── */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        {SUBJECTS.map(s => {
          const isActive = s.id === activeSubject;
          const colors = SUBJECT_COLOR_MAP[s.color];
          return (
            <button
              key={s.id}
              onClick={() => setActiveSubject(s.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap
                transition-all duration-200 shrink-0
                ${isActive
                  ? `${colors.pill} border-current shadow-sm`
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
                }
              `}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Chat Container ──────────────────────────────── */}
      <Card className="border dark:border-gray-800 flex-1 flex flex-col overflow-hidden min-h-0">
        {/* ─── Messages Area ─────────────────────────────── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
          {hasMessages ? (
            /* ─── Chat Messages ─────────────────────────── */
            <div className="p-3 sm:p-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => {
                  const lastMsg = messages[messages.length - 1];
                  const isLastStreaming = loading && msg.id === lastMsg.id && msg.role === 'assistant';

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
                              {getInitials(user?.name || 'U')}
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
                          {/* AI Avatar with Clover */}
                          <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                              <Clover className="w-3.5 h-3.5" />
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
                                  {isLastStreaming && <StreamingCursor />}
                                </>
                              ) : (
                                isLastStreaming && (
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
                                    <span className="text-xs text-gray-400">Thinking...</span>
                                  </div>
                                )
                              )}
                            </div>
                            {/* Action buttons — only when complete */}
                            {msg.content && !(loading && msg.id === lastMsg?.id) && (
                              <div className="flex items-center gap-0.5 mt-1 ml-1">
                                <button
                                  onClick={() => copyMsg(msg.id, msg.content)}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                  {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
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
            /* ─── Welcome Screen ────────────────────────── */
            <WelcomeScreen
              onStarterPrompt={handleStarterPrompt}
              stats={{
                totalMessages: historyTotalMessages || statsData?.totalMessages || 0,
                totalSessions: statsData?.totalSessions || 0,
                subjectsExplored: statsData?.subjectStats?.length || 0,
              }}
            />
          )}
        </div>

        {/* ─── Input Area ──────────────────────────────── */}
        <div className="border-t dark:border-gray-800 p-2.5 sm:p-3 shrink-0 bg-white dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="flex items-end gap-1.5 sm:gap-2">
            <div className="flex-1 min-w-0 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask Lucky Strick about ${activeSubjectConfig.label.toLowerCase()}...`}
                disabled={loading}
                className="dark:bg-gray-800 dark:border-gray-700 text-sm h-10 pr-10"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) e.preventDefault(); }}
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <activeSubjectConfig.icon className={`w-3.5 h-3.5 ${activeColors.pillText} opacity-60`} />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="text-white shrink-0 h-10 w-10 p-0 shadow-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
          <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-2">
            <GraduationCap className="w-3 h-3 inline mr-1 -mt-0.5" />
            Powered by Lucky Strick AI &middot; {activeSubjectConfig.label} Mode
          </p>
        </div>
      </Card>

      {/* ─── History Sheet ──────────────────────────────── */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md p-0 bg-white dark:bg-gray-900">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <History className="w-4 h-4 text-emerald-500" />
              Chat History
            </SheetTitle>
            <SheetDescription className="text-xs">
              Your past conversations with Lucky Strick
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pt-3 pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllHistory}
              className="w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800"
            >
              <Trash2 className="w-3 h-3 mr-1.5" />
              Clear All History
            </Button>
          </div>

          <ScrollArea className="flex-1 h-[calc(100vh-12rem)]">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
              </div>
            ) : historySessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-400 dark:text-gray-500">No chat history yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Start a conversation to see it here</p>
              </div>
            ) : (
              <div className="px-4 pb-6">
                {groupSessionsByDate(historySessions).map(group => (
                  <div key={group.label} className="mb-4">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                      {group.label}
                    </p>
                    <div className="space-y-1.5">
                      {group.sessions.map(sess => {
                        const subjConfig = getSubjectConfig(sess.subject);
                        const subjColors = SUBJECT_COLOR_MAP[subjConfig.color];
                        return (
                          <motion.div
                            key={sess.sessionId}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`group flex items-start gap-3 p-3 rounded-xl border ${subjColors.border} ${subjColors.bg} hover:shadow-sm transition-all cursor-pointer`}
                          >
                            <div className={`w-8 h-8 rounded-lg ${subjColors.bg} border ${subjColors.border} flex items-center justify-center shrink-0`}>
                              <subjConfig.icon className={`w-4 h-4 ${subjColors.text}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className={`text-xs font-semibold ${subjColors.text}`}>{subjConfig.label}</span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                                  {sess.messageCount} msgs
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                {sess.preview || 'Empty conversation'}
                              </p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">
                                {new Date(sess.lastMessageAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteSession(sess.sessionId); }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all shrink-0 mt-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* ─── Stats Dialog ───────────────────────────────── */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900 border dark:border-gray-800 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Usage Analytics
            </DialogTitle>
            <DialogDescription className="text-xs">
              Your Lucky Strick AI usage statistics
            </DialogDescription>
          </DialogHeader>

          {statsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
            </div>
          ) : statsData ? (
            <div className="space-y-5 mt-2">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{statsData.totalMessages}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Messages</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                  <p className="text-lg font-bold text-violet-700 dark:text-violet-300">{statsData.totalSessions}</p>
                  <p className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">Sessions</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                    {(statsData.totalTokens / 1000).toFixed(1)}k
                  </p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Tokens</p>
                </div>
              </div>

              {/* Subject distribution */}
              {statsData.subjectStats.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Subject Distribution
                  </h3>
                  <div className="space-y-2">
                    {statsData.subjectStats
                      .sort((a, b) => b.count - a.count)
                      .map(stat => {
                        const subj = getSubjectConfig(stat.subject);
                        const colors = SUBJECT_COLOR_MAP[subj.color];
                        const maxCount = Math.max(...statsData.subjectStats.map(s => s.count));
                        const barWidth = Math.max(8, (stat.count / maxCount) * 100);
                        return (
                          <div key={stat.subject} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-md ${colors.bg} flex items-center justify-center shrink-0`}>
                              <subj.icon className={`w-3.5 h-3.5 ${colors.text}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{subj.label}</span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">{stat.count} msgs</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${barWidth}%` }}
                                  transition={{ duration: 0.6, ease: 'easeOut' }}
                                  className={`h-full rounded-full bg-gradient-to-r ${subj.color === 'emerald' ? 'from-emerald-400 to-teal-400' : subj.color === 'blue' ? 'from-sky-400 to-blue-400' : subj.color === 'violet' ? 'from-violet-400 to-purple-400' : subj.color === 'amber' ? 'from-amber-400 to-yellow-400' : subj.color === 'rose' ? 'from-rose-400 to-pink-400' : subj.color === 'cyan' ? 'from-cyan-400 to-teal-400' : 'from-orange-400 to-amber-400'}`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Daily activity (last 7 days) */}
              {statsData.dailyActivity && Object.keys(statsData.dailyActivity).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    <TrendingUp className="w-3 h-3 inline mr-1 -mt-0.5" />
                    Daily Activity (7 days)
                  </h3>
                  <div className="flex items-end gap-1.5 h-20">
                    {Object.entries(statsData.dailyActivity).map(([date, count]) => {
                      const dayLabel = new Date(date).toLocaleDateString('en', { weekday: 'short' });
                      const maxVal = Math.max(...Object.values(statsData.dailyActivity), 1);
                      const barH = Math.max(4, (count / maxVal) * 100);
                      const isToday = date === new Date().toISOString().split('T')[0];
                      return (
                        <div key={date} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{count}</span>
                          <div className="w-full flex items-end" style={{ height: '56px' }}>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${barH}%` }}
                              transition={{ duration: 0.5, delay: 0.1 }}
                              className={`w-full rounded-t-md ${isToday ? 'bg-gradient-to-t from-emerald-500 to-teal-400' : 'bg-gray-200 dark:bg-gray-700'}`}
                            />
                          </div>
                          <span className={`text-[9px] ${isToday ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                            {dayLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent queries */}
              {statsData.recentQueries.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Recent Questions
                  </h3>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {statsData.recentQueries.map((q, i) => {
                      const subj = getSubjectConfig(q.subject);
                      return (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <subj.icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{q.preview}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart3 className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-400">No usage data yet</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WELCOME SCREEN
// ═══════════════════════════════════════════════════════════════════

function WelcomeScreen({
  onStarterPrompt,
  stats,
}: {
  onStarterPrompt: (subjectId: SubjectId, prompt: string) => void;
  stats: { totalMessages: number; totalSessions: number; subjectsExplored: number };
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
      {/* Brand */}
      <motion.div
        className="relative mb-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-200/50 dark:shadow-emerald-900/40">
          <Clover className="w-8 h-8 text-white" />
        </div>
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="w-5 h-5 text-amber-400" />
        </motion.div>
      </motion.div>

      <motion.h2
        className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Lucky Strick
      </motion.h2>
      <motion.p
        className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Your academic AI assistant. Choose a subject below to get started with expert-level help.
      </motion.p>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full max-w-2xl">
        {SUBJECTS.map((subject, i) => {
          const colors = SUBJECT_COLOR_MAP[subject.color];
          return (
            <motion.button
              key={subject.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              onClick={() => onStarterPrompt(subject.id, subject.starterPrompts[0])}
              className={`group text-left p-3.5 rounded-xl border ${colors.border} ${colors.bg} hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <subject.icon className={`w-4 h-4 ${colors.text}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-sm font-semibold ${colors.text}`}>{subject.label}</span>
                    <ArrowRight className={`w-3 h-3 ${colors.text} opacity-0 group-hover:opacity-60 transition-opacity`} />
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {subject.starterPrompts[0]}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Stats Bar */}
      <motion.div
        className="flex items-center gap-4 mt-6 px-4 py-2.5 rounded-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <MessageSquare className="w-3 h-3" />
          <span>{stats.totalMessages} messages</span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{stats.totalSessions} sessions</span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <BookOpen className="w-3 h-3" />
          <span>{stats.subjectsExplored} subjects explored</span>
        </div>
      </motion.div>

      {/* Capabilities */}
      <motion.div
        className="flex flex-wrap gap-1.5 mt-4 justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {['Step-by-step solutions', 'Code generation', 'Lab reports', 'Essay writing', 'Bangla + English', '24/7 Available'].map((cap, i) => (
          <span
            key={i}
            className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
          >
            {cap}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

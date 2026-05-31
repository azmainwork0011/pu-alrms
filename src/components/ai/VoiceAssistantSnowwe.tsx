'use client';

/**
 * Snowwe — Voice Assistant v2 (Gemini Pro + Google Cloud Neural2 TTS)
 *
 * Premium voice assistant with:
 * - Advanced Gemini Pro brain: Deep thinking, natural Bangla, logical reasoning
 * - Google Cloud TTS Neural2-A: Ultra-realistic human-like Bangla voice
 * - Fallback: Browser SpeechSynthesis if TTS unavailable
 * - Enhanced Bangla SpeechRecognition: bn-BD with pause detection
 * - Beautiful UI states: Listening → Thinking → Speaking
 * - Conversation history with context awareness
 * - SPA navigation via Zustand setPage()
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, RotateCcw, Brain, Radio, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore, type PageView } from '@/store/app';
import { toast } from 'sonner';

// ─── Snowwe's Initial Greeting ────────────────────────────
const SNOWWE_GREETING = 'আসসালামু আলাইকুম! আমি স্নোয়ি, PU-ALRMS এর ভয়েস অ্যাসিস্ট্যান্ট। আজকে আপনাকে কীভাবে সাহায্য করতে পারি?';

// ─── Status Types ─────────────────────────────────────────
type SnowweStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

// ─── Browser Speech API Types ─────────────────────────────
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onaudiostart: (() => void) | null;
  onaudioend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

// ─── Valid pages for navigation ────────────────────────────
const VALID_NAVIGATION: Record<string, PageView> = {
  'dashboard': 'dashboard',
  'admin-panel': 'admin-panel',
  'admin panel': 'admin-panel',
  'assignments': 'assignments',
  'lab-reports': 'lab-reports',
  'lab reports': 'lab-reports',
  'create-assignment': 'create-assignment',
  'submissions': 'submissions',
  'my-tasks': 'student-tasks',
  'student-tasks': 'student-tasks',
  'leaderboard': 'leaderboard',
  'announcements': 'announcements',
  'batch-chat': 'student-community',
  'student-community': 'student-community',
  'community': 'student-community',
  'chat': 'student-community',
  'quiz': 'quiz',
  'code-quest': 'code-quest',
  'books': 'books',
  'digital-library': 'books',
  'library': 'books',
  'ai-chat': 'ai-chat',
  'lucky-strick': 'ai-chat',
  'notifications': 'notifications',
  'profile': 'profile',
  'cr-dashboard': 'cr-dashboard',
};

// ═══════════════════════════════════════════════════════════════════
//  Snowwe Component
// ═══════════════════════════════════════════════════════════════════
export default function VoiceAssistantSnowwe() {
  const { currentPage, setPage, token, isAuthenticated } = useAppStore();
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<SnowweStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  // Detect SpeechRecognition support (computed once, client-only)
  const [supported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  });
  const [ttsAvailable, setTtsAvailable] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'snowwe'; text: string }[]>([]);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasGreetedRef = useRef(false);
  const transcriptRef = useRef('');
  const interimRef = useRef('');
  const statusRef = useRef<SnowweStatus>('idle');
  const processVoiceIntentRef = useRef<(text: string) => void>(() => {});

  // Keep refs in sync
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { interimRef.current = interimTranscript; }, [interimTranscript]);
  useEffect(() => { statusRef.current = status; }, [status]);

  // ─── Detect Bangla characters ─────────────────────────
  const containsBangla = useCallback((text: string): boolean => {
    return /[\u0980-\u09FF]/.test(text);
  }, []);

  // ─── Play premium audio from backend (Google Cloud TTS) ──
  const playPremiumAudio = useCallback((base64Audio: string) => {
    if (isMuted) return;

    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();

    try {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audio.onplay = () => setStatus('speaking');
      audio.onended = () => setStatus('idle');
      audio.onerror = () => {
        console.warn('[Snowwe] Audio playback error, falling back to SpeechSynthesis');
        setStatus('idle');
      };
      audioRef.current = audio;
      audio.play().catch(() => {
        setStatus('idle');
      });
    } catch {
      setStatus('idle');
    }
  }, [isMuted]);

  // ─── Find best female voice (fallback) ───────────────────
  const getFemaleVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();

    const bnFemale = voices.find(v => v.lang.includes('bn') && v.name.toLowerCase().includes('google'));
    if (bnFemale) return bnFemale;

    const bnVoice = voices.find(v => v.lang.includes('bn'));
    if (bnVoice) return bnVoice;

    const enFemale = voices.find(v =>
      v.lang.includes('en') && (
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('google')
      )
    );
    if (enFemale) return enFemale;

    const enGoogle = voices.find(v => v.lang.includes('en') && v.name.toLowerCase().includes('google'));
    return enGoogle || null;
  }, []);

  // ─── Browser TTS fallback ──────────────────────────────
  const speakWithBrowser = useCallback((text: string, lang?: 'bn-BD' | 'en-US') => {
    if (!window.speechSynthesis || isMuted) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const detectedLang = lang || (containsBangla(text) ? 'bn-BD' : 'en-US');
    utterance.lang = detectedLang;

    const voice = getFemaleVoice();
    if (voice) utterance.voice = voice;

    utterance.pitch = detectedLang === 'bn-BD' ? 1.15 : 1.1;
    utterance.rate = detectedLang === 'bn-BD' ? 0.95 : 1.0;
    utterance.volume = 1;

    utterance.onstart = () => setStatus('speaking');
    utterance.onend = () => setStatus('idle');
    utterance.onerror = () => setStatus('idle');

    window.speechSynthesis.speak(utterance);
  }, [containsBangla, getFemaleVoice, isMuted]);

  // ─── Auto-greeting ──────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || hasGreetedRef.current || !supported) return;

    const timer = setTimeout(() => {
      hasGreetedRef.current = true;
      setHasGreeted(true);
      setConversationHistory([{ role: 'snowwe', text: SNOWWE_GREETING }]);
      speakWithBrowser(SNOWWE_GREETING, 'bn-BD');
    }, 2500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, speakWithBrowser, supported]);

  // ─── Load voices ────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // ─── Initialize Enhanced SpeechRecognition ──────────────
  useEffect(() => {
    if (!supported) return;

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor() as SpeechRecognitionInstance;

    // Enhanced Bangla recognition config
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = 'bn-BD'; // Default to Bangla

    recognition.onstart = () => {
      setStatus('listening');
      setInterimTranscript('');
    };

    recognition.onspeechstart = () => {
      setStatus('listening');
    };

    recognition.onspeechend = () => {
      // User paused speaking — will auto-process when recognition ends
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript(prev => prev ? `${prev} ${final}` : final);
        // Auto-detect language for better recognition accuracy
        if (containsBangla(final)) {
          recognition.lang = 'bn-BD';
        } else {
          recognition.lang = 'en-US';
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.error('[Snowwe] Recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('মাইক্রোফোন পারমিশন দেওয়া হয়নি। ব্রাউজার সেটিংস থেকে মাইক্রোফোন অনুমতি দিন।');
        }
      }
      setStatus('idle');
    };

    recognition.onend = () => {
      setStatus('idle');
      // Auto-send when recognition ends with transcript
      const currentTranscript = transcriptRef.current || interimRef.current;
      if (currentTranscript && statusRef.current !== 'thinking') {
        processVoiceIntentRef.current(currentTranscript);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.abort(); } catch { /* ignore */ }
    };
  }, [containsBangla]);

  // ─── Process voice intent via API ────────────────────
  const processVoiceIntent = useCallback(async (text: string) => {
    if (!text.trim() || statusRef.current === 'thinking') return;
    setStatus('thinking');
    setAiResponse('');

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/ai/voice-assistant', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transcript: text,
          currentPageState: currentPage,
          conversationHistory: conversationHistory.slice(-6),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ reply: '' }));
        const errorMsg = errData.reply || 'দুঃখিত, কিছু একটা সমস্যা হয়েছে।';
        setAiResponse(errorMsg);
        setConversationHistory(prev => [...prev, { role: 'user', text }, { role: 'snowwe', text: errorMsg }]);
        setStatus('idle');
        speakWithBrowser(errorMsg);
        return;
      }

      const data = await res.json();
      const reply = data.reply || 'দুঃখিত, উত্তর পাওয়া যায়নি।';

      // Check if TTS audio was provided
      if (data.audioBuffer && !isMuted) {
        setTtsAvailable(true);
        setAiResponse(reply);
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', text },
          { role: 'snowwe', text: reply },
        ]);
        playPremiumAudio(data.audioBuffer);
      } else {
        // Fallback to browser TTS
        setTtsAvailable(false);
        setAiResponse(reply);
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', text },
          { role: 'snowwe', text: reply },
        ]);
        speakWithBrowser(reply);
      }

      // SPA Navigation
      if (data.navigation) {
        const navTarget = data.navigation as PageView;
        setPage(navTarget);
        toast.success(`নেভিগেট করা হচ্ছে`, {
          description: navTarget.replace(/-/g, ' '),
          icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
        });
      }
    } catch (err) {
      const errorMsg = 'সংযোগে সমস্যা হচ্ছে। আবার চেষ্টা করুন।';
      setAiResponse(errorMsg);
      setConversationHistory(prev => [...prev, { role: 'user', text }, { role: 'snowwe', text: errorMsg }]);
      setStatus('idle');
      speakWithBrowser(errorMsg);
    }
  }, [token, currentPage, setPage, isMuted, conversationHistory, speakWithBrowser, playPremiumAudio]);

  // Keep ref in sync so SpeechRecognition onend handler always calls latest version
  useEffect(() => {
    processVoiceIntentRef.current = processVoiceIntent;
  }, [processVoiceIntent]);

  // ─── Toggle listening ─────────────────────────────────
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (status === 'listening') {
      recognitionRef.current.stop();
      setStatus('idle');
    } else if (status === 'thinking' || status === 'speaking') {
      // Stop current action
      recognitionRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis?.cancel();
      setStatus('idle');
    } else {
      // Start new listening session
      setTranscript('');
      setInterimTranscript('');
      setAiResponse('');
      recognitionRef.current.lang = 'bn-BD';
      try {
        recognitionRef.current.start();
      } catch {
        toast.error('মাইক্রোফোন পারমিশন চেক করুন।');
      }
    }
  }, [status]);

  // ─── Toggle mute ─────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      if (aiResponse) speakWithBrowser(aiResponse);
    } else {
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis?.cancel();
      setStatus('idle');
    }
  }, [isMuted, aiResponse, speakWithBrowser]);

  // ─── Trigger greeting ────────────────────────────────
  const triggerGreeting = useCallback(() => {
    if (status === 'speaking') {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis?.cancel();
      setStatus('idle');
      return;
    }
    speakWithBrowser(SNOWWE_GREETING, 'bn-BD');
  }, [status, speakWithBrowser]);

  // ─── Reset conversation ──────────────────────────────
  const resetConversation = useCallback(() => {
    recognitionRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setStatus('idle');
    setTranscript('');
    setInterimTranscript('');
    setAiResponse('');
    setConversationHistory([]);
  }, []);

  // ─── Close panel ────────────────────────────────────
  const closePanel = useCallback(() => {
    recognitionRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setStatus('idle');
    setExpanded(false);
  }, []);

  // ─── Cleanup ────────────────────────────────────────
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }
      if (audioRef.current) audioRef.current.pause();
      window.speechSynthesis?.cancel();
    };
  }, []);

  if (!supported) return null;

  // ─── Status config for UI ────────────────────────────
  const statusConfig: Record<SnowweStatus, { label: string; icon: React.ReactNode; color: string }> = {
    idle: {
      label: 'মাইকে ট্যাপ করুন',
      icon: <Mic className="w-4 h-4" />,
      color: 'text-gray-400',
    },
    listening: {
      label: 'শুনছি...',
      icon: <Radio className="w-4 h-4 animate-pulse" />,
      color: 'text-red-400',
    },
    thinking: {
      label: 'ভাবছি...',
      icon: <Brain className="w-4 h-4 animate-pulse" />,
      color: 'text-amber-400',
    },
    speaking: {
      label: ttsAvailable ? 'Snowwe (Neural2)' : 'বলছি...',
      icon: <Volume2 className="w-4 h-4" />,
      color: 'text-emerald-400',
    },
    error: {
      label: 'সমস্যা হয়েছে',
      icon: <X className="w-4 h-4" />,
      color: 'text-red-400',
    },
  };

  // ═══════════════════════════════════════════════════════
  //  Render
  // ═══════════════════════════════════════════════════════
  return (
    <>
      {/* ─── Floating Button ──────────────────────────── */}
      <AnimatePresence>
        {!expanded && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setExpanded(true)}
            className="fixed bottom-20 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center cursor-pointer"
            aria-label="Open Snowwe voice assistant"
          >
            {status === 'speaking' ? (
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                <Volume2 className="w-6 h-6" />
              </motion.div>
            ) : status === 'listening' ? (
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
                <Mic className="w-6 h-6" />
              </motion.div>
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Snowwe Chat Panel ────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-96 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* ─── Header ────────────────────────────── */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10">
              <div className="flex items-center gap-2.5">
                {/* Snowwe Avatar with status ring */}
                <div className="relative">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md ${
                    status === 'listening' ? 'ring-2 ring-red-400/50 shadow-red-400/20' :
                    status === 'thinking' ? 'ring-2 ring-amber-400/50 shadow-amber-400/20' :
                    status === 'speaking' ? 'ring-2 ring-emerald-400/50 shadow-emerald-400/20' :
                    ''
                  }`}>
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  {/* Animated status dot */}
                  {status !== 'idle' && (
                    <motion.div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                        status === 'listening' ? 'bg-red-500' :
                        status === 'thinking' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                    Snowwe
                    {ttsAvailable && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium">
                        Neural2
                      </span>
                    )}
                  </h3>
                  <p className={`text-[10px] ${statusConfig[status].color} flex items-center gap-1`}>
                    {statusConfig[status].icon}
                    {statusConfig[status].label}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className={`h-7 w-7 ${isMuted ? 'text-red-500' : 'text-gray-400'}`} onClick={toggleMute} title={isMuted ? 'আনমিউট' : 'মিউট'}>
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-emerald-500" onClick={triggerGreeting} title="স্নোয়ির গ্রিটিং শুনুন">
                  <Volume2 className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onClick={closePanel}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* ─── Content / Chat History ──────────────── */}
            <div className="p-3 space-y-2.5 max-h-80 overflow-y-auto scroll-smooth">
              {/* Speaking Waveform Animation (premium feel) */}
              {status === 'speaking' && (
                <div className="flex items-center justify-center gap-1 py-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                    <motion.div
                      key={i}
                      className="w-1 bg-gradient-to-t from-emerald-400 to-teal-300 rounded-full"
                      animate={{ height: [4, 22, 4] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.06,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Listening Pulse Animation */}
              {status === 'listening' && (
                <div className="flex items-center justify-center gap-1.5 py-2">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-red-400"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-xs text-red-400 font-medium">আপনার কথা শুনছি...</span>
                  <motion.div
                    className="w-2 h-2 rounded-full bg-red-400"
                    animate={{ scale: [1, 1.8, 1], opacity: [1, 0.6, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                  />
                </div>
              )}

              {/* Thinking Animation */}
              {status === 'thinking' && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl rounded-bl-sm bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100/50 dark:border-amber-800/30">
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                    <div>
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">চিন্তা করছি</span>
                      <div className="flex gap-1 mt-0.5">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-1 h-1 rounded-full bg-amber-400"
                            animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Conversation History */}
              {conversationHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-500/10 text-gray-800 dark:text-gray-200 rounded-br-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                  }`}>
                    <p className="font-medium text-[10px] text-gray-400 mb-0.5">
                      {msg.role === 'user' ? 'আপনি' : '❄️ স্নোয়ি'}
                      {msg.role === 'snowwe' && ttsAvailable && (
                        <span className="ml-1 text-emerald-500 text-[8px]">Neural2</span>
                      )}
                    </p>
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Current Transcript (interim) */}
              {interimTranscript && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-[13px] bg-emerald-500/5 text-gray-500 dark:text-gray-400 italic">
                    {interimTranscript}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!conversationHistory.length && status === 'idle' && (
                <div className="text-center py-6">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">হ্যালো! আমি স্নোয়ি ❄️</p>
                  <p className="text-xs text-gray-400 mt-1">PU-ALRMS ভয়েস অ্যাসিস্ট্যান্ট</p>
                  <p className="text-[10px] text-gray-400 mt-1.5">বাংলা ও English — মাইক বাটনে ট্যাপ করুন</p>
                  {ttsAvailable && (
                    <p className="text-[9px] text-emerald-500 mt-1 flex items-center justify-center gap-1">
                      <Volume2 className="w-3 h-3" /> Google Neural2 ভয়েস অন আছে
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ─── Bottom Controls ─────────────────────── */}
            <div className="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
              {/* Left: Reset */}
              {conversationHistory.length > 0 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onClick={resetConversation} title="রিসেট">
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              )}

              {/* Center: Mic Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleListening}
                className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 ${
                  status === 'listening'
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/40'
                    : status === 'thinking'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/40'
                    : status === 'speaking'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/40'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50'
                }`}
                aria-label={
                  status === 'listening' ? 'Stop listening' :
                  status === 'thinking' ? 'Cancel' :
                  status === 'speaking' ? 'Stop speaking' :
                  'Start listening'
                }
              >
                {/* Pulse rings when listening */}
                {status === 'listening' && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-red-300"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border border-red-200"
                      animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    />
                  </>
                )}

                {status === 'listening' ? (
                  <MicOff className="w-5 h-5" />
                ) : status === 'thinking' ? (
                  <X className="w-5 h-5" />
                ) : status === 'speaking' ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </motion.button>

              {/* Right spacer for balance */}
              <div className="w-8" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

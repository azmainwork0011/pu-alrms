'use client';

/**
 * Snowwe — Voice Assistant for PU-ALRMS
 *
 * A named, warm, female AI voice assistant with:
 * - Initial Bangla greeting: "আসসালামু আলাইকুম, আমি PU-ALRMS থেকে স্নোয়ি বলছি।"
 * - Web Speech API for voice recognition (Bangla + English)
 * - SpeechSynthesis for TTS response with female voice preference
 * - SPA navigation via Zustand setPage() — NO window.location
 * - Persistent floating button + expandable chat panel
 * - Animated waveform when speaking
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, Send, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore, type PageView } from '@/store/app';
import { toast } from 'sonner';

// ─── Snowwe's Initial Greeting ────────────────────────────
const SNOWWE_GREETING = 'আসসালামু আলাইকুম, আমি PU-ALRMS থেকে স্নোয়ি বলছি। আজকে আপনাকে কীভাবে সাহায্য করতে পারি?';

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
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

// ─── Valid pages for navigation (matches Zustand PageView) ─
const VALID_NAVIGATION: Record<string, PageView> = {
  'dashboard': 'dashboard',
  'admin-panel': 'admin-panel',
  'admin panel': 'admin-panel',
  'assignments': 'assignments',
  'lab-reports': 'lab-reports',
  'lab reports': 'lab-reports',
  'create-assignment': 'create-assignment',
  'create assignment': 'create-assignment',
  'submissions': 'submissions',
  'my-tasks': 'student-tasks',
  'student-tasks': 'student-tasks',
  'my tasks': 'student-tasks',
  'leaderboard': 'leaderboard',
  'announcements': 'announcements',
  'batch-chat': 'student-community',
  'student-community': 'student-community',
  'community': 'student-community',
  'chat': 'student-community',
  'quiz': 'quiz',
  'quick-quiz': 'quiz',
  'code-quest': 'code-quest',
  'learn-with-game': 'code-quest',
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
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'snowwe'; text: string }[]>([]);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const hasGreetedRef = useRef(false);

  // ─── Detect Bangla characters ─────────────────────────
  const containsBangla = useCallback((text: string): boolean => {
    return /[\u0980-\u09FF]/.test(text);
  }, []);

  // ─── Find best female voice ───────────────────────────
  const getFemaleVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();

    // Priority 1: Bengali female Google voice
    const bnFemale = voices.find(v =>
      v.lang.includes('bn') && v.name.toLowerCase().includes('google মহিলা')
    );
    if (bnFemale) return bnFemale;

    // Priority 2: Bengali Google voice (any)
    const bnGoogle = voices.find(v =>
      v.lang.includes('bn') && v.name.toLowerCase().includes('google')
    );
    if (bnGoogle) return bnGoogle;

    // Priority 3: Any Bengali voice
    const bnVoice = voices.find(v => v.lang.includes('bn'));
    if (bnVoice) return bnVoice;

    // Priority 4: English female voice
    const enFemale = voices.find(v =>
      v.lang.includes('en') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('google'))
    );
    if (enFemale) return enFemale;

    // Priority 5: Any English Google voice
    const enGoogle = voices.find(v =>
      v.lang.includes('en') && v.name.toLowerCase().includes('google')
    );
    return enGoogle || null;
  }, []);

  // ─── Speak text with female voice ─────────────────────
  const speak = useCallback((text: string, lang?: 'bn-BD' | 'en-US') => {
    if (!window.speechSynthesis || isMuted) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const detectedLang = lang || (containsBangla(text) ? 'bn-BD' : 'en-US');
    utterance.lang = detectedLang;

    // Get female voice
    const voice = getFemaleVoice();
    if (voice) utterance.voice = voice;

    // Configure for natural female voice
    utterance.pitch = detectedLang === 'bn-BD' ? 1.15 : 1.1;
    utterance.rate = detectedLang === 'bn-BD' ? 0.95 : 1.0;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [containsBangla, getFemaleVoice, isMuted]);

  // ─── Auto-greeting after first login ───────────────────
  useEffect(() => {
    if (!isAuthenticated || hasGreetedRef.current || !supported) return;

    // Delay greeting slightly for UX
    const timer = setTimeout(() => {
      hasGreetedRef.current = true;
      setHasGreeted(true);
      setConversationHistory(prev => [...prev, { role: 'snowwe', text: SNOWWE_GREETING }]);
      speak(SNOWWE_GREETING, 'bn-BD');
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, speak, supported]);

  // ─── Load voices when available ───────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // ─── Initialize SpeechRecognition ─────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') {
      setSupported(false);
      return;
    }

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor() as SpeechRecognitionInstance;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'bn-BD'; // Default to Bangla

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
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
        // Auto-detect language
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
        console.error('[Snowwe] Speech recognition error:', event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-send when recognition ends with transcript
      const currentTranscript = transcript || interimTranscript;
      if (currentTranscript && !loading && !aiResponse) {
        processVoiceIntent(currentTranscript);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.abort(); } catch { /* ignore */ }
    };
  }, [containsBangla]);

  // ─── Process voice intent via API ────────────────────
  const processVoiceIntent = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
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
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ reply: '' }));
        const errorMsg = errData.reply || 'দুঃখিত, কিছু একটা সমস্যা হয়েছে।';
        setAiResponse(errorMsg);
        setConversationHistory(prev => [...prev, { role: 'snowwe', text: errorMsg }]);
        setLoading(false);
        if (!isMuted) speak(errorMsg);
        return;
      }

      const data = await res.json();
      const reply = data.reply || 'দুঃখিত, উত্তর পাওয়া যায়নি।';
      setAiResponse(reply);
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', text },
        { role: 'snowwe', text: reply },
      ]);

      // Speak the response
      if (!isMuted) speak(reply);

      // SPA Navigation via Zustand setPage() — NEVER window.location
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
      setConversationHistory(prev => [...prev, { role: 'snowwe', text: errorMsg }]);
      if (!isMuted) speak(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, setPage, isMuted, speak]);

  // ─── Toggle listening ─────────────────────────────────
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Reset for new session
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
  }, [isListening]);

  // ─── Toggle mute ─────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      if (aiResponse) speak(aiResponse);
    } else {
      setIsMuted(true);
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  }, [isMuted, aiResponse, speak]);

  // ─── Manual greeting trigger ─────────────────────────
  const triggerGreeting = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      return;
    }
    speak(SNOWWE_GREETING, 'bn-BD');
  }, [isSpeaking, speak]);

  // ─── Reset conversation ─────────────────────────────
  const resetConversation = useCallback(() => {
    if (isListening) recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setTranscript('');
    setInterimTranscript('');
    setAiResponse('');
    setLoading(false);
    setConversationHistory([]);
  }, [isListening]);

  // ─── Close panel ─────────────────────────────────────
  const closePanel = useCallback(() => {
    if (isListening) recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setExpanded(false);
  }, [isListening]);

  // ─── Cleanup on unmount ─────────────────────────────
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }
      window.speechSynthesis?.cancel();
    };
  }, []);

  if (!supported) return null;

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
            {isSpeaking ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Volume2 className="w-6 h-6" />
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
                {/* Snowwe Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                    Snowwe
                    {isSpeaking && (
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="inline-block w-2 h-2 rounded-full bg-emerald-500"
                      />
                    )}
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {isListening ? 'শুনছি...' : isSpeaking ? 'বলছি...' : loading ? 'ভাবছি...' : 'মাইকে ট্যাপ করুন'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {/* Mute toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${isMuted ? 'text-red-500' : 'text-gray-400'}`}
                  onClick={toggleMute}
                  title={isMuted ? 'আনমিউট' : 'মিউট'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </Button>
                {/* Greeting */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-emerald-500"
                  onClick={triggerGreeting}
                  title="শুনুন স্নোয়ির গ্রিটিং"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </Button>
                {/* Close */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  onClick={closePanel}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* ─── Content / Chat History ──────────────── */}
            <div className="p-3 space-y-2.5 max-h-80 overflow-y-auto">
              {/* Speaking Waveform Animation */}
              {isSpeaking && (
                <div className="flex items-center justify-center gap-1 py-2">
                  {[0, 1, 2, 3, 4].map(i => (
                    <motion.div
                      key={i}
                      className="w-1 bg-gradient-to-t from-emerald-400 to-teal-300 rounded-full"
                      animate={{ height: [6, 20, 6] }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Conversation History */}
              {conversationHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-500/10 text-gray-800 dark:text-gray-200 rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                    }`}
                  >
                    <p className="font-medium text-[10px] text-gray-400 mb-0.5">
                      {msg.role === 'user' ? 'আপনি' : '❄️ স্নোয়ি'}
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

              {/* Loading Indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">ভাবছি...</span>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!conversationHistory.length && !loading && !isSpeaking && !interimTranscript && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">হ্যালো! আমি স্নোয়ি ❄️</p>
                  <p className="text-xs text-gray-400 mt-1">PU-ALRMS ভয়েস অ্যাসিস্ট্যান্ট</p>
                  <p className="text-[10px] text-gray-400 mt-2">বাংলা ও English উভয় সাপোর্ট করে</p>
                </div>
              )}
            </div>

            {/* ─── Bottom Controls ─────────────────────── */}
            <div className="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
              {/* Left: Reset */}
              {conversationHistory.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={resetConversation}
                  title="রিসেট"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              )}

              {/* Center: Mic Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleListening}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/40 animate-pulse'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50'
                }`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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

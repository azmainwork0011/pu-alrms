'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ─── Browser Speech API types ─────────────────────────────
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

export default function VoiceAssistant() {
  const [expanded, setExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ─── Detect Bangla characters ─────────────────────────
  const containsBangla = useCallback((text: string): boolean => {
    return /[\u0980-\u09FF]/.test(text);
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
    recognition.lang = 'en-US';

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
        // Auto-detect language for subsequent recognition
        if (containsBangla(final)) {
          recognition.lang = 'bn-BD';
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast.error(`Voice error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // If we have a final transcript and no response yet, send to AI
      const currentTranscript = transcript;
      if (currentTranscript && !loading && !aiResponse) {
        sendToAI(currentTranscript);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {}
    };
  }, [containsBangla]);

  // ─── Send transcript to AI ────────────────────────────
  const sendToAI = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setAiResponse('');

    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, lang: containsBangla(text) ? 'bn' : 'en' }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Request failed' }));
        setAiResponse(errData.error || 'Sorry, I could not process that.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      const responseText = data.response || data.content || data.message || 'No response received.';
      setAiResponse(responseText);

      // Speak the response if not muted
      if (!isMuted && typeof window !== 'undefined' && window.speechSynthesis) {
        speak(responseText);
      }
    } catch {
      setAiResponse('Connection issue. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [containsBangla, isMuted]);

  // ─── Speak response using SpeechSynthesis ─────────────
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis || isMuted) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;

    // Set language based on text content
    if (containsBangla(text)) {
      utterance.lang = 'bn-BD';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [containsBangla, isMuted]);

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
      recognitionRef.current.lang = 'en-US';
      try {
        recognitionRef.current.start();
      } catch {
        toast.error('Could not start voice recognition. Please check microphone permissions.');
      }
    }
  }, [isListening]);

  // ─── Toggle mute ─────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      // If there's a response, re-speak it
      if (aiResponse) speak(aiResponse);
    } else {
      setIsMuted(true);
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  }, [isMuted, aiResponse, speak]);

  // ─── Re-speak response ───────────────────────────────
  const handleReSpeak = useCallback(() => {
    if (aiResponse) {
      setIsMuted(false);
      speak(aiResponse);
    }
  }, [aiResponse, speak]);

  // ─── Close panel ─────────────────────────────────────
  const closePanel = useCallback(() => {
    if (isListening) recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setExpanded(false);
  }, [isListening]);

  // ─── Reset conversation ─────────────────────────────
  const resetConversation = useCallback(() => {
    if (isListening) recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setTranscript('');
    setInterimTranscript('');
    setAiResponse('');
    setLoading(false);
  }, [isListening]);

  // ─── Cleanup on unmount ──────────────────────────────
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.abort(); } catch {}
      window.speechSynthesis?.cancel();
    };
  }, []);

  if (!supported) return null;

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
            className="fixed bottom-20 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center cursor-pointer"
            aria-label="Open voice assistant"
          >
            <Mic className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Voice Panel ──────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-80 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Mic className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Voice Assistant</h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Tap mic to start'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                onClick={closePanel}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3 max-h-72 overflow-y-auto">
              {/* Waveform animation when speaking */}
              {isSpeaking && (
                <div className="flex items-center justify-center gap-1 py-2">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1 bg-emerald-500 rounded-full"
                      animate={{ height: [8, 24, 8] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                  <span className="text-xs text-gray-400 ml-2">Speaking...</span>
                </div>
              )}

              {/* Transcript area */}
              {(transcript || interimTranscript) && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">You said</p>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-2.5 text-sm text-gray-800 dark:text-gray-200">
                    {transcript}
                    {interimTranscript && (
                      <span className="text-gray-400 dark:text-gray-500">{interimTranscript}</span>
                    )}
                  </div>
                </div>
              )}

              {/* AI response area */}
              {(aiResponse || loading) && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">AI Response</p>
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5 text-sm text-gray-800 dark:text-gray-200">
                    {loading ? (
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
                    ) : (
                      aiResponse
                    )}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!transcript && !interimTranscript && !aiResponse && !loading && !isSpeaking && (
                <div className="text-center py-4 text-gray-400 dark:text-gray-500">
                  <Mic className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Tap the mic to start speaking</p>
                  <p className="text-[10px] mt-1">Supports English &amp; Bangla</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="flex items-center gap-1.5">
                {/* Mute toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 rounded-full ${
                    isMuted
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>

                {/* Re-speak */}
                {aiResponse && !isSpeaking && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={handleReSpeak}
                    title="Replay response"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Reset */}
                {(transcript || aiResponse) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={resetConversation}
                  >
                    Reset
                  </Button>
                )}

                {/* Mic button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleListening}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md cursor-pointer transition-colors ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-300/50'
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-300/50 hover:shadow-lg'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

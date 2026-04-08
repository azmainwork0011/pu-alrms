'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppStore } from '@/store/app';
import { aiApi } from '@/lib/api';
import {
  MessageCircle, ClipboardList, FlaskConical, Bug, Lightbulb, Code2, FileText,
  BookOpen, Send, Trash2, Sparkles, Copy, RotateCcw, Download, GraduationCap,
  Paperclip, Image as ImageIcon, Camera, Search, Check, BrainCircuit, Zap, X,
} from 'lucide-react';
import { getInitials } from '@/components/pu-helpers';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  generatedImage?: string;
  fileName?: string;
  timestamp: number;
}

function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'chat' | 'image'>('chat');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<{ file: File; dataUrl: string } | null>(null);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scanPreview, setScanPreview] = useState<{ dataUrl: string; file: File } | null>(null);
  const [scanQuestion, setScanQuestion] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanFileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { user } = useAppStore();

  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 60);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, imageLoading]);

  const ctaButtons = [
    { label: 'Get Assignment Help', icon: <ClipboardList className="w-6 h-6" />, prompt: 'Help me with my university assignment. What approach should I take and what should I include in my response?', gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Write Lab Report', icon: <FlaskConical className="w-6 h-6" />, prompt: 'How should I structure a proper university lab report? Give me a detailed template with all required sections.', gradient: 'from-blue-500 to-cyan-600' },
    { label: 'Code Review', icon: <Bug className="w-6 h-6" />, prompt: 'Review this code for bugs, performance issues, and best practices improvements. Suggest cleaner alternatives.', gradient: 'from-orange-500 to-red-500' },
    { label: 'Study Tips', icon: <Lightbulb className="w-6 h-6" />, prompt: 'Give me effective study tips and strategies for computer science exams. How can I prepare more efficiently?', gradient: 'from-purple-500 to-pink-500' },
  ];

  const suggestedPrompts = [
    { text: 'Explain binary search trees', icon: <Code2 className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" /> },
    { text: 'Help me write a lab report', icon: <FileText className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> },
    { text: 'Solve this math problem for me', icon: <BookOpen className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> },
    { text: 'Review my code for bugs', icon: <Bug className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" /> },
    { text: 'Give me exam preparation tips', icon: <Lightbulb className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> },
  ];

  const imagePromptExamples = [
    'Diagram of a binary search tree',
    'University campus illustration',
    'Flowchart of software development lifecycle',
  ];

  const sendMessage = useCallback(async (text?: string) => {
    const message = text || input.trim();
    if (!message || loading) return;

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      const result = await aiApi.chat(message);
      const aiMsg: ChatMessage = {
        id: genId(),
        role: 'assistant',
        content: result.response || 'Sorry, I could not generate a response.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to get response');
      setMessages(prev => [...prev, {
        id: genId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [input, loading, scrollToBottom]);

  const generateImage = useCallback(async (prompt?: string) => {
    const text = prompt || input.trim();
    if (!text || imageLoading) return;

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setImageLoading(true);
    scrollToBottom();

    try {
      const result = await aiApi.generateImage(text);
      const aiMsg: ChatMessage = {
        id: genId(),
        role: 'assistant',
        content: `Here\'s the generated image for: \"${text}\"`,
        generatedImage: result.image,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error(err.message || 'Image generation failed');
      setMessages(prev => [...prev, {
        id: genId(),
        role: 'assistant',
        content: 'Sorry, I could not generate the image. Please try again.',
        timestamp: Date.now(),
      }]);
    } finally {
      setImageLoading(false);
      scrollToBottom();
    }
  }, [input, imageLoading, scrollToBottom]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFilePreview({ file, dataUrl: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const sendFileMessage = useCallback(async () => {
    if (!filePreview || loading) return;
    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: `Uploaded file: ${filePreview.file.name}`,
      fileName: filePreview.file.name,
      image: filePreview.dataUrl,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    const currentPreview = filePreview;
    setFilePreview(null);
    setLoading(true);

    try {
      const result = await aiApi.uploadFile(currentPreview.file, `Analyze this file: ${currentPreview.file.name}`);
      const aiMsg: ChatMessage = {
        id: genId(),
        role: 'assistant',
        content: result.response || 'File analyzed successfully.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error(err.message || 'File upload failed');
      setMessages(prev => [...prev, {
        id: genId(),
        role: 'assistant',
        content: 'Sorry, I could not analyze the file. Please try again.',
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [filePreview, loading, scrollToBottom]);

  const handleScanFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file for scanning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setScanPreview({ dataUrl: ev.target?.result as string, file });
      setScanDialogOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const submitScan = useCallback(async () => {
    if (!scanPreview || scanLoading) return;
    setScanLoading(true);
    const currentScan = scanPreview;
    const currentQuestion = scanQuestion;

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: currentQuestion ? `Analyze this image: "${currentQuestion}"` : 'Analyze this image and describe it in detail.',
      image: currentScan.dataUrl,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setScanDialogOpen(false);
    setScanPreview(null);
    setScanQuestion('');

    try {
      const result = await aiApi.scanImage(currentScan.dataUrl, currentQuestion || 'What is in this image? Describe it in detail.');
      const aiMsg: ChatMessage = {
        id: genId(),
        role: 'assistant',
        content: result.response || 'Image analyzed.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error(err.message || 'Image scan failed');
      setMessages(prev => [...prev, {
        id: genId(),
        role: 'assistant',
        content: 'Sorry, I could not analyze the image. Please try again.',
        timestamp: Date.now(),
      }]);
    } finally {
      setScanLoading(false);
      scrollToBottom();
    }
  }, [scanPreview, scanQuestion, scanLoading, scrollToBottom]);

  const copyMessage = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      toast.error('Failed to copy');
    });
  }, []);

  const regenerateLastResponse = useCallback(() => {
    const msgs = [...messages];
    let lastUserContent: string | null = null;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user' && !msgs[i].image) {
        lastUserContent = msgs[i].content;
        break;
      }
    }
    if (!lastUserContent || loading) return;

    setMessages(prev => {
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].role === 'assistant') return prev.slice(0, i);
      }
      return prev;
    });

    const doResend = async () => {
      setLoading(true);
      try {
        const result = await aiApi.chat(lastUserContent);
        const aiMsg: ChatMessage = {
          id: genId(),
          role: 'assistant',
          content: result.response || 'Sorry, I could not generate a response.',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, aiMsg]);
      } catch (err: any) {
        toast.error(err.message || 'Failed to regenerate');
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    };
    doResend();
  }, [messages, loading, scrollToBottom]);

  const clearChat = useCallback(async () => {
    try {
      await aiApi.clearChat();
      setMessages([]);
      toast.success('Chat history cleared');
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear chat');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFilePreview({ file, dataUrl: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (chatMode === 'image') {
      generateImage();
    } else {
      sendMessage();
    }
  }, [chatMode, generateImage, sendMessage]);

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30"
            whileHover={{ scale: 1.05, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
          >
            <GraduationCap className="w-5 h-5" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-purple-600 dark:from-emerald-400 dark:to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Lucky Strick
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Your Premium AI Academic Assistant &middot; Powered by Gemini</p>
          </div>
        </div>
        {messages.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Button variant="outline" size="sm" onClick={clearChat} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 text-xs">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear Chat
            </Button>
          </motion.div>
        )}
      </div>

      {/* Chat Card */}
      <Card className="border dark:border-gray-800 flex-1 flex flex-col overflow-hidden">
        {/* Mode Tabs */}
        <div className="flex items-center border-b dark:border-gray-800 px-4 pt-2 shrink-0">
          <button
            onClick={() => setChatMode('chat')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              chatMode === 'chat'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </span>
          </button>
          <button
            onClick={() => setChatMode('image')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              chatMode === 'image'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Image Generator
            </span>
          </button>
        </div>

        {/* Messages Area */}
        <div
          ref={(el) => { (scrollRef as any).current = el; (chatContainerRef as any).current = el; }}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {messages.length === 0 && !filePreview ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-purple-100 dark:from-emerald-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <BrainCircuit className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </motion.div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {chatMode === 'chat' ? 'How can I help you today?' : 'What would you like to create?'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6 max-w-sm">
                {chatMode === 'chat'
                  ? 'I can help with assignments, programming, lab reports, and academic questions.'
                  : 'Describe any image and I\'ll generate it for you with AI.'}
              </p>

              {chatMode === 'chat' ? (
                <>
                  {/* CTA Cards */}
                  <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-6">
                    {ctaButtons.map((cta, i) => (
                      <motion.button
                        key={cta.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        onClick={() => sendMessage(cta.prompt)}
                        className={`flex flex-col items-center gap-2.5 p-4 rounded-xl bg-gradient-to-br ${cta.gradient} text-white hover:opacity-90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0`}
                      >
                        {cta.icon}
                        <span className="text-xs font-medium">{cta.label}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Quick Prompts */}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Or try a quick prompt:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                    {suggestedPrompts.map((prompt, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.05 }}
                        onClick={() => sendMessage(prompt.text)}
                        className="flex items-center gap-2.5 text-xs text-left p-3 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-gray-700 dark:text-gray-300"
                      >
                        {prompt.icon}
                        {prompt.text}
                      </motion.button>
                    ))}
                  </div>
                </>
              ) : (
                /* Image Gen Prompt Examples */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-lg">
                  {imagePromptExamples.map((prompt, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                      onClick={() => generateImage(prompt)}
                      className="flex items-center gap-2 text-xs text-left p-3 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Chat Messages */}
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                      <AvatarFallback className={
                        msg.role === 'user'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-gradient-to-br from-emerald-100 to-purple-100 text-purple-700 dark:from-emerald-900/30 dark:to-purple-900/30 dark:text-purple-300'
                      }>
                        {msg.role === 'user' ? getInitials(user?.name || 'U') : 'PG'}
                      </AvatarFallback>
                    </Avatar>

                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 px-1">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                      <div className={`rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-tr-md'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-md'
                      }`}>
                        {/* Uploaded image in user message */}
                        {msg.image && (
                          <div className="mb-2">
                            <img
                              src={msg.image}
                              alt="Uploaded content"
                              className="max-w-[200px] max-h-[150px] rounded-lg object-cover"
                            />
                          </div>
                        )}

                        {/* Generated image in assistant message */}
                        {msg.generatedImage && (
                          <div className="mb-2">
                            <img
                              src={msg.generatedImage}
                              alt="AI generated"
                              className="max-w-full rounded-lg object-cover shadow-md"
                            />
                            <a
                              href={msg.generatedImage}
                              download={`gemini-${msg.id}.png`}
                              className="inline-flex items-center gap-1.5 mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                            >
                              <Download className="w-3 h-3" /> Download Image
                            </a>
                          </div>
                        )}

                        {/* File name badge */}
                        {msg.fileName && (
                          <div className="flex items-center gap-1.5 mb-1.5 text-xs opacity-80">
                            <FileText className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{msg.fileName}</span>
                          </div>
                        )}

                        {/* Message content */}
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-code:text-xs dark:prose-invert">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <span>{msg.content}</span>
                        )}
                      </div>

                      {/* Toolbar for assistant messages */}
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1 mt-1 ml-1">
                          <button
                            onClick={() => copyMessage(msg.id, msg.content)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Copy message"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={regenerateLastResponse}
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Regenerate response"
                            disabled={loading}
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* File Preview Bubble */}
              {filePreview && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 flex-row-reverse"
                >
                  <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {getInitials(user?.name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[80%] flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 px-1">
                      {formatTimestamp(Date.now())}
                    </span>
                    <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-md px-4 py-3 text-sm space-y-2">
                      {filePreview.file.type.startsWith('image/') && (
                        <img
                          src={filePreview.dataUrl}
                          alt="Preview"
                          className="max-w-[200px] max-h-[150px] rounded-lg object-cover"
                        />
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[200px]">{filePreview.file.name}</span>
                        <span className="opacity-70">({(filePreview.file.size / 1024).toFixed(1)}KB)</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={sendFileMessage}
                          disabled={loading}
                          className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" /> Send
                        </button>
                        <button
                          onClick={() => setFilePreview(null)}
                          className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Typing Indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-purple-100 text-purple-700 text-xs dark:from-emerald-900/30 dark:to-purple-900/30 dark:text-purple-300">PG</AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Image Generation Loading */}
              {imageLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-purple-100 text-purple-700 text-xs dark:from-emerald-900/30 dark:to-purple-900/30 dark:text-purple-300">PG</AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-2.5">
                    <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Creating your image...</span>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t dark:border-gray-800 p-3 shrink-0">
          {chatMode === 'chat' ? (
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              {/* Hidden file input for uploads */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.txt,.doc,.docx,.py,.js,.ts,.java,.cpp,.c,.html,.css,.json,.md,.csv,.xls,.xlsx"
                onChange={handleFileSelect}
              />
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-gray-400 hover:text-emerald-600 dark:text-gray-500 dark:hover:text-emerald-400 h-9 w-9"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
                    <p className="text-xs">Upload file</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about your studies..."
                  disabled={loading}
                  className="dark:bg-gray-800 dark:border-gray-700"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>

              {/* Hidden scan file input */}
              <input
                ref={scanFileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleScanFileSelect}
              />
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-gray-400 hover:text-purple-600 dark:text-gray-500 dark:hover:text-purple-400 h-9 w-9"
                      onClick={() => scanFileInputRef.current?.click()}
                      disabled={loading}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
                    <p className="text-xs">Smart Scanner</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-emerald-600 to-purple-600 hover:from-emerald-700 hover:to-purple-700 text-white shrink-0 h-9 w-9 p-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            /* Image Gen Mode Input */
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  disabled={imageLoading}
                  className="dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <Button
                type="submit"
                disabled={imageLoading || !input.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shrink-0"
              >
                {imageLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Generate</span>
                )}
              </Button>
            </form>
          )}

          {chatMode === 'chat' && (
            <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-2">
              Drag &amp; drop files here or use the upload button &middot; Max 10MB
            </p>
          )}
        </div>
      </Card>

      {/* Scan Image Dialog */}
      <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
        <DialogContent className="dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Smart Scanner
            </DialogTitle>
            <DialogDescription>
              Upload an image and ask a question about it. AI will analyze and provide a detailed response.
            </DialogDescription>
          </DialogHeader>

          {scanPreview && (
            <div className="space-y-4">
              <div className="flex justify-center rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 p-2">
                <img
                  src={scanPreview.dataUrl}
                  alt="Scan preview"
                  className="max-h-[250px] rounded-lg object-contain"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scan-question" className="text-sm font-medium">
                  What would you like to know about this image?
                </Label>
                <Textarea
                  id="scan-question"
                  value={scanQuestion}
                  onChange={(e) => setScanQuestion(e.target.value)}
                  placeholder="e.g., What is shown in this image? Explain the diagram..."
                  className="dark:bg-gray-800 dark:border-gray-700 resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setScanDialogOpen(false);
                setScanPreview(null);
                setScanQuestion('');
              }}
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={submitScan}
              disabled={scanLoading}
              className="bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white"
            >
              {scanLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Analyze Image
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AIChatPage;

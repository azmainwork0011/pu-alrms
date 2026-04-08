'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/app';
import {
  MessageSquare, Hash, Users, BookOpen, Wifi, WifiOff,
  Paperclip, Download, X, Send, Check,
} from 'lucide-react';
import { playNotificationSound } from '@/components/pu-helpers';

interface ChatRoomInfo {
  id: string;
  name: string;
  type: 'BATCH' | 'SUBJECT' | 'GENERAL';
  batch?: string;
  subjectId?: string;
}

interface ChatMsg {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  fileUrl?: string;
  fileName?: string;
  timestamp: string;
  role?: string;
  type?: 'user' | 'system';
}

interface OnlineUserInfo {
  userId: string;
  username: string;
  role: string;
}

function StudentCommunityPage() {
  const { user, token } = useAppStore();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUserInfo[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [rooms, setRooms] = useState<ChatRoomInfo[]>([]);
  const [activeRoom, setActiveRoom] = useState<string>('general');
  const [showRooms, setShowRooms] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    const handleVisibility = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!token || !user) return;

    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join', { userId: user.id, username: user.name, role: user.role, batch: user.role === 'STUDENT' || user.role === 'CR' ? 'CSE-66' : undefined });
    });

    socket.on('joined', (data: { rooms: string[] }) => {
      setIsJoined(true);
      if (data.rooms?.includes(activeRoom)) {
        socket.emit('join-room', { roomId: activeRoom });
      }
    });

    socket.on('room-list', (roomList: ChatRoomInfo[]) => {
      if (Array.isArray(roomList)) setRooms(roomList);
    });

    socket.on('room-messages', (data: { roomId: string; messages: ChatMsg[] }) => {
      if (data.roomId === activeRoom) {
        setMessages(Array.isArray(data.messages) ? data.messages.slice(-100) : []);
      }
    });

    socket.on('room-created', (room: ChatRoomInfo) => {
      setRooms(prev => [...prev, room]);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsJoined(false);
    });

    socket.on('message', (msg: ChatMsg) => {
      if (msg.roomId === activeRoom) {
        setMessages(prev => [...prev.slice(-99), msg]);
      }
      if (!isVisible && msg.userId !== user?.id) {
        playNotificationSound();
      }
      // Clear typing indicator for this user
      setTypingUsers(prev => prev.filter(u => u !== msg.username));
    });

    socket.on('user-joined-room', (data: { roomId: string; user: OnlineUserInfo; message: ChatMsg }) => {
      if (data.roomId === activeRoom) {
        setMessages(prev => [...prev.slice(-99), data.message]);
      }
      socket.emit('users-list', { roomId: activeRoom });
    });

    socket.on('user-left-room', (data: { roomId: string; user: OnlineUserInfo; message: ChatMsg }) => {
      if (data.roomId === activeRoom) {
        setMessages(prev => [...prev.slice(-99), data.message]);
      }
      socket.emit('users-list', { roomId: activeRoom });
    });

    socket.on('users-list', (data: { roomId: string; users: OnlineUserInfo[] }) => {
      if (data.roomId === activeRoom) {
        setOnlineUsers(data.users || []);
      }
    });

    socket.on('typing', (data: { roomId: string; username: string; isTyping: boolean }) => {
      if (data.roomId === activeRoom && data.username !== user?.name) {
        setTypingUsers(prev => {
          if (data.isTyping && !prev.includes(data.username)) return [...prev, data.username];
          if (!data.isTyping) return prev.filter(u => u !== data.username);
          return prev;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user, isVisible, activeRoom]);

  const switchRoom = (roomId: string) => {
    if (!socketRef.current || roomId === activeRoom) return;
    setActiveRoom(roomId);
    setMessages([]);
    setTypingUsers([]);
    socketRef.current.emit('join-room', { roomId });
  };

  const sendMessage = () => {
    if (!socketRef.current || !inputMessage.trim() || !isJoined) return;
    socketRef.current.emit('message', {
      content: inputMessage.trim(),
      roomId: activeRoom,
      messageType: 'TEXT',
    });
    setInputMessage('');
    // Stop typing
    socketRef.current.emit('typing', { roomId: activeRoom, isTyping: false });
  };

  const sendImageMessage = (dataUrl: string) => {
    if (!socketRef.current || !isJoined) return;
    socketRef.current.emit('message', {
      content: dataUrl,
      roomId: activeRoom,
      messageType: 'IMAGE',
    });
    setImagePreview(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Non-image file - read as data URL and send
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (!socketRef.current || !isJoined) return;
        socketRef.current.emit('message', {
          content: '',
          roomId: activeRoom,
          messageType: 'FILE',
          fileUrl: ev.target?.result as string,
          fileName: file.name,
        });
        toast.success(`Shared: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleTyping = () => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { roomId: activeRoom, isTyping: true });
    }
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return null;
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      TEACHER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      CR: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
      STUDENT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    };
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
        {role === 'CR' ? 'CR' : role.slice(0, 4)}
      </span>
    );
  };

  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'BATCH': return <Hash className="w-3.5 h-3.5" />;
      case 'SUBJECT': return <BookOpen className="w-3.5 h-3.5" />;
      default: return <MessageSquare className="w-3.5 h-3.5" />;
    }
  };

  const getRoomBadgeColor = (type: string) => {
    switch (type) {
      case 'BATCH': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'SUBJECT': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const currentRoomInfo = rooms.find(r => r.id === activeRoom);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Community Chat
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              {currentRoomInfo ? (
                <span className="flex items-center gap-1.5">
                  {getRoomIcon(currentRoomInfo.type)}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{currentRoomInfo.name}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getRoomBadgeColor(currentRoomInfo.type)}`}>
                    {currentRoomInfo.type}
                  </span>
                </span>
              ) : 'Real-time chat with students and faculty'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300" onClick={() => setShowRooms(!showRooms)}>
            <Hash className="w-4 h-4 mr-1" /> Rooms ({rooms.length})
          </Button>
          <Button variant="outline" size="sm" className="relative dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300" onClick={() => setShowUsers(!showUsers)}>
            <Users className="w-4 h-4 mr-1" /> {onlineUsers.length} Online
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
          </Button>
          <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
            {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {isConnected ? 'Live' : 'Off'}
          </Badge>
        </div>
      </div>

      {/* Rooms Panel */}
      {showRooms && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Card className="border dark:border-gray-800">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3 dark:text-gray-200">Chat Rooms</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {rooms.map((room) => (
                  <motion.div key={room.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <button
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                        activeRoom === room.id
                          ? 'bg-emerald-100 border border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700'
                          : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 border border-transparent'
                      }`}
                      onClick={() => { switchRoom(room.id); setShowRooms(false); }}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeRoom === room.id ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                        {getRoomIcon(room.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate dark:text-gray-200">{room.name}</p>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getRoomBadgeColor(room.type)}`}>
                          {room.type}
                        </span>
                      </div>
                      {activeRoom === room.id && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                    </button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Online Users Panel */}
      {showUsers && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Card className="border dark:border-gray-800">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3 dark:text-gray-200">Online in {currentRoomInfo?.name || 'room'} ({onlineUsers.length})</h3>
              <div className="flex flex-wrap gap-2">
                {onlineUsers.map((u) => (
                  <div key={u.userId} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm dark:text-gray-300">{u.username}</span>
                    {getRoleBadge(u.role)}
                  </div>
                ))}
                {onlineUsers.length === 0 && <p className="text-sm text-gray-400">No one else online</p>}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Image Preview Modal */}
      {imagePreview && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 max-w-md w-full border dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold dark:text-gray-200">Send Image</h3>
              <button onClick={() => setImagePreview(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>
            <img src={imagePreview} alt="Preview" className="w-full rounded-lg max-h-60 object-contain bg-gray-100 dark:bg-gray-800" />
            <div className="flex gap-2 mt-3">
              <Button variant="outline" className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300" onClick={() => setImagePreview(null)}>Cancel</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => sendImageMessage(imagePreview)}>Send Image</Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Chat Card */}
      <Card className="border dark:border-gray-800 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!isJoined ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-gray-400 animate-pulse" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Connecting to chat...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Welcome to {currentRoomInfo?.name || 'the chat'}!</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Be the first to say hello</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
                {msg.type === 'system' ? (
                  <div className="text-center py-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic bg-gray-50 dark:bg-gray-800/50 px-3 py-1 rounded-full">{msg.content}</span>
                  </div>
                ) : (
                  <div className={`flex gap-3 ${msg.userId === user?.id ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${msg.userId === user?.id ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-emerald-400 to-teal-500'}`}>
                      {msg.username.charAt(0).toUpperCase()}
                    </div>
                    <div className={`flex-1 min-w-0 max-w-[75%] ${msg.userId === user?.id ? 'text-right' : ''}`}>
                      <div className={`flex items-center gap-2 flex-wrap ${msg.userId === user?.id ? 'justify-end' : ''}`}>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{msg.username}</span>
                        {getRoleBadge(msg.role)}
                        <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div className="mt-1">
                        {msg.messageType === 'IMAGE' && msg.content ? (
                          <img src={msg.content} alt="Shared" className="rounded-lg max-h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity bg-gray-50 dark:bg-gray-800/50" />
                        ) : msg.messageType === 'FILE' && msg.fileUrl ? (
                          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border dark:border-gray-700">
                            <Paperclip className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{msg.fileName || 'File'}</span>
                            <a href={msg.fileUrl} download={msg.fileName} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline shrink-0">
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="px-4 py-1">
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.slice(0, 2).join(', ')} and ${typingUsers.length - 1} more are typing...`}
            </p>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-3 dark:border-gray-800">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2 items-end">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.zip" onChange={handleFileSelect} />
            <Button type="button" variant="ghost" size="icon" className="shrink-0 h-10 w-10 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800" onClick={() => fileInputRef.current?.click()} disabled={!isConnected || !isJoined}>
              <Paperclip className="w-4 h-4" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                onKeyUp={handleTyping}
                placeholder={isConnected ? `Message ${currentRoomInfo?.name || 'chat'}...` : 'Connecting...'}
                disabled={!isConnected || !isJoined}
                className="pr-10 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <Button type="submit" disabled={!isConnected || !isJoined || !inputMessage.trim()} className="bg-emerald-600 hover:bg-emerald-700 shrink-0 h-10 w-10 p-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default StudentCommunityPage;

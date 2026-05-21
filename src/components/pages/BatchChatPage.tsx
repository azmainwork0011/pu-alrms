'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app';
import { getInitials, timeAgo, playNotificationSound } from '@/components/pu-helpers';
import {
  Hash, Users, Search, Send, Paperclip, X, Smile, Pin,
  Reply, Edit3, Trash2, MoreVertical, ChevronLeft, Check,
  CheckCheck, ArrowDown, Circle, Image as ImageIcon, FileText,
  Phone, Wifi, WifiOff, PanelRightOpen, PanelRightClose,
  MessageSquare, LogOut, Hash as HashIcon, BookOpen,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════
interface ChatRoomInfo {
  id: string;
  name: string;
  type: 'BATCH' | 'SUBJECT' | 'GENERAL';
  batch?: string;
  subjectId?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  memberCount?: number;
}

interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'PDF';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: string;
  role?: string;
  type?: 'user' | 'system';
  replyToId?: string;
  replyTo?: { id: string; username: string; content: string };
  edited?: boolean;
  pinned?: boolean;
  readBy?: string[];
}

interface OnlineUser {
  userId: string;
  username: string;
  role: string;
  avatar?: string;
  online?: boolean;
}

interface PinnedMessage {
  id: string;
  content: string;
  username: string;
  timestamp: string;
  messageType: string;
}

type RoomFilter = 'all' | 'batch' | 'mine';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════
const TYPING_DEBOUNCE = 2000;
const MAX_CACHED_MESSAGES = 50;
const MESSAGE_GROUP_WINDOW = 5 * 60 * 1000; // 5 minutes
const SCROLL_THRESHOLD = 150;

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white',
  ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  TEACHER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  CR: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  STUDENT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  DEVELOPER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const AVATAR_GRADIENTS = [
  'from-emerald-400 to-teal-500',
  'from-violet-500 to-purple-600',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-cyan-400 to-sky-500',
  'from-lime-400 to-green-500',
];

function getAvatarGradient(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

// ═══════════════════════════════════════════════════════════════
// Offline Cache Helpers
// ═══════════════════════════════════════════════════════════════
const CACHE_PREFIX = 'batchchat_cache_';

function getCachedMessages(roomId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + roomId);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function setCachedMessages(roomId: string, messages: ChatMessage[]) {
  try {
    const trimmed = messages.slice(-MAX_CACHED_MESSAGES);
    localStorage.setItem(CACHE_PREFIX + roomId, JSON.stringify(trimmed));
  } catch { /* localStorage full */ }
}

// ═══════════════════════════════════════════════════════════════
// Date Separator Component
// ═══════════════════════════════════════════════════════════════
function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (d.toDateString() === today.toDateString()) label = 'Today';
  else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
  else label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="flex items-center justify-center py-3">
      <Separator className="flex-1 bg-border/50" />
      <span className="px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <Separator className="flex-1 bg-border/50" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Typing Indicator
// ═══════════════════════════════════════════════════════════════
function TypingIndicator({ names }: { names: string[] }) {
  const display = names.length <= 2 ? names.join(', ') : `${names[0]} and ${names.length - 1} others`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex items-center gap-2 px-4 py-2"
    >
      <div className="flex items-center gap-1.5">
        <span className="flex gap-0.5">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            />
          ))}
        </span>
        <span className="text-xs text-muted-foreground italic">{display} is typing...</span>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Emoji Picker (Simple)
// ═══════════════════════════════════════════════════════════════
const COMMON_EMOJIS = [
  '😀', '😂', '🤣', '😍', '🥰', '😎', '🤔', '😅',
  '👍', '👎', '❤️', '🔥', '💯', '✅', '🎉', '🙏',
  '💪', '👀', '🤝', '📚', '💡', '⚡', '🎯', '🚀',
];

function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
      className="absolute bottom-14 left-2 bg-popover border rounded-xl shadow-xl p-3 z-50"
    >
      <div className="grid grid-cols-8 gap-1">
        {COMMON_EMOJIS.map((emoji, i) => (
          <button
            key={i}
            onClick={() => { onSelect(emoji); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent text-lg transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Room Card (Sidebar)
// ═══════════════════════════════════════════════════════════════
function RoomCard({
  room, isActive, onClick, userBatch,
}: {
  room: ChatRoomInfo;
  isActive: boolean;
  onClick: () => void;
  userBatch?: string;
}) {
  const isMine = userBatch && room.batch === userBatch;
  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all group ${
        isActive
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-accent border border-transparent'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
        isActive
          ? 'bg-emerald-500 text-white'
          : 'bg-muted text-muted-foreground group-hover:bg-emerald-100 group-hover:text-emerald-600 dark:group-hover:bg-emerald-900/30 dark:group-hover:text-emerald-400'
      }`}>
        {room.type === 'BATCH' ? <Hash className="w-4.5 h-4.5" /> :
         room.type === 'SUBJECT' ? <BookOpen className="w-4.5 h-4.5" /> :
         <MessageSquare className="w-4.5 h-4.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-medium truncate ${isActive ? 'text-foreground' : 'text-foreground/80'}`}>
            {room.name}
          </span>
          {room.lastMessageTime && (
            <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(room.lastMessageTime)}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground truncate">{room.lastMessage || 'No messages yet'}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            {(room.unreadCount ?? 0) > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {room.unreadCount > 99 ? '99+' : room.unreadCount}
              </span>
            )}
            {isMine && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════
// Message Bubble
// ═══════════════════════════════════════════════════════════════
function MessageBubble({
  msg, isOwn, isGrouped, onReply, onEdit, onDelete, onPin, replyingTo,
  userRole,
}: {
  msg: ChatMessage;
  isOwn: boolean;
  isGrouped: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  replyingTo: ChatMessage | null;
  userRole?: string;
}) {
  const canEditDelete = isOwn;
  const canPin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'CR' || userRole === 'TEACHER';

  const formatMsgTime = (ts: string) => {
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const getFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''} ${isGrouped ? 'mt-0.5' : 'mt-4'}`}
    >
      {/* Avatar */}
      {!isGrouped ? (
        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br ${getAvatarGradient(msg.userId)}`}>
          {msg.username.charAt(0).toUpperCase()}
        </div>
      ) : (
        <div className="w-8 shrink-0" />
      )}

      {/* Bubble */}
      <div className={`group relative max-w-[75%] min-w-0 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Name + Time (non-grouped) */}
        {!isGrouped && msg.type !== 'system' && (
          <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs font-semibold text-foreground">{msg.username}</span>
            {msg.role && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[msg.role] || 'bg-muted text-muted-foreground'}`}>
                {msg.role === 'CR' ? 'CR' : msg.role.slice(0, 4)}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">{formatMsgTime(msg.timestamp)}</span>
            {msg.pinned && (
              <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />
            )}
          </div>
        )}

        {/* Reply preview */}
        {replyingTo && (
          <div className={`px-3 py-1.5 rounded-lg mb-1 border-l-2 border-emerald-500 bg-muted/50 ${isOwn ? 'mr-1' : 'ml-1'}`}>
            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{replyingTo.username}</p>
            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{replyingTo.content}</p>
          </div>
        )}

        {/* Message Content */}
        <div className={`relative`}>
          {msg.type === 'system' ? (
            <div className="px-4 py-1.5 mx-auto">
              <span className="text-[11px] text-muted-foreground italic bg-muted/50 px-3 py-1 rounded-full">
                {msg.content}
              </span>
            </div>
          ) : (
            <div className={`rounded-2xl px-3.5 py-2 relative ${
              isOwn
                ? `bg-primary text-primary-foreground ${isGrouped ? 'rounded-tr-md' : 'rounded-tr-md'}`
                : `bg-muted text-foreground ${isGrouped ? 'rounded-tl-md' : 'rounded-tl-md'}`
            }`}>
              {/* Text */}
              {(msg.messageType === 'TEXT' || !msg.messageType) && (
                <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              )}

              {/* Image */}
              {msg.messageType === 'IMAGE' && msg.content && (
                <div className="space-y-1.5">
                  {msg.content && <p className="text-sm break-words">{msg.content}</p>}
                  {msg.fileUrl && (
                    <img src={msg.fileUrl} alt="Shared image" className="rounded-lg max-h-64 max-w-[280px] object-contain cursor-pointer hover:opacity-90 transition-opacity" />
                  )}
                </div>
              )}

              {/* PDF */}
              {msg.messageType === 'PDF' && (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-background/20">
                  <FileText className="w-8 h-8 text-red-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{msg.fileName || 'Document'}</p>
                    {msg.fileSize && <p className="text-[10px] opacity-70">{getFileSize(msg.fileSize)}</p>}
                  </div>
                  {msg.fileUrl && (
                    <a href={msg.fileUrl} download={msg.fileName} target="_blank" rel="noopener noreferrer" className="text-xs underline shrink-0">
                      Download
                    </a>
                  )}
                </div>
              )}

              {/* File */}
              {msg.messageType === 'FILE' && (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-background/20">
                  <Paperclip className="w-6 h-6 opacity-70 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{msg.fileName || 'File'}</p>
                    {msg.fileSize && <p className="text-[10px] opacity-70">{getFileSize(msg.fileSize)}</p>}
                  </div>
                  {msg.fileUrl && (
                    <a href={msg.fileUrl} download={msg.fileName} target="_blank" rel="noopener noreferrer" className="text-xs underline shrink-0">
                      Download
                    </a>
                  )}
                </div>
              )}

              {/* Edited indicator */}
              {msg.edited && (
                <span className="text-[9px] opacity-50 italic ml-1">edited</span>
              )}
            </div>
          )}

          {/* Message Actions (hover) */}
          {msg.type !== 'system' && (
            <div className={`absolute top-0 ${isOwn ? '-left-9' : '-right-9'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full bg-popover border shadow-sm">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwn ? 'end' : 'start'} className="w-40">
                  <DropdownMenuItem onClick={onReply}>
                    <Reply className="w-3.5 h-3.5 mr-2" />Reply
                  </DropdownMenuItem>
                  {canEditDelete && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit3 className="w-3.5 h-3.5 mr-2" />Edit
                    </DropdownMenuItem>
                  )}
                  {canPin && (
                    <DropdownMenuItem onClick={onPin}>
                      <Pin className="w-3.5 h-3.5 mr-2" />{msg.pinned ? 'Unpin' : 'Pin'}
                    </DropdownMenuItem>
                  )}
                  {canEditDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                        <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Read receipt (own messages, non-grouped) */}
        {isOwn && msg.type !== 'system' && (
          <div className="flex items-center gap-1 mt-0.5 px-1">
            <span className="text-[9px] text-muted-foreground">{formatMsgTime(msg.timestamp)}</span>
            <CheckCheck className="w-3 h-3 text-emerald-500" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main BatchChatPage
// ═══════════════════════════════════════════════════════════════
export default function BatchChatPage() {
  const { user, token } = useAppStore();

  // ─── State ─────────────────────────────────────────────────
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [rooms, setRooms] = useState<ChatRoomInfo[]>([]);
  const [activeRoom, setActiveRoom] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [showPinned, setShowPinned] = useState(false);

  // Sidebar
  const [roomSearch, setRoomSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState<RoomFilter>('all');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Members panel
  const [showMembers, setShowMembers] = useState(false);

  // Input
  const [inputMessage, setInputMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);

  // File upload
  const [uploadingFile, setUploadingFile] = useState(false);

  // Scroll
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search messages dialog
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');

  // Image preview
  const [imagePreview, setImagePreview] = useState<{ url: string; name: string } | null>(null);

  // Visibility
  const [isVisible, setIsVisible] = useState(true);

  // ─── Refs ──────────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAtBottomRef = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const isUnmountedRef = useRef(false);

  // ─── Visibility ────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // ─── Socket Connection ─────────────────────────────────────
  useEffect(() => {
    if (!token || !user) return;

    isUnmountedRef.current = false;

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
      if (isUnmountedRef.current) return;
      setIsConnected(true);
      socket.emit('join', {
        userId: user.id,
        username: user.name,
        role: user.role,
        batch: user.batch || (user.role === 'STUDENT' || user.role === 'CR' ? 'CSE-66' : undefined),
      });
    });

    socket.on('joined', (data: { rooms: string[] }) => {
      if (isUnmountedRef.current) return;
      setIsJoined(true);
      if (data.rooms?.length > 0 && !activeRoom) {
        const firstRoom = data.rooms[0];
        setActiveRoom(firstRoom);
        socket.emit('join-room', { roomId: firstRoom });
      } else if (activeRoom) {
        socket.emit('join-room', { roomId: activeRoom });
      }
    });

    socket.on('room-list', (roomList: ChatRoomInfo[]) => {
      if (isUnmountedRef.current) return;
      if (Array.isArray(roomList)) {
        setRooms(roomList);
        if (!activeRoom && roomList.length > 0) {
          setActiveRoom(roomList[0].id);
        }
      }
    });

    socket.on('room-messages', (data: { roomId: string; messages: ChatMessage[] }) => {
      if (isUnmountedRef.current) return;
      if (data.roomId === activeRoom) {
        const msgs = Array.isArray(data.messages) ? data.messages : [];
        const merged = [...msgs];
        setMessages(merged);
        setCachedMessages(data.roomId, merged);
        setTimeout(() => {
          if (isAtBottomRef.current) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    });

    socket.on('room-created', (room: ChatRoomInfo) => {
      if (isUnmountedRef.current) return;
      setRooms(prev => [...prev, room]);
    });

    socket.on('disconnect', () => {
      if (isUnmountedRef.current) return;
      setIsConnected(false);
      setIsJoined(false);
    });

    socket.on('message', (msg: ChatMessage) => {
      if (isUnmountedRef.current) return;
      if (msg.roomId === activeRoom) {
        setMessages(prev => {
          const updated = [...prev, msg];
          setCachedMessages(activeRoom, updated);
          return updated;
        });
        setTimeout(() => {
          if (isAtBottomRef.current) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          else setShowScrollBtn(true);
        }, 50);
        // Vibrate
        if (!isVisible && msg.userId !== user?.id) {
          try { navigator.vibrate?.(100); } catch {}
          playNotificationSound();
        }
      }
      // Clear typing for this user
      setTypingUsers(prev => prev.filter(u => u !== msg.username));
    });

    socket.on('user-joined-room', (data: { roomId: string; user: OnlineUser; message: ChatMessage }) => {
      if (isUnmountedRef.current) return;
      if (data.roomId === activeRoom) {
        setMessages(prev => [...prev, data.message]);
        setTimeout(() => { if (isAtBottomRef.current) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 50);
      }
      socket.emit('users-list', { roomId: activeRoom });
    });

    socket.on('user-left-room', (data: { roomId: string; user: OnlineUser; message: ChatMessage }) => {
      if (isUnmountedRef.current) return;
      if (data.roomId === activeRoom) {
        setMessages(prev => [...prev, data.message]);
        setTimeout(() => { if (isAtBottomRef.current) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 50);
      }
      socket.emit('users-list', { roomId: activeRoom });
    });

    socket.on('users-list', (data: { roomId: string; users: OnlineUser[] }) => {
      if (isUnmountedRef.current) return;
      if (data.roomId === activeRoom) {
        setOnlineUsers(data.users || []);
      }
    });

    socket.on('typing', (data: { roomId: string; username: string; isTyping: boolean }) => {
      if (isUnmountedRef.current) return;
      if (data.roomId === activeRoom && data.username !== user?.name) {
        setTypingUsers(prev => {
          if (data.isTyping && !prev.includes(data.username)) return [...prev, data.username];
          if (!data.isTyping) return prev.filter(u => u !== data.username);
          return prev;
        });
      }
    });

    socket.on('edit-message', (updatedMsg: ChatMessage) => {
      if (isUnmountedRef.current) return;
      if (updatedMsg.roomId === activeRoom) {
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg, edited: true } : m));
      }
    });

    socket.on('delete-message', (data: { messageId: string; roomId: string }) => {
      if (isUnmountedRef.current) return;
      if (data.roomId === activeRoom) {
        setMessages(prev => prev.filter(m => m.id !== data.messageId));
      }
    });

    socket.on('pin-message', (data: { roomId: string; message: ChatMessage; action: 'pin' | 'unpin' }) => {
      if (isUnmountedRef.current) return;
      if (data.roomId === activeRoom) {
        if (data.action === 'pin') {
          setPinnedMessages(prev => [{
            id: data.message.id,
            content: data.message.content,
            username: data.message.username,
            timestamp: data.message.timestamp,
            messageType: data.message.messageType,
          }, ...prev].slice(0, 5));
        } else {
          setPinnedMessages(prev => prev.filter(p => p.id !== data.message.id));
        }
        setMessages(prev => prev.map(m =>
          m.id === data.message.id ? { ...m, pinned: data.action === 'pin' } : m
        ));
      }
    });

    socket.on('read-receipt', (data: { messageId: string; userId: string; roomId: string }) => {
      if (isUnmountedRef.current) return;
      if (data.roomId === activeRoom) {
        setMessages(prev => prev.map(m =>
          m.id === data.messageId
            ? { ...m, readBy: [...(m.readBy || []), data.userId] }
            : m
        ));
      }
    });

    return () => {
      isUnmountedRef.current = true;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.disconnect();
    };
  }, [token, user]);

  // ─── Auto-scroll helper ────────────────────────────────────
  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // ─── Scroll handler ────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
    isAtBottomRef.current = atBottom;
    setShowScrollBtn(!atBottom);

    // Infinite scroll: load older messages on scroll up
    if (el.scrollTop < 50 && !loadingMore && messages.length > 0) {
      setLoadingMore(true);
      socketRef.current?.emit('room-messages', {
        roomId: activeRoom,
        offset: messages.length,
        limit: 50,
      });
      setTimeout(() => setLoadingMore(false), 500);
    }
  }, [activeRoom, loadingMore, messages.length]);

  // ─── Room switching ────────────────────────────────────────
  const switchRoom = useCallback((roomId: string) => {
    if (!socketRef.current || roomId === activeRoom) return;
    // Cache current messages
    if (activeRoom && messages.length > 0) {
      setCachedMessages(activeRoom, messages);
    }
    setActiveRoom(roomId);
    setMessages([]);
    setTypingUsers([]);
    setPinnedMessages([]);
    setReplyingTo(null);
    setEditingMessage(null);
    setShowPinned(false);
    setShowScrollBtn(false);
    isAtBottomRef.current = true;
    setMobileSidebarOpen(false);

    // Load cached messages
    const cached = getCachedMessages(roomId);
    if (cached.length > 0) setMessages(cached);

    socketRef.current.emit('join-room', { roomId });
  }, [activeRoom, messages]);

  // ─── Send message ──────────────────────────────────────────
  const sendMessage = useCallback(() => {
    if (!socketRef.current || !inputMessage.trim() || !isJoined) return;

    if (editingMessage) {
      socketRef.current.emit('edit-message', {
        messageId: editingMessage.id,
        roomId: activeRoom,
        content: inputMessage.trim(),
      });
      setEditingMessage(null);
    } else {
      socketRef.current.emit('message', {
        content: inputMessage.trim(),
        roomId: activeRoom,
        messageType: 'TEXT',
        replyToId: replyingTo?.id,
      });
      setReplyingTo(null);
    }
    setInputMessage('');
    socketRef.current.emit('typing', { roomId: activeRoom, isTyping: false });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    inputRef.current?.focus();
  }, [inputMessage, isJoined, activeRoom, editingMessage, replyingTo]);

  // ─── Typing indicator ──────────────────────────────────────
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputMessage(val);
    if (editingMessage) return;

    if (socketRef.current && val.trim()) {
      socketRef.current.emit('typing', { roomId: activeRoom, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', { roomId: activeRoom, isTyping: false });
      }, TYPING_DEBOUNCE);
    }
  }, [activeRoom, editingMessage]);

  // ─── File upload ───────────────────────────────────────────
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview({ url: ev.target?.result as string, name: file.name });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (!socketRef.current || !isJoined) return;
        const isPdf = file.type === 'application/pdf';
        socketRef.current.emit('message', {
          content: '',
          roomId: activeRoom,
          messageType: isPdf ? 'PDF' : 'FILE',
          fileUrl: ev.target?.result as string,
          fileName: file.name,
          fileSize: file.size,
        });
        toast.success(`Shared: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, [isJoined, activeRoom]);

  const sendImageMessage = useCallback((data: { url: string; name: string }) => {
    if (!socketRef.current || !isJoined) return;
    socketRef.current.emit('message', {
      content: '',
      roomId: activeRoom,
      messageType: 'IMAGE',
      fileUrl: data.url,
      fileName: data.name,
    });
    setImagePreview(null);
    toast.success('Image sent');
  }, [isJoined, activeRoom]);

  // ─── Message actions ───────────────────────────────────────
  const handleReply = useCallback((msg: ChatMessage) => {
    setReplyingTo(msg);
    setEditingMessage(null);
    inputRef.current?.focus();
  }, []);

  const handleEdit = useCallback((msg: ChatMessage) => {
    setEditingMessage(msg);
    setReplyingTo(null);
    setInputMessage(msg.content);
    inputRef.current?.focus();
  }, []);

  const handleDelete = useCallback((msg: ChatMessage) => {
    if (!socketRef.current) return;
    socketRef.current.emit('delete-message', { messageId: msg.id, roomId: activeRoom });
    toast.success('Message deleted');
  }, [activeRoom]);

  const handlePin = useCallback((msg: ChatMessage) => {
    if (!socketRef.current) return;
    const action = msg.pinned ? 'unpin' : 'pin';
    socketRef.current.emit('pin-message', { messageId: msg.id, roomId: activeRoom, action });
    toast.success(msg.pinned ? 'Message unpinned' : 'Message pinned');
  }, [activeRoom]);

  // ─── Keyboard handler ──────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === 'Escape') {
      setReplyingTo(null);
      setEditingMessage(null);
      setShowEmoji(false);
    }
  }, [sendMessage]);

  // ─── Filter rooms ──────────────────────────────────────────
  const filteredRooms = rooms.filter(r => {
    if (roomSearch && !r.name.toLowerCase().includes(roomSearch.toLowerCase())) return false;
    if (roomFilter === 'batch') return r.type === 'BATCH';
    if (roomFilter === 'mine') return r.batch === user?.batch;
    return true;
  });

  // ─── Group messages ────────────────────────────────────────
  const renderMessages = () => {
    let lastDate = '';
    let lastUserId = '';
    let lastMsgTime = 0;

    return messages.map((msg, idx) => {
      const msgDate = new Date(msg.timestamp).toDateString();
      const showDateSep = msgDate !== lastDate;
      const isGrouped = !showDateSep && msg.userId === lastUserId && msg.type !== 'system' &&
        (new Date(msg.timestamp).getTime() - lastMsgTime) < MESSAGE_GROUP_WINDOW;

      lastDate = msgDate;
      lastUserId = msg.userId;
      lastMsgTime = new Date(msg.timestamp).getTime();

      return (
        <React.Fragment key={msg.id || `${msg.userId}-${msg.timestamp}-${idx}`}>
          {showDateSep && <DateSeparator date={msg.timestamp} />}
          <MessageBubble
            msg={msg}
            isOwn={msg.userId === user?.id}
            isGrouped={isGrouped}
            onReply={() => handleReply(msg)}
            onEdit={() => handleEdit(msg)}
            onDelete={() => handleDelete(msg)}
            onPin={() => handlePin(msg)}
            replyingTo={msg.replyToId ? messages.find(m => m.id === msg.replyToId) || null : null}
            userRole={user?.role}
          />
        </React.Fragment>
      );
    });
  };

  // ─── Search filtered messages ──────────────────────────────
  const searchResults = messageSearch.trim()
    ? messages.filter(m => m.content?.toLowerCase().includes(messageSearch.toLowerCase()))
    : [];

  // ─── Current room info ─────────────────────────────────────
  const currentRoom = rooms.find(r => r.id === activeRoom);

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="flex h-[calc(100vh-8.5rem)] sm:h-[calc(100vh-8rem)] gap-0 min-w-0 overflow-hidden rounded-xl border bg-background shadow-sm">
      {/* ═══ Left Sidebar ═══ */}
      {/* Desktop */}
      <aside className="hidden md:flex w-72 lg:w-80 flex-col border-r bg-card/50 shrink-0">
        {/* Sidebar Header */}
        <div className="p-3 border-b space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              Chats
            </h2>
            <div className="flex items-center gap-1">
              <Badge variant={isConnected ? 'default' : 'destructive'} className="text-[10px] h-5 gap-1">
                {isConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                {isConnected ? 'Live' : 'Off'}
              </Badge>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search rooms..."
              value={roomSearch}
              onChange={e => setRoomSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'batch', 'mine'] as RoomFilter[]).map(f => (
              <Button
                key={f}
                variant={roomFilter === f ? 'default' : 'ghost'}
                size="sm"
                className={`h-7 text-[11px] px-2.5 capitalize ${roomFilter === f ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                onClick={() => setRoomFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* Room List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {filteredRooms.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                isActive={room.id === activeRoom}
                onClick={() => switchRoom(room.id)}
                userBatch={user?.batch}
              />
            ))}
            {filteredRooms.length === 0 && (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground">No rooms found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-3 border-b">
            <SheetTitle className="text-sm font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              Chats
              <Badge variant={isConnected ? 'default' : 'destructive'} className="ml-auto text-[10px] h-5">
                {isConnected ? 'Live' : 'Off'}
              </Badge>
            </SheetTitle>
          </SheetHeader>
          <div className="p-3 space-y-2.5 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={roomSearch}
                onChange={e => setRoomSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'batch', 'mine'] as RoomFilter[]).map(f => (
                <Button
                  key={f}
                  variant={roomFilter === f ? 'default' : 'ghost'}
                  size="sm"
                  className={`h-7 text-[11px] px-2.5 capitalize ${roomFilter === f ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                  onClick={() => setRoomFilter(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {filteredRooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  isActive={room.id === activeRoom}
                  onClick={() => switchRoom(room.id)}
                  userBatch={user?.batch}
                />
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* ═══ Main Chat Area ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b shrink-0 bg-card/50">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost" size="icon" className="md:hidden h-8 w-8 shrink-0"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                {currentRoom?.type === 'BATCH' ? <Hash className="w-4 h-4" /> :
                 currentRoom?.type === 'SUBJECT' ? <BookOpen className="w-4 h-4" /> :
                 <MessageSquare className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate">{currentRoom?.name || 'Select a room'}</h3>
                <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                  {onlineUsers.length > 0 && (
                    <>
                      <span className="flex items-center gap-1">
                        <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" />
                        {onlineUsers.length} online
                      </span>
                      <span className="text-border">·</span>
                    </>
                  )}
                  {currentRoom?.memberCount && <span>{currentRoom.memberCount} members</span>}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSearchDialogOpen(true)}>
                    <Search className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search messages</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPinned(!showPinned)}>
                    <Pin className={`w-4 h-4 ${showPinned ? 'text-amber-500 fill-amber-500' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pinned messages</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowMembers(!showMembers)}>
                    <Users className="w-4 h-4" />
                    {onlineUsers.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {onlineUsers.length}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Members</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Pinned Messages Bar (collapsible) */}
        <AnimatePresence>
          {showPinned && pinnedMessages.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b overflow-hidden"
            >
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <Pin className="w-3 h-3" /> Pinned Messages
                  </span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowPinned(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <ScrollArea className="max-h-24">
                  <div className="space-y-1.5">
                    {pinnedMessages.map(p => (
                      <div key={p.id} className="flex items-start gap-2 p-1.5 rounded-lg bg-white/50 dark:bg-white/5">
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 shrink-0">{p.username}</span>
                        <p className="text-[11px] text-muted-foreground truncate">{p.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-2 relative"
          style={{ scrollbarGutter: 'stable' }}
        >
          {/* Loading older messages indicator */}
          {loadingMore && (
            <div className="flex justify-center py-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <motion.div
                  className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
                Loading older messages...
              </div>
            </div>
          )}

          {!isJoined ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-7 h-7 text-emerald-500 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Connecting to chat...</p>
                  <p className="text-xs text-muted-foreground mt-1">Please wait while we establish a connection</p>
                </div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                  <Hash className="w-7 h-7 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Welcome to {currentRoom?.name || 'the chat'}!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Be the first to say something
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                  {['Hello everyone!', 'How are you all?', 'Any updates?'].map(s => (
                    <button
                      key={s}
                      onClick={() => { setInputMessage(s); inputRef.current?.focus(); }}
                      className="px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            renderMessages()
          )}
          <div ref={messagesEndRef} />

          {/* Scroll to bottom button */}
          <AnimatePresence>
            {showScrollBtn && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="sticky bottom-2 flex justify-center"
              >
                <Button
                  size="sm"
                  className="rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white h-9 gap-1.5"
                  onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span className="text-xs">New messages</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Typing Indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && <TypingIndicator names={typingUsers} />}
        </AnimatePresence>

        {/* Reply / Edit Preview Bar */}
        <AnimatePresence>
          {(replyingTo || editingMessage) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-2 bg-muted/30">
                <div className="w-1 h-8 rounded-full bg-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-foreground">
                    {editingMessage ? `Editing message` : `Replying to ${replyingTo?.username}`}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {editingMessage?.content || replyingTo?.content}
                  </p>
                </div>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                  onClick={() => { setReplyingTo(null); setEditingMessage(null); setInputMessage(''); }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Input Area */}
        <div className="border-t px-3 py-2.5 bg-card/50 shrink-0">
          <div className="flex items-end gap-2">
            {/* Attachments */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.zip,.ppt,.pptx,.xls,.xlsx"
              onChange={handleFileSelect}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isConnected || !isJoined || uploadingFile}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach file</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Emoji */}
            <div className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowEmoji(!showEmoji)}
                      disabled={!isConnected || !isJoined}
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Emoji</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <AnimatePresence>
                {showEmoji && (
                  <EmojiPicker
                    onSelect={(emoji) => setInputMessage(prev => prev + emoji)}
                    onClose={() => setShowEmoji(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Text Input */}
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  !isConnected ? 'Connecting...' :
                  !isJoined ? 'Joining room...' :
                  editingMessage ? 'Edit message...' :
                  `Message ${currentRoom?.name || 'chat'}...`
                }
                disabled={!isConnected || !isJoined}
                className="h-9 text-sm pr-3 bg-background"
              />
            </div>

            {/* Send Button */}
            <Button
              size="icon"
              disabled={!isConnected || !isJoined || !inputMessage.trim()}
              className="h-9 w-9 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
              onClick={sendMessage}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ Right Panel (Members) ═══ */}
      <AnimatePresence>
        {showMembers && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden lg:flex flex-col border-l bg-card/50 shrink-0 overflow-hidden"
          >
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="text-sm font-semibold text-foreground">Members</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowMembers(false)}>
                <PanelRightClose className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {/* Online */}
                {onlineUsers.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">
                      Online — {onlineUsers.length}
                    </p>
                    <div className="space-y-1">
                      {onlineUsers.map(u => (
                        <div key={u.userId} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors">
                          <div className="relative">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold bg-gradient-to-br ${getAvatarGradient(u.userId)}`}>
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{u.username}</p>
                            <p className="text-[10px] text-muted-foreground">{u.role === 'CR' ? 'Class Rep' : u.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Room Info */}
                {currentRoom && (
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                      Room Info
                    </p>
                    <div className="space-y-2 px-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Type</span>
                        <Badge variant="secondary" className="text-[10px] h-5">{currentRoom.type}</Badge>
                      </div>
                      {currentRoom.batch && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Batch</span>
                          <span className="text-xs font-medium">{currentRoom.batch}</span>
                        </div>
                      )}
                      {currentRoom.memberCount && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Members</span>
                          <span className="text-xs font-medium">{currentRoom.memberCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ═══ Image Preview Modal ═══ */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setImagePreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-2xl p-4 max-w-md w-full border shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                  Send Image
                </h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setImagePreview(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <img
                src={imagePreview.url}
                alt="Preview"
                className="w-full rounded-xl max-h-64 object-contain bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-2 truncate">{imagePreview.name}</p>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" className="flex-1" onClick={() => setImagePreview(null)}>Cancel</Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => sendImageMessage(imagePreview)}>Send</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Search Messages Dialog ═══ */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">Search Messages</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Type to search messages..."
              value={messageSearch}
              onChange={e => setMessageSearch(e.target.value)}
              autoFocus
              className="h-9"
            />
            {messageSearch.trim() && (
              <ScrollArea className="max-h-72">
                <div className="space-y-2">
                  {searchResults.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No results found</p>
                  ) : (
                    searchResults.map(m => (
                      <div key={m.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer" onClick={() => {
                        // Scroll to this message
                        const el = document.getElementById(`msg-${m.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setSearchDialogOpen(false);
                      }}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold bg-gradient-to-br ${getAvatarGradient(m.userId)} shrink-0`}>
                          {m.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold">{m.username}</p>
                          <p className="text-xs text-muted-foreground truncate">{m.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

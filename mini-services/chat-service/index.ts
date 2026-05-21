import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import fs from 'fs';
import path from 'path';

// ─── Configuration ───────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3003;
const JWT_SECRET = process.env.JWT_SECRET || 'pu-alrms-dev-key-2024-local';
const MAX_MESSAGES_PER_MINUTE = 30;
const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
const UPLOAD_DIR = '/tmp/uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── AI Bot Configuration ────────────────────────────────────
const AI_BOT = {
  userId: 'ai-bot',
  name: 'Lucky Strick AI',
  email: 'ai-bot@pu-alrms.local',
  role: 'SYSTEM',
  avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=AI&backgroundColor=8b5cf6',
} as const;
const AI_TRIGGER_PATTERN = /^@(ai|lucky)\s+/i;
const LUCKY_STRICK_API = 'http://localhost:3000/api/lucky-strick/chat';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Types ───────────────────────────────────────────────────
interface AuthenticatedUser {
  userId: string;
  username: string;
  role: string;
  batch?: string;
  department?: string;
  avatar?: string;
}

interface ConnectedSocket extends AuthenticatedUser {
  socketId: string;
  joinedRooms: Set<string>;
  lastActivity: number;
  messageCount: number;
  messageCountReset: number;
}

// ─── In-Memory State ────────────────────────────────────────
const connectedUsers = new Map<string, ConnectedSocket>(); // socketId -> user
const roomMembers = new Map<string, Set<string>>(); // roomId -> Set<socketId>
const idleTimers = new Map<string, ReturnType<typeof setTimeout>>();

// ─── Helpers ────────────────────────────────────────────────
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function createSystemMessage(roomId: string, content: string) {
  return {
    id: generateId(),
    roomId,
    userId: 'system',
    username: 'System',
    content,
    messageType: 'TEXT',
    timestamp: new Date().toISOString(),
    type: 'system' as const,
  };
}

function verifyJWT(token: string): any | null {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    // Fallback: parse without verification
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.exp && payload.exp < Date.now() / 1000) return null;
      return payload;
    } catch {
      return null;
    }
  }
}

function checkRateLimit(user: ConnectedSocket): boolean {
  const now = Date.now();
  // Reset counter every minute
  if (now - user.messageCountReset > 60 * 1000) {
    user.messageCount = 0;
    user.messageCountReset = now;
  }
  user.messageCount++;
  if (user.messageCount > MAX_MESSAGES_PER_MINUTE) {
    return false;
  }
  return true;
}

function resetIdleTimer(socketId: string, io: Server) {
  if (idleTimers.has(socketId)) {
    clearTimeout(idleTimers.get(socketId)!);
  }
  const timer = setTimeout(() => {
    const user = connectedUsers.get(socketId);
    if (user) {
      console.log(`[Idle Timeout] Disconnecting user: ${user.username} (${socketId})`);
      io.sockets.sockets.get(socketId)?.disconnect(true);
    }
  }, IDLE_TIMEOUT_MS);
  idleTimers.set(socketId, timer);
}

function clearIdleTimer(socketId: string) {
  if (idleTimers.has(socketId)) {
    clearTimeout(idleTimers.get(socketId)!);
    idleTimers.delete(socketId);
  }
}

function getOnlineUsersForRoom(roomId: string): Array<{ userId: string; username: string; role: string }> {
  const members = roomMembers.get(roomId);
  if (!members) return [];
  const users: Array<{ userId: string; username: string; role: string }> = [];
  for (const socketId of members) {
    const user = connectedUsers.get(socketId);
    if (user) {
      users.push({ userId: user.userId, username: user.username, role: user.role });
    }
  }
  return users;
}

function userCanAccessRoom(user: AuthenticatedUser, room: { type: string; batch?: string | null; department?: string | null }): boolean {
  // Admin, SUPER_ADMIN, DEVELOPER can access all rooms
  if (['ADMIN', 'SUPER_ADMIN', 'DEVELOPER'].includes(user.role)) return true;

  // GENERAL rooms: accessible by everyone
  if (room.type === 'GENERAL') return true;

  // BATCH rooms: user must have matching batch
  if (room.type === 'BATCH') {
    if (!room.batch) return true; // No batch filter = open to all
    return user.batch === room.batch;
  }

  // DEPARTMENT rooms: user must have matching department
  if (room.type === 'DEPARTMENT') {
    if (!room.department) return true;
    return user.department === room.department;
  }

  return true;
}

// ─── HTTP Server ─────────────────────────────────────────────
const httpServer = createServer();

// File upload endpoint (multipart)
httpServer.on('request', async (req, res) => {
  if (req.method === 'POST' && req.url === '/upload') {
    try {
      const chunks: Buffer[] = [];
      let totalSize = 0;
      const boundary = req.headers['content-type']?.split('boundary=')[1];

      for await (const chunk of req) {
        totalSize += chunk.length;
        if (totalSize > MAX_FILE_SIZE) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'File too large (max 10MB)' }));
          return;
        }
        chunks.push(chunk);
      }

      const body = Buffer.concat(chunks).toString('binary');
      const boundaryIndex = body.indexOf('--' + boundary);
      if (boundaryIndex === -1) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid multipart data' }));
        return;
      }

      // Extract filename from Content-Disposition
      const headerSection = body.substring(boundaryIndex, body.indexOf('\r\n\r\n', boundaryIndex));
      const filenameMatch = headerSection.match(/filename="([^"]+)"/);
      const fileName = filenameMatch ? filenameMatch[1] : `upload_${Date.now()}`;

      // Extract file content
      const start = body.indexOf('\r\n\r\n', boundaryIndex) + 4;
      const end = body.lastIndexOf('--' + boundary) - 2;
      const fileContent = body.substring(start, end > start ? end : start);

      const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = path.join(UPLOAD_DIR, safeName);

      // Convert from binary string to buffer
      const buffer = Buffer.from(fileContent, 'binary');
      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/uploads/${safeName}`;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        fileUrl,
        fileName,
        fileSize: buffer.length,
      }));
    } catch (error) {
      console.error('[Upload Error]', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Upload failed' }));
    }
  } else if (req.method === 'GET' && req.url?.startsWith('/uploads/')) {
    // Serve uploaded files
    try {
      const fileName = req.url.replace('/uploads/', '');
      const filePath = path.join(UPLOAD_DIR, fileName);

      // Prevent directory traversal
      if (fileName.includes('..')) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      const fileContent = fs.readFileSync(filePath);
      const ext = path.extname(fileName).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain',
        '.zip': 'application/zip',
      };

      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Content-Length': fileContent.length,
      });
      res.end(fileContent);
    } catch {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// ─── Socket.IO Server ────────────────────────────────────────
const io = new Server(httpServer, {
  // DO NOT change the path — used by Caddy for XTransformPort routing
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── Connection ──────────────────────────────────────────────
io.on('connection', async (socket) => {
  console.log(`[Connect] Socket ${socket.id} connecting...`);

  // Verify auth token — can come from auth object or handshake query
  const token = socket.handshake.auth?.token || socket.handshake.query?.token as string;

  if (!token) {
    console.log(`[Auth Failed] No token provided for socket ${socket.id}`);
    socket.emit('error', { message: 'Authentication required' });
    socket.disconnect(true);
    return;
  }

  const decoded = verifyJWT(token);
  if (!decoded) {
    console.log(`[Auth Failed] Invalid token for socket ${socket.id}`);
    socket.emit('error', { message: 'Invalid or expired token' });
    socket.disconnect(true);
    return;
  }

  // Load user from DB
  let dbUser;
  try {
    dbUser = await db.user.findUnique({
      where: { id: decoded.userId || decoded.sub || decoded.id },
    });
  } catch (error) {
    console.error(`[DB Error] Failed to load user:`, error);
    socket.emit('error', { message: 'Database error' });
    socket.disconnect(true);
    return;
  }

  if (!dbUser) {
    console.log(`[Auth Failed] User not found in DB for socket ${socket.id}`);
    socket.emit('error', { message: 'User not found' });
    socket.disconnect(true);
    return;
  }

  if (dbUser.status !== 'ACTIVE') {
    console.log(`[Auth Failed] User ${dbUser.name} is ${dbUser.status}`);
    socket.emit('error', { message: `Account is ${dbUser.status}` });
    socket.disconnect(true);
    return;
  }

  // Register connected user
  const connectedUser: ConnectedSocket = {
    socketId: socket.id,
    userId: dbUser.id,
    username: dbUser.name,
    role: dbUser.role,
    batch: dbUser.batch || undefined,
    department: dbUser.department || undefined,
    avatar: dbUser.avatar || undefined,
    joinedRooms: new Set(),
    lastActivity: Date.now(),
    messageCount: 0,
    messageCountReset: Date.now(),
  };

  connectedUsers.set(socket.id, connectedUser);
  console.log(`[Connect] ${connectedUser.username} (${connectedUser.userId}) connected as socket ${socket.id}`);

  // Start idle timer
  resetIdleTimer(socket.id, io);

  // ─── Event: join (initial join handshake) ──────────────────
  // Frontend sends: { userId, username, role, batch }
  socket.on('join', async (data: { userId?: string; username?: string; role?: string; batch?: string }) => {
    try {
      // Fetch rooms this user can access from DB
      const rooms = await db.chatRoom.findMany({
        where: {
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'asc' },
      });

      // Filter rooms user can access
      const accessibleRooms = rooms.filter(room =>
        userCanAccessRoom(connectedUser, room)
      );

      const roomList = accessibleRooms.map(room => ({
        id: room.id,
        name: room.name,
        type: room.type,
        batch: room.batch || undefined,
      }));

      // Ensure default room exists
      if (accessibleRooms.length === 0) {
        const defaultRoom = await db.chatRoom.create({
          data: {
            name: 'General Chat',
            type: 'GENERAL',
            status: 'ACTIVE',
            maxMembers: 500,
            allowFiles: true,
          },
        });
        roomList.push({
          id: defaultRoom.id,
          name: defaultRoom.name,
          type: 'GENERAL' as const,
        });
      }

      socket.emit('joined', {
        rooms: roomList.map(r => r.id),
      });

      socket.emit('room-list', roomList);

      console.log(`[Join] ${connectedUser.username} can access ${roomList.length} rooms`);
    } catch (error) {
      console.error('[Join Error]', error);
      socket.emit('error', { message: 'Failed to load rooms' });
    }
  });

  // ─── Event: join-room ──────────────────────────────────────
  // Frontend sends: { roomId }
  socket.on('join-room', async (data: { roomId?: string }) => {
    try {
      const { roomId } = data;
      if (!roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      // Check room exists and is active
      const room = await db.chatRoom.findUnique({
        where: { id: roomId },
      });

      if (!room || room.status !== 'ACTIVE') {
        socket.emit('error', { message: 'Room not found or inactive' });
        return;
      }

      // Check access
      if (!userCanAccessRoom(connectedUser, room)) {
        socket.emit('error', { message: 'You do not have access to this room' });
        return;
      }

      // Leave previous rooms with same type if needed
      const previousRooms = Array.from(connectedUser.joinedRooms);
      for (const prevRoomId of previousRooms) {
        socket.leave(prevRoomId);
        roomMembers.get(prevRoomId)?.delete(socket.id);
      }

      // Join the room
      socket.join(roomId);
      connectedUser.joinedRooms.add(roomId);

      // Track room members
      if (!roomMembers.has(roomId)) {
        roomMembers.set(roomId, new Set());
      }
      roomMembers.get(roomId)!.add(socket.id);

      // Load last 50 messages
      const dbMessages = await db.chatMessage.findMany({
        where: {
          roomId,
          isDeleted: false,
        },
        include: {
          user: {
            select: { id: true, name: true, role: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });

      const formattedMessages = dbMessages.map(msg => ({
        id: msg.id,
        roomId: msg.roomId,
        userId: msg.userId,
        username: msg.user?.name || 'Unknown',
        content: msg.content,
        messageType: msg.messageType,
        fileUrl: msg.fileUrl || undefined,
        fileName: msg.fileName || undefined,
        timestamp: msg.createdAt.toISOString(),
        role: msg.user?.role || undefined,
        type: msg.messageType === 'SYSTEM' ? 'system' as const : 'user' as const,
      }));

      socket.emit('room-messages', {
        roomId,
        messages: formattedMessages,
      });

      // Notify others in the room
      const systemMsg = createSystemMessage(roomId, `${connectedUser.username} joined the room`);
      socket.to(roomId).emit('user-joined-room', {
        roomId,
        user: { userId: connectedUser.userId, username: connectedUser.username, role: connectedUser.role },
        message: systemMsg,
      });

      // Update last activity
      await db.chatRoom.update({
        where: { id: roomId },
        data: { lastActivity: new Date() },
      });

      console.log(`[Room] ${connectedUser.username} joined room ${room.name} (${roomId})`);
    } catch (error) {
      console.error('[Join-Room Error]', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // ─── Event: leave-room ─────────────────────────────────────
  socket.on('leave-room', async (data: { roomId?: string }) => {
    try {
      const { roomId } = data;
      if (!roomId || !connectedUser.joinedRooms.has(roomId)) return;

      // Get room name for system message
      const room = await db.chatRoom.findUnique({ where: { id: roomId } });

      socket.leave(roomId);
      connectedUser.joinedRooms.delete(roomId);
      roomMembers.get(roomId)?.delete(socket.id);

      // Notify others
      const systemMsg = createSystemMessage(roomId, `${connectedUser.username} left the room`);
      socket.to(roomId).emit('user-left-room', {
        roomId,
        user: { userId: connectedUser.userId, username: connectedUser.username, role: connectedUser.role },
        message: systemMsg,
      });

      console.log(`[Room] ${connectedUser.username} left room ${room?.name || roomId}`);
    } catch (error) {
      console.error('[Leave-Room Error]', error);
    }
  });

  // ─── Event: room-list ──────────────────────────────────────
  socket.on('room-list', async () => {
    try {
      const rooms = await db.chatRoom.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' },
      });

      const accessibleRooms = rooms.filter(room =>
        userCanAccessRoom(connectedUser, room)
      );

      const roomList = accessibleRooms.map(room => ({
        id: room.id,
        name: room.name,
        type: room.type,
        batch: room.batch || undefined,
      }));

      socket.emit('room-list', roomList);
    } catch (error) {
      console.error('[Room-List Error]', error);
    }
  });

  // ─── Event: users-list ─────────────────────────────────────
  // Frontend sends: { roomId }
  socket.on('users-list', (data: { roomId?: string }) => {
    const { roomId } = data;
    if (!roomId) return;

    const users = getOnlineUsersForRoom(roomId);
    socket.emit('users-list', { roomId, users });
  });

  // ─── Event: message ────────────────────────────────────────
  // Frontend sends: { content, roomId, messageType, fileUrl, fileName }
  socket.on('message', async (data: {
    content?: string;
    roomId?: string;
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
    replyToId?: string;
  }) => {
    try {
      const { content, roomId, messageType = 'TEXT', fileUrl, fileName, replyToId } = data;

      // Validate
      if (!roomId || !connectedUser.joinedRooms.has(roomId)) {
        socket.emit('error', { message: 'Not in this room' });
        return;
      }

      // Rate limiting
      if (!checkRateLimit(connectedUser)) {
        socket.emit('error', { message: 'Rate limit exceeded. Max 30 messages per minute.' });
        return;
      }

      // Validate content for TEXT messages
      if (messageType === 'TEXT' && (!content || content.trim().length === 0)) {
        socket.emit('error', { message: 'Message content is required' });
        return;
      }

      // Check room allows files if uploading
      if ((messageType === 'FILE' || messageType === 'IMAGE') && fileUrl) {
        const room = await db.chatRoom.findUnique({ where: { id: roomId } });
        if (room && !room.allowFiles) {
          socket.emit('error', { message: 'File sharing is disabled in this room' });
          return;
        }
      }

      // Save message to DB
      const message = await db.chatMessage.create({
        data: {
          roomId,
          userId: connectedUser.userId,
          content: content || '',
          messageType,
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          replyToId: replyToId || null,
        },
        include: {
          user: {
            select: { id: true, name: true, role: true, avatar: true },
          },
        },
      });

      // Update room last activity
      await db.chatRoom.update({
        where: { id: roomId },
        data: { lastActivity: new Date() },
      });

      // Format and broadcast
      const formattedMsg = {
        id: message.id,
        roomId: message.roomId,
        userId: message.userId,
        username: connectedUser.username,
        content: message.content,
        messageType: message.messageType,
        fileUrl: message.fileUrl || undefined,
        fileName: message.fileName || undefined,
        timestamp: message.createdAt.toISOString(),
        role: connectedUser.role,
        type: 'user' as const,
      };

      // Emit to all in room including sender
      io.to(roomId).emit('message', formattedMsg);

      // Reset idle timer
      connectedUser.lastActivity = Date.now();
      resetIdleTimer(socket.id, io);

      console.log(`[Message] ${connectedUser.username}: ${content?.substring(0, 50)}... [${roomId}]`);

      // ─── AI Bot: respond to @ai or @lucky mentions ───────
      // Skip if the sender is the AI bot itself (prevent recursion)
      if (connectedUser.userId !== AI_BOT.userId && messageType === 'TEXT' && content && AI_TRIGGER_PATTERN.test(content.trim())) {
        const question = content.trim().replace(AI_TRIGGER_PATTERN, '').trim();
        if (question) {
          // Send typing indicator so users know the AI is thinking
          io.to(roomId).emit('typing', {
            roomId,
            username: AI_BOT.name,
            isTyping: true,
            userId: AI_BOT.userId,
          });

          // Process AI response asynchronously (don't block the message handler)
          (async () => {
            try {
              const botToken = generateAIBotToken();
              const response = await fetch(LUCKY_STRICK_API, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${botToken}`,
                },
                body: JSON.stringify({
                  message: question,
                  subject: 'general',
                }),
              });

              let aiText = '';

              if (response.ok) {
                const contentType = response.headers.get('content-type') || '';

                if (contentType.includes('text/event-stream')) {
                  // Read SSE stream
                  const reader = response.body?.getReader();
                  if (reader) {
                    const decoder = new TextDecoder();
                    let buffer = '';
                    while (true) {
                      const { done, value } = await reader.read();
                      if (done) break;
                      buffer += decoder.decode(value, { stream: true });
                      const lines = buffer.split('\n');
                      buffer = lines.pop() || '';
                      for (const line of lines) {
                        if (line.startsWith('data: ')) {
                          const data = line.slice(6).trim();
                          if (data === '[DONE]') continue;
                          try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) aiText += parsed.content;
                          } catch {
                            // Skip malformed JSON chunks
                          }
                        }
                      }
                    }
                  }
                } else {
                  // Read as JSON
                  const json = await response.json();
                  aiText = json?.response || json?.content || json?.message || '';
                }
              } else {
                console.error(`[AI Bot] API returned status ${response.status}`);
              }

              // Stop typing indicator
              io.to(roomId).emit('typing', {
                roomId,
                username: AI_BOT.name,
                isTyping: false,
                userId: AI_BOT.userId,
              });

              if (aiText.trim()) {
                // Save AI message to DB
                const aiMessage = await db.chatMessage.create({
                  data: {
                    roomId,
                    userId: AI_BOT.userId,
                    content: aiText.trim(),
                    messageType: 'TEXT',
                  },
                  include: {
                    user: {
                      select: { id: true, name: true, role: true, avatar: true },
                    },
                  },
                });

                // Broadcast AI response to room
                io.to(roomId).emit('message', {
                  id: aiMessage.id,
                  roomId: aiMessage.roomId,
                  userId: AI_BOT.userId,
                  username: AI_BOT.name,
                  content: aiMessage.content,
                  messageType: aiMessage.messageType,
                  timestamp: aiMessage.createdAt.toISOString(),
                  role: AI_BOT.role,
                  type: 'user' as const,
                });

                console.log(`[AI Bot] Responded in room ${roomId} (${aiText.length} chars)`);
              } else {
                // No content received — send fallback
                io.to(roomId).emit('message', {
                  id: generateId(),
                  roomId,
                  userId: AI_BOT.userId,
                  username: AI_BOT.name,
                  content: 'Sorry, I could not generate a response. Please try again.',
                  messageType: 'TEXT',
                  timestamp: new Date().toISOString(),
                  role: AI_BOT.role,
                  type: 'user' as const,
                });
              }
            } catch (err) {
              console.error('[AI Bot] Error generating response:', err);

              // Stop typing indicator
              io.to(roomId).emit('typing', {
                roomId,
                username: AI_BOT.name,
                isTyping: false,
                userId: AI_BOT.userId,
              });

              // Send error message to room
              io.to(roomId).emit('message', {
                id: generateId(),
                roomId,
                userId: AI_BOT.userId,
                username: AI_BOT.name,
                content: 'Sorry, I encountered an error while processing your request. Please try again later.',
                messageType: 'TEXT',
                timestamp: new Date().toISOString(),
                role: AI_BOT.role,
                type: 'user' as const,
              });
            }
          })();
        }
      }
    } catch (error) {
      console.error('[Message Error]', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // ─── Event: typing ─────────────────────────────────────────
  // Frontend sends: { roomId, isTyping }
  socket.on('typing', (data: { roomId?: string; isTyping?: boolean }) => {
    const { roomId, isTyping } = data;
    if (!roomId) return;

    // Broadcast to room excluding sender
    socket.to(roomId).emit('typing', {
      roomId,
      username: connectedUser.username,
      isTyping: !!isTyping,
    });
  });

  // ─── Event: edit-message ───────────────────────────────────
  socket.on('edit-message', async (data: { messageId?: string; content?: string }) => {
    try {
      const { messageId, content } = data;
      if (!messageId || !content) {
        socket.emit('error', { message: 'Message ID and content are required' });
        return;
      }

      // Verify ownership
      const message = await db.chatMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      if (message.userId !== connectedUser.userId) {
        socket.emit('error', { message: 'You can only edit your own messages' });
        return;
      }

      if (message.isDeleted) {
        socket.emit('error', { message: 'Cannot edit deleted message' });
        return;
      }

      const updated = await db.chatMessage.update({
        where: { id: messageId },
        data: { content, isEdited: true },
      });

      io.to(message.roomId).emit('message-edited', {
        messageId: updated.id,
        content: updated.content,
        isEdited: true,
        roomId: message.roomId,
      });

      console.log(`[Edit] ${connectedUser.username} edited message ${messageId}`);
    } catch (error) {
      console.error('[Edit Error]', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // ─── Event: delete-message ─────────────────────────────────
  socket.on('delete-message', async (data: { messageId?: string }) => {
    try {
      const { messageId } = data;
      if (!messageId) {
        socket.emit('error', { message: 'Message ID is required' });
        return;
      }

      const message = await db.chatMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Only owner or admin can delete
      const canDelete = message.userId === connectedUser.userId ||
        ['ADMIN', 'SUPER_ADMIN', 'DEVELOPER'].includes(connectedUser.role);

      if (!canDelete) {
        socket.emit('error', { message: 'You can only delete your own messages' });
        return;
      }

      await db.chatMessage.update({
        where: { id: messageId },
        data: { isDeleted: true, content: '[Message deleted]' },
      });

      io.to(message.roomId).emit('message-deleted', {
        messageId,
        roomId: message.roomId,
      });

      console.log(`[Delete] ${connectedUser.username} deleted message ${messageId}`);
    } catch (error) {
      console.error('[Delete Error]', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // ─── Event: pin-message ────────────────────────────────────
  socket.on('pin-message', async (data: { messageId?: string }) => {
    try {
      const { messageId } = data;
      if (!messageId) {
        socket.emit('error', { message: 'Message ID is required' });
        return;
      }

      const message = await db.chatMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      const newPinnedState = !message.isPinned;
      await db.chatMessage.update({
        where: { id: messageId },
        data: { isPinned: newPinnedState },
      });

      io.to(message.roomId).emit('message-pinned', {
        messageId,
        isPinned: newPinnedState,
        roomId: message.roomId,
        pinnedBy: connectedUser.username,
      });

      console.log(`[Pin] ${connectedUser.username} ${newPinnedState ? 'pinned' : 'unpinned'} message ${messageId}`);
    } catch (error) {
      console.error('[Pin Error]', error);
      socket.emit('error', { message: 'Failed to pin message' });
    }
  });

  // ─── Event: mark-read ──────────────────────────────────────
  socket.on('mark-read', async (data: { roomId?: string; messageIds?: string[] }) => {
    try {
      const { roomId, messageIds } = data;
      if (!roomId || !messageIds || messageIds.length === 0) return;

      // Create read receipts (ignore duplicates via catch)
      for (const messageId of messageIds) {
        try {
          await db.chatReadReceipt.create({
            data: {
              messageId,
              userId: connectedUser.userId,
            },
          });
        } catch {
          // Ignore unique constraint errors (already read)
        }
      }

      // Notify room about read receipts
      socket.to(roomId).emit('read-receipt', {
        roomId,
        userId: connectedUser.userId,
        username: connectedUser.username,
        messageIds,
      });
    } catch (error) {
      console.error('[Read-Receipt Error]', error);
    }
  });

  // ─── Disconnect ────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    console.log(`[Disconnect] ${connectedUser.username} disconnected (${reason})`);

    // Leave all rooms and notify
    for (const roomId of connectedUser.joinedRooms) {
      roomMembers.get(roomId)?.delete(socket.id);

      const systemMsg = createSystemMessage(roomId, `${connectedUser.username} left the room`);
      socket.to(roomId).emit('user-left-room', {
        roomId,
        user: { userId: connectedUser.userId, username: connectedUser.username, role: connectedUser.role },
        message: systemMsg,
      });
    }

    // Cleanup
    connectedUsers.delete(socket.id);
    clearIdleTimer(socket.id);
  });

  // ─── Error ─────────────────────────────────────────────────
  socket.on('error', (error) => {
    console.error(`[Socket Error] ${connectedUser.username}:`, error);
  });
});

// ─── Ensure AI Bot User Exists in DB ────────────────────────
async function ensureAIBotUser() {
  try {
    await db.user.upsert({
      where: { id: AI_BOT.userId },
      update: {
        name: AI_BOT.name,
        avatar: AI_BOT.avatar,
        status: 'ACTIVE',
      },
      create: {
        id: AI_BOT.userId,
        name: AI_BOT.name,
        email: AI_BOT.email,
        role: AI_BOT.role,
        status: 'ACTIVE',
        avatar: AI_BOT.avatar,
        password: '',
        authProvider: 'EMAIL',
      },
    });
    console.log(`[AI Bot] User '${AI_BOT.name}' ensured in DB`);
  } catch (err) {
    console.error('[AI Bot] Failed to ensure AI bot user:', err);
  }
}

// Generate a JWT for the AI bot (to call Lucky Strick API)
function generateAIBotToken(): string {
  const payload = {
    userId: AI_BOT.userId,
    email: AI_BOT.email,
    name: AI_BOT.name,
    role: AI_BOT.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// ─── Start Server ────────────────────────────────────────────
httpServer.listen(PORT, async () => {
  // Ensure AI bot user exists before accepting connections
  await ensureAIBotUser();

  console.log(`╔══════════════════════════════════════════════╗`);
  console.log(`║  PU-ALRMS Chat Service                      ║`);
  console.log(`║  Socket.IO server running on port ${PORT}       ║`);
  console.log(`║  File uploads: POST /upload                   ║`);
  console.log(`║  File serving: GET /uploads/:filename         ║`);
  console.log(`║  AI Bot: Lucky Strick AI (enabled)           ║`);
  console.log(`║  JWT Secret: ${JWT_SECRET.substring(0, 10)}...            ║`);
  console.log(`╚══════════════════════════════════════════════╝`);
});

// ─── Graceful Shutdown ───────────────────────────────────────
async function gracefulShutdown() {
  console.log('\n[Shutdown] Starting graceful shutdown...');
  io.close();
  await db.$disconnect();

  // Clear all idle timers
  for (const timer of idleTimers.values()) {
    clearTimeout(timer);
  }
  idleTimers.clear();

  httpServer.close(() => {
    console.log('[Shutdown] Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('[Shutdown] Forcing exit after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('uncaughtException', (error) => {
  console.error('[Uncaught Exception]', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

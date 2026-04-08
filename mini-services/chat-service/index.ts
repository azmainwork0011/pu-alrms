import { Server, Socket } from "socket.io";

// ─── Types ──────────────────────────────────────────────────────────────────

type RoomType = "BATCH" | "SUBJECT" | "GENERAL";
type MessageType = "TEXT" | "IMAGE" | "FILE";

interface ChatRoom {
  id: string;
  name: string;
  type: RoomType;
  subjectId?: string;
  batch?: string;
}

interface ChatUser {
  id: string;
  userId: string;
  username: string;
  role: string;
  batch?: string;
  socketId: string;
  rooms: Set<string>;
}

interface ChatMsg {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  messageType: MessageType;
  fileUrl?: string;
  fileName?: string;
  timestamp: string;
  role?: string;
  type?: "user" | "system";
}

// ─── Socket.IO Server ───────────────────────────────────────────────────────

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ─── In-memory Storage ──────────────────────────────────────────────────────

const MAX_MESSAGES_PER_ROOM = 200;
const MAX_TEXT_LENGTH = 500;

const rooms: Map<string, ChatRoom> = new Map();
const roomMessages: Map<string, ChatMsg[]> = new Map();
const onlineUsers: Map<string, ChatUser> = new Map(); // key = socketId
const userSocketMap: Map<string, string> = new Map(); // key = userId, value = socketId

// ─── Pre-create Default Rooms ───────────────────────────────────────────────

const defaultRooms: ChatRoom[] = [
  {
    id: "general",
    name: "General Chat",
    type: "GENERAL",
  },
  {
    id: "cse-66",
    name: "CSE 66 Batch",
    type: "BATCH",
    batch: "CSE-66",
  },
  {
    id: "cse-65",
    name: "CSE 65 Batch",
    type: "BATCH",
    batch: "CSE-65",
  },
  {
    id: "subject-cse101",
    name: "CSE 101 - Intro to CS",
    type: "SUBJECT",
    subjectId: "cse101",
  },
];

for (const room of defaultRooms) {
  rooms.set(room.id, room);
  roomMessages.set(room.id, []);
}

console.log(`[Chat Service] ${rooms.size} default rooms created`);

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function getRoomList(): ChatRoom[] {
  return Array.from(rooms.values());
}

function getMessagesForRoom(roomId: string): ChatMsg[] {
  return roomMessages.get(roomId) || [];
}

function addMessageToRoom(roomId: string, msg: ChatMsg): void {
  const msgs = roomMessages.get(roomId);
  if (!msgs) return;
  msgs.push(msg);
  if (msgs.length > MAX_MESSAGES_PER_ROOM) msgs.shift();
}

function createSystemMessage(roomId: string, content: string): ChatMsg {
  return {
    id: generateId(),
    roomId,
    userId: "system",
    username: "System",
    content,
    messageType: "TEXT",
    timestamp: new Date().toISOString(),
    type: "system",
  };
}

function getUsersInRoom(roomId: string): { userId: string; username: string; role: string }[] {
  const result: { userId: string; username: string; role: string }[] = [];
  for (const [socketId, user] of onlineUsers.entries()) {
    if (user.rooms.has(roomId)) {
      result.push({
        userId: user.userId,
        username: user.username,
        role: user.role,
      });
    }
  }
  return result;
}

function getSocketUser(socket: Socket): ChatUser | undefined {
  return onlineUsers.get(socket.id);
}

function ensureRoom(roomId: string, room?: Partial<ChatRoom>): ChatRoom | undefined {
  if (rooms.has(roomId)) {
    return rooms.get(roomId)!;
  }
  if (room) {
    const newRoom: ChatRoom = {
      id: roomId,
      name: room.name || roomId,
      type: room.type || "GENERAL",
      subjectId: room.subjectId,
      batch: room.batch,
    };
    rooms.set(roomId, newRoom);
    roomMessages.set(roomId, []);
    console.log(`[Chat Service] Room auto-created: ${newRoom.name} (${roomId})`);
    return newRoom;
  }
  return undefined;
}

// ─── Event Handlers ─────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log(`[Chat Service] Connection: ${socket.id}`);

  // ── JOIN ──────────────────────────────────────────────────────────────
  socket.on(
    "join",
    (data: {
      userId?: string;
      username?: string;
      role?: string;
      batch?: string;
    }) => {
      const userId = data.userId || generateId();
      const username = data.username || "Anonymous";
      const role = data.role || "STUDENT";
      const batch = data.batch;

      // Clean up any existing connection for this userId
      const existingSocketId = userSocketMap.get(userId);
      if (existingSocketId && existingSocketId !== socket.id) {
        const existingUser = onlineUsers.get(existingSocketId);
        if (existingUser) {
          // Leave all rooms
          for (const roomId of existingUser.rooms) {
            socket.broadcast.to(roomId).emit("user-left-room", {
              roomId,
              user: {
                userId: existingUser.userId,
                username: existingUser.username,
                role: existingUser.role,
              },
            });
          }
          onlineUsers.delete(existingSocketId);
          // Force disconnect old socket
          io.sockets.sockets.get(existingSocketId)?.disconnect(true);
        }
      }

      const chatUser: ChatUser = {
        id: socket.id,
        userId,
        username,
        role,
        batch,
        socketId: socket.id,
        rooms: new Set(),
      };

      onlineUsers.set(socket.id, chatUser);
      userSocketMap.set(userId, socket.id);

      console.log(`[Chat Service] ${username} (${role}, userId=${userId}) joined`);

      // Auto-join "general" room
      const generalRoom = rooms.get("general");
      if (generalRoom) {
        chatUser.rooms.add("general");
        socket.join("general");

        const joinMsg = createSystemMessage("general", `${username} joined the chat`);
        addMessageToRoom("general", joinMsg);
        socket.broadcast.to("general").emit("user-joined-room", {
          roomId: "general",
          user: { userId, username, role },
          message: joinMsg,
        });
      }

      // Auto-join batch room if batch is provided
      if (batch) {
        const batchRoomId = batch.toLowerCase().replace(/\s+/g, "-");
        const batchRoom = ensureRoom(batchRoomId, {
          name: `${batch} Batch`,
          type: "BATCH",
          batch,
        });
        if (batchRoom && !chatUser.rooms.has(batchRoomId)) {
          chatUser.rooms.add(batchRoomId);
          socket.join(batchRoomId);
          const batchJoinMsg = createSystemMessage(batchRoomId, `${username} joined the chat`);
          addMessageToRoom(batchRoomId, batchJoinMsg);
          socket.broadcast.to(batchRoomId).emit("user-joined-room", {
            roomId: batchRoomId,
            user: { userId, username, role },
            message: batchJoinMsg,
          });
        }
      }

      // Confirm join
      socket.emit("joined", {
        userId: chatUser.userId,
        username: chatUser.username,
        role: chatUser.role,
        batch: chatUser.batch,
        rooms: Array.from(chatUser.rooms),
      });

      // Send room list
      socket.emit("room-list", getRoomList());

      // Send general room messages
      socket.emit("room-messages", {
        roomId: "general",
        messages: getMessagesForRoom("general"),
      });

      // Send users in general room
      socket.emit("users-list", {
        roomId: "general",
        users: getUsersInRoom("general"),
      });
    }
  );

  // ── JOIN ROOM ─────────────────────────────────────────────────────────
  socket.on("join-room", (data: { roomId: string }) => {
    const user = getSocketUser(socket);
    if (!user) {
      socket.emit("error", { message: "Not joined to chat. Send 'join' event first." });
      return;
    }

    const roomId = data.roomId;
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("error", { message: `Room "${roomId}" not found.` });
      return;
    }

    if (user.rooms.has(roomId)) {
      // Already in room, just send messages
      socket.emit("room-messages", {
        roomId,
        messages: getMessagesForRoom(roomId),
      });
      socket.emit("users-list", {
        roomId,
        users: getUsersInRoom(roomId),
      });
      return;
    }

    // Join the room
    user.rooms.add(roomId);
    socket.join(roomId);

    const joinMsg = createSystemMessage(roomId, `${user.username} joined the chat`);
    addMessageToRoom(roomId, joinMsg);

    socket.emit("room-messages", {
      roomId,
      messages: getMessagesForRoom(roomId),
    });

    socket.emit("users-list", {
      roomId,
      users: getUsersInRoom(roomId),
    });

    // Broadcast to others in the room
    socket.broadcast.to(roomId).emit("user-joined-room", {
      roomId,
      user: {
        userId: user.userId,
        username: user.username,
        role: user.role,
      },
      message: joinMsg,
    });

    console.log(`[Chat Service] ${user.username} joined room: ${room.name} (${roomId})`);
  });

  // ── LEAVE ROOM ────────────────────────────────────────────────────────
  socket.on("leave-room", (data: { roomId: string }) => {
    const user = getSocketUser(socket);
    if (!user) return;

    const roomId = data.roomId;
    if (!user.rooms.has(roomId)) return;

    // Don't allow leaving "general"
    if (roomId === "general") {
      socket.emit("error", { message: "Cannot leave the general room." });
      return;
    }

    user.rooms.delete(roomId);
    socket.leave(roomId);

    const leaveMsg = createSystemMessage(roomId, `${user.username} left the chat`);
    addMessageToRoom(roomId, leaveMsg);

    socket.broadcast.to(roomId).emit("user-left-room", {
      roomId,
      user: {
        userId: user.userId,
        username: user.username,
        role: user.role,
      },
      message: leaveMsg,
    });

    console.log(`[Chat Service] ${user.username} left room: ${roomId}`);
  });

  // ── MESSAGE ───────────────────────────────────────────────────────────
  socket.on(
    "message",
    (data: {
      content: string;
      messageType?: MessageType;
      roomId?: string;
      fileUrl?: string;
      fileName?: string;
    }) => {
      const user = getSocketUser(socket);
      if (!user) {
        socket.emit("error", { message: "Not joined to chat. Send 'join' event first." });
        return;
      }

      const roomId = data.roomId || "general";
      const messageType: MessageType = data.messageType || "TEXT";
      const content = (data.content || "").trim();

      if (!content && messageType === "TEXT") return;

      // Validate text length for TEXT messages
      if (messageType === "TEXT" && content.length > MAX_TEXT_LENGTH) {
        socket.emit("error", { message: `Message too long. Max ${MAX_TEXT_LENGTH} characters.` });
        return;
      }

      // Must be in the room to send a message
      if (!user.rooms.has(roomId)) {
        socket.emit("error", { message: `You are not in room "${roomId}". Join it first.` });
        return;
      }

      const room = rooms.get(roomId);
      if (!room) return;

      const msg: ChatMsg = {
        id: generateId(),
        roomId,
        userId: user.userId,
        username: user.username,
        content: content || "",
        messageType,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        timestamp: new Date().toISOString(),
        role: user.role,
        type: "user",
      };

      addMessageToRoom(roomId, msg);

      // Broadcast to everyone in the room (including sender)
      io.to(roomId).emit("message", msg);

      console.log(
        `[Chat Service] [${room.name}] ${user.username}: ${messageType} (${msg.id})`
      );
    }
  );

  // ── ROOM MESSAGES (request history) ───────────────────────────────────
  socket.on("room-messages", (data: { roomId: string }) => {
    const user = getSocketUser(socket);
    if (!user) return;

    const roomId = data.roomId;
    if (!user.rooms.has(roomId)) {
      socket.emit("error", { message: `You are not in room "${roomId}".` });
      return;
    }

    socket.emit("room-messages", {
      roomId,
      messages: getMessagesForRoom(roomId),
    });
  });

  // ── ROOM LIST (request available rooms) ───────────────────────────────
  socket.on("room-list", () => {
    socket.emit("room-list", getRoomList());
  });

  // ── USERS LIST (request users in room) ───────────────────────────────
  socket.on("users-list", (data: { roomId: string }) => {
    const roomId = data.roomId || "general";
    socket.emit("users-list", {
      roomId,
      users: getUsersInRoom(roomId),
    });
  });

  // ── CREATE ROOM (dynamic room creation) ───────────────────────────────
  socket.on(
    "create-room",
    (data: {
      id: string;
      name: string;
      type: RoomType;
      subjectId?: string;
      batch?: string;
    }) => {
      const user = getSocketUser(socket);
      if (!user) {
        socket.emit("error", { message: "Not joined to chat." });
        return;
      }

      if (rooms.has(data.id)) {
        // Room already exists, just join it
        socket.emit("join-room", { roomId: data.id });
        return;
      }

      // Only allow teachers and admins to create rooms
      if (user.role !== "TEACHER" && user.role !== "ADMIN") {
        socket.emit("error", { message: "Only teachers and admins can create rooms." });
        return;
      }

      const newRoom: ChatRoom = {
        id: data.id,
        name: data.name,
        type: data.type,
        subjectId: data.subjectId,
        batch: data.batch,
      };

      rooms.set(newRoom.id, newRoom);
      roomMessages.set(newRoom.id, []);

      console.log(`[Chat Service] Room created: ${newRoom.name} (${newRoom.id}) by ${user.username}`);

      // Notify all clients about new room
      io.emit("room-created", newRoom);

      // Auto-join the creator
      socket.emit("join-room", { roomId: newRoom.id });
    }
  );

  // ── TYPING INDICATOR ──────────────────────────────────────────────────
  socket.on("typing", (data: { roomId: string; isTyping: boolean }) => {
    const user = getSocketUser(socket);
    if (!user) return;

    const roomId = data.roomId || "general";
    if (!user.rooms.has(roomId)) return;

    socket.broadcast.to(roomId).emit("typing", {
      roomId,
      userId: user.userId,
      username: user.username,
      isTyping: data.isTyping,
    });
  });

  // ── DISCONNECT ────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;

    // Leave all rooms with system message
    for (const roomId of user.rooms) {
      const leaveMsg = createSystemMessage(roomId, `${user.username} left the chat`);
      addMessageToRoom(roomId, leaveMsg);

      socket.broadcast.to(roomId).emit("user-left-room", {
        roomId,
        user: {
          userId: user.userId,
          username: user.username,
          role: user.role,
        },
        message: leaveMsg,
      });

      // Update users list for each room
      io.to(roomId).emit("users-list", {
        roomId,
        users: getUsersInRoom(roomId),
      });
    }

    onlineUsers.delete(socket.id);
    userSocketMap.delete(user.userId);

    console.log(`[Chat Service] ${user.username} disconnected`);
  });
});

// ─── Start Server ───────────────────────────────────────────────────────────

const PORT = 3003;
io.listen(PORT);
console.log(`[Chat Service] Running on port ${PORT} with ${rooms.size} rooms`);
console.log(`[Chat Service] Rooms: ${Array.from(rooms.keys()).join(", ")}`);

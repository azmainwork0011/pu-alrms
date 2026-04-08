import { Server } from "socket.io";

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

interface ChatUser {
  id: string;
  username: string;
  role: string;
  socketId: string;
}

interface ChatMessage {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  type: "user" | "system";
  role?: string;
}

// In-memory storage
const messages: ChatMessage[] = [];
const MAX_MESSAGES = 100;
const onlineUsers: Map<string, ChatUser> = new Map();

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function getOnlineUsersList() {
  return Array.from(onlineUsers.values()).map(u => ({
    id: u.id,
    username: u.username,
    role: u.role,
  }));
}

io.on("connection", (socket) => {
  console.log(`[Chat] Connection: ${socket.id}`);

  // Handle join event
  socket.on("join", (data: { username: string; role: string }) => {
    const userId = generateId();
    const chatUser: ChatUser = {
      id: userId,
      username: data.username || "Anonymous",
      role: data.role || "STUDENT",
      socketId: socket.id,
    };

    onlineUsers.set(userId, chatUser);
    console.log(`[Chat] ${chatUser.username} (${chatUser.role}) joined`);

    // Confirm join
    socket.emit("joined", { userId });

    // Send message history to the joining user
    socket.emit("messages-history", messages);

    // Send online users list to everyone
    io.emit("users-list", getOnlineUsersList());

    // Broadcast join message to everyone else
    const joinMsg: ChatMessage = {
      id: generateId(),
      username: "System",
      content: `${chatUser.username} joined the chat`,
      timestamp: new Date().toISOString(),
      type: "system",
    };
    messages.push(joinMsg);
    if (messages.length > MAX_MESSAGES) messages.shift();
    
    socket.broadcast.emit("user-joined", {
      user: { id: chatUser.id, username: chatUser.username, role: chatUser.role },
      message: joinMsg,
    });
  });

  // Handle chat messages
  socket.on("message", (data: { content: string; username?: string }) => {
    const userEntry = Array.from(onlineUsers.entries()).find(([_, u]) => u.socketId === socket.id);
    if (!userEntry) {
      return;
    }

    const [, chatUser] = userEntry;
    const content = (data?.content || "").trim();
    
    if (!content) return;
    if (content.length > 500) return;

    const msg: ChatMessage = {
      id: generateId(),
      username: chatUser.username,
      content,
      timestamp: new Date().toISOString(),
      type: "user",
      role: chatUser.role,
    };

    messages.push(msg);
    if (messages.length > MAX_MESSAGES) messages.shift();

    // Broadcast to all including sender
    io.emit("message", msg);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    const userEntry = Array.from(onlineUsers.entries()).find(([_, u]) => u.socketId === socket.id);
    if (userEntry) {
      const [userId, chatUser] = userEntry;
      onlineUsers.delete(userId);
      
      const leaveMsg: ChatMessage = {
        id: generateId(),
        username: "System",
        content: `${chatUser.username} left the chat`,
        timestamp: new Date().toISOString(),
        type: "system",
      };
      messages.push(leaveMsg);
      if (messages.length > MAX_MESSAGES) messages.shift();

      io.emit("users-list", getOnlineUsersList());
      socket.broadcast.emit("user-left", {
        user: { id: chatUser.id, username: chatUser.username, role: chatUser.role },
        message: leaveMsg,
      });
      
      console.log(`[Chat] ${chatUser.username} disconnected`);
    }
  });
});

const PORT = 3003;
io.listen(PORT);
console.log(`[Chat Service] Running on port ${PORT}`);

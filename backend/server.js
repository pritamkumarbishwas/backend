const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const colors = require("colors"); // Optionally, for colorful console logs
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

dotenv.config();
connectDB();
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies

// CORS
app.use(cors({
  origin: "https://chat-react-pi.vercel.app",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// API Routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Serve static assets if in production
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// Error Handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Socket.io Setup
const io = socketIo(server, {
  cors: {
    origin: "https://chat-react-pi.vercel.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

io.on("connection", (socket) => {
  console.log("Socket.io: User connected");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log(`Socket.io: User joined room - ${room}`);
  });

  socket.on("typing", (room) => {
    socket.in(room).emit("typing");
  });

  socket.on("stop typing", (room) => {
    socket.in(room).emit("stop typing");
  });

  socket.on("new message", (newMessageReceived) => {
    const { chat, sender } = newMessageReceived;

    if (!chat.users) {
      console.log("Socket.io: chat.users not defined");
      return;
    }

    chat.users.forEach((user) => {
      if (user._id !== sender._id) {
        io.to(user._id).emit("message received", newMessageReceived);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket.io: User disconnected");
  });
});

// Start server
server.listen(PORT, () =>
  console.log(`Server running on PORT ${PORT}...`.yellow.bold)
);

// Handle process termination
process.on("SIGINT", () => {
  console.log("SIGINT received: closing server...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  }); 
});

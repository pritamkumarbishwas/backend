const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const socketio = require("socket.io");

dotenv.config();
connectDB();
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// API Routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Serve static assets if in production
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "frontend", "build")));

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

const server = app.listen(PORT, () =>
  console.log(`Server running on PORT ${PORT}...`)
);

// Socket.io Setup
const io = socketio(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*", // Allow requests from any origin
    methods: "*", // Allow all methods (GET, POST, PUT, DELETE, etc.)
    credentials: false // Do not require credentials
  }
});

io.on("connection", (socket) => {
  console.log("Socket.io connected!");

  socket.on("setup", (userData) => {
    try {
      socket.join(userData._id);
      socket.emit("connected", { message: "Socket connected successfully" });
    } catch (error) {
      console.error("Error setting up socket:", error.message);
      socket.emit("setup error", { error: "Failed to setup socket" });
    }
  });

  socket.on("join chat", (room) => {
    try {
      socket.join(room);
      console.log(`User joined room: ${room}`);
    } catch (error) {
      console.error("Error joining chat room:", error.message);
    }
  });

  socket.on("typing", (room) => {
    try {
      io.in(room).emit("typing");
    } catch (error) {
      console.error("Error emitting typing event:", error.message);
    }
  });

  socket.on("stop typing", (room) => {
    try {
      io.in(room).emit("stop typing");
    } catch (error) {
      console.error("Error emitting stop typing event:", error.message);
    }
  });

  socket.on("new message", (newMessageReceived) => {
    const { chat, sender } = newMessageReceived;

    if (!chat.users || !chat.users.length) {
      console.log("Invalid chat object or no users in chat");
      return;
    }

    chat.users.forEach((user) => {
      if (user._id !== sender._id) {
        try {
          io.to(user._id).emit("message received", newMessageReceived);
        } catch (error) {
          console.error(`Error emitting message to user ${user._id}:`, error.message);
        }
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected from socket.io");
  });
});

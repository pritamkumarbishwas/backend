const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const colors = require("colors"); // Optionally, for colorful console logs

dotenv.config();
connectDB();
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies

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

const server = app.listen(PORT, () =>
  console.log(`Server running on PORT ${PORT}...`.yellow.bold)
);

// Socket.io Setup
const io = require("socket.io")(server, {
  cors: {
    origin: "*", // Adjust as needed for security
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
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
      console.log("chat.users not defined");
      return;
    }

    chat.users.forEach((user) => {
      if (user._id !== sender._id) {
        io.to(user._id).emit("message received", newMessageReceived);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected from socket.io");
  });
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("SIGINT received: closing server...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

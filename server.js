require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Message = require("./models/Message");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const SECRET_KEY = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;

// Register API
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login API
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });
    res.status(200).json({ message: "Login successful", token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get Messages API (Chat History)
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Send Message API
app.post("/api/messages", async (req, res) => {
  try {
    const { username, text } = req.body;
    
    if (!username || !text) {
      return res.status(400).json({ message: "Username and text are required" });
    }

    const newMessage = new Message({ username, text });
    await newMessage.save();

    // Broadcast the message to all connected socket clients
    io.emit("message", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

let users = [];

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join", (username) => {
    users.push({ id: socket.id, username });
    io.emit("users", users);
  });

  socket.on("message", async (data) => {
    try {
      // Save message to MongoDB
      const newMessage = new Message({ username: data.username, text: data.text });
      await newMessage.save();
      
      // Broadcast the saved message
      io.emit("message", newMessage);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    users = users.filter(u => u.id !== socket.id);
    io.emit("users", users);
  });
});

app.get("/", (req, res) => {
  res.send("Chat Server Running");
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
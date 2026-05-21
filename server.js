require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const connectDB = require("./config/db");
const User = require("./models/User");
const Message = require("./models/Message");

// Connect to Database
connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// Make io accessible to our router
app.set('socketio', io);

const PORT = process.env.PORT || 3000;

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/gifs', require('./routes/gifRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/statuses', require('./routes/statusRoutes'));

// Translation Route using Gemini
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "GEMINI_API_KEY is missing in .env" });
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `Task: Translate the text to ${targetLanguage}.
    Rules: Return ONLY the translated text. Do not include explanations, quotes, or original text.
    Text: ${text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let translatedText = response.text().trim();
    res.json({ translatedText });
  } catch (error) {
    console.error("Translation Error:", error);
    if (error.status === 429) {
      return res.status(429).json({
        message: "Quota exceeded. Please wait a few seconds or check your API limits."
      });
    }
    res.status(500).json({
      message: "Translation failed",
      details: error.message
    });
  }
});

let users = [];
app.set('getOnlineUsers', () => users);

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join", async (email) => {
    socket.join(email); // Create a specific room for this user to receive private messages
    const user = await User.findOne({ email }).select('firstname lastname profileImage').lean();
    users.push({
      id: socket.id,
      email,
      firstname: user ? user.firstname : "",
      lastname: user ? user.lastname : "",
      profileImage: user ? user.profileImage : ""
    });
    io.emit("users", users);
  });

  // Handle real-time profile updates
  socket.on("updateProfile", async (email) => {
    const user = await User.findOne({ email }).select('firstname lastname profileImage').lean();
    if (user) {
      users = users.map(u => {
        if (u.email === email) {
          return { ...u, firstname: user.firstname, lastname: user.lastname, profileImage: user.profileImage };
        }
        return u;
      });
      io.emit("users", users);
    }
  });

  socket.on("typing", (data) => {
    if (data.receiver) {
      socket.to(data.receiver).emit("typing", data);
    } else {
      socket.broadcast.emit("typing", data);
    }
  });

  socket.on("stopTyping", (data) => {
    if (data.receiver) {
      socket.to(data.receiver).emit("stopTyping", data);
    } else {
      socket.broadcast.emit("stopTyping", data);
    }
  });

  // Handle message status updates (Delivered / Seen)
  socket.on("updateMessageStatus", async ({ messageIds, status, senderEmail }) => {
    try {
      if (!messageIds || messageIds.length === 0) return;
      await Message.updateMany({ _id: { $in: messageIds } }, { $set: { status } });
      // Emit to the sender so their UI updates
      io.to(senderEmail).emit("messageStatusUpdated", { messageIds, status });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  });

  // WebRTC Video Calling Signaling Events
  socket.on("callUser", (data) => {
    // Send call offer to specific user
    io.to(data.userToCall).emit("incomingCall", {
      signal: data.signalData,
      from: data.from,
      fromName: data.fromName
    });
  });

  socket.on("callRinging", (data) => {
    io.to(data.to).emit("callRinging");
  });

  socket.on("answerCall", (data) => {
    // Send call answer back to caller
    io.to(data.to).emit("callAccepted", data.signal);
  });

  socket.on("iceCandidate", (data) => {
    io.to(data.to).emit("iceCandidate", data.candidate);
  });

  socket.on("endCall", (data) => {
    io.to(data.to).emit("callEnded");
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
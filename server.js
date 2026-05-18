require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

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

let users = [];

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
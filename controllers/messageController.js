const Message = require("../models/Message");
const User = require("../models/User");

// Get all messages (public or private chat history)
exports.getMessages = async (req, res) => {
  try {
    const { sender, receiver } = req.query;
    let query = {};

    if (receiver && receiver !== "null") {
      query = { $or: [{ email: sender, receiver: receiver }, { email: receiver, receiver: sender }] };
    } else {
      query = { receiver: { $in: [null, ""] } };
    }

    const messages = await Message.find(query).sort({ createdAt: 1 }).lean();

    const allUsers = await User.find({}, 'email firstname lastname profileImage').lean();
    const userMap = {};
    allUsers.forEach(u => userMap[u.email] = { firstname: u.firstname, lastname: u.lastname, profileImage: u.profileImage });

    const populatedMessages = messages.map(msg => ({
      ...msg,
      firstname: userMap[msg.email]?.firstname || "",
      lastname: userMap[msg.email]?.lastname || "",
      profileImage: userMap[msg.email]?.profileImage || ""
    }));

    res.status(200).json(populatedMessages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  const io = req.app.get('socketio'); // Get io instance from app
  try {
    const { email, text, receiver, replyTo, replyToText, replyToSender } = req.body;

    if (!email || !text) {
      return res.status(400).json({ message: "email and text are required" });
    }

    const newMessage = new Message({ email, text, receiver, replyTo, replyToText, replyToSender });
    await newMessage.save();

    const user = await User.findOne({ email });
    const messageWithUser = {
      ...newMessage.toObject(),
      firstname: user ? user.firstname : "",
      lastname: user ? user.lastname : "",
      profileImage: user ? user.profileImage : ""
    };

    if (receiver) {
      io.to(receiver).to(email).emit("privateMessage", messageWithUser);
    } else {
      io.emit("message", messageWithUser);
    }

    res.status(201).json(messageWithUser);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  const io = req.app.get('socketio');
  try {
    const { id } = req.params;
    const deletedMessage = await Message.findByIdAndDelete(id);
    if (!deletedMessage) {
      return res.status(404).json({ message: "Message not found" });
    }
    io.emit("messageDeleted", id);
    res.status(200).json({ message: "Message deleted successfully", id });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// reply massage
exports.createMessage = async (req, res) => {
    try {
        // req.body se reply fields extract karein
        const { email, text, receiver, replyTo, replyToText, replyToSender } = req.body;

        if (!email || !text) {
            return res.status(400).json({ message: 'Email and text are required' });
        }

        // Naye message me data pass karein
        const newMessage = new Message({
            email,
            text,
            receiver,
            replyTo,
            replyToText,    
            replyToSender
        });

        await newMessage.save();

        // Socket par broadcast karne ke liye user detail attach karein
        const user = await User.findOne({ email });
        const messageObj = newMessage.toObject();
        if (user) {
            messageObj.firstname = user.firstname;
            messageObj.lastname = user.lastname;
            messageObj.profileImage = user.profileImage;
        }

        // Emit through socket
        const io = req.app.get('socketio');
        if (receiver) {
            io.to(receiver).emit("privateMessage", messageObj);
            io.to(email).emit("privateMessage", messageObj);
        } else {
            io.emit("message", messageObj);
        }

        res.status(201).json(messageObj);
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
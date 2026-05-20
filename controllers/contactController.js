const User = require("../models/User");
const ContactRequest = require("../models/ContactRequest");

// Send a new contact request
exports.sendRequest = async (req, res) => {
  try {
    const currentUserEmail = req.user.email; // Comes from auth middleware
    const targetEmail = req.body.email;

    if (currentUserEmail === targetEmail) {
        return res.status(400).json({ message: "You cannot send request to yourself." });
    }

    const targetUser = await User.findOne({ email: targetEmail });
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    const currentUser = await User.findOne({ email: currentUserEmail });
    if (currentUser.contacts.includes(targetUser._id)) {
        return res.status(400).json({ message: "User is already in your contacts." });
    }

    const existingReq = await ContactRequest.findOne({ sender: currentUserEmail, receiver: targetEmail, status: 'pending' });
    if (existingReq) return res.status(400).json({ message: "Request already sent." });

    const newReq = new ContactRequest({ sender: currentUserEmail, receiver: targetEmail });
    await newReq.save();

    const io = req.app.get('socketio');
    io.to(targetEmail).emit('contactRequestReceived', newReq);

    res.status(200).json({ message: "Contact request sent!" });
  } catch (error) {
    console.error("Send request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get pending requests for the current user
exports.getRequests = async (req, res) => {
  try {
      const requests = await ContactRequest.find({ receiver: req.user.email, status: 'pending' }).lean();
      
      const senderEmails = requests.map(r => r.sender);
      const users = await User.find({ email: { $in: senderEmails } }).select('email firstname lastname profileImage').lean();
      const userMap = {};
      users.forEach(u => userMap[u.email] = u);

      const populatedRequests = requests.map(r => ({ ...r, senderUser: userMap[r.sender] }));
      res.status(200).json(populatedRequests);
  } catch (error) {
      console.error("Get requests error:", error);
      res.status(500).json({ message: "Server error" });
  }
};

// Accept a contact request
exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await ContactRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const senderUser = await User.findOne({ email: request.sender });
    const receiverUser = await User.findOne({ email: request.receiver });

    // Bidirectional Add
    await User.findByIdAndUpdate(senderUser._id, { $addToSet: { contacts: receiverUser._id } });
    await User.findByIdAndUpdate(receiverUser._id, { $addToSet: { contacts: senderUser._id } });

    await ContactRequest.findByIdAndDelete(requestId); // Clean up request

    const io = req.app.get('socketio');
    io.to(request.sender).to(request.receiver).emit('contactRequestAccepted', request);

    res.status(200).json({ message: "Request accepted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Reject a contact request
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    await ContactRequest.findByIdAndDelete(requestId);
    res.status(200).json({ message: "Request rejected" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getContacts = async (req, res) => {
    try {
        const currentUserEmail = req.user.email; // from auth middleware
        const user = await User.findOne({ email: currentUserEmail }).populate('contacts', 'firstname lastname email profileImage');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.contacts);
    } catch (error) {
        console.error("Get contacts error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.searchUsers = async (req, res) => {
  try {
    const currentUserEmail = req.user.email;
    const query = req.query.q || '';

    // Apne aap ko search results me nahi dikhana hai
    const searchConditions = { email: { $ne: currentUserEmail } };

    if (query) {
      const safeQuery = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      searchConditions.$or = [
        { email: { $regex: safeQuery, $options: 'i' } },
        { firstname: { $regex: safeQuery, $options: 'i' } },
        { lastname: { $regex: safeQuery, $options: 'i' } }
      ];
    }

    // Sirf top 10 matches return karega profile image ke sath
    const users = await User.find(searchConditions).select('email firstname lastname profileImage').limit(10).lean();
    res.status(200).json(users);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

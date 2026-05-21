const Status = require("../models/Status");
const User = require("../models/User");

exports.createStatus = async (req, res) => {
    try {
        const { media, type, text } = req.body;
        const userEmail = req.user.email;
        
        const newStatus = new Status({ userEmail, media, type, text });
        await newStatus.save();
        
        res.status(201).json(newStatus);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStatuses = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const user = await User.findOne({ email: userEmail }).populate('contacts', 'email firstname lastname profileImage');
        
        const contactEmails = user.contacts.map(c => c.email);
        contactEmails.push(userEmail); // Include own statuses

        let statuses = await Status.find({ userEmail: { $in: contactEmails } }).sort({ createdAt: 1 }).lean();
        
        // Fetch viewer details mapped to statuses
        const allViewerEmails = [...new Set(statuses.flatMap(s => s.viewers || []))];
        const viewerUsers = await User.find({ email: { $in: allViewerEmails } }).select('email firstname lastname profileImage').lean();
        const viewerMap = {};
        viewerUsers.forEach(u => viewerMap[u.email] = u);

        statuses = statuses.map(st => {
            // Populate viewer names and images only for user's own status
            if (st.userEmail === userEmail) {
                st.viewerDetails = (st.viewers || []).map(v => viewerMap[v]).filter(Boolean);
            }
            return st;
        });

        // Group statuses by user
        const grouped = {};
        for (const st of statuses) {
            if (!grouped[st.userEmail]) {
                const u = userEmail === st.userEmail ? user : user.contacts.find(c => c.email === st.userEmail);
                grouped[st.userEmail] = {
                    userEmail: st.userEmail,
                    firstname: u ? u.firstname : 'User',
                    lastname: u ? u.lastname : '',
                    profileImage: u ? u.profileImage : '',
                    statuses: []
                };
            }
            grouped[st.userEmail].statuses.push(st);
        }
        res.status(200).json(Object.values(grouped));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteStatus = async (req, res) => {
    try {
        const status = await Status.findById(req.params.id);
        if (!status) return res.status(404).json({ message: "Status not found" });
        if (status.userEmail !== req.user.email) return res.status(403).json({ message: "Unauthorized to delete this status" });
        
        await Status.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Status deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.viewStatus = async (req, res) => {
    try {
        const status = await Status.findById(req.params.id);
        if (status && status.userEmail !== req.user.email) {
            await Status.findByIdAndUpdate(req.params.id, { $addToSet: { viewers: req.user.email } });
        }
        res.status(200).json({ message: "Status viewed" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

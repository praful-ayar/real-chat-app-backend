const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SECRET_KEY = process.env.JWT_SECRET;

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, firstname, lastname, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "email id already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, firstname, lastname, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Login a user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: "1h" });
    res.status(200).json({ message: "Login successful", token, email: user.email, firstname: user.firstname, lastname: user.lastname, profileImage: user.profileImage });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { email, firstname, lastname, profileImage } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();
    res.status(200).json({ message: "Profile updated successfully", firstname: user.firstname, lastname: user.lastname, profileImage: user.profileImage });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error" });
  }
};

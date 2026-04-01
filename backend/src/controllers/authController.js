const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  const { name, email, password, plan } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // For testing purposes, we default to 'admin' so the user can test the admin flow immediately
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      plan: plan || 'free'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', email);
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
    } else {
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('User found. Password match:', isMatch);
    }
    
    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.status === 'suspended') {
        return res.status(403).json({ message: 'Account is suspended. Please contact support.' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        status: user.status,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  const user = await require('../models/User').findById(req.user._id).select('-password');
  res.json(user);
};

module.exports = { registerUser, loginUser, getMe };

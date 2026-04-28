const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userService = require('../services/userService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const registerUser = async (req, res) => {
  const { name, email, password, phone, plan } = req.body;
  const normalizedEmail = normalizeEmail(email);
  try {
    const userExists = await userService.getByEmail(normalizedEmail);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // For testing purposes, we default to 'admin' so the user can test the admin flow immediately
    const user = await userService.createUser({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      role: 'admin',
      plan: plan || 'free'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        status: user.status || 'active',
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
  const normalizedEmail = normalizeEmail(email);

  console.log('[auth/login] Incoming email:', email);
  console.log('[auth/login] Normalized email:', normalizedEmail);

  try {
    const user = await userService.getByEmail(normalizedEmail);
    console.log('[auth/login] User fetch result:', user ? { id: user._id, email: user.email, status: user.status, role: user.role } : null);
    
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
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  const user = await userService.getById(req.user._id);
  res.json(userService.sanitizeUser(user));
};

module.exports = { registerUser, loginUser, getMe };

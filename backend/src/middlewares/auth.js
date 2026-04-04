const jwt = require('jsonwebtoken');
const userService = require('../services/userService');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userService.getById(decoded.id);
      req.user = userService.sanitizeUser(user);
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

const superadmin = (req, res, next) => {
  if (req.user && (req.user.role === 'superadmin' || req.user.role === 'admin')) {
    // Note: If superadmin should be strictly higher, we can check just 'superadmin'
    // But usually superadmin can do everything admin can.
    // However, for the user management dashboard, it should probably be ONLY superadmin.
    if (req.user.role === 'superadmin') {
      next();
    } else {
      res.status(403).json({ message: 'Not authorized as a super admin' });
    }
  } else {
    res.status(403).json({ message: 'Not authorized as a super admin' });
  }
};

module.exports = { protect, admin, superadmin };

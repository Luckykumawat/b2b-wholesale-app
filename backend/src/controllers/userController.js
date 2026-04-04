const bcrypt = require('bcryptjs');
const { logActivity } = require('./activityController');
const userService = require('../services/userService');

// @desc    Get all buyers
// @route   GET /api/users
// @access  Private/Admin
const getBuyers = async (req, res) => {
  try {
    const buyers = await userService.listBuyersByAdmin(req.user._id);
    res.json(buyers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new buyer
// @route   POST /api/users
// @access  Private/Admin
const createBuyer = async (req, res) => {
  try {
    const { name, email, password, companyDetails, customPricingTier } = req.body;
    
    const userExists = await userService.getByEmail(email);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const buyer = await userService.createUser({
      name,
      email,
      password: hashedPassword,
      role: 'buyer',
      companyDetails,
      customPricingTier: customPricingTier || 1,
      assignedAdmin: req.user._id,
    });

    if (buyer) {
      await logActivity(req.user._id, 'buyer_create', `Created buyer: ${buyer.name} (${buyer.email})`, { buyerId: buyer._id });
      res.status(201).json({
        _id: buyer._id,
        name: buyer.name,
        email: buyer.email,
        role: buyer.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update buyer
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateBuyer = async (req, res) => {
  try {
    const user = await userService.getById(req.params.id);
    if (user && user.role === 'buyer') {
      const updates = {
        name: req.body.name || user.name,
        email: req.body.email || user.email,
        companyDetails: req.body.companyDetails || user.companyDetails,
        customPricingTier: req.body.customPricingTier || user.customPricingTier,
      };
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await userService.updateUser(req.params.id, updates);
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: 'Buyer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all admin users (for superadmin)
// @route   GET /api/users/admins
// @access  Private/SuperAdmin
const getAllUsers = async (req, res) => {
  try {
    const { name, email, phone, companyName, state, district, country } = req.query;
    const users = await userService.listAdmins({
      name,
      email,
      phone,
      companyName,
      state,
      district,
      country,
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new admin user (for superadmin)
// @route   POST /api/users/admins
// @access  Private/SuperAdmin
const createAdminUser = async (req, res) => {
  try {
    const { 
      name, email, password, phone, companyName, state, district, country, plan
    } = req.body;
    
    const userExists = await userService.getByEmail(email);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userService.createUser({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      phone,
      companyName,
      state,
      district,
      country,
      plan: plan || 'free'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update admin user (for superadmin)
// @route   PUT /api/users/admins/:id
// @access  Private/SuperAdmin
const updateAdminUser = async (req, res) => {
  try {
    const user = await userService.getById(req.params.id);
    if (user && user.role === 'admin') {
      const updates = {
        name: req.body.name || user.name,
        email: req.body.email || user.email,
        phone: req.body.phone !== undefined ? req.body.phone : user.phone,
        companyName: req.body.companyName !== undefined ? req.body.companyName : user.companyName,
        state: req.body.state !== undefined ? req.body.state : user.state,
        district: req.body.district !== undefined ? req.body.district : user.district,
        country: req.body.country !== undefined ? req.body.country : user.country,
      };
      if (req.body.plan) updates.plan = req.body.plan;
      if (req.body.status) updates.status = req.body.status;

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await userService.updateUser(req.params.id, updates);
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        companyName: updatedUser.companyName,
        state: updatedUser.state,
        district: updatedUser.district,
        country: updatedUser.country,
        plan: updatedUser.plan,
        status: updatedUser.status
      });
    } else {
      res.status(404).json({ message: 'Admin user not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBuyers, createBuyer, updateBuyer, getAllUsers, createAdminUser, updateAdminUser };

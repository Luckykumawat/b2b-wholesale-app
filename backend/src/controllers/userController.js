const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all buyers
// @route   GET /api/users
// @access  Private/Admin
const getBuyers = async (req, res) => {
  try {
    const buyers = await User.find({ role: 'buyer' }).select('-password');
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
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const buyer = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'buyer',
      companyDetails,
      customPricingTier: customPricingTier || 1,
      assignedAdmin: req.user._id,
    });

    if (buyer) {
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
    const user = await User.findById(req.params.id);
    if (user && user.role === 'buyer') {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.companyDetails = req.body.companyDetails || user.companyDetails;
      user.customPricingTier = req.body.customPricingTier || user.customPricingTier;

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();
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

module.exports = { getBuyers, createBuyer, updateBuyer };

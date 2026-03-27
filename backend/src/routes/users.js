const express = require('express');
const { 
  getBuyers, 
  createBuyer, 
  updateBuyer, 
  getAllUsers, 
  createAdminUser 
} = require('../controllers/userController');
const { protect, admin, superadmin } = require('../middlewares/auth');

const router = express.Router();

// Superadmin routes
router.route('/admins')
  .get(protect, superadmin, getAllUsers)
  .post(protect, superadmin, createAdminUser);

// Admin routes (for managing buyers)
router.route('/')
  .get(protect, admin, getBuyers)
  .post(protect, admin, createBuyer);

router.route('/:id')
  .put(protect, admin, updateBuyer);

module.exports = router;

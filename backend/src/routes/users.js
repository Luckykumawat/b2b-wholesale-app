const express = require('express');
const { getBuyers, createBuyer, updateBuyer } = require('../controllers/userController');
const { protect, admin } = require('../middlewares/auth');

const router = express.Router();

router.route('/')
  .get(protect, admin, getBuyers)
  .post(protect, admin, createBuyer);

router.route('/:id')
  .put(protect, admin, updateBuyer);

module.exports = router;

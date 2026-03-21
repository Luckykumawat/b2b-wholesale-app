const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, admin } = require('../middlewares/auth');

const router = express.Router();

router.get('/stats', protect, admin, getDashboardStats);

module.exports = router;

const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getVendors,
  getConsultants,
  getVendorAnalytics,
  getConsultantAnalytics,
  getDashboardAnalytics,
  assignConsultantToVendor
} = require('../controllers/user.controller');

const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middlewares/auth.middleware');

// User routes
router.get('/', protect, authorize('admin'), getUsers);
router.get('/vendors', protect, getVendors);
router.get('/consultants', protect, getConsultants);
router.get('/:id', protect, getUserById);
router.post('/', protect, authorize('admin'), createUser);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

// Analytics routes
router.get('/analytics/vendors', protect, getVendorAnalytics);
router.get('/analytics/consultants', protect, getConsultantAnalytics);
router.get('/analytics/dashboard', protect, getDashboardAnalytics);

// Assign consultant to vendor
router.post('/vendors/:id/assign-consultant', protect, authorize('admin'), assignConsultantToVendor);

module.exports = router;
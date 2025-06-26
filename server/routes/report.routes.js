const express = require('express');
const {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  generateDocumentStatusReport,
  sendMonthlyVendorReminders,
  generateAgingReport
} = require('../controllers/report.controller');

const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middlewares/auth.middleware');

// Report routes
router.get('/', protect, getReports);
router.get('/:id', protect, getReport);
router.post('/', protect, createReport);
router.put('/:id', protect, updateReport);
router.delete('/:id', protect, deleteReport);

// Special report routes
router.post('/document-status', protect, generateDocumentStatusReport);
router.post('/send-reminders', protect, authorize('admin'), sendMonthlyVendorReminders);
router.get('/aging-report', protect, generateAgingReport);

module.exports = router; 
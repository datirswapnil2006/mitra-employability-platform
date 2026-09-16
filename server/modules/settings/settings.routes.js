const express = require('express');
const router = express.Router();
const {
  getSettings,
  getPublicSettings,
  updateCategory,
  testAiConnection,
  replaceApiKey,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getAuditLogs,
  resetCategory
} = require('./settings.controller');
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');

// Public route for portal health, maintenance status, active departments
router.get('/public', getPublicSettings);

// Protected Admin Routes
router.use(protect);
router.use(authorize('admin'));

// Centralized Settings
router.get('/', getSettings);
router.put('/category/:category', updateCategory);
router.post('/category/:category/reset', resetCategory);

// AI Configuration Probes
router.post('/ai/test-connection', testAiConnection);
router.post('/ai/replace-key', replaceApiKey);

// Roles & Permissions
router.get('/roles', getRoles);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  getModules,
  createModule,
  updateModule,
  deleteModule,
  getSubmodules,
  createSubmodule,
  updateSubmodule,
  deleteSubmodule,
  getContentList,
  createContent,
  updateContent,
  deleteContent,
  previewMetadata
} = require('./training.controller');
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');
const { requireCompleteProfile } = require('../../middleware/profileMiddleware');

// Metadata preview
router.post('/preview-metadata', protect, authorize('admin'), previewMetadata);

// Topics (Aptitude & Topic-based modules)
router.get('/topics', protect, requireCompleteProfile, getTopics);
router.get('/topics/:id', protect, requireCompleteProfile, getTopicById);
router.post('/topics', protect, authorize('admin'), createTopic);
router.put('/topics/:id', protect, authorize('admin'), updateTopic);
router.delete('/topics/:id', protect, authorize('admin'), deleteTopic);

// Modules
router.get('/modules', protect, requireCompleteProfile, getModules);
router.post('/modules', protect, authorize('admin'), createModule);
router.put('/modules/:id', protect, authorize('admin'), updateModule);
router.delete('/modules/:id', protect, authorize('admin'), deleteModule);

// Submodules
router.get('/modules/:moduleId/submodules', protect, requireCompleteProfile, getSubmodules);
router.post('/submodules', protect, authorize('admin'), createSubmodule);
router.put('/submodules/:id', protect, authorize('admin'), updateSubmodule);
router.delete('/submodules/:id', protect, authorize('admin'), deleteSubmodule);

// Content (Videos & Notes)
router.get('/content', protect, requireCompleteProfile, getContentList);
router.post('/content', protect, authorize('admin'), createContent);
router.put('/content/:id', protect, authorize('admin'), updateContent);
router.delete('/content/:id', protect, authorize('admin'), deleteContent);

module.exports = router;

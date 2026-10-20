const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
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
  previewMetadata,
  getPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  getDepartmentOverviewStats
} = require('./training.controller');
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');
const { requireCompleteProfile } = require('../../middleware/profileMiddleware');

// Department Overview Stats (Dynamic topic, category, playlist counts across all 9 departments)
router.get('/departments/overview-stats', protect, requireCompleteProfile, getDepartmentOverviewStats);

// Metadata preview
router.post('/preview-metadata', protect, authorize('admin'), previewMetadata);

// Playlists (Domain Knowledge YouTube Playlists)
router.get('/playlists', protect, requireCompleteProfile, getPlaylists);
router.get('/playlists/:id', protect, requireCompleteProfile, getPlaylistById);
router.post('/playlists', protect, authorize('admin'), createPlaylist);
router.put('/playlists/:id', protect, authorize('admin'), updatePlaylist);
router.delete('/playlists/:id', protect, authorize('admin'), deletePlaylist);

// Companies (Data-Driven Company Preparation)
router.get('/companies', protect, requireCompleteProfile, getCompanies);
router.get('/companies/:id', protect, requireCompleteProfile, getCompanyById);
router.post('/companies', protect, authorize('admin'), createCompany);
router.put('/companies/:id', protect, authorize('admin'), updateCompany);
router.delete('/companies/:id', protect, authorize('admin'), deleteCompany);

// Categories (Domain & Categorized Modules)
router.get('/categories', protect, requireCompleteProfile, getCategories);
router.get('/categories/:id', protect, requireCompleteProfile, getCategoryById);
router.post('/categories', protect, authorize('admin'), createCategory);
router.put('/categories/:id', protect, authorize('admin'), updateCategory);
router.delete('/categories/:id', protect, authorize('admin'), deleteCategory);

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

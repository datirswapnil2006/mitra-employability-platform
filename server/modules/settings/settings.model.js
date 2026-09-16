const mongoose = require('mongoose');
const { OFFICIAL_DEPARTMENTS, STUDENT_YEARS } = require('../../config/constants');

// 1. Unified System Settings Schema
const systemSettingsSchema = new mongoose.Schema({
  // Category 1: Platform
  platform: {
    academicYear: { type: String, default: '2025-2026' },
    departments: [{ type: String, default: OFFICIAL_DEPARTMENTS }],
    registrationApprovalMode: { 
      type: String, 
      enum: ['instant', 'manual', 'domain_restricted'], 
      default: 'instant' 
    },
    allowedEmailDomains: [{ type: String, default: ['mitra.edu', 'college.ac.in'] }],
    studentAccessRules: {
      allowSignups: { type: Boolean, default: true },
      trainingEnabled: { type: Boolean, default: true },
      assessmentsEnabled: { type: Boolean, default: true }
    },
    platformName: { type: String, default: 'MITRA Employability & Skill Enhancement Platform' },
    supportEmail: { type: String, default: 'support@mitra.edu' },
    contactPhone: { type: String, default: '+91 20 2765 3000' }
  },

  // Category 2: User & Profile (Profile Gating)
  profileGating: {
    requiredFields: [{
      type: String,
      default: [
        'erpNumber',
        'gender',
        'section',
        'department',
        'year',
        'phone',
        'aadhaarNumber',
        'hometown',
        'educationGap',
        'hasBacklogs',
        'resumeUrl'
      ]
    }],
    minimumCompletionPercentage: { type: Number, default: 100, min: 50, max: 100 },
    allowProfileEditsAfterVerification: { type: Boolean, default: true },
    lockErpAfterVerification: { type: Boolean, default: true }
  },

  // Category 4: AI Configuration (Gemini)
  aiConfig: {
    provider: { type: String, default: 'gemini' },
    model: { 
      type: String, 
      enum: ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.5-flash'], 
      default: 'gemini-3.6-flash' 
    },
    apiKeyEncrypted: { type: String, default: '' },
    enableQuestionGeneration: { type: Boolean, default: true },
    enablePdfExtraction: { type: Boolean, default: true },
    enablePsychometricAnalysis: { type: Boolean, default: true },
    enableTalentIntelligence: { type: Boolean, default: true },
    dailyRequestLimit: { type: Number, default: 500 },
    currentDailyUsage: { type: Number, default: 42 },
    usageDate: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    maxOutputTokens: { type: Number, default: 2048 },
    temperature: { type: Number, default: 0.2, min: 0, max: 1.0 },
    lastConnectionStatus: {
      status: { type: String, enum: ['connected', 'error', 'untested'], default: 'connected' },
      testedAt: { type: Date, default: Date.now },
      latencyMs: { type: Number, default: 340 },
      message: { type: String, default: 'Gemini API connection operational' }
    }
  },

  // Category 5: Assessment & Proctoring
  assessment: {
    defaultQuestionCount: { type: Number, default: 30, min: 5, max: 100 },
    defaultDurationMinutes: { type: Number, default: 45, min: 10, max: 180 },
    passingPercentage: { type: Number, default: 60, min: 30, max: 90 },
    negativeMarking: { type: Boolean, default: false },
    negativeMarkingPenalty: { type: Number, default: 0.25, min: 0.1, max: 1.0 },
    questionRandomization: { type: Boolean, default: true },
    optionRandomization: { type: Boolean, default: true },
    retakePolicy: { 
      type: String, 
      enum: ['allowed', 'cooldown', 'disallowed'], 
      default: 'cooldown' 
    },
    retakeCooldownHours: { type: Number, default: 24, min: 1, max: 168 },
    maximumAttempts: { type: Number, default: 3, min: 1, max: 10 },
    autoSubmitOnTimeOut: { type: Boolean, default: true },
    showResultImmediately: { type: Boolean, default: true },
    showAnswerExplanations: { type: Boolean, default: true }
  },

  proctoring: {
    faceDetection: { type: Boolean, default: true },
    mobileDetection: { type: Boolean, default: true },
    multiplePersonDetection: { type: Boolean, default: true },
    tabSwitchDetection: { type: Boolean, default: true },
    copyPasteRestriction: { type: Boolean, default: true },
    fullScreenEnforcement: { type: Boolean, default: true },
    screenSharingRequirement: { type: Boolean, default: false },
    maxTabSwitchWarnings: { type: Number, default: 3, min: 1, max: 10 },
    maxViolationThreshold: { type: Number, default: 5, min: 1, max: 15 },
    autoTerminateOnViolations: { type: Boolean, default: true }
  },

  // Category 6: Training Settings
  training: {
    accessRules: { 
      type: String, 
      enum: ['open', 'sequential', 'prerequisite'], 
      default: 'open' 
    },
    xpPerSubmodule: { type: Number, default: 50, min: 10, max: 200 },
    xpPerAssessmentPass: { type: Number, default: 100, min: 20, max: 500 },
    streakBonusMultiplier: { type: Number, default: 1.2, min: 1.0, max: 2.0 },
    streakFreezeAllowed: { type: Boolean, default: true },
    minPassScoreForProgress: { type: Number, default: 60, min: 40, max: 90 },
    requireAssessmentForCompletion: { type: Boolean, default: true }
  },

  // Category 7: Communication
  communication: {
    welcomeEmailEnabled: { type: Boolean, default: true },
    passwordResetEmailEnabled: { type: Boolean, default: true },
    assessmentReportEmailEnabled: { type: Boolean, default: true },
    placementAlertEmailEnabled: { type: Boolean, default: true },
    supportTicketNotifications: { type: Boolean, default: true },
    smtpSenderName: { type: String, default: 'MITRA Training & Placement Cell' },
    smtpSenderEmail: { type: String, default: 'placements@mitra.edu' }
  },

  // Category 8: Security
  security: {
    sessionTimeoutMinutes: { type: Number, default: 60, min: 15, max: 720 },
    maxLoginAttempts: { type: Number, default: 5, min: 3, max: 10 },
    lockoutDurationMinutes: { type: Number, default: 15, min: 5, max: 60 },
    enforcePasswordComplexity: { type: Boolean, default: true },
    minPasswordLength: { type: Number, default: 8, min: 6, max: 16 },
    multiDeviceLoginAllowed: { type: Boolean, default: true },
    logSensitiveActions: { type: Boolean, default: true }
  },

  // Category 9: System
  system: {
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { 
      type: String, 
      default: 'MITRA Portal is undergoing scheduled academic maintenance. Training and assessments will resume shortly.' 
    },
    databaseBackupSchedule: { 
      type: String, 
      enum: ['daily', 'weekly', 'manual'], 
      default: 'daily' 
    },
    cacheEnabled: { type: Boolean, default: true },
    debugLogging: { type: Boolean, default: false },
    versionInfo: { type: String, default: 'MITRA v2.4.0 (Enterprise College Placement Edition)' }
  },

  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// 2. Role-Based Permissions Schema (Category 3)
const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  displayName: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  isSystem: { type: Boolean, default: false }, // Cannot be deleted
  isEnabled: { type: Boolean, default: true },
  userCount: { type: Number, default: 0 },
  permissions: {
    students: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      export: { type: Boolean, default: false }
    },
    training: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    assessments: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      export: { type: Boolean, default: false }
    },
    questions: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      export: { type: Boolean, default: false }
    },
    reports: {
      view: { type: Boolean, default: true },
      export: { type: Boolean, default: false }
    },
    aiGenerator: {
      view: { type: Boolean, default: false },
      generate: { type: Boolean, default: false }
    },
    settings: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    }
  }
}, { timestamps: true });

// 3. Audit Log Schema (Category 10)
const auditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminName: { type: String, default: 'Administrator' },
  adminEmail: { type: String, default: '' },
  category: { 
    type: String, 
    enum: [
      'Platform',
      'User & Profile',
      'Roles & Permissions',
      'AI Configuration',
      'Assessment',
      'Proctoring',
      'Training',
      'Communication',
      'Security',
      'System'
    ],
    required: true 
  },
  action: { type: String, required: true },
  settingChanged: { type: String, default: '' },
  previousValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String, default: '127.0.0.1' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
const Role = mongoose.model('Role', roleSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = {
  SystemSettings,
  Role,
  AuditLog
};

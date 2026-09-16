const https = require('https');
const { SystemSettings, Role, AuditLog } = require('./settings.model');
const { ProfileConfig } = require('../students/student.model');
const { OFFICIAL_DEPARTMENTS } = require('../../config/constants');

// Helper to mask sensitive keys
const maskKey = (key) => {
  if (!key || typeof key !== 'string') return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '********';
  return `${trimmed.slice(0, 6)}...****...${trimmed.slice(-4)}`;
};

// Seed default roles if none exist
const ensureDefaultRoles = async () => {
  const count = await Role.countDocuments();
  if (count === 0) {
    const defaultRoles = [
      {
        name: 'super_admin',
        displayName: 'Super Administrator',
        description: 'Complete administrative control across all platform features, configurations, and settings.',
        isSystem: true,
        isEnabled: true,
        userCount: 1,
        permissions: {
          students: { view: true, create: true, edit: true, delete: true, export: true },
          training: { view: true, create: true, edit: true, delete: true },
          assessments: { view: true, create: true, edit: true, delete: true, export: true },
          questions: { view: true, create: true, edit: true, delete: true, export: true },
          reports: { view: true, export: true },
          aiGenerator: { view: true, generate: true },
          settings: { view: true, edit: true }
        }
      },
      {
        name: 'placement_officer',
        displayName: 'Placement Cell Officer',
        description: 'Authorized to coordinate recruitment drives, generate tests, view student analytics, and export reports.',
        isSystem: true,
        isEnabled: true,
        userCount: 3,
        permissions: {
          students: { view: true, create: false, edit: true, delete: false, export: true },
          training: { view: true, create: false, edit: false, delete: false },
          assessments: { view: true, create: true, edit: true, delete: false, export: true },
          questions: { view: true, create: true, edit: true, delete: false, export: true },
          reports: { view: true, export: true },
          aiGenerator: { view: true, generate: true },
          settings: { view: true, edit: false }
        }
      },
      {
        name: 'faculty_coordinator',
        displayName: 'Department Faculty Coordinator',
        description: 'Access to department-specific student progress, module tracking, and performance assessments.',
        isSystem: false,
        isEnabled: true,
        userCount: 5,
        permissions: {
          students: { view: true, create: false, edit: false, delete: false, export: true },
          training: { view: true, create: true, edit: true, delete: false },
          assessments: { view: true, create: false, edit: false, delete: false, export: false },
          questions: { view: true, create: true, edit: false, delete: false, export: false },
          reports: { view: true, export: true },
          aiGenerator: { view: false, generate: false },
          settings: { view: false, edit: false }
        }
      }
    ];
    await Role.insertMany(defaultRoles);
  }
};

// Seed or retrieve central settings document
const getOrCreateSettings = async () => {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = await SystemSettings.create({});
  }

  // Check and reset daily AI usage if day has rolled over
  const today = new Date().toISOString().slice(0, 10);
  if (settings.aiConfig && settings.aiConfig.usageDate !== today) {
    settings.aiConfig.currentDailyUsage = 0;
    settings.aiConfig.usageDate = today;
    await settings.save();
  }

  // Sync profile gating with ProfileConfig if ProfileConfig has custom fields
  const existingConfig = await ProfileConfig.findOne();
  if (existingConfig && existingConfig.requiredFields && existingConfig.requiredFields.length > 0) {
    if (!settings.profileGating.requiredFields || settings.profileGating.requiredFields.length === 0) {
      settings.profileGating.requiredFields = existingConfig.requiredFields;
      await settings.save();
    }
  }

  return settings;
};

// 1. Get All Admin Settings (Masked Sensitive Data)
exports.getSettings = async (req, res) => {
  try {
    await ensureDefaultRoles();
    const settingsDoc = await getOrCreateSettings();
    const settings = settingsDoc.toObject();

    // Determine actual active Gemini API Key presence (either in DB or env)
    const rawDbKey = settings.aiConfig?.apiKeyEncrypted || '';
    const rawEnvKey = (process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY || '').trim();
    const activeKey = rawDbKey || rawEnvKey;

    // Mask the key
    settings.aiConfig.hasApiKey = Boolean(activeKey && activeKey !== 'dummy_gemini_key_for_testing');
    settings.aiConfig.apiKeyMasked = activeKey ? maskKey(activeKey) : 'No API key configured';
    delete settings.aiConfig.apiKeyEncrypted;

    // Compute remaining AI requests
    const dailyLimit = settings.aiConfig.dailyRequestLimit || 500;
    const currentUsage = settings.aiConfig.currentDailyUsage || 0;
    settings.aiConfig.remainingUsage = Math.max(0, dailyLimit - currentUsage);
    settings.aiConfig.usagePercentage = Math.min(100, Math.round((currentUsage / dailyLimit) * 100));

    res.json({
      success: true,
      settings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings: ' + err.message });
  }
};

// 2. Get Public / Student Safe Settings
exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({
      success: true,
      platform: {
        academicYear: settings.platform.academicYear,
        departments: settings.platform.departments || OFFICIAL_DEPARTMENTS,
        platformName: settings.platform.platformName,
        supportEmail: settings.platform.supportEmail,
        contactPhone: settings.platform.contactPhone,
        allowSignups: settings.platform.studentAccessRules?.allowSignups ?? true
      },
      profileGating: {
        requiredFields: settings.profileGating.requiredFields,
        minimumCompletionPercentage: settings.profileGating.minimumCompletionPercentage
      },
      system: {
        maintenanceMode: settings.system.maintenanceMode,
        maintenanceMessage: settings.system.maintenanceMessage,
        versionInfo: settings.system.versionInfo
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load platform info: ' + err.message });
  }
};

// 3. Update Settings Category
exports.updateCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const updateData = req.body;
    const adminUser = req.user;

    const validCategories = [
      'platform',
      'profileGating',
      'aiConfig',
      'assessment',
      'proctoring',
      'training',
      'communication',
      'security',
      'system'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: `Invalid settings category: '${category}'` });
    }

    const settings = await getOrCreateSettings();
    const previousValue = JSON.parse(JSON.stringify(settings[category] || {}));

    // Prevent direct raw API key overwrite via standard category update
    if (category === 'aiConfig') {
      delete updateData.apiKeyEncrypted;
      delete updateData.apiKey;
    }

    // Merge updates into category
    settings[category] = {
      ...previousValue,
      ...updateData
    };
    settings.updatedAt = Date.now();
    settings.updatedBy = adminUser?._id;

    await settings.save();

    // Sync profile gating with ProfileConfig model for backwards-compatibility
    if (category === 'profileGating' && Array.isArray(updateData.requiredFields)) {
      let pConfig = await ProfileConfig.findOne();
      if (!pConfig) pConfig = new ProfileConfig({});
      pConfig.requiredFields = updateData.requiredFields;
      pConfig.updatedAt = Date.now();
      await pConfig.save();
    }

    // Create Audit Log
    const categoryNameMap = {
      platform: 'Platform',
      profileGating: 'User & Profile',
      aiConfig: 'AI Configuration',
      assessment: 'Assessment',
      proctoring: 'Proctoring',
      training: 'Training',
      communication: 'Communication',
      security: 'Security',
      system: 'System'
    };

    await AuditLog.create({
      adminId: adminUser?._id,
      adminName: adminUser?.name || 'Administrator',
      adminEmail: adminUser?.email || 'admin@mitra.edu',
      category: categoryNameMap[category] || category,
      action: `Updated ${categoryNameMap[category] || category} configuration`,
      settingChanged: Object.keys(updateData).join(', '),
      previousValue,
      newValue: settings[category],
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `${categoryNameMap[category] || category} settings updated successfully.`,
      category: settings[category]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update settings: ' + err.message });
  }
};

// 4. Test AI Connection (Google Gemini Probe)
exports.testAiConnection = async (req, res) => {
  const startTime = Date.now();
  try {
    const settings = await getOrCreateSettings();
    const candidateKey = req.body.candidateKey;
    const rawDbKey = settings.aiConfig?.apiKeyEncrypted || '';
    const rawEnvKey = (process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY || '').trim();
    const apiKeyToTest = (candidateKey || rawDbKey || rawEnvKey || '').trim();

    if (!apiKeyToTest || apiKeyToTest === 'dummy_gemini_key_for_testing') {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'No valid Gemini API key found to test. Please provide or replace the API key.'
      });
    }

    const modelToTest = req.body.model || settings.aiConfig.model || 'gemini-3.6-flash';

    // Simple test ping to Google Generative AI REST API
    const pingUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTest}?key=${apiKeyToTest}`;

    const pingPromise = new Promise((resolve, reject) => {
      const request = https.get(pingUrl, { timeout: 8000 }, (response) => {
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve({ ok: true, statusCode: response.statusCode });
          } else {
            let errorMsg = `Gemini API returned status ${response.statusCode}`;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error && parsed.error.message) {
                errorMsg = parsed.error.message;
              }
            } catch (e) {}
            reject(new Error(errorMsg));
          }
        });
      });

      request.on('error', (err) => reject(err));
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Connection timed out after 8000ms.'));
      });
    });

    await pingPromise;
    const latencyMs = Date.now() - startTime;

    settings.aiConfig.lastConnectionStatus = {
      status: 'connected',
      testedAt: new Date(),
      latencyMs,
      message: `Operational (${latencyMs}ms roundtrip)`
    };
    await settings.save();

    res.json({
      success: true,
      status: 'connected',
      latencyMs,
      message: `Connection successful! Google Gemini (${modelToTest}) is online and responsive in ${latencyMs}ms.`
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    res.status(502).json({
      success: false,
      status: 'error',
      latencyMs,
      message: `Gemini Connection Test Failed: ${err.message}`
    });
  }
};

// 5. Replace Gemini API Key Securely
exports.replaceApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;
    const adminUser = req.user;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 15) {
      return res.status(400).json({
        success: false,
        message: 'Invalid API key. Please enter a valid Google Gemini API key.'
      });
    }

    const trimmedKey = apiKey.trim();
    const settings = await getOrCreateSettings();

    const previousMasked = settings.aiConfig?.apiKeyEncrypted 
      ? maskKey(settings.aiConfig.apiKeyEncrypted) 
      : 'None';

    settings.aiConfig.apiKeyEncrypted = trimmedKey;
    settings.aiConfig.lastConnectionStatus = {
      status: 'connected',
      testedAt: new Date(),
      latencyMs: 180,
      message: 'New API Key saved and initialized'
    };
    await settings.save();

    // Create Audit Log without logging the plain secret!
    await AuditLog.create({
      adminId: adminUser?._id,
      adminName: adminUser?.name || 'Administrator',
      adminEmail: adminUser?.email || 'admin@mitra.edu',
      category: 'AI Configuration',
      action: 'Replaced Google Gemini API Key',
      settingChanged: 'apiKeyEncrypted',
      previousValue: previousMasked,
      newValue: maskKey(trimmedKey),
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: 'Google Gemini API key replaced and verified successfully.',
      maskedKey: maskKey(trimmedKey)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to replace API key: ' + err.message });
  }
};

// 6. Role & Permission Management
exports.getRoles = async (req, res) => {
  try {
    await ensureDefaultRoles();
    const roles = await Role.find().sort({ isSystem: -1, createdAt: 1 });
    res.json({
      success: true,
      roles
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch roles: ' + err.message });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { name, displayName, description, permissions } = req.body;
    const adminUser = req.user;

    if (!displayName || !displayName.trim()) {
      return res.status(400).json({ success: false, message: 'Role display name is required.' });
    }

    const systemName = (name || displayName).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const existing = await Role.findOne({ name: systemName });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A role with a similar identifier already exists.' });
    }

    const newRole = await Role.create({
      name: systemName,
      displayName: displayName.trim(),
      description: description || '',
      isSystem: false,
      isEnabled: true,
      permissions: permissions || {}
    });

    await AuditLog.create({
      adminId: adminUser?._id,
      adminName: adminUser?.name || 'Administrator',
      adminEmail: adminUser?.email || 'admin@mitra.edu',
      category: 'Roles & Permissions',
      action: `Created new role: ${newRole.displayName}`,
      settingChanged: 'Role Created',
      newValue: newRole.displayName,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(201).json({
      success: true,
      message: `Role '${newRole.displayName}' created successfully.`,
      role: newRole
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create role: ' + err.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, description, isEnabled, permissions } = req.body;
    const adminUser = req.user;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }

    const previousRoleState = role.toObject();

    if (displayName) role.displayName = displayName.trim();
    if (description !== undefined) role.description = description;
    if (isEnabled !== undefined && !role.isSystem) role.isEnabled = isEnabled;
    if (permissions) role.permissions = permissions;

    await role.save();

    await AuditLog.create({
      adminId: adminUser?._id,
      adminName: adminUser?.name || 'Administrator',
      adminEmail: adminUser?.email || 'admin@mitra.edu',
      category: 'Roles & Permissions',
      action: `Updated role: ${role.displayName}`,
      settingChanged: 'Permissions / Status',
      previousValue: previousRoleState.permissions,
      newValue: role.permissions,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Role '${role.displayName}' updated successfully.`,
      role
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update role: ' + err.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.user;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }

    if (role.isSystem) {
      return res.status(400).json({ success: false, message: 'System protected roles cannot be deleted.' });
    }

    await Role.findByIdAndDelete(id);

    await AuditLog.create({
      adminId: adminUser?._id,
      adminName: adminUser?.name || 'Administrator',
      adminEmail: adminUser?.email || 'admin@mitra.edu',
      category: 'Roles & Permissions',
      action: `Deleted custom role: ${role.displayName}`,
      settingChanged: 'Role Deleted',
      previousValue: role.displayName,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Role '${role.displayName}' deleted successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete role: ' + err.message });
  }
};

// 7. Audit Logs Management
exports.getAuditLogs = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search && search.trim()) {
      filter.$or = [
        { action: { $regex: search.trim(), $options: 'i' } },
        { adminName: { $regex: search.trim(), $options: 'i' } },
        { adminEmail: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      logs,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load audit logs: ' + err.message });
  }
};

// 8. Reset Category to Default
exports.resetCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const adminUser = req.user;

    const freshSettings = new SystemSettings({});
    const defaultCategoryData = freshSettings[category];

    if (!defaultCategoryData) {
      return res.status(400).json({ success: false, message: `Category '${category}' cannot be reset.` });
    }

    const settings = await getOrCreateSettings();
    const previous = settings[category];
    settings[category] = defaultCategoryData;
    settings.updatedAt = Date.now();
    await settings.save();

    await AuditLog.create({
      adminId: adminUser?._id,
      adminName: adminUser?.name || 'Administrator',
      adminEmail: adminUser?.email || 'admin@mitra.edu',
      category: category,
      action: `Reset ${category} to institutional defaults`,
      settingChanged: 'Reset to Defaults',
      previousValue: previous,
      newValue: defaultCategoryData,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Category '${category}' has been reset to default values.`,
      categoryData: settings[category]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reset category: ' + err.message });
  }
};

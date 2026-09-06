const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./user.model');
const Session = require('./session.model');
const { StudentProfile } = require('../students/student.model');
const { sendCredentialEmail, sendPasswordResetEmail, getEmailDiagnostics, sendTestEmail, verifyConnection } = require('../../utils/email.service');
const { OFFICIAL_DEPARTMENTS } = require('../../config/constants');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  REFRESH_TOKEN_EXPIRY_MS,
  INACTIVITY_TIMEOUT_MS,
  setRefreshTokenCookie,
  clearRefreshTokenCookie
} = require('./token.util');

// Helper to create a new session and attach HttpOnly refresh cookie
const createSession = async (user, req, res) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const family = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
  const userAgent = req.headers['user-agent'] || 'Unknown Browser';
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'Unknown IP';
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  await Session.create({
    user: user._id,
    refreshTokenHash,
    family,
    userAgent,
    ipAddress,
    lastActive: new Date(),
    expiresAt,
    isRevoked: false
  });

  setRefreshTokenCookie(res, refreshToken);

  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, erpNumber, rollNo, gender, section, year, batch } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and Email are required.' });
    }

    const selectedDept = department && OFFICIAL_DEPARTMENTS.includes(department) ? department : 'CSE';

    const trimmedEmail = email.toLowerCase().trim();
    const finalErp = (erpNumber || rollNo || '').trim();

    // Check if Email already exists
    const existingUser = await User.findOne({ email: trimmedEmail });

    // Check if ERP / Roll number already exists (for student registrations)
    let existingProfileWithErp = null;
    if (finalErp) {
      const candidateProfiles = await StudentProfile.find({
        $or: [
          { erpNumber: { $regex: new RegExp(`^${finalErp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { rollNo: { $regex: new RegExp(`^${finalErp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
        ]
      }).populate('user');

      for (const cp of candidateProfiles) {
        if (cp.user) {
          existingProfileWithErp = cp;
          break;
        } else {
          // Self-clean orphaned profile record
          await StudentProfile.deleteOne({ _id: cp._id });
        }
      }
    }

    if (existingUser && existingProfileWithErp) {
      return res.status(400).json({
        success: false,
        message: `Both email '${trimmedEmail}' and ERP number '${finalErp}' are already registered. Please sign in or use different details.`
      });
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `Email '${trimmedEmail}' is already registered. Please sign in or use a different email address.`
      });
    }

    if (existingProfileWithErp) {
      return res.status(400).json({
        success: false,
        message: `ERP / Roll number '${finalErp}' is already registered. Please verify your ERP number or contact the Training & Placement department.`
      });
    }

    const generatedPassword = password ? password.trim() : `Mitra@${Math.floor(100000 + Math.random() * 900000)}`;

    const user = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      password: generatedPassword,
      role: role || 'student',
      department: selectedDept
    });

    let profileCompletion = 0;
    let emailResult = { success: false };

    // Auto-create StudentProfile if user is student
    if (user.role === 'student') {
      const profile = new StudentProfile({
        user: user._id,
        erpNumber: finalErp,
        rollNo: finalErp,
        gender: gender || 'Male',
        section: section || 'A',
        department: user.department,
        year: year || 'Third Year',
        batch: batch || '2026'
      });

      profileCompletion = profile.calculateCompletion(user);
      await profile.save();

      // Dispatch credentials email and verify delivery result
      emailResult = await sendCredentialEmail({
        toEmail: user.email,
        studentName: user.name,
        password: generatedPassword,
        erpNumber: finalErp
      });

      if (!emailResult?.success) {
        return res.status(500).json({
          success: false,
          emailDispatched: false,
          status: 'Email Failed',
          message: `Account created, but credentials email delivery failed (${emailResult?.error || 'SMTP delivery error'}). Please check Mailtrap SMTP configuration.`
        });
      }
    }

    const { accessToken } = await createSession(user, req, res);

    res.status(201).json({
      success: true,
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      },
      emailDispatched: true,
      status: 'Email Sent',
      message: 'Student account registered successfully. Your official sign-in credentials have been dispatched to your email.'
    });
  } catch (err) {
    console.error('[Registration Error]:', err?.message || err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || '';
      if (field === 'email') {
        return res.status(400).json({ success: false, message: 'This email address is already registered.' });
      } else if (field === 'erpNumber' || field === 'rollNo') {
        return res.status(400).json({ success: false, message: 'This ERP / Roll number is already registered.' });
      }
      return res.status(400).json({ success: false, message: 'An account with these details already exists.' });
    }
    res.status(500).json({ success: false, message: err.message || 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Role Verification: Prevent cross-role login
    if (role && user.role !== role) {
      const selectedLabel = role === 'admin' ? 'Administrator' : 'Student';
      const actualLabel = user.role === 'admin' ? 'Administrator' : 'Student';
      return res.status(403).json({
        success: false,
        message: `This account belongs to an ${actualLabel}. You cannot sign in under the ${selectedLabel} portal. Please switch to the ${actualLabel} tab.`
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is inactive. Contact administrator.' });
    }

    const { accessToken } = await createSession(user, req, res);

    let profileCompletion = 100;
    if (user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: user._id });
      if (profile) {
        profile.calculateCompletion(user);
        await profile.save();
        profileCompletion = profile.profileCompletionPercentage;
      } else {
        profileCompletion = 0;
      }
    }

    res.json({
      success: true,
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        profileCompletion
      }
    });
  } catch (err) {
    console.error('[Login Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const rawToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];
    if (!rawToken) {
      return res.status(401).json({ success: false, message: 'Refresh token is required' });
    }

    const tokenHash = hashToken(rawToken);
    const session = await Session.findOne({ refreshTokenHash: tokenHash });

    if (!session) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }

    // Reuse detection: Invalidate all sessions in this family if a revoked token is used
    if (session.isRevoked) {
      await Session.updateMany({ family: session.family }, { isRevoked: true });
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        message: 'Security Alert: Revoked refresh token reuse detected. All linked sessions terminated.',
        code: 'TOKEN_REUSE_DETECTED'
      });
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      session.isRevoked = true;
      await session.save();
      clearRefreshTokenCookie(res);
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    // Check inactivity timeout (30 min)
    const inactiveDuration = Date.now() - new Date(session.lastActive).getTime();
    if (inactiveDuration > INACTIVITY_TIMEOUT_MS) {
      session.isRevoked = true;
      await session.save();
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        message: 'Session expired due to inactivity. Please log in again.',
        code: 'INACTIVITY_TIMEOUT'
      });
    }

    // Verify user exists and is active
    const user = await User.findById(session.user);
    if (!user || user.status !== 'active') {
      session.isRevoked = true;
      await session.save();
      clearRefreshTokenCookie(res);
      return res.status(401).json({ success: false, message: 'User account is inactive or no longer exists' });
    }

    // Refresh Token Rotation: Generate new refresh token and update session
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRefreshToken);

    session.refreshTokenHash = newRefreshTokenHash;
    session.lastActive = new Date();
    session.expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    session.userAgent = req.headers['user-agent'] || session.userAgent;
    session.ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || session.ipAddress;
    await session.save();

    // Set new rotated refresh cookie
    setRefreshTokenCookie(res, newRefreshToken);

    // Issue new 15-minute access token
    const newAccessToken = generateAccessToken(user);

    let profileCompletion = 100;
    if (user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: user._id });
      if (profile) {
        profile.calculateCompletion(user);
        await profile.save();
        profileCompletion = profile.profileCompletionPercentage;
      } else {
        profileCompletion = 0;
      }
    }

    res.json({
      success: true,
      token: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        profileCompletion
      }
    });
  } catch (err) {
    console.error('[Refresh Token Error]:', err);
    res.status(500).json({ success: false, message: err.message || 'Error during token refresh' });
  }
};

exports.logout = async (req, res) => {
  try {
    const rawToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await Session.deleteOne({ refreshTokenHash: tokenHash });
    }
    clearRefreshTokenCookie(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('[Logout Error]:', err);
    clearRefreshTokenCookie(res);
    res.status(500).json({ success: false, message: err.message || 'Error during logout' });
  }
};

exports.logoutAll = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await Session.deleteMany({ user: req.user._id });
    clearRefreshTokenCookie(res);

    res.json({
      success: true,
      message: 'Successfully logged out from all devices'
    });
  } catch (err) {
    console.error('[Logout All Error]:', err);
    clearRefreshTokenCookie(res);
    res.status(500).json({ success: false, message: err.message || 'Error logging out from all devices' });
  }
};

exports.getSessions = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const currentToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];
    const currentHash = currentToken ? hashToken(currentToken) : null;

    const sessions = await Session.find({
      user: req.user._id,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    }).sort({ lastActive: -1 }).select('-refreshTokenHash');

    const formattedSessions = sessions.map(s => ({
      id: s._id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      lastActive: s.lastActive,
      createdAt: s.createdAt,
      isCurrent: currentHash ? s.refreshTokenHash === currentHash : false
    }));

    res.json({
      success: true,
      sessions: formattedSessions
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Error fetching active sessions' });
  }
};

exports.revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    const session = await Session.findOne({ _id: sessionId, user: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    await Session.deleteOne({ _id: sessionId });

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Error revoking session' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    let studentProfile = null;
    if (user && user.role === 'student') {
      studentProfile = await StudentProfile.findOne({ user: user._id });
      if (studentProfile) {
        studentProfile.calculateCompletion(user);
        await studentProfile.save();
      }
    }
    res.json({
      success: true,
      user,
      studentProfile
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email address.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered account found with this email address.' });
    }

    // Find or create student profile if user is student
    if (user.role === 'student') {
      let profile = await StudentProfile.findOne({ user: user._id });
      if (!profile) {
        profile = new StudentProfile({
          user: user._id,
          department: user.department || 'CSE'
        });
      }
      profile.passwordResetStatus = 'PENDING';
      profile.passwordResetRequestedAt = new Date();
      profile.passwordResetToken = null;
      profile.passwordResetExpires = null;
      await profile.save();
    }

    res.json({
      success: true,
      message: 'Password reset request submitted successfully. Please contact the Training & Placement department to enable your password reset.'
    });
  } catch (err) {
    console.error('[Forgot Password Error]:', err?.message || err);
    res.status(500).json({ success: false, message: err.message || 'Server error while submitting password reset request.' });
  }
};

exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Password reset token is required.' });
    }

    const profile = await StudentProfile.findOne({
      passwordResetToken: token,
      passwordResetStatus: 'ENABLED',
      passwordResetExpires: { $gt: new Date() }
    }).populate('user', 'name email');

    if (!profile || !profile.user) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid, expired, or has already been used. Please submit a new request if needed.'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid.',
      student: {
        name: profile.user.name,
        email: profile.user.email
      }
    });
  } catch (err) {
    console.error('[Verify Reset Token Error]:', err?.message || err);
    res.status(500).json({ success: false, message: err.message || 'Server error while verifying reset token.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Password reset token is required.' });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Both New Password and Confirm Password are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Find student profile with matching token, status ENABLED, and valid expiry
    const profile = await StudentProfile.findOne({
      passwordResetToken: token,
      passwordResetStatus: 'ENABLED',
      passwordResetExpires: { $gt: new Date() }
    });

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid, expired, or has already been used. Please submit a new request if needed.'
      });
    }

    const user = await User.findById(profile.user);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Hash and update password (userSchema.pre('save') handles bcrypt hashing)
    user.password = newPassword;
    await user.save();

    // Invalidate reset token and mark status as COMPLETED
    profile.passwordResetToken = null;
    profile.passwordResetExpires = null;
    profile.passwordResetStatus = 'COMPLETED';
    profile.passwordResetCompletedAt = new Date();
    await profile.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in using your new password.'
    });
  } catch (err) {
    console.error('[Reset Password Error]:', err?.message || err);
    res.status(500).json({ success: false, message: err.message || 'Server error while resetting password.' });
  }
};

exports.getEmailStatus = async (req, res) => {
  try {
    const shouldVerify = req.query?.verify === 'true';
    const diagnostics = await getEmailDiagnostics(shouldVerify);
    res.json({
      success: true,
      diagnostics
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Helper to generate an interactive browser-based testing console for Render deployment
 */
const renderEmailTestConsoleHtml = ({ diagnostics, testResult = null, targetEmail = '' }) => {
  const isConfigured = diagnostics.configured;
  const provider = diagnostics.provider;
  const envName = diagnostics.environment;
  const sender = diagnostics.config.senderAddress;
  const host = diagnostics.config.smtpHost;
  const port = diagnostics.config.smtpPort;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MITRA Portal - Email Test Console</title>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        :root {
          --bg-main: #f8fafc;
          --card-bg: #ffffff;
          --text-primary: #0f172a;
          --text-muted: #64748b;
          --primary: #2563eb;
          --primary-hover: #1d4ed8;
          --success: #16a34a;
          --error: #dc2626;
          --border: #e2e8f0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #f0f4ff 0%, #f8fafc 100%);
          color: var(--text-primary);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .container {
          max-width: 680px;
          width: 100%;
          background: var(--card-bg);
          border-radius: 20px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
          border: 1px solid var(--border);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%);
          color: white;
          padding: 32px 28px;
          text-align: center;
        }
        .header h1 {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }
        .header p {
          font-size: 14px;
          color: #bfdbfe;
        }
        .content {
          padding: 28px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .badge-success { background: #dcfce7; color: #15803d; }
        .badge-warning { background: #fef3c7; color: #b45309; }
        .badge-info { background: #dbeafe; color: #1e40af; }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .info-card {
          background: #f8fafc;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .info-card .label {
          font-size: 11px;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .info-card .val {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .result-box {
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
        }
        .result-success {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
        }
        .result-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        .input-row {
          display: flex;
          gap: 10px;
        }
        .input-row input {
          flex: 1;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1.5px solid var(--border);
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-row input:focus {
          border-color: var(--primary);
        }
        .btn {
          padding: 12px 22px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          text-decoration: none;
        }
        .btn-primary {
          background: var(--primary);
          color: white;
        }
        .btn-primary:hover {
          background: var(--primary-hover);
        }
        .btn-secondary {
          background: #e2e8f0;
          color: #334155;
          font-size: 13px;
          padding: 8px 14px;
        }
        .btn-secondary:hover {
          background: #cbd5e1;
        }
        .footer-links {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
          font-size: 12px;
          color: var(--text-muted);
        }
        .footer-links a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
        }
        .mono {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MITRA Email Service Tester</h1>
          <p>Verify custom domain mail delivery on Render Cloud & Local environments</p>
        </div>
        <div class="content">
          <!-- Status Grid -->
          <div class="info-grid">
            <div class="info-card">
              <div class="label">Status</div>
              <div class="val">
                <span class="badge ${isConfigured ? 'badge-success' : 'badge-warning'}">
                  ${isConfigured ? 'Ready' : 'Incomplete'}
                </span>
              </div>
            </div>
            <div class="info-card">
              <div class="label">Environment</div>
              <div class="val mono">${envName}</div>
            </div>
            <div class="info-card">
              <div class="label">Provider</div>
              <div class="val">${provider}</div>
            </div>
            <div class="info-card">
              <div class="label">SMTP Server</div>
              <div class="val mono">${host}:${port}</div>
            </div>
          </div>

          <div style="background: #f1f5f9; padding: 10px 14px; border-radius: 8px; font-size: 12px; margin-bottom: 20px; color: #475569;">
            <strong>Sender Identity:</strong> <span class="mono">${sender}</span>
          </div>

          ${
            testResult
              ? `
            <div class="result-box ${testResult.success ? 'result-success' : 'result-error'}">
              <div style="font-weight: 800; font-size: 15px; margin-bottom: 6px;">
                ${testResult.success ? '✓ Test Email Dispatched Successfully!' : '✗ Email Dispatch Failed'}
              </div>
              <div>${testResult.message || testResult.error}</div>
              ${testResult.latencyMs ? `<div style="margin-top: 6px; font-size: 12px; opacity: 0.9;"><strong>Latency:</strong> ${testResult.latencyMs}ms</div>` : ''}
              ${testResult.messageId ? `<div style="margin-top: 4px; font-size: 12px; opacity: 0.9;"><strong>Message ID:</strong> <span class="mono">${testResult.messageId}</span></div>` : ''}
              ${testResult.hint ? `<div style="margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.05); border-radius: 6px; font-size: 12px;"><strong>Tip:</strong> ${testResult.hint}</div>` : ''}
            </div>
          `
              : ''
          }

          <!-- Test Dispatch Form -->
          <form method="GET" action="">
            <div class="form-group">
              <label class="form-label" for="targetEmail">Send Live Test Email To:</label>
              <div class="input-row">
                <input
                  type="email"
                  id="targetEmail"
                  name="to"
                  placeholder="e.g. your_email@gmail.com"
                  value="${targetEmail}"
                  required
                />
                <button type="submit" class="btn btn-primary">
                  Send Test Email
                </button>
              </div>
            </div>
          </form>

          <div class="footer-links">
            <div>
              <a href="?verify=true" class="btn-secondary" style="border-radius: 6px; padding: 6px 12px; display: inline-block;">
                ⚡ Test Live Handshake
              </a>
            </div>
            <div>
              <a href="/api/auth/email-diagnostic?verify=true" target="_blank">View JSON Diagnostics &rarr;</a>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

exports.testEmailSend = async (req, res) => {
  try {
    const targetEmail = (req.body?.to || req.query?.to || '').trim();
    const wantsHtml = req.accepts('html') && !req.xhr && !req.headers['accept']?.includes('application/json') && req.query?.format !== 'json';

    // If user accessed in browser with ?verify=true (handshake check)
    if (req.query?.verify === 'true' && wantsHtml) {
      const diag = await getEmailDiagnostics(true);
      const handshakeSuccess = diag.liveVerification?.success;
      return res.send(
        renderEmailTestConsoleHtml({
          diagnostics: diag,
          testResult: {
            success: handshakeSuccess,
            message: handshakeSuccess
              ? `Live SMTP Handshake Successful: ${diag.liveVerification?.message}`
              : `Handshake Failed: ${diag.liveVerification?.error || 'Unknown error'}`,
            hint: diag.liveVerification?.hint,
            latencyMs: diag.liveVerification?.latencyMs
          }
        })
      );
    }

    // If accessed in browser without target email, display the interactive test console
    if (!targetEmail) {
      if (wantsHtml) {
        const diagnostics = await getEmailDiagnostics(false);
        return res.send(renderEmailTestConsoleHtml({ diagnostics }));
      }

      return res.status(400).json({
        success: false,
        message: 'Please provide a target email address in request body {"to": "..."} or query parameter ?to=...'
      });
    }

    // Dispatch test email
    const result = await sendTestEmail(targetEmail);
    const diagnostics = await getEmailDiagnostics(false);

    if (wantsHtml) {
      return res.status(result.success ? 200 : 500).send(
        renderEmailTestConsoleHtml({
          diagnostics,
          targetEmail,
          testResult: {
            success: result.success,
            message: result.success
              ? `Test email dispatched successfully to ${result.to} via ${result.providerName || result.provider}. Check your inbox or spam folder.`
              : `Delivery failed: ${result.error}`,
            messageId: result.messageId,
            latencyMs: result.latencyMs,
            hint: result.hint
          }
        })
      );
    }

    res.status(result.success ? 200 : 500).json({
      success: result.success,
      status: result.status,
      message: result.success
        ? `Test email dispatched successfully to ${result.to} via ${result.providerName || result.provider}.`
        : `Test email delivery failed: ${result.error}`,
      details: result
    });
  } catch (err) {
    res.status(500).json({ success: false, status: 'Email Failed', message: err.message });
  }
};

exports.updateThemePreferences = async (req, res) => {
  try {
    const { mode, primaryColor, sidebarColor, customPrimaryColor, customSidebarColor } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.themePreferences = {
      mode: mode || user.themePreferences?.mode || 'light',
      primaryColor: primaryColor || user.themePreferences?.primaryColor || '#2563EB',
      sidebarColor: sidebarColor || user.themePreferences?.sidebarColor || 'default',
      customPrimaryColor: customPrimaryColor !== undefined ? customPrimaryColor : (user.themePreferences?.customPrimaryColor || ''),
      customSidebarColor: customSidebarColor !== undefined ? customSidebarColor : (user.themePreferences?.customSidebarColor || '')
    };

    await user.save();

    res.json({
      success: true,
      message: 'Theme preferences saved successfully',
      themePreferences: user.themePreferences
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

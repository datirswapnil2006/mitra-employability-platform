const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./user.model');
const Session = require('./session.model');
const { StudentProfile } = require('../students/student.model');
const { sendCredentialEmail, sendPasswordResetEmail, getEmailDiagnostics, sendTestEmail } = require('../../utils/email.service');
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
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
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

exports.getEmailStatus = (req, res) => {
  try {
    const diagnostic = getEmailDiagnostics();
    res.json({ success: true, diagnostics: diagnostic });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.testEmailSend = async (req, res) => {
  try {
    const targetEmail = req.body?.to || req.query?.to;
    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a target email address in request body {"to": "..."} or query parameter ?to=...'
      });
    }
    const result = await sendTestEmail(targetEmail);
    res.status(result.success ? 200 : 500).json({
      success: result.success,
      status: result.status,
      message: result.success ? 'Test email dispatched successfully to Mailtrap.' : 'Test email failed. Check Mailtrap SMTP configuration.',
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

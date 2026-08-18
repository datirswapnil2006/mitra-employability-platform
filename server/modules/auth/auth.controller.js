const jwt = require('jsonwebtoken');
const User = require('./user.model');
const { StudentProfile } = require('../students/student.model');
const { sendCredentialEmail, sendPasswordResetEmail, getEmailDiagnostics, sendTestEmail } = require('../../utils/email.service');
const { OFFICIAL_DEPARTMENTS } = require('../../config/constants');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mitra_super_secret_jwt_key_2026_employability', {
    expiresIn: '30d'
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, erpNumber, rollNo, gender, section, year, batch } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and Email are required.' });
    }

    const selectedDept = department && OFFICIAL_DEPARTMENTS.includes(department) ? department : 'CSE';

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const generatedPassword = password ? password.trim() : `Mitra@${Math.floor(100000 + Math.random() * 900000)}`;

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: generatedPassword,
      role: role || 'student',
      department: selectedDept
    });

    let profileCompletion = 0;
    let emailResult = { success: false };

    // Auto-create StudentProfile if user is student
    if (user.role === 'student') {
      const finalErp = erpNumber || rollNo || '';
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

      profileCompletion = profile.calculateCompletion();
      await profile.save();

      // Send credentials email asynchronously (non-blocking for fast registration)
      sendCredentialEmail({
        toEmail: user.email,
        studentName: user.name,
        password: generatedPassword,
        erpNumber: finalErp
      }).then(res => {
        if (res?.success) {
          console.log(`[Email Service]: Email Sent - Credentials email delivered to ${user.email}`);
        } else {
          console.error(`[Email Service]: Email Failed - Credentials email failed for ${user.email}: ${res?.error}`);
        }
      }).catch(emailErr => {
        console.error(`[Email Service]: Email Failed - Credentials email error for ${user.email}:`, emailErr?.message || emailErr);
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      },
      emailDispatched: true,
      message: 'Student account registered successfully. Your official sign-in credentials have been dispatched to your email.'
    });
  } catch (err) {
    console.error('[Registration Error]:', err?.message || err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'Email / ERP Number';
      return res.status(400).json({ success: false, message: `${field} is already registered.` });
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

    const token = generateToken(user._id);

    let profileCompletion = 100;
    if (user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: user._id });
      profileCompletion = profile ? profile.profileCompletionPercentage : 0;
    }

    res.json({
      success: true,
      token,
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
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    let studentProfile = null;
    if (user.role === 'student') {
      studentProfile = await StudentProfile.findOne({ user: user._id });
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

    res.json({
      success: true,
      message: 'Password reset request submitted. Please contact your Training & Placement Administrator to authorize and dispatch a new password to your email.'
    });
  } catch (err) {
    console.error('[Forgot Password Error]:', err?.message || err);
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




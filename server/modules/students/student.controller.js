const crypto = require('crypto');
const { StudentProfile, ProfileConfig } = require('./student.model');
const User = require('../auth/user.model');
const { OFFICIAL_DEPARTMENTS } = require('../../config/constants');
const { sendPasswordResetEmail } = require('../../utils/email.service');

// Get profile config or default
const getRequiredFieldsConfig = async () => {
  let config = await ProfileConfig.findOne();
  if (!config) {
    config = await ProfileConfig.create({
      requiredFields: ['erpNumber', 'department', 'year', 'phone', 'hometown', 'aadhaarNumber', 'educationGap', 'hasBacklogs', 'resumeUrl']
    });
  } else if (config.requiredFields && (config.requiredFields.includes('skills') || config.requiredFields.includes('githubUrl'))) {
    config.requiredFields = config.requiredFields.filter(f => f !== 'skills' && f !== 'targetRole' && f !== 'githubUrl');
    await config.save();
  }
  return config.requiredFields;
};

// Get current student profile
exports.getStudentProfile = async (req, res) => {
  try {
    let profile = await StudentProfile.findOne({ user: req.user.id }).populate('user', 'name email role department');
    if (!profile) {
      profile = await StudentProfile.create({
        user: req.user.id,
        department: req.user.department || 'CSE'
      });
      profile = await profile.populate('user', 'name email role department');
    }

    const requiredFields = await getRequiredFieldsConfig();
    profile.calculateCompletion(requiredFields);
    await profile.save();

    res.json({
      success: true,
      profile,
      requiredFields
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update student profile
exports.updateStudentProfile = async (req, res) => {
  try {
    const {
      erpNumber,
      rollNo,
      gender,
      section,
      department,
      year,
      batch,
      phone,
      profilePhoto,
      hometown,
      aadhaarNumber,
      educationGap,
      hasBacklogs,
      bio,
      skills,
      resumeUrl,
      linkedinUrl,
      githubUrl,
      targetRole,
      tenthPercentage,
      twelfthPercentage,
      diplomaPercentage,
      cgpa
    } = req.body;

    let profile = await StudentProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new StudentProfile({ user: req.user.id });
    }

    const finalErp = erpNumber !== undefined ? erpNumber : rollNo;
    if (finalErp !== undefined) {
      const trimmedErp = (finalErp || '').trim();
      if (trimmedErp) {
        const existingOther = await StudentProfile.findOne({
          user: { $ne: req.user.id },
          $or: [
            { erpNumber: { $regex: new RegExp(`^${trimmedErp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
            { rollNo: { $regex: new RegExp(`^${trimmedErp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
          ]
        });
        if (existingOther) {
          return res.status(400).json({
            success: false,
            message: `The ERP / Roll number '${trimmedErp}' is already associated with another student account.`
          });
        }
      }
      profile.erpNumber = trimmedErp;
      profile.rollNo = trimmedErp;
    }
    if (gender !== undefined) profile.gender = gender;
    if (section !== undefined) profile.section = section;
    if (department !== undefined && OFFICIAL_DEPARTMENTS.includes(department)) {
      profile.department = department;
    }
    if (year !== undefined) profile.year = year;
    if (batch !== undefined) profile.batch = batch;
    if (phone !== undefined) profile.phone = phone;
    if (profilePhoto !== undefined) profile.profilePhoto = profilePhoto;
    if (hometown !== undefined) profile.hometown = hometown;
    if (aadhaarNumber !== undefined) profile.aadhaarNumber = aadhaarNumber;
    if (educationGap !== undefined) profile.educationGap = educationGap;
    if (hasBacklogs !== undefined) profile.hasBacklogs = hasBacklogs;
    if (bio !== undefined) profile.bio = bio;
    if (skills !== undefined) {
      profile.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (resumeUrl !== undefined) profile.resumeUrl = resumeUrl;
    if (linkedinUrl !== undefined) profile.linkedinUrl = linkedinUrl;
    if (githubUrl !== undefined) profile.githubUrl = githubUrl;
    if (targetRole !== undefined) profile.targetRole = targetRole;

    // Academic scores
    if (tenthPercentage !== undefined) {
      profile.tenthPercentage = tenthPercentage === '' || tenthPercentage === null ? null : parseFloat(tenthPercentage);
    }
    if (twelfthPercentage !== undefined) {
      profile.twelfthPercentage = twelfthPercentage === '' || twelfthPercentage === null ? null : parseFloat(twelfthPercentage);
    }
    if (diplomaPercentage !== undefined) {
      profile.diplomaPercentage = diplomaPercentage === '' || diplomaPercentage === null ? null : parseFloat(diplomaPercentage);
    }
    if (cgpa !== undefined) {
      profile.cgpa = cgpa === '' || cgpa === null ? null : parseFloat(cgpa);
    }

    profile.updatedAt = Date.now();

    const requiredFields = await getRequiredFieldsConfig();
    profile.calculateCompletion(requiredFields);
    await profile.save();

    // Also update User department / profilePhoto if changed
    const userUpdates = {};
    if (department) userUpdates.department = department;
    if (profilePhoto !== undefined) userUpdates.profilePhoto = profilePhoto;
    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(req.user.id, userUpdates);
    }

    res.json({
      success: true,
      profile,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: Get all student profiles with filtering
exports.getAllStudentsAdmin = async (req, res) => {
  try {
    const { department, year, batch, section, search } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (year) filter.year = year;
    if (batch) filter.batch = batch;
    if (section) filter.section = section;

    let rawProfiles = await StudentProfile.find(filter)
      .populate('user', 'name email status department createdAt')
      .sort({ updatedAt: -1, createdAt: -1 });

    // Filter out orphaned profiles where user was deleted or is null
    let validProfiles = rawProfiles.filter(p => p.user && p.user._id);

    // Deduplicate profiles by user id
    const seenUsers = new Set();
    let profiles = [];
    for (const p of validProfiles) {
      const uId = p.user._id.toString();
      if (!seenUsers.has(uId)) {
        seenUsers.add(uId);
        profiles.push(p);
      }
    }
    
    if (search) {
      const q = search.toLowerCase();
      profiles = profiles.filter(p => p.user && (
        (p.user.name && p.user.name.toLowerCase().includes(q)) ||
        (p.user.email && p.user.email.toLowerCase().includes(q)) ||
        (p.erpNumber && p.erpNumber.toLowerCase().includes(q)) ||
        (p.rollNo && p.rollNo.toLowerCase().includes(q))
      ));
    }

    res.json({
      success: true,
      count: profiles.length,
      students: profiles
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: Enable a student's password reset only if they have a PENDING request
exports.adminResetStudentPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Student user account not found.' });
    }

    // Check student profile for pending request
    let profile = await StudentProfile.findOne({ user: user._id });
    if (!profile || profile.passwordResetStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'No pending password reset request found for this student. Password reset can only be processed when requested by the student.'
      });
    }

    // Generate secure one-time reset token (valid for 24 hours)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    profile.passwordResetStatus = 'ENABLED';
    profile.passwordResetToken = resetToken;
    profile.passwordResetExpires = expiresAt;
    profile.passwordResetApprovedAt = new Date();
    await profile.save();

    // Student password is NOT changed or generated here. Existing password remains intact.
    let originUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');
    if (req.headers.origin) {
      originUrl = req.headers.origin.trim().replace(/\/+$/, '');
    } else if (req.headers.referer) {
      try {
        originUrl = new URL(req.headers.referer).origin.replace(/\/+$/, '');
      } catch (_) {}
    }
    const resetLink = `${originUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    const emailResult = await sendPasswordResetEmail({
      toEmail: user.email,
      studentName: user.name,
      resetToken,
      resetLink
    });

    if (emailResult?.success) {
      return res.json({
        success: true,
        emailDispatched: true,
        status: 'Email Sent',
        passwordResetStatus: 'ENABLED',
        message: `Password reset link has been successfully dispatched to ${user.email}.`
      });
    } else {
      return res.status(500).json({
        success: false,
        emailDispatched: false,
        status: 'Email Failed',
        message: `Password reset was enabled, but email delivery failed: ${emailResult?.error || 'SMTP delivery error'}`
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, status: 'Email Failed', message: err.message });
  }
};




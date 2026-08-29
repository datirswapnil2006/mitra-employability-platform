const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { StudentProfile, ProfileConfig } = require('./student.model');
const User = require('../auth/user.model');
const { OFFICIAL_DEPARTMENTS } = require('../../config/constants');
const { sendPasswordResetEmail } = require('../../utils/email.service');

// Helper to save base64 / data URI photo to disk and return file URL
const savePhotoToFile = (photoInput, userId) => {
  if (!photoInput || typeof photoInput !== 'string') return '';
  const trimmed = photoInput.trim();
  if (!trimmed) return '';

  // If already a static URL or web URL, keep it
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Handle data URI / base64 image
  const matches = trimmed.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    const mimeType = matches[1];
    const base64Data = matches[2];
    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else if (mimeType.includes('webp')) ext = 'webp';

    const uploadsDir = path.join(__dirname, '../../uploads/profiles');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `profile-${userId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    try {
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
      return `/uploads/profiles/${filename}`;
    } catch (err) {
      console.error('Error writing profile photo file:', err);
      return '';
    }
  }

  return trimmed;
};

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
    const currentUserId = req.user._id || req.user.id;
    let profile = await StudentProfile.findOne({ user: currentUserId }).populate('user', 'name email role department profilePhoto');
    if (!profile) {
      profile = await StudentProfile.create({
        user: currentUserId,
        department: req.user.department || 'CSE'
      });
      profile = await profile.populate('user', 'name email role department profilePhoto');
    }

    // Ensure photo consistency between User and Profile
    if (!profile.profilePhoto && profile.user?.profilePhoto) {
      profile.profilePhoto = profile.user.profilePhoto;
    }

    profile.calculateCompletion(profile.user);
    await profile.save();

    res.json({
      success: true,
      profile,
      student: profile,
      requiredFields: await getRequiredFieldsConfig()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Standalone endpoint: Upload profile photo
exports.uploadProfilePhoto = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const { photoData, profilePhoto } = req.body;
    const photoToProcess = photoData || profilePhoto;

    if (!photoToProcess) {
      return res.status(400).json({ success: false, message: 'No photo data provided' });
    }

    const savedUrl = savePhotoToFile(photoToProcess, currentUserId);
    if (!savedUrl) {
      return res.status(400).json({ success: false, message: 'Invalid photo data' });
    }

    let profile = await StudentProfile.findOne({ user: currentUserId });
    if (!profile) {
      profile = new StudentProfile({ user: currentUserId });
    }
    profile.profilePhoto = savedUrl;

    const user = await User.findById(currentUserId);
    if (user) {
      user.profilePhoto = savedUrl;
      await user.save();
    }

    profile.calculateCompletion(user);
    await profile.save();
    await profile.populate('user', 'name email role department profilePhoto');

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      photoUrl: savedUrl,
      profilePhoto: savedUrl,
      profile,
      student: profile
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update student profile
exports.updateStudentProfile = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const {
      name,
      email,
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

    let profile = await StudentProfile.findOne({ user: currentUserId });
    if (!profile) {
      profile = new StudentProfile({ user: currentUserId });
    }

    // 1. ERP / Roll Number uniqueness validation - excludes currently authenticated student's own document
    const finalErp = erpNumber !== undefined ? erpNumber : rollNo;
    if (finalErp !== undefined) {
      const trimmedErp = (finalErp || '').trim();
      if (trimmedErp) {
        const userObjId = mongoose.Types.ObjectId.isValid(currentUserId)
          ? new mongoose.Types.ObjectId(currentUserId)
          : currentUserId;

        const candidateProfiles = await StudentProfile.find({
          _id: { $ne: profile._id },
          user: { $ne: userObjId },
          $or: [
            { erpNumber: { $regex: new RegExp(`^${trimmedErp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
            { rollNo: { $regex: new RegExp(`^${trimmedErp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
          ]
        }).populate('user');

        for (const candidate of candidateProfiles) {
          if (candidate.user && candidate.user._id && candidate.user._id.toString() !== currentUserId.toString()) {
            return res.status(400).json({
              success: false,
              message: `The ERP / Roll number '${trimmedErp}' is already associated with another student account.`
            });
          } else if (!candidate.user) {
            // Self-clean orphaned profile record with no active user
            await StudentProfile.deleteOne({ _id: candidate._id });
          }
        }
      }
      profile.erpNumber = trimmedErp;
      profile.rollNo = trimmedErp;
    }

    // 2. Email uniqueness validation if email was provided
    if (email && email.trim()) {
      const trimmedEmail = email.trim().toLowerCase();
      const existingEmailUser = await User.findOne({
        _id: { $ne: currentUserId },
        email: trimmedEmail
      });
      if (existingEmailUser) {
        return res.status(400).json({
          success: false,
          message: `The email address '${trimmedEmail}' is already associated with another account.`
        });
      }
    }

    // 3. Process Profile Photo storage (file on disk, path/URL in DB)
    if (profilePhoto !== undefined) {
      profile.profilePhoto = savePhotoToFile(profilePhoto, currentUserId);
    }

    if (gender !== undefined) profile.gender = gender;
    if (section !== undefined) profile.section = section;
    if (department !== undefined && OFFICIAL_DEPARTMENTS.includes(department)) {
      profile.department = department;
    }
    if (year !== undefined) profile.year = year;
    if (batch !== undefined) profile.batch = batch;
    if (phone !== undefined) profile.phone = phone;
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

    // Also update User department, name, email, profilePhoto
    const userUpdates = {};
    if (name && name.trim()) userUpdates.name = name.trim();
    if (email && email.trim()) userUpdates.email = email.trim().toLowerCase();
    if (department) userUpdates.department = department;
    if (profile.profilePhoto !== undefined) userUpdates.profilePhoto = profile.profilePhoto;

    let updatedUser = null;
    if (Object.keys(userUpdates).length > 0) {
      updatedUser = await User.findByIdAndUpdate(currentUserId, userUpdates, { new: true });
    } else {
      updatedUser = await User.findById(currentUserId);
    }

    // 4. Calculate Profile Completion using weighted formula
    profile.calculateCompletion(updatedUser);
    await profile.save();

    await profile.populate('user', 'name email role department profilePhoto');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile,
      student: profile
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

// Get distinct graduation batches from registered students + default years up to max year
exports.getDistinctBatches = async (req, res) => {
  try {
    const rawBatches = await StudentProfile.distinct('batch');
    const validBatches = (rawBatches || [])
      .filter((b) => b && String(b).trim().length > 0)
      .map((b) => String(b).trim());

    const currentYear = new Date().getFullYear();
    let maxYear = currentYear + 4;
    validBatches.forEach((b) => {
      const num = parseInt(b, 10);
      if (!isNaN(num) && num > maxYear) {
        maxYear = num;
      }
    });

    const yearsSet = new Set();
    for (let y = 2024; y <= maxYear; y++) {
      yearsSet.add(String(y));
    }
    validBatches.forEach((b) => yearsSet.add(b));

    const sortedBatches = Array.from(yearsSet).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    res.json({
      success: true,
      batches: ['All', ...sortedBatches]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};




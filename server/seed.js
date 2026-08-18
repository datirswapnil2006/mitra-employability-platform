const mongoose = require('mongoose');
const User = require('./modules/auth/user.model');

/**
 * Clean System Initialization
 * Ensures default Administrator account exists without populating fake students, fake modules, or fake assessments.
 */
const seedData = async () => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.log('[System Init]: Bootstrapping initial system administrator...');
      await User.create({
        name: 'Dr. N. N. Khalsa (Admin)',
        email: 'admin@mitra.edu',
        password: 'adminpassword123',
        role: 'admin',
        department: 'CSE'
      });
      console.log('[System Init]: Administrator account initialized (admin@mitra.edu).');
    }
  } catch (err) {
    console.error('[System Init Error]:', err.message);
  }
};

module.exports = seedData;

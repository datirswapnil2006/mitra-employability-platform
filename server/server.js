require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const seedData = require('./seed');

const authRoutes = require('./modules/auth/auth.routes');
const studentRoutes = require('./modules/students/student.routes');
const trainingRoutes = require('./modules/training/training.routes');
const progressRoutes = require('./modules/progress/progress.routes');
const assessmentRoutes = require('./modules/assessments/assessment.routes');
const questionRoutes = require('./modules/assessments/question.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const reportRoutes = require('./modules/reports/report.routes');

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Module Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', app: 'MITRA Employability Portal API', timestamp: new Date() });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start Server & Connect Database
const startServer = async () => {
  await connectDB();
  await seedData();

  app.listen(PORT, () => {
    console.log(`MITRA EMPLOYABILITY PORTAL API SERVER RUNNING ON PORT ${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
  });
};

startServer();

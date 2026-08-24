import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ThemeCustomizerModal from './components/ThemeCustomizerModal';

import PublicLayout from './layouts/PublicLayout';
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import TrainingPublicPage from './pages/public/TrainingPublicPage';
import ContactPage from './pages/public/ContactPage';
import TermsConditionsPage from './pages/public/TermsConditionsPage';
import PrivacyPolicyPage from './pages/public/PrivacyPolicyPage';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import ProfilePage from './pages/student/ProfilePage';
import TrainingPage from './pages/student/TrainingPage';
import SubmoduleViewPage from './pages/student/SubmoduleViewPage';
import StudentAssessmentsPage from './pages/student/StudentAssessmentsPage';
import TakeAssessmentPage from './pages/student/TakeAssessmentPage';
import AssessmentResultPage from './pages/student/AssessmentResultPage';
import PsychometricPage from './pages/student/PsychometricPage';
import StudentPerformancePage from './pages/student/StudentPerformancePage';
import StudentNotificationsPage from './pages/student/StudentNotificationsPage';
import StudentSettingsPage from './pages/student/StudentSettingsPage';
import StudentSupportPage from './pages/student/StudentSupportPage';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagementPage from './pages/admin/StudentManagementPage';
import StudentExportPage from './pages/admin/StudentExportPage';
import ContentManagementPage from './pages/admin/ContentManagementPage';
import AssessmentManagementPage from './pages/admin/AssessmentManagementPage';
import ResultsManagementPage from './pages/admin/ResultsManagementPage';
import QuestionBankPage from './pages/admin/QuestionBankPage';
import AIAssessmentGenPage from './pages/admin/AIAssessmentGenPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import ReportsPage from './pages/admin/ReportsPage';
import AdminSupportPage from './pages/admin/AdminSupportPage';
import SettingsPage from './pages/admin/SettingsPage';

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ThemeCustomizerModal />
        <BrowserRouter>
          <Routes>
            {/* Public Institutional Website */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="training" element={<TrainingPublicPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="terms-and-conditions" element={<TermsConditionsPage />} />
              <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
            </Route>

            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Student Ecosystem */}
            <Route path="/student" element={<StudentLayout />}>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="training" element={<TrainingPage />} />
              <Route path="submodule/:submoduleId" element={<SubmoduleViewPage />} />
              <Route path="assessments" element={<StudentAssessmentsPage />} />
              <Route path="assessment" element={<Navigate to="/student/assessments" replace />} />
              <Route path="take-assessment/:id" element={<TakeAssessmentPage />} />
              <Route path="assessment-result/:id" element={<AssessmentResultPage />} />
              <Route path="psychometric" element={<PsychometricPage />} />
              <Route path="performance" element={<StudentPerformancePage />} />
              <Route path="support" element={<StudentSupportPage />} />
              <Route path="notifications" element={<StudentNotificationsPage />} />
              <Route path="settings" element={<StudentSettingsPage />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Admin Ecosystem */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<StudentManagementPage />} />
              <Route path="students/export" element={<StudentExportPage />} />
              <Route path="registration-requests" element={<StudentManagementPage />} />
              <Route path="training" element={<ContentManagementPage />} />
              <Route path="questions" element={<QuestionBankPage />} />
              <Route path="question-bank" element={<QuestionBankPage />} />
              <Route path="assessments" element={<AssessmentManagementPage />} />
              <Route path="results" element={<ResultsManagementPage />} />
              <Route path="ai-gen" element={<AIAssessmentGenPage />} />
              <Route path="psychometric" element={<AIAssessmentGenPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="support" element={<AdminSupportPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

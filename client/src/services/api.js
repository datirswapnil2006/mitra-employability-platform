const rawBase = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '');
export const API_BASE = rawBase.endsWith('/api')
  ? rawBase
  : (rawBase === '' ? '/api' : `${rawBase}/api`);

export const getMediaUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const baseUrl = rawBase.endsWith('/api') ? rawBase.slice(0, -4) : rawBase;
  if (baseUrl) {
    return `${baseUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  }
  return trimmed;
};

const getHeaders = () => {
  const token = localStorage.getItem('mitra_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },
  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },
  forgotPassword: async (email) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },
  verifyResetToken: async (token) => {
    const res = await fetch(`${API_BASE}/auth/verify-reset-token?token=${encodeURIComponent(token)}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },
  resetPassword: async (token, newPassword, confirmPassword) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword, confirmPassword })
    });
    return res.json();
  },
  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    return res.json();
  },
  updateThemePreferences: async (themeData) => {
    const res = await fetch(`${API_BASE}/auth/theme`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(themeData)
    });
    return res.json();
  },

  // Student Profile & Gating
  getProfile: async () => {
    const res = await fetch(`${API_BASE}/students/profile`, { headers: getHeaders() });
    return res.json();
  },
  updateProfile: async (data) => {
    const res = await fetch(`${API_BASE}/students/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  uploadProfilePhoto: async (data) => {
    const res = await fetch(`${API_BASE}/students/profile/photo`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getAllStudentsAdmin: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/students/admin/all?${query}`, { headers: getHeaders() });
    return res.json();
  },
  adminResetStudentPassword: async (userId) => {
    const res = await fetch(`${API_BASE}/students/admin/reset-password/${userId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  // Training
  getModules: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/training/modules?${query}`, { headers: getHeaders() });
    return res.json();
  },
  createModule: async (data) => {
    const res = await fetch(`${API_BASE}/training/modules`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Categories (Domain & Categorized Modules)
  getCategories: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/training/categories?${query}`, { headers: getHeaders() });
    return res.json();
  },
  getCategoryById: async (id) => {
    const res = await fetch(`${API_BASE}/training/categories/${id}`, { headers: getHeaders() });
    return res.json();
  },
  createCategory: async (data) => {
    const res = await fetch(`${API_BASE}/training/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateCategory: async (id, data) => {
    const res = await fetch(`${API_BASE}/training/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteCategory: async (id) => {
    const res = await fetch(`${API_BASE}/training/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // Companies (Data-Driven Company Preparation)
  getCompanies: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/training/companies?${query}`, { headers: getHeaders() });
    return res.json();
  },
  getCompanyById: async (id) => {
    const res = await fetch(`${API_BASE}/training/companies/${id}`, { headers: getHeaders() });
    return res.json();
  },
  createCompany: async (data) => {
    const res = await fetch(`${API_BASE}/training/companies`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateCompany: async (id, data) => {
    const res = await fetch(`${API_BASE}/training/companies/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteCompany: async (id) => {
    const res = await fetch(`${API_BASE}/training/companies/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // Topics (Aptitude & Topic-based modules)
  getTopics: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/training/topics?${query}`, { headers: getHeaders() });
    return res.json();
  },
  getTopicById: async (id) => {
    const res = await fetch(`${API_BASE}/training/topics/${id}`, { headers: getHeaders() });
    return res.json();
  },
  createTopic: async (data) => {
    const res = await fetch(`${API_BASE}/training/topics`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateTopic: async (id, data) => {
    const res = await fetch(`${API_BASE}/training/topics/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteTopic: async (id) => {
    const res = await fetch(`${API_BASE}/training/topics/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  getSubmodules: async (moduleId) => {
    const res = await fetch(`${API_BASE}/training/modules/${moduleId}/submodules`, { headers: getHeaders() });
    return res.json();
  },
  createSubmodule: async (data) => {
    const res = await fetch(`${API_BASE}/training/submodules`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getContentList: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/training/content?${query}`, { headers: getHeaders() });
    return res.json();
  },
  createContent: async (data) => {
    const res = await fetch(`${API_BASE}/training/content`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  previewMetadata: async (url) => {
    const res = await fetch(`${API_BASE}/training/preview-metadata`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ url })
    });
    return res.json();
  },
  updateContent: async (id, data) => {
    const res = await fetch(`${API_BASE}/training/content/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteContent: async (id) => {
    const res = await fetch(`${API_BASE}/training/content/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // Progress
  markContentComplete: async (contentId) => {
    const res = await fetch(`${API_BASE}/progress/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ contentId })
    });
    return res.json();
  },
  getSubmoduleProgress: async (submoduleId) => {
    const res = await fetch(`${API_BASE}/progress/submodule/${submoduleId}`, { headers: getHeaders() });
    return res.json();
  },
  getOverallProgress: async () => {
    const res = await fetch(`${API_BASE}/progress/overall`, { headers: getHeaders() });
    return res.json();
  },

  // Assessments
  getAssessments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/assessments?${query}`, { headers: getHeaders() });
    return res.json();
  },
  getAssessmentsBySubmodule: async (submoduleId) => {
    const res = await fetch(`${API_BASE}/assessments?submoduleId=${submoduleId}`, { headers: getHeaders() });
    return res.json();
  },
  getAssessmentById: async (id) => {
    const res = await fetch(`${API_BASE}/assessments/take/${id}`, { headers: getHeaders() });
    return res.json();
  },
  submitAssessment: async (data) => {
    const res = await fetch(`${API_BASE}/assessments/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getAttemptById: async (id) => {
    const res = await fetch(`${API_BASE}/assessments/attempt/${id}`, { headers: getHeaders() });
    return res.json();
  },
  getStudentAttempts: async () => {
    const res = await fetch(`${API_BASE}/assessments/attempts`, { headers: getHeaders() });
    return res.json();
  },
  getAllAssessmentsAdmin: async () => {
    const res = await fetch(`${API_BASE}/assessments/admin/all`, { headers: getHeaders() });
    return res.json();
  },
  getAllAttemptsAdmin: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/assessments/admin/results?${query}`, { headers: getHeaders() });
    return res.json();
  },
  createAssessment: async (data) => {
    const res = await fetch(`${API_BASE}/assessments/admin/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateAssessment: async (id, data) => {
    const res = await fetch(`${API_BASE}/assessments/admin/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteAssessment: async (id) => {
    const res = await fetch(`${API_BASE}/assessments/admin/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },
  generateAIAssessment: async (data) => {
    const res = await fetch(`${API_BASE}/assessments/admin/generate-ai`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Question Bank & Multi-LLM AI Generation
  getQuestions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/questions?${query}`, { headers: getHeaders() });
    return res.json();
  },
  createQuestion: async (data) => {
    const res = await fetch(`${API_BASE}/questions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateQuestion: async (id, data) => {
    const res = await fetch(`${API_BASE}/questions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteQuestion: async (id) => {
    const res = await fetch(`${API_BASE}/questions/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },
  generateAIQuestions: async (data) => {
    const res = await fetch(`${API_BASE}/questions/generate-ai`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  bulkSaveQuestions: async (data) => {
    const res = await fetch(`${API_BASE}/questions/bulk-save`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // AI Psychometric & Talent Intelligence Module
  getPsychometricTests: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/psychometric/tests?${query}`, { headers: getHeaders() });
    return res.json();
  },
  getPsychometricTestById: async (id = 'default') => {
    const res = await fetch(`${API_BASE}/psychometric/tests/${id}`, { headers: getHeaders() });
    return res.json();
  },
  createPsychometricTest: async (data) => {
    const res = await fetch(`${API_BASE}/psychometric`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updatePsychometricTest: async (id, data) => {
    const res = await fetch(`${API_BASE}/psychometric/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  togglePsychometricTestStatus: async (id) => {
    const res = await fetch(`${API_BASE}/psychometric/${id}/toggle`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    return res.json();
  },
  deletePsychometricTest: async (id) => {
    const res = await fetch(`${API_BASE}/psychometric/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },
  generateDynamicAIQuestions: async (data) => {
    const res = await fetch(`${API_BASE}/psychometric/admin/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  generateMissingAIQuestions: async (data) => {
    const res = await fetch(`${API_BASE}/psychometric/admin/generate-missing`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getBlueprintPreview: async (data) => {
    const res = await fetch(`${API_BASE}/psychometric/admin/blueprint-preview`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  generate50AIQuestions: async (data) => {
    const res = await fetch(`${API_BASE}/psychometric/admin/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ...data, questionCount: data.questionCount || 50 })
    });
    return res.json();
  },
  submitPsychometricAttempt: async (testId, data) => {
    const targetUrl = testId ? `${API_BASE}/psychometric/${testId}/attempt` : `${API_BASE}/psychometric/attempt`;
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getStudentAttempts: async () => {
    const res = await fetch(`${API_BASE}/psychometric/attempts/my`, { headers: getHeaders() });
    return res.json();
  },
  getPsychometricAttemptById: async (id) => {
    const res = await fetch(`${API_BASE}/psychometric/attempts/${id}`, { headers: getHeaders() });
    return res.json();
  },
  getStudentPsychometricProfile: async (testId) => {
    const url = testId ? `${API_BASE}/psychometric/profile?testId=${encodeURIComponent(testId)}` : `${API_BASE}/psychometric/profile`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },
  getPsychometricAdminSummary: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/psychometric/admin/summary?${query}`, { headers: getHeaders() });
    return res.json();
  },
  // Legacy compatibility
  getPsychometricQuestions: async () => {
    const res = await fetch(`${API_BASE}/ai/psychometric/questions`, { headers: getHeaders() });
    return res.json();
  },
  evaluatePsychometric: async (data) => {
    const res = await fetch(`${API_BASE}/psychometric/attempt`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  createPsychometricQuestion: async (data) => {
    const res = await fetch(`${API_BASE}/ai/psychometric/admin/create-question`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  generateAIPsychometricQuestions: async (data) => {
    const res = await fetch(`${API_BASE}/ai/psychometric/admin/generate-ai-questions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deletePsychometricQuestion: async (id) => {
    const res = await fetch(`${API_BASE}/ai/psychometric/admin/question/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // AI Submodule Adaptive Assessment
  generateSubmoduleAIAssessment: async (data) => {
    const res = await fetch(`${API_BASE}/ai/generate-assessment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Analytics & Reports
  getAdminAnalytics: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/analytics/admin?${query}`, { headers: getHeaders() });
    return res.json();
  },
  getStudentAnalytics: async () => {
    const res = await fetch(`${API_BASE}/analytics/student`, { headers: getHeaders() });
    return res.json();
  },
  getExportReportUrl: (department = 'EXTC', batch = '2026') => {
    const token = localStorage.getItem('mitra_token');
    return `${API_BASE}/reports/export?department=${department}&batch=${batch}&token=${token}`;
  },
  downloadStudentReport: async (params = {}, format = 'xlsx') => {
    const token = localStorage.getItem('mitra_token');
    const query = new URLSearchParams({
      type: 'students',
      format,
      ...params,
      ...(token ? { token } : {})
    }).toString();

    const res = await fetch(`${API_BASE}/reports/export?${query}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      let errMsg = 'Export failed';
      try {
        const err = await res.json();
        errMsg = err.message || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedDept = (params.department || 'All').replace(/\s+/g, '_');
    const sanitizedBatch = params.batch || 'All';
    a.download = `MITRA_Students_${sanitizedDept}_${sanitizedBatch}_${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // AI Communication Assessment
  startCommunicationAssessment: async (data) => {
    const res = await fetch(`${API_BASE}/communication/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  respondCommunicationAssessment: async (data) => {
    const res = await fetch(`${API_BASE}/communication/respond`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  evaluateCommunicationAssessment: async (data) => {
    const res = await fetch(`${API_BASE}/communication/evaluate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getCommunicationHistory: async () => {
    const res = await fetch(`${API_BASE}/communication/history`, {
      headers: getHeaders()
    });
    return res.json();
  },
  getCommunicationAttempt: async (id) => {
    const res = await fetch(`${API_BASE}/communication/attempt/${id}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Support & Suggestions Module
  submitSupportFeedback: async (data) => {
    const res = await fetch(`${API_BASE}/support`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getMySupportFeedback: async () => {
    const res = await fetch(`${API_BASE}/support/my`, {
      headers: getHeaders()
    });
    return res.json();
  },
  getSupportFeedbackById: async (id) => {
    const res = await fetch(`${API_BASE}/support/${id}`, {
      headers: getHeaders()
    });
    return res.json();
  },
  getAdminSupportFeedback: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/support/admin/all?${query}`, {
      headers: getHeaders()
    });
    return res.json();
  },
  getAdminSupportStats: async () => {
    const res = await fetch(`${API_BASE}/support/admin/stats`, {
      headers: getHeaders()
    });
    return res.json();
  },
  updateAdminSupportFeedback: async (id, data) => {
    const res = await fetch(`${API_BASE}/support/admin/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteAdminSupportFeedback: async (id) => {
    const res = await fetch(`${API_BASE}/support/admin/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },
  downloadSupportExcel: async (params = {}) => {
    const token = localStorage.getItem('mitra_token');
    const cleanParams = { ...params };
    if (token) cleanParams.token = token;
    const query = new URLSearchParams(cleanParams).toString();

    const res = await fetch(`${API_BASE}/support/admin/export?${query}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      let errMsg = 'Export failed';
      try {
        const err = await res.json();
        errMsg = err.message || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Determine filename
    const dept = (params.department || 'All').replace(/[\s/\\?%*:|"<>]+/g, '_');
    const batch = (params.batch || 'All').replace(/[\s/\\?%*:|"<>]+/g, '_');
    let exportName = 'Support_Feedback_Report.xlsx';
    if (dept === 'All' && batch === 'All') {
      exportName = 'Support_Feedback_All_Departments_All_Batches.xlsx';
    } else if (dept !== 'All' && batch !== 'All') {
      exportName = `Support_Feedback_${dept}_${batch}.xlsx`;
    } else if (dept !== 'All' && batch === 'All') {
      exportName = `Support_Feedback_${dept}_All_Batches.xlsx`;
    } else if (dept === 'All' && batch !== 'All') {
      exportName = `Support_Feedback_All_Departments_${batch}.xlsx`;
    }

    a.download = exportName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};

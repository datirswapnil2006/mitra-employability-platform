const rawBase = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '');
export const API_BASE = rawBase.endsWith('/api')
  ? rawBase
  : (rawBase === '' ? '/api' : `${rawBase}/api`);

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
  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
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

  // AI Psychometric Profiling & Evaluation
  getPsychometricQuestions: async () => {
    const res = await fetch(`${API_BASE}/ai/psychometric/questions`, { headers: getHeaders() });
    return res.json();
  },
  evaluatePsychometric: async (data) => {
    const res = await fetch(`${API_BASE}/ai/psychometric/evaluate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getStudentPsychometricProfile: async () => {
    const res = await fetch(`${API_BASE}/ai/psychometric/profile`, { headers: getHeaders() });
    return res.json();
  },
  getPsychometricAdminSummary: async () => {
    const res = await fetch(`${API_BASE}/ai/psychometric/admin/summary`, { headers: getHeaders() });
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
  }
};

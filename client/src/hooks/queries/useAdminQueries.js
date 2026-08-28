import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export const ADMIN_KEYS = {
  all: ['admin'],
  students: (params) => [...ADMIN_KEYS.all, 'students', params || {}],
  assessments: () => [...ADMIN_KEYS.all, 'assessments'],
  attempts: (params) => [...ADMIN_KEYS.all, 'attempts', params || {}],
  questions: (params) => [...ADMIN_KEYS.all, 'questions', params || {}],
  analytics: (params) => [...ADMIN_KEYS.all, 'analytics', params || {}],
  supportStats: () => [...ADMIN_KEYS.all, 'support-stats'],
  supportFeedback: (params) => [...ADMIN_KEYS.all, 'support-feedback', params || {}],
  psychometricSummary: (params) => [...ADMIN_KEYS.all, 'psychometric-summary', params || {}],
};

export function useAdminStudents(params = {}, options = {}) {
  return useQuery({
    queryKey: ADMIN_KEYS.students(params),
    queryFn: () => api.getAllStudentsAdmin(params),
    ...options,
  });
}

export function useAdminAssessments(options = {}) {
  return useQuery({
    queryKey: ADMIN_KEYS.assessments(),
    queryFn: () => api.getAllAssessmentsAdmin(),
    ...options,
  });
}

export function useAdminAttempts(params = {}, options = {}) {
  return useQuery({
    queryKey: ADMIN_KEYS.attempts(params),
    queryFn: () => api.getAllAttemptsAdmin(params),
    ...options,
  });
}

export function useAdminQuestions(params = {}, options = {}) {
  return useQuery({
    queryKey: ADMIN_KEYS.questions(params),
    queryFn: () => api.getQuestions(params),
    ...options,
  });
}

export function useAdminAnalytics(params = {}, options = {}) {
  return useQuery({
    queryKey: ADMIN_KEYS.analytics(params),
    queryFn: () => api.getAdminAnalytics(params),
    ...options,
  });
}

export function useAdminSupportStats(options = {}) {
  return useQuery({
    queryKey: ADMIN_KEYS.supportStats(),
    queryFn: () => api.getAdminSupportStats(),
    ...options,
  });
}

export function useAdminSupportFeedback(params = {}, options = {}) {
  return useQuery({
    queryKey: ADMIN_KEYS.supportFeedback(params),
    queryFn: () => api.getAdminSupportFeedback(params),
    ...options,
  });
}

export function useAdminPsychometricSummary(params = {}, options = {}) {
  return useQuery({
    queryKey: ADMIN_KEYS.psychometricSummary(params),
    queryFn: () => api.getPsychometricAdminSummary(params),
    ...options,
  });
}

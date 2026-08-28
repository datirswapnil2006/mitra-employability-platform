import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export const ASSESSMENT_KEYS = {
  all: ['assessments'],
  list: (params) => [...ASSESSMENT_KEYS.all, 'list', params || {}],
  detail: (id) => [...ASSESSMENT_KEYS.all, 'detail', id],
  studentAttempts: () => [...ASSESSMENT_KEYS.all, 'student-attempts'],
  attemptResult: (id) => [...ASSESSMENT_KEYS.all, 'attempt-result', id],
  psychometricTests: (params) => ['psychometric', 'tests', params || {}],
  psychometricTest: (id) => ['psychometric', 'test', id],
  psychometricProfile: (testId) => ['psychometric', 'profile', testId],
  psychometricAttempts: () => ['psychometric', 'attempts'],
};

export function useAssessments(params = {}, options = {}) {
  return useQuery({
    queryKey: ASSESSMENT_KEYS.list(params),
    queryFn: () => api.getAssessments(params),
    ...options,
  });
}

export function useAssessmentDetail(id, options = {}) {
  return useQuery({
    queryKey: ASSESSMENT_KEYS.detail(id),
    queryFn: () => api.getAssessmentById(id),
    enabled: !!id,
    ...options,
  });
}

export function useStudentAttempts(options = {}) {
  return useQuery({
    queryKey: ASSESSMENT_KEYS.studentAttempts(),
    queryFn: () => api.getStudentAttempts(),
    ...options,
  });
}

export function useAssessmentAttemptResult(id, options = {}) {
  return useQuery({
    queryKey: ASSESSMENT_KEYS.attemptResult(id),
    queryFn: () => api.getAttemptById(id),
    enabled: !!id,
    ...options,
  });
}

export function usePsychometricTests(params = {}, options = {}) {
  return useQuery({
    queryKey: ASSESSMENT_KEYS.psychometricTests(params),
    queryFn: () => api.getPsychometricTests(params),
    ...options,
  });
}

export function usePsychometricTestDetail(id, options = {}) {
  return useQuery({
    queryKey: ASSESSMENT_KEYS.psychometricTest(id),
    queryFn: () => api.getPsychometricTestById(id),
    enabled: !!id,
    ...options,
  });
}

export function useStudentPsychometricProfile(testId, options = {}) {
  return useQuery({
    queryKey: ASSESSMENT_KEYS.psychometricProfile(testId),
    queryFn: () => api.getStudentPsychometricProfile(testId),
    ...options,
  });
}

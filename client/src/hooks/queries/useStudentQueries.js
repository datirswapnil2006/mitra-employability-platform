import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export const STUDENT_KEYS = {
  all: ['student'],
  profile: () => [...STUDENT_KEYS.all, 'profile'],
  overallProgress: () => [...STUDENT_KEYS.all, 'overall-progress'],
  analytics: () => [...STUDENT_KEYS.all, 'analytics'],
  supportFeedback: () => [...STUDENT_KEYS.all, 'support-feedback'],
  supportFeedbackDetail: (id) => [...STUDENT_KEYS.all, 'support-feedback', id],
  communicationHistory: () => [...STUDENT_KEYS.all, 'communication-history'],
};

export function useStudentProfile(options = {}) {
  return useQuery({
    queryKey: STUDENT_KEYS.profile(),
    queryFn: async () => {
      const res = await api.getProfile();
      return res;
    },
    ...options,
  });
}

export function useStudentOverallProgress(options = {}) {
  return useQuery({
    queryKey: STUDENT_KEYS.overallProgress(),
    queryFn: async () => {
      const res = await api.getOverallProgress();
      return res;
    },
    ...options,
  });
}

export function useStudentAnalytics(options = {}) {
  return useQuery({
    queryKey: STUDENT_KEYS.analytics(),
    queryFn: async () => {
      const res = await api.getStudentAnalytics();
      return res;
    },
    ...options,
  });
}

export function useStudentSupportFeedback(options = {}) {
  return useQuery({
    queryKey: STUDENT_KEYS.supportFeedback(),
    queryFn: async () => {
      const res = await api.getMySupportFeedback();
      return res;
    },
    ...options,
  });
}

export function useCommunicationHistory(options = {}) {
  return useQuery({
    queryKey: STUDENT_KEYS.communicationHistory(),
    queryFn: async () => {
      const res = await api.getCommunicationHistory();
      return res;
    },
    ...options,
  });
}

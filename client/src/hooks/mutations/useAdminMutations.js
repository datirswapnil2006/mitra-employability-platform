import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { ADMIN_KEYS } from '../queries/useAdminQueries';

export function useAdminResetStudentPassword() {
  return useMutation({
    mutationFn: (userId) => api.adminResetStudentPassword(userId),
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.createAssessment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.assessments() });
    },
  });
}

export function useUpdateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.updateAssessment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.assessments() });
    },
  });
}

export function useDeleteAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.deleteAssessment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.assessments() });
    },
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.createQuestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.questions({}) });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.updateQuestion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.questions({}) });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.questions({}) });
    },
  });
}

export function useUpdateAdminSupportFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.updateAdminSupportFeedback(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.supportFeedback({}) });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.supportStats() });
    },
  });
}

export function useDeleteAdminSupportFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.deleteAdminSupportFeedback(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.supportFeedback({}) });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.supportStats() });
    },
  });
}

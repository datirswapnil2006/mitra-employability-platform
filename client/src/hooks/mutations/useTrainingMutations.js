import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { TRAINING_KEYS } from '../queries/useTrainingQueries';
import { STUDENT_KEYS } from '../queries/useStudentQueries';

export function useMarkContentComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contentId) => api.markContentComplete(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: STUDENT_KEYS.overallProgress() });
    },
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.createModule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
    },
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.createTopic(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
    },
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.updateTopic(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.deleteTopic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
    },
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
    },
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.createContent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
    },
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.updateContent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.deleteContent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { STUDENT_KEYS } from '../queries/useStudentQueries';

export function useUpdateStudentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileData) => api.updateProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENT_KEYS.profile() });
    },
  });
}

export function useUploadStudentProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoData) => api.uploadProfilePhoto(photoData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENT_KEYS.profile() });
    },
  });
}

export function useSubmitSupportFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedbackData) => api.submitSupportFeedback(feedbackData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENT_KEYS.supportFeedback() });
    },
  });
}

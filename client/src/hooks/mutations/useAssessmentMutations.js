import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { ASSESSMENT_KEYS } from '../queries/useAssessmentQueries';
import { STUDENT_KEYS } from '../queries/useStudentQueries';

export function useSubmitAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.submitAssessment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSESSMENT_KEYS.studentAttempts() });
      queryClient.invalidateQueries({ queryKey: STUDENT_KEYS.overallProgress() });
      queryClient.invalidateQueries({ queryKey: STUDENT_KEYS.analytics() });
    },
  });
}

export function useSubmitPsychometricAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ testId, data }) => api.submitPsychometricAttempt(testId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ASSESSMENT_KEYS.psychometricAttempts() });
      if (variables?.testId) {
        queryClient.invalidateQueries({ queryKey: ASSESSMENT_KEYS.psychometricProfile(variables.testId) });
      }
    },
  });
}

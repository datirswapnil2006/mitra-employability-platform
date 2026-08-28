import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export const TRAINING_KEYS = {
  all: ['training'],
  modules: (params) => [...TRAINING_KEYS.all, 'modules', params || {}],
  categories: (params) => [...TRAINING_KEYS.all, 'categories', params || {}],
  category: (id) => [...TRAINING_KEYS.all, 'category', id],
  companies: (params) => [...TRAINING_KEYS.all, 'companies', params || {}],
  company: (id) => [...TRAINING_KEYS.all, 'company', id],
  topics: (params) => [...TRAINING_KEYS.all, 'topics', params || {}],
  topic: (id) => [...TRAINING_KEYS.all, 'topic', id],
  submodules: (moduleId) => [...TRAINING_KEYS.all, 'submodules', moduleId],
  contentList: (params) => [...TRAINING_KEYS.all, 'content-list', params || {}],
  submoduleProgress: (submoduleId) => [...TRAINING_KEYS.all, 'submodule-progress', submoduleId],
};

export function useTrainingModules(params = {}, options = {}) {
  return useQuery({
    queryKey: TRAINING_KEYS.modules(params),
    queryFn: () => api.getModules(params),
    ...options,
  });
}

export function useTrainingCategories(params = {}, options = {}) {
  return useQuery({
    queryKey: TRAINING_KEYS.categories(params),
    queryFn: () => api.getCategories(params),
    ...options,
  });
}

export function useTrainingCompanies(params = {}, options = {}) {
  return useQuery({
    queryKey: TRAINING_KEYS.companies(params),
    queryFn: () => api.getCompanies(params),
    ...options,
  });
}

export function useTrainingTopics(params = {}, options = {}) {
  return useQuery({
    queryKey: TRAINING_KEYS.topics(params),
    queryFn: () => api.getTopics(params),
    ...options,
  });
}

export function useTrainingSubmodules(moduleId, options = {}) {
  return useQuery({
    queryKey: TRAINING_KEYS.submodules(moduleId),
    queryFn: () => api.getSubmodules(moduleId),
    enabled: !!moduleId,
    ...options,
  });
}

export function useTrainingContentList(params = {}, options = {}) {
  return useQuery({
    queryKey: TRAINING_KEYS.contentList(params),
    queryFn: () => api.getContentList(params),
    ...options,
  });
}

export function useSubmoduleProgress(submoduleId, options = {}) {
  return useQuery({
    queryKey: TRAINING_KEYS.submoduleProgress(submoduleId),
    queryFn: () => api.getSubmoduleProgress(submoduleId),
    enabled: !!submoduleId,
    ...options,
  });
}

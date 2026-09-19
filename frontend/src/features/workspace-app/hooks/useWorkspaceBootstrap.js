import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getWorkspaceBootstrap } from '../api/workspaceApi';

export function useWorkspaceBootstrap(teamId, options = {}) {
  return useQuery({
    queryKey: queryKeys.workspace.bootstrap(teamId),
    queryFn: () => getWorkspaceBootstrap(teamId),
    enabled: Boolean(teamId),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
    ...options,
  });
}

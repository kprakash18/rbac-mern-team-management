import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getPermissionCatalog } from '../api/permissionsApi';

export function usePermissionCatalog(options = {}) {
  return useQuery({
    queryKey: queryKeys.permissions.catalog(),
    queryFn: getPermissionCatalog,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}

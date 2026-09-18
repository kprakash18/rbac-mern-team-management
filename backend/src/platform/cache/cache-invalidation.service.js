import { delCachePattern, invalidateUserAuthCache } from "../../config/redis.js";
import { invalidateUserPermissionCache } from "../../modules/authorization/authorization.service.js";

function warn(err) {
  if (err?.message) {
    console.warn("[Redis] Cache invalidation warning:", err.message);
  }
}

function fireAndForget(tasks) {
  for (const task of tasks) {
    Promise.resolve()
      .then(task)
      .catch(warn);
  }
}

export function invalidateTeamData(teamId) {
  if (!teamId) return;
  fireAndForget([
    () => delCachePattern("teams:list:*"),
    () => delCachePattern("teams:user:*"),
    () => delCachePattern(`teams:bootstrap:${teamId}:*`),
  ]);
}

export function invalidateUserWorkspaceData(userId) {
  if (!userId) return;
  fireAndForget([
    () => delCachePattern(`teams:user:${userId}`),
    () => invalidateUserAuthCache(userId),
  ]);
}

export function invalidateMembershipAccess({ userId, teamId }) {
  fireAndForget([
    () => teamId ? delCachePattern(`teams:bootstrap:${teamId}:*`) : null,
    () => userId ? delCachePattern(`teams:user:${userId}`) : null,
    () => delCachePattern("teams:list:*"),
    () => userId || teamId ? invalidateUserPermissionCache(userId, teamId) : null,
  ]);
}

export function invalidateRoleAssignment({ userId, teamId }) {
  invalidateMembershipAccess({ userId, teamId });
}

export function invalidateUserAccount(userId) {
  if (!userId) return;
  fireAndForget([
    () => delCachePattern("users:*"),
    () => delCachePattern("teams:*"),
    () => invalidateUserAuthCache(userId),
    () => invalidateUserPermissionCache(userId),
  ]);
}

export const cacheInvalidationService = {
  invalidateTeamData,
  invalidateUserWorkspaceData,
  invalidateMembershipAccess,
  invalidateRoleAssignment,
  invalidateUserAccount,
};

export default cacheInvalidationService;

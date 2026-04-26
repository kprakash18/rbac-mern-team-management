const normalizePermission = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const hasPermission = (permissions, candidates) => {
  const normalizedPermissions = permissions.map((permission) =>
    normalizePermission(permission.name || permission)
  );

  return candidates.some((candidate) =>
    normalizedPermissions.includes(normalizePermission(candidate))
  );
};

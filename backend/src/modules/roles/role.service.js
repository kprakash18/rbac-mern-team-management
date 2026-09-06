import mongoose from "mongoose";
import Role from "./role.model.js";
import RolePermission from "./role-permission.model.js";
import Permission from "../permissions/permission.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import { logAuditEvent } from "../audit/audit.service.js";
import { BadRequestError, NotFoundError, ConflictError } from "../../common/errors/index.js";

const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(id);

export async function createRole({ name, description = "", permissionIds = [], createdBy }) {
  if (!name || typeof name !== "string" || !name.trim()) throw new BadRequestError("Role name is required");
  const normalizedName = name.trim();

  const exists = await Role.findOne({ name: normalizedName, status: { $ne: "ARCHIVED" } });
  if (exists) throw new ConflictError("A role with this name already exists");

  let permissionKeys = [];
  if (permissionIds.length > 0) {
    const validPerms = await Permission.find({ _id: { $in: permissionIds } });
    if (validPerms.length !== permissionIds.length) throw new BadRequestError("One or more permission IDs are invalid.");
    permissionKeys = validPerms.map((p) => p.key);
  }

  const role = await Role.create({
    name: normalizedName,
    description: description.trim(),
    createdBy,
    isSystemRole: false,
    status: "ACTIVE",
    permissions: permissionKeys,
  });

  if (permissionIds.length > 0) {
    await RolePermission.insertMany(permissionIds.map((pId) => ({ roleId: role._id, permissionId: pId, assignedBy: createdBy })));
  }

  logAuditEvent({
    actorId: createdBy,
    action: "role.created",
    targetType: "Role",
    targetId: role._id,
    metadata: { name: role.name, permissionsCount: permissionIds.length },
  });

  return getRoleById(role._id);
}

export async function listRoles({ status } = {}) {
  const filter = {};
  if (status && status.toLowerCase() !== "all") filter.status = status.toUpperCase();
  else if (!status) filter.status = { $ne: "ARCHIVED" };

  const roles = await Role.find(filter).sort({ isSystemRole: -1, name: 1 });
  const roleIds = roles.map((r) => r._id);

  const [rolePermissions, memberRoles] = await Promise.all([
    RolePermission.find({ roleId: { $in: roleIds } }).populate("permissionId", "key resource action category description"),
    MembershipRole.find({ roleId: { $in: roleIds }, revokedAt: null, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] })
      .populate({ path: "membershipId", populate: [{ path: "userId", select: "name email avatar" }, { path: "teamId", select: "name" }] }),
  ]);

  const permMap = new Map();
  for (const rp of rolePermissions) {
    const rId = String(rp.roleId);
    if (!permMap.has(rId)) permMap.set(rId, []);
    if (rp.permissionId) permMap.get(rId).push(rp.permissionId);
  }

  const roleMembersMap = new Map();
  for (const mr of memberRoles) {
    const rId = String(mr.roleId);
    if (!roleMembersMap.has(rId)) roleMembersMap.set(rId, []);
    if (mr.membershipId?.userId) {
      roleMembersMap.get(rId).push({
        id: mr.membershipId.userId._id,
        name: mr.membershipId.userId.name,
        email: mr.membershipId.userId.email,
        workspace: mr.membershipId.teamId?.name || "Workspace",
        assignedAt: mr.assignedAt,
        expiresAt: mr.expiresAt,
      });
    }
  }

  return roles.map((role) => {
    const assignedList = roleMembersMap.get(String(role._id)) || [];
    return {
      ...role.toObject(),
      permissions: permMap.get(String(role._id)) || [],
      assignedUsers: assignedList,
      membersCount: assignedList.length,
    };
  });
}

export async function getRoleById(roleId) {
  if (!isValidId(roleId)) throw new NotFoundError("Role not found.");
  const role = await Role.findById(roleId);
  if (!role || role.status === "ARCHIVED") throw new NotFoundError("Role not found.");

  const rolePermissions = await RolePermission.find({ roleId: role._id }).populate("permissionId", "key resource action category description");
  return {
    ...role.toObject(),
    permissions: rolePermissions.filter((rp) => rp.permissionId).map((rp) => rp.permissionId),
  };
}

export async function updateRole(roleId, { name, description, status, permissionIds }, actorId) {
  if (!isValidId(roleId)) throw new NotFoundError("Role not found.");
  const role = await Role.findById(roleId);
  if (!role || role.status === "ARCHIVED") throw new NotFoundError("Role not found.");
  if (role.isSystemRole) throw new BadRequestError("System roles cannot be modified or deleted.");

  if (name && name.trim() !== role.name) {
    const exists = await Role.findOne({ name: name.trim(), _id: { $ne: role._id }, status: { $ne: "ARCHIVED" } });
    if (exists) throw new ConflictError("A role with this name already exists.");
    role.name = name.trim();
  }
  if (description !== undefined) role.description = description.trim();
  if (status !== undefined) {
    if (!["ACTIVE", "DISABLED"].includes(status)) throw new BadRequestError("Invalid status. Allowed values: ACTIVE, DISABLED.");
    role.status = status;
  }

  if (permissionIds !== undefined && Array.isArray(permissionIds)) {
    let validPerms = [];
    if (permissionIds.length > 0) {
      validPerms = await Permission.find({ _id: { $in: permissionIds } });
      if (validPerms.length !== permissionIds.length) throw new BadRequestError("One or more permission IDs are invalid.");
    }
    role.permissions = validPerms.map((p) => p.key);

    const currentMappings = await RolePermission.find({ roleId: role._id });
    const currentPermStrs = currentMappings.map((m) => String(m.permissionId));
    const nextPermStrs = permissionIds.map(String);
    const removedPermIds = currentPermStrs.filter((id) => !nextPermStrs.includes(id));

    if (removedPermIds.length > 0) {
      const activeCount = await MembershipRole.countDocuments({
        roleId: role._id,
        revokedAt: null,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      });
      if (activeCount > 0) {
        throw new BadRequestError(
          `Cannot remove permission(s) from role "${role.name}" because it is currently assigned to ${activeCount} active user(s). Please reassign or unassign active members before removing permissions.`,
          "ACTIVE_USERS_HOLD_PERMISSION"
        );
      }
      await RolePermission.deleteMany({ roleId: role._id, permissionId: { $in: removedPermIds } });
    }

    const toAddPermIds = nextPermStrs.filter((id) => !currentPermStrs.includes(id));
    if (toAddPermIds.length > 0) {
      await RolePermission.insertMany(toAddPermIds.map((pId) => ({ roleId: role._id, permissionId: pId, assignedBy: actorId })));
    }
  }

  await role.save();

  logAuditEvent({
    actorId,
    action: "role.updated",
    targetType: "Role",
    targetId: role._id,
    metadata: { name: role.name, updates: { name, description, permissionIds } },
  });

  return getRoleById(role._id);
}

export async function deleteRole(roleId, { reassignToRoleId, reassignedBy } = {}) {
  if (!isValidId(roleId)) throw new NotFoundError("Role not found.");
  const role = await Role.findById(roleId);
  if (!role || role.status === "ARCHIVED") throw new NotFoundError("Role not found.");
  if (role.isSystemRole) throw new BadRequestError("System roles cannot be modified or deleted.");

  const activeAssignments = await MembershipRole.find({
    roleId: role._id,
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });

  let reassignedCount = 0;
  if (activeAssignments.length > 0) {
    if (!reassignToRoleId || !isValidId(reassignToRoleId)) {
      throw new BadRequestError(
        `Cannot delete role "${role.name}" because it is currently assigned to ${activeAssignments.length} active user(s). Please specify a replacement role to reassign active members.`,
        "ACTIVE_MEMBERS_ASSIGNED"
      );
    }
    const targetRole = await Role.findById(reassignToRoleId);
    if (!targetRole || targetRole.status === "ARCHIVED") throw new BadRequestError("Destination replacement role is invalid or archived.");

    for (const assignment of activeAssignments) {
      assignment.roleId = targetRole._id;
      assignment.assignedBy = reassignedBy || assignment.assignedBy;
      assignment.assignedAt = new Date();
      await assignment.save();
    }
    reassignedCount = activeAssignments.length;
  }

  role.status = "ARCHIVED";
  await role.save();

  logAuditEvent({
    actorId: reassignedBy,
    action: "role.archived",
    targetType: "Role",
    targetId: role._id,
    metadata: { name: role.name, reassignedCount },
  });

  return { success: true, message: "Role archived successfully.", reassignedCount };
}

export const roleService = {
  createRole,
  listRoles,
  getRoleById,
  updateRole,
  deleteRole,
};

export default roleService;

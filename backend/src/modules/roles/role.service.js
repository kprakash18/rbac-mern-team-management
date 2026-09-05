import Role from "./role.model.js";
import RolePermission from "./role-permission.model.js";
import Permission from "../permissions/permission.model.js";
import MembershipRole from "../member-roles/member-role.model.js";
import Membership from "../memberships/membership.model.js";
import User from "../users/user.model.js";
import Team from "../teams/team.model.js";
import { logAuditEvent } from "../audit/audit.service.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../../common/errors/index.js";
import mongoose from "mongoose";

export async function createRole({name, description="", permissionIds = [], createdBy }){

    if(!name || typeof name !== "string" || name.trim().length === 0){
        throw new BadRequestError("Role name is required");
    }
    const normalizedRoleName = name.trim();

    // 1. check if the role already exist
    const DoesRoleExist = await Role.findOne({
        name : normalizedRoleName,
        status: {$ne: "ARCHIVED"},
    });

    if(DoesRoleExist){
        throw new ConflictError("A role with this name already exsists");
    }
    // 2. validate permissions Ids if supplied
   if (permissionIds.length > 0) {
        const validPermissions = await Permission.find({ _id: { $in: permissionIds } });
    if (validPermissions.length !== permissionIds.length) {
        throw new BadRequestError("One or more permission IDs are invalid.");
    }
  }

  // 3 create the role 
  const role = await Role.create({
    name : normalizedRoleName,
    description: description.trim(),
    createdBy,
    isSystemRole: false,
    status: "ACTIVE",
  });

  // 4. create RolePermission junction record
  if (permissionIds.length > 0) {
    const junctionDocs = permissionIds.map((permissionId) => ({
      roleId: role._id,
      permissionId,
      assignedBy: createdBy,
    }));
    await RolePermission.insertMany(junctionDocs);
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

export async function listRoles({ status } = {}){
    const filter = {};
    if (status && status.toLowerCase() !== "all") {
        filter.status = status.toUpperCase();
    } else if (!status) {
        filter.status = { $ne: "ARCHIVED"};
    }

    const roles = await Role.find(filter).sort({isSystemRole: -1, name:1});
    const roleIds = roles.map((r) => r._id);

    // fetch all attached permissions for these roles
    const rolePermissions = await RolePermission.find({
        roleId: { $in: roleIds },
    }).populate("permissionId", "key resource action category description");

    // map permissions to their respective roles
    const permMap = new Map();
    for(const rp of rolePermissions){
        const rIdStr = rp.roleId.toString();
        if(!permMap.has(rIdStr)) permMap.set(rIdStr, []);
        if(rp.permissionId) permMap.get(rIdStr).push(rp.permissionId);
    }

    // fetch active members assigned to these roles
    const memberRoles = await MembershipRole.find({
      roleId: { $in: roleIds },
      revokedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).populate({
      path: "membershipId",
      populate: [
        { path: "userId", select: "name email avatar" },
        { path: "teamId", select: "name" },
      ],
    });

    const roleMembersMap = new Map();
    for (const mr of memberRoles) {
      const rIdStr = mr.roleId.toString();
      if (!roleMembersMap.has(rIdStr)) roleMembersMap.set(rIdStr, []);
      if (mr.membershipId?.userId) {
        roleMembersMap.get(rIdStr).push({
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
        const assignedList = roleMembersMap.get(role._id.toString()) || [];
        return {
          ...role.toObject(),
          permissions: permMap.get(role._id.toString()) || [],
          assignedUsers: assignedList,
          membersCount: assignedList.length,
        };
    });
} 

export async function getRoleById(roleId) {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    throw new NotFoundError("Role not found.");
  }
  const role = await Role.findById(roleId);
  if (!role || role.status === "ARCHIVED") {
    throw new NotFoundError("Role not found.");
  }
  const rolePermissions = await RolePermission.find({ roleId: role._id }).populate(
    "permissionId",
    "key resource action category description"
  );
  return {
    ...role.toObject(),
    permissions: rolePermissions
      .filter((rp) => rp.permissionId)
      .map((rp) => rp.permissionId),
  };
}
export async function updateRole(roleId, { name, description, status, permissionIds }, actorId) {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    throw new NotFoundError("Role not found.");
  }
  const role = await Role.findById(roleId);
  if (!role || role.status === "ARCHIVED") {
    throw new NotFoundError("Role not found.");
  }
  // System Role Protection — if role.isSystemRole is true, throw BadRequestError
  if (role.isSystemRole) {
    throw new BadRequestError("System roles cannot be modified or deleted.");
  }

  if (name && name.trim() !== role.name) {
    const existingRole = await Role.findOne({
      name: name.trim(),
      _id: { $ne: role._id },
      status: { $ne: "ARCHIVED" },
    });
    if (existingRole) {
      throw new ConflictError("A role with this name already exists.");
    }
    role.name = name.trim();
  }
  if (description !== undefined) {
    role.description = description.trim();
  }
  if (status !== undefined) {
    if (!["ACTIVE", "DISABLED"].includes(status)) {
      throw new BadRequestError("Invalid status. Allowed values: ACTIVE, DISABLED.");
    }
    role.status = status;
  }
  await role.save();

  // If permissionIds is provided, synchronize permissions with active-user guardrail
  if (permissionIds !== undefined && Array.isArray(permissionIds)) {
    // 1. Validate all incoming permission IDs exist
    if (permissionIds.length > 0) {
      const validPermissions = await Permission.find({ _id: { $in: permissionIds } });
      if (validPermissions.length !== permissionIds.length) {
        throw new BadRequestError("One or more permission IDs are invalid.");
      }
    }

    // 2. Fetch current permissions mapped to this role
    const currentMappings = await RolePermission.find({ roleId: role._id });
    const currentPermIdStrs = currentMappings.map((m) => m.permissionId.toString());
    const nextPermIdStrs = permissionIds.map((id) => id.toString());

    // 3. Find permissions being removed
    const removedPermIds = currentPermIdStrs.filter((id) => !nextPermIdStrs.includes(id));

    if (removedPermIds.length > 0) {
      // Guardrail: Check if any active user holds this role
      const activeAssignments = await MembershipRole.find({
        roleId: role._id,
        revokedAt: null,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      });

      if (activeAssignments.length > 0) {
        throw new BadRequestError(
          `Cannot remove permission(s) from role "${role.name}" because it is currently assigned to ${activeAssignments.length} active user(s). Please reassign or unassign active members before removing permissions.`,
          "ACTIVE_USERS_HOLD_PERMISSION"
        );
      }

      // Safe to remove
      await RolePermission.deleteMany({
        roleId: role._id,
        permissionId: { $in: removedPermIds },
      });
    }

    // 4. Add new permissions
    const toAddPermIds = nextPermIdStrs.filter((id) => !currentPermIdStrs.includes(id));
    if (toAddPermIds.length > 0) {
      const junctionDocs = toAddPermIds.map((pId) => ({
        roleId: role._id,
        permissionId: pId,
        assignedBy: actorId,
      }));
      await RolePermission.insertMany(junctionDocs);
    }
  }

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
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    throw new NotFoundError("Role not found.");
  }
  const role = await Role.findById(roleId);
  if (!role || role.status === "ARCHIVED") {
    throw new NotFoundError("Role not found.");
  }
  if (role.isSystemRole) {
    throw new BadRequestError("System roles cannot be modified or deleted.");
  }

  // Check for active assignments
  const activeAssignments = await MembershipRole.find({
    roleId: role._id,
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });

  let reassignedCount = 0;
  if (activeAssignments.length > 0) {
    if (!reassignToRoleId) {
      throw new BadRequestError(
        `Cannot delete role "${role.name}" because it is currently assigned to ${activeAssignments.length} active user(s). Please specify a replacement role to reassign active members.`,
        "ACTIVE_MEMBERS_ASSIGNED"
      );
    }

    if (!mongoose.Types.ObjectId.isValid(reassignToRoleId)) {
      throw new BadRequestError("Invalid replacement role ID.");
    }

    const targetRole = await Role.findById(reassignToRoleId);
    if (!targetRole || targetRole.status === "ARCHIVED") {
      throw new BadRequestError("Destination replacement role is invalid or archived.");
    }

    // Reassign all active member assignments to targetRole
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

  return {
    success: true,
    message: "Role archived successfully.",
    reassignedCount,
  };
}
export const roleService = {
  createRole,
  listRoles,
  getRoleById,
  updateRole,
  deleteRole,
};
export default roleService;
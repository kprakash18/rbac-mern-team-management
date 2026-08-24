import Role from "./role.model.js";
import RolePermission from "./role-permission.model.js";
import Permission from "../permissions/permission.model.js";
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
  return getRoleById(role._id);
}

export async function listRoles({ status } = {}){
    const filter = {};
    if(status){
        filter.status = status;
    }else{
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

    return roles.map((role) =>({
        ...role.toObject(),
        permissions: permMap.get(role._id.toString()) || [],
    }));
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
export async function updateRole(roleId, { name, description, status }) {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    throw new NotFoundError("Role not found.");
  }
  const role = await Role.findById(roleId);
  if (!role || role.status === "ARCHIVED") {
    throw new NotFoundError("Role not found.");
  }
  // TODO #1: System Role Protection — if role.isSystemRole is true, throw BadRequestError("System roles cannot be modified or deleted.")
  if(role.isSystemRole){
    throw new BadRequestError("System role cannot be modified or deleted");
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
  return getRoleById(role._id);
}
export async function deleteRole(roleId) {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    throw new NotFoundError("Role not found.");
  }
  const role = await Role.findById(roleId);
  if (!role || role.status === "ARCHIVED") {
    throw new NotFoundError("Role not found.");
  }
  // TODO #2: System Role Protection & Soft Archival — verify isSystemRole, set status = "ARCHIVED", and save.
  if(role.isSystemRole){
    throw new BadRequestError("System roles cannot be modified or deleted.");
  }
    role.status = "ARCHIVED",
    await role.save();
    return{
        success: true,
        message: "Role archived successfully",
    }
}
export const roleService = {
  createRole,
  listRoles,
  getRoleById,
  updateRole,
  deleteRole,
};
export default roleService;
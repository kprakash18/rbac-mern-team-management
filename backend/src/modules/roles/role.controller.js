import roleService from "./role.service.js";
import rolePermissionService from "./role-permission.service.js";

export async function createRole (req,res,next){
    try {
        const {name, description, permissionIds } = req.body;
        const role = await roleService.createRole({
            name,
            description,
            permissionIds,
            createdBy: req.user.id,
        });

        return res.status(200).json({
            success: true,
            data: role,
        });
    } catch (error) {
        next(error)
    }
}

export async function getRoles(req,res,next){
    try{
        const {status} = req.query;
        const roles = await roleService.listRoles({status});
        return res.status(200).json({success: true, data: roles, count: roles.length});
    }catch(error){
        next(error);
    }
}

export async function getRoleById(req,res,next){
    try{
        const {roleId} = req.params ;
        const role = await roleService.getRoleById(roleId);
        return res.status(200).json({success: true, data: role});
    }catch(error){
        next(error);
    }
}

export async function updateRole(req,res,next){
    try{
        const {roleId} = req.params;
        const {name,description, status} = req.body;
        const updatdRole = await roleService.updateRole(roleId, {name,description,status});
        return res.status(200).json({success: true, data: updatdRole});
    }catch(error){
        next(error);
    }
}

export async function deleteRole(req, res, next) {
  try {
    const { roleId } = req.params;
    const result = await roleService.deleteRole(roleId);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function addPermissionsToRole(req, res, next) {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body;
    const updatedPermissions = await rolePermissionService.assignPermissionsToRole(
      roleId,
      permissionIds,
      req.user.id
    );
    return res.status(200).json({ success: true, data: updatedPermissions });
  } catch (error) {
    next(error);
  }
}



export async function removePermissionFromRole(req, res, next) {
  try {
    const { roleId, permissionId } = req.params;
    const result = await rolePermissionService.removePermissionFromRole(
      roleId,
      permissionId
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
export async function getRolePermissions(req, res, next) {
  try {
    const { roleId } = req.params;
    const permissions = await rolePermissionService.getPermissionsForRole(roleId);
    return res.status(200).json({ success: true, data: permissions, count: permissions.length });
  } catch (error) {
    next(error);
  }
}
export const roleController = {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  addPermissionsToRole,
  removePermissionFromRole,
  getRolePermissions,
};
 

export default roleController ;
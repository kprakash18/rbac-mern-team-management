import Permission from "./permission.model.js";
import Role from "../roles/role.model.js";
import { NotFoundError, BadRequestError } from "../../common/errors/index.js";
import { getCache, setCache } from "../../config/redis.js";
import VALID_CATEGORIES from "./constants.js";
import mongoose from "mongoose";

export async function listPermissions({ category, scope } = {}){
    const cacheKey = `permissions:list:${category || "all"}:${scope || "all"}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const queryFilter = {};

    if(category){
        const normalizedCategory = category.toUpperCase().trim() ;
        if(!VALID_CATEGORIES.includes(normalizedCategory)){
            throw new BadRequestError(
                `Invalid category '${category}'`
            );
        }
        queryFilter.category = normalizedCategory;
    }

    if (scope === "team" || scope === "team_admin") {
        const teamAdminRole = await Role.findOne({ name: { $in: ["Team Admin", "Admin"] }, status: "ACTIVE" });
        if (teamAdminRole && Array.isArray(teamAdminRole.permissions)) {
            queryFilter.key = { $in: teamAdminRole.permissions };
        }
    }

    const result = await Permission.find(queryFilter).sort({ category: 1, key: 1 });
    await setCache(cacheKey, result, 600);
    return result;
}    
export async function getPermissionById(permissionId) {
  if (!mongoose.Types.ObjectId.isValid(permissionId)) {
    throw new NotFoundError("Permission not found.");
  }

   const permission = await Permission.findById(permissionId);
        if(!permission) {
            throw new NotFoundError("Permission not found");
        };
        return permission; 
}
export async function getPermissionByIds(permissionIds = []){
    if(!Array.isArray(permissionIds) || permissionIds.length === 0){
        return [];
    }

    return Permission.find({_id: {$in: permissionIds} });
}

export const permissionService = {
    listPermissions,
    getPermissionById,
    getPermissionByIds,
};

export default permissionService;

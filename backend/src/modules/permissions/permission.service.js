import Permission from "./permission.model.js";
import { NotFoundError, BadRequestError } from "../../common/errors/index.js";
import VALID_CATEGORIES from "./constants.js";
import mongoose from "mongoose";


export async function listPermissions({ category } = {}){
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

    // TODO #1: Return list of permissions matching queryFilter, sorted by category (1) and key (1)
    return await Permission.find(queryFilter).sort({ category: 1, key: 1 });
}    
export async function getPermissionById(permissionId) {
  if (!mongoose.Types.ObjectId.isValid(permissionId)) {
    throw new NotFoundError("Permission not found.");
  }

   // TODO #2: Query Permission.findById(permissionId). If not found, throw new NotFoundError("Permission not found.")
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
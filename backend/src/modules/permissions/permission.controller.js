import permissionService from "./permission.service.js";

export async function getPermissions(req, res, next){
    try {
        const { category }  = req.query ;
        const permissions = await permissionService.listPermissions({category});
        return res.status(200).json({
            success : true,
            data : permissions,
            count : permissions.length ,
        });
    } catch (error) {
        next(error) ;
    }
}

export async function getPermissionById(req,res,next){
    try {
        const { permissionId } = req.params;
        const permission = await permissionService.getPermissionById(permissionId) ;
        return res.json({
            success : true,
            data: permission
        });
    } catch (error) {
        next(error) ;
    }
}

export const permissionController = {
    getPermissions,
    getPermissionById,
};

export default permissionController ;
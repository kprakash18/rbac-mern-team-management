import { Router } from "express";
import { membershipRoleController } from "./membership-role.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

// mergeParams: true allows accessing :teamId and :userId from parent router
const router = Router({ mergeParams: true });

router.post("/", authenticate, requirePermission("role.assign"), membershipRoleController.assignRole);
router.patch("/:assignmentId", authenticate, requirePermission("role.assign"), membershipRoleController.updateAssignment);
router.delete("/:assignmentId", authenticate, requirePermission("role.revoke"), membershipRoleController.revokeAssignment);
router.get("/", authenticate, requirePermission("role.read"), membershipRoleController.getMemberRoles);


export default router;

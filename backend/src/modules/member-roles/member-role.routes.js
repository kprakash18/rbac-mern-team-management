import { Router } from "express";
import { membershipRoleController as c } from "./member-role.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

const router = Router({ mergeParams: true });
router.post("/", authenticate, requirePermission("role.assign"), c.assignRole);
router.patch("/:assignmentId", authenticate, requirePermission("role.assign"), c.updateAssignment);
router.delete("/:assignmentId", authenticate, requirePermission("role.revoke"), c.revokeAssignment);
router.get("/", authenticate, requirePermission("role.read"), c.getMemberRoles);

export default router;

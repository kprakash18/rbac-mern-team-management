import { Router } from "express";
import { membershipRoleController as c } from "./member-role.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import {
  assignMemberRoleSchema,
  memberRoleAssignmentParamSchema,
  memberRoleRouteParamsSchema,
  updateMemberRoleAssignmentSchema,
} from "./member-role.validation.js";

const router = Router({ mergeParams: true });
router.post("/", authenticate, validateRequest(assignMemberRoleSchema), requirePermission("role.assign"), c.assignRole);
router.patch("/:assignmentId", authenticate, validateRequest(updateMemberRoleAssignmentSchema), requirePermission("role.assign"), c.updateAssignment);
router.delete("/:assignmentId", authenticate, validateRequest(memberRoleAssignmentParamSchema), requirePermission("role.revoke"), c.revokeAssignment);
router.get("/", authenticate, validateRequest(memberRoleRouteParamsSchema), requirePermission("role.read"), c.getMemberRoles);

export default router;

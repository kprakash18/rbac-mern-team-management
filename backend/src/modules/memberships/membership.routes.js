import { Router } from "express";
import { membershipController as c } from "./membership.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import {
  addMembershipSchema,
  listMembershipsSchema,
  membershipIdParamSchema,
} from "./membership.validation.js";

const router = Router({ mergeParams: true });
router.post("/", authenticate, validateRequest(addMembershipSchema), requirePermission("membership.create"), c.addMember);
router.get("/", authenticate, validateRequest(listMembershipsSchema), requirePermission(["membership.read", "team.read"]), c.getTeamMembers);
router.get("/:membershipId", authenticate, validateRequest(membershipIdParamSchema), requirePermission(["membership.read", "team.read"]), c.getMemberById);
router.patch("/:membershipId/suspend", authenticate, validateRequest(membershipIdParamSchema), requirePermission("membership.update"), c.suspendMember);
router.patch("/:membershipId/reactivate", authenticate, validateRequest(membershipIdParamSchema), requirePermission("membership.update"), c.reactivateMember);
router.delete("/:membershipId", authenticate, validateRequest(membershipIdParamSchema), requirePermission("membership.remove"), c.removeMember);

export default router;

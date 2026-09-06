import { Router } from "express";
import { membershipController as c } from "./membership.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

const router = Router({ mergeParams: true });
router.post("/", authenticate, requirePermission("membership.create"), c.addMember);
router.get("/", authenticate, requirePermission("membership.read"), c.getTeamMembers);
router.get("/:membershipId", authenticate, requirePermission("membership.read"), c.getMemberById);
router.patch("/:membershipId/suspend", authenticate, requirePermission("membership.update"), c.suspendMember);
router.patch("/:membershipId/reactivate", authenticate, requirePermission("membership.update"), c.reactivateMember);
router.delete("/:membershipId", authenticate, requirePermission("membership.remove"), c.removeMember);

export default router;

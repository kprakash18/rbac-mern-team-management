import { Router } from "express";
import { membershipController } from "./membership.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

// mergeParams: true allows access to :teamId from parent router
const router = Router({ mergeParams: true });

router.post("/", authenticate, requirePermission("membership.create"), membershipController.addMember);
router.get("/", authenticate, requirePermission("membership.read"), membershipController.getTeamMembers);
router.get("/:membershipId", authenticate, requirePermission("membership.read"), membershipController.getMemberById);
router.patch("/:membershipId/suspend", authenticate, requirePermission("membership.update"), membershipController.suspendMember);
router.patch("/:membershipId/reactivate", authenticate, requirePermission("membership.update"), membershipController.reactivateMember);
router.delete("/:membershipId", authenticate, requirePermission("membership.remove"), membershipController.removeMember);


export default router;

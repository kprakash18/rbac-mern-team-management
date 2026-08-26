import { Router } from "express";
import { membershipController } from "./membership.controller.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requirePermission } from "../../common/middleware/authorize.js";

// mergeParams: true allows access to :teamId from parent router
const router = Router({ mergeParams: true });

router.post("/", authenticate, requirePermission("membership.create"), membershipController.addMember);
router.get("/", authenticate, requirePermission("membership.read"), membershipController.getTeamMembers);
router.get("/:membershipId", authenticate, requirePermission("membership.read"), membershipController.getMemberById);

export default router;

import { Router } from "express";
import userRoutes from "../modules/users/users.routes";
import studyRoutes from "../modules/studies/studies.routes";
import adminRoutes from "../modules/admin/admin.routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/", studyRoutes);
router.use("/admin", adminRoutes);

export default router;

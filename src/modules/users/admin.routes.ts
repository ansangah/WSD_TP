import { Router } from "express";
import { prisma } from "../../config/db";
import { authenticate } from "../../middlewares/auth";
import { requireAdmin } from "../../middlewares/rbac";
import { createError } from "../../utils/errors";
import { sanitizeUser } from "../auth/auth.service";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json({ users: users.map(sanitizeUser) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/role", async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;

    if (!role || !["USER", "ADMIN"].includes(role)) {
      throw createError("role must be USER or ADMIN", {
        statusCode: 400,
        code: "INVALID_ROLE",
      });
    }

    if (Number.isNaN(userId)) {
      throw createError("Invalid user id", {
        statusCode: 400,
        code: "INVALID_USER_ID",
      });
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw createError("User not found", {
        statusCode: 404,
        code: "USER_NOT_FOUND",
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    res.json({ user: sanitizeUser(updated) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/deactivate", async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (Number.isNaN(userId)) {
      throw createError("Invalid user id", {
        statusCode: 400,
        code: "INVALID_USER_ID",
      });
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw createError("User not found", {
        statusCode: 404,
        code: "USER_NOT_FOUND",
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: "INACTIVE" },
    });

    res.json({ user: sanitizeUser(updated) });
  } catch (error) {
    next(error);
  }
});

export default router;

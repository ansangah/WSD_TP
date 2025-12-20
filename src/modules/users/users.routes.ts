import { Router } from "express";
import { prisma } from "../../config/db";
import { requireAuth } from "../../middlewares/firebase-auth";
import { createHttpError } from "../../utils/http-error";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.get("/me/studies", ...requireAuth, async (req, res, next) => {
  try {
    const role =
      typeof req.query.role === "string" && req.query.role.length > 0
        ? req.query.role
        : undefined;
    const status =
      typeof req.query.status === "string" && req.query.status.length > 0
        ? req.query.status
        : undefined;

    const memberships = await prisma.studyMember.findMany({
      where: {
        userId: req.authUser!.id,
        ...(role ? { memberRole: role } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        study: true,
      },
      orderBy: { joinedAt: "desc" },
    });

    res.json(memberships);
  } catch (err) {
    next(err);
  }
});

router.get("/me/attendance", ...requireAuth, async (req, res, next) => {
  try {
    const records = await prisma.attendanceRecord.findMany({
      where: { userId: req.authUser!.id },
      include: {
        session: {
          include: { study: true },
        },
      },
      orderBy: { recordedAt: "desc" },
    });

    res.json(records);
  } catch (err) {
    next(err);
  }
});

router.get("/me", ...requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.authUser!.id },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (!user) throw createHttpError(404, "User not found");

    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router } from "express";
import { prisma } from "../../config/db";
import { authenticate } from "../../middlewares/auth";
import { requireStudyLeader } from "../../middlewares/rbac";
import { createError } from "../../utils/errors";

const router = Router();

const parseId = (value: string | undefined, label: string): number => {
  const id = Number(value);
  if (!value || Number.isNaN(id)) {
    throw createError(`Invalid ${label} id`, {
      statusCode: 400,
      code: "INVALID_ID",
    });
  }
  return id;
};

const ensureMember = async (studyId: number, userId: number) => {
  const membership = await prisma.studyMember.findUnique({
    where: {
      studyId_userId: {
        studyId,
        userId,
      },
    },
  });

  if (!membership || membership.status !== "APPROVED") {
    throw createError("You are not a member of this study", {
      statusCode: 403,
      code: "NOT_A_MEMBER",
    });
  }

  return membership;
};

router.post("/", authenticate, async (req, res, next) => {
  try {
    const { title, description, category, maxMembers } = req.body;
    if (!title || !description) {
      throw createError("title and description are required", {
        statusCode: 400,
        code: "INVALID_PAYLOAD",
      });
    }

    const parsedMaxMembers =
      maxMembers === undefined || maxMembers === null
        ? null
        : Number(maxMembers);
    if (parsedMaxMembers !== null && Number.isNaN(parsedMaxMembers)) {
      throw createError("maxMembers must be a number", {
        statusCode: 400,
        code: "INVALID_PAYLOAD",
      });
    }

    const study = await prisma.$transaction(async (tx) => {
      const created = await tx.study.create({
        data: {
          title,
          description,
          category: category ?? null,
          maxMembers: parsedMaxMembers,
          leaderId: req.user!.id,
        },
      });

      await tx.studyMember.create({
        data: {
          studyId: created.id,
          userId: req.user!.id,
          memberRole: "LEADER",
          status: "APPROVED",
        },
      });

      return created;
    });

    res.status(201).json({ study });
  } catch (error) {
    next(error);
  }
});

router.post("/:studyId/join", authenticate, async (req, res, next) => {
  try {
    const studyId = parseId(req.params.studyId, "study");

    const study = await prisma.study.findUnique({
      where: { id: studyId },
    });

    if (!study) {
      throw createError("Study not found", {
        statusCode: 404,
        code: "STUDY_NOT_FOUND",
      });
    }

    const existing = await prisma.studyMember.findUnique({
      where: {
        studyId_userId: {
          studyId,
          userId: req.user!.id,
        },
      },
    });

    if (existing) {
      throw createError("Already joined this study", {
        statusCode: 409,
        code: "ALREADY_JOINED",
      });
    }

    if (study.maxMembers) {
      const count = await prisma.studyMember.count({
        where: { studyId, status: "APPROVED" },
      });
      if (count >= study.maxMembers) {
        throw createError("Study is full", {
          statusCode: 409,
          code: "STUDY_FULL",
        });
      }
    }

    const membership = await prisma.studyMember.create({
      data: {
        studyId,
        userId: req.user!.id,
        memberRole: "MEMBER",
        status: "APPROVED",
      },
    });

    res.status(201).json({ membership });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/:studyId/sessions",
  authenticate,
  requireStudyLeader("studyId"),
  async (req, res, next) => {
    try {
      const studyId = parseId(req.params.studyId, "study");
      const { title, date } = req.body;

      if (!title || !date) {
        throw createError("title and date are required", {
          statusCode: 400,
          code: "INVALID_PAYLOAD",
        });
      }

      const sessionDate = new Date(date);
      if (Number.isNaN(sessionDate.getTime())) {
        throw createError("date must be a valid ISO string", {
          statusCode: 400,
          code: "INVALID_DATE",
        });
      }

      const session = await prisma.attendanceSession.create({
        data: {
          studyId,
          title,
          date: sessionDate,
        },
      });

      res.status(201).json({ session });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:studyId/sessions/:sessionId/attendance",
  authenticate,
  async (req, res, next) => {
    try {
      const studyId = parseId(req.params.studyId, "study");
      const sessionId = parseId(req.params.sessionId, "session");
      const { status } = req.body;

      if (!status || !["PRESENT", "LATE", "ABSENT"].includes(status)) {
        throw createError("status must be PRESENT, LATE, or ABSENT", {
          statusCode: 400,
          code: "INVALID_STATUS",
        });
      }

      await ensureMember(studyId, req.user!.id);

      const session = await prisma.attendanceSession.findUnique({
        where: { id: sessionId },
      });

      if (!session || session.studyId !== studyId) {
        throw createError("Attendance session not found", {
          statusCode: 404,
          code: "SESSION_NOT_FOUND",
        });
      }

      const existing = await prisma.attendanceRecord.findFirst({
        where: {
          sessionId,
          userId: req.user!.id,
        },
      });

      const record = existing
        ? await prisma.attendanceRecord.update({
            where: { id: existing.id },
            data: { status },
          })
        : await prisma.attendanceRecord.create({
            data: {
              sessionId,
              userId: req.user!.id,
              status,
            },
          });

      res.status(201).json({ record });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:studyId/attendance/summary",
  authenticate,
  requireStudyLeader("studyId"),
  async (req, res, next) => {
    try {
      const studyId = parseId(req.params.studyId, "study");

      const grouped = await prisma.attendanceRecord.groupBy({
        by: ["status"],
        where: {
          session: {
            studyId,
          },
        },
        _count: {
          _all: true,
        },
      });

      const summary = grouped.reduce(
        (acc, item) => {
          acc[item.status] = item._count._all;
          acc.total += item._count._all;
          return acc;
        },
        { total: 0 } as Record<string, number>,
      );

      res.json({ studyId, summary });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

import { prisma } from "../src/config/db";
import { hashPassword } from "../src/utils/passwords";

const USER_COUNT = 20;
const STUDY_COUNT = 10;
const SESSIONS_PER_STUDY = 3;

const randomFrom = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

const STUDY_TITLES = [
  "TypeScript Mastery",
  "Backend Bootcamp",
  "Frontend Craft",
  "Cloud Builders",
  "System Design Lab",
  "AI Study Group",
  "Algorithm Arena",
  "Product Builders",
  "Database Deep Dive",
  "DevOps Journey",
];

const CATEGORIES = ["WEB", "MOBILE", "AI", "BACKEND", "FRONTEND"];
const STATUSES = ["PRESENT", "LATE", "ABSENT"] as const;

const clearDatabase = async () => {
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.studyMember.deleteMany();
  await prisma.study.deleteMany();
  await prisma.user.deleteMany();
};

const seedUsers = async () => {
  const passwordHash = await hashPassword("Password123!");

  const usersData = Array.from({ length: USER_COUNT }, (_, index) => ({
    email: `user${index + 1}@example.com`,
    passwordHash,
    name: `User ${index + 1}`,
    role: index === 0 ? "ADMIN" : "USER",
  }));

  await prisma.user.createMany({ data: usersData });
  return prisma.user.findMany({ orderBy: { id: "asc" } });
};

const seedStudies = async (userIds: number[]) => {
  const studies = await Promise.all(
    Array.from({ length: STUDY_COUNT }, (_, index) => {
      const leaderId = userIds[index % userIds.length];
      return prisma.study.create({
        data: {
          title: STUDY_TITLES[index % STUDY_TITLES.length],
          description: `Study ${index + 1} for building skills together.`,
          category: randomFrom(CATEGORIES),
          maxMembers: 30,
          leaderId,
        },
      });
    }),
  );

  const memberships = studies.flatMap((study) =>
    userIds.map((userId) => ({
      studyId: study.id,
      userId,
      memberRole: userId === study.leaderId ? "LEADER" : "MEMBER",
      status: "APPROVED",
    })),
  );

  await prisma.studyMember.createMany({ data: memberships });

  return studies;
};

const seedSessionsAndAttendance = async (
  studies: { id: number }[],
  userIds: number[],
) => {
  for (const study of studies) {
    const sessions = await Promise.all(
      Array.from({ length: SESSIONS_PER_STUDY }, (_, idx) =>
        prisma.attendanceSession.create({
          data: {
            studyId: study.id,
            title: `Session ${idx + 1}`,
            date: new Date(Date.now() - idx * 24 * 60 * 60 * 1000),
          },
        }),
      ),
    );

    for (const session of sessions) {
      const attendanceRecords = userIds.map((userId) => ({
        sessionId: session.id,
        userId,
        status: randomFrom([...STATUSES]),
      }));
      await prisma.attendanceRecord.createMany({ data: attendanceRecords });
    }
  }
};

const main = async () => {
  await clearDatabase();

  const users = await seedUsers();
  const userIds = users.map((user) => user.id);

  const studies = await seedStudies(userIds);
  await seedSessionsAndAttendance(studies, userIds);

  console.log(
    `Seeded ${users.length} users, ${studies.length} studies, ` +
      `${USER_COUNT * STUDY_COUNT} study members, ` +
      `${STUDY_COUNT * SESSIONS_PER_STUDY * USER_COUNT} attendance records.`,
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

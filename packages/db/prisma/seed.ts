import { PrismaClient, Role } from "../generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@platform.com";
  const adminPassword = "Admin@123";

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("✅ Admin already exists");
    return;
  }

  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      role: Role.Admin,
    },
  });

  console.log("🚀 Admin seeded successfully");
  console.log("📧 Email:", adminEmail);
  console.log("🔑 Password:", adminPassword);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// async function seed() {
//   const contest = await prisma.contest.create({
//     data: {
//       title: "Weekly Contest",
//       startTime: new Date(),
//     },
//   });

//   const challenge = await prisma.challenge.create({
//     data: {
//       title: "Two Sum",
//       notionDocId: "doc-123",
//       maxPoints: 100,
//     },
//   });

//   await prisma.contestToChallengeMapping.create({
//     data: {
//       contestId: contest.id,
//       challengeId: challenge.id,
//       index: 1,
//     },
//   });

//   console.log("✅ Seed completed");
// }

// seed()
//   .catch(console.error)
//   .finally(() => prisma.$disconnect());

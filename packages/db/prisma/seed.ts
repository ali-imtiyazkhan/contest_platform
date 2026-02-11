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
    console.log("Admin already exists");
    return;
  }

  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      role: Role.Admin,
    },
  });

  console.log(" Admin seeded successfully");
  console.log(" Email:", adminEmail);
  console.log(" Password:", adminPassword);
}

main()
  .catch((e) => {
    console.error(" Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

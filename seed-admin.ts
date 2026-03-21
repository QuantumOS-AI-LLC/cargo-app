import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter } as any);

  const email = "admin@cargodeductible.com";
  const password = "Admin@2026!";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("✅ Admin user already exists:", email);
    await prisma.$disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const admin = await prisma.user.create({
    data: {
      email,
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", admin.email);
  console.log("   Email:", email);
  console.log("   Password:", password);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

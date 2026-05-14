import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2] || "admin@theworkplaceuk.co.uk";
  const password = process.argv[3] || "changeme123";
  const name = process.argv[4] || "Admin";

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.adminUser.upsert({
    where: { email },
    update: { password: hash, name },
    create: { email, password: hash, name },
  });

  console.log(`Admin user ready: ${user.email}`);
}

main().finally(() => prisma.$disconnect());

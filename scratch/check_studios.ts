
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const studios = await prisma.studio.findMany();
  console.log(JSON.stringify(studios, null, 2));
}

main().catch(console.error);

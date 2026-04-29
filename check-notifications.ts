import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.notificationSetting.findUnique({
    where: { id: "default" },
  });
  console.log("Settings:", settings);

  const logs = await prisma.notificationLog.findMany({
    orderBy: { sentAt: 'desc' },
    take: 5
  });
  console.log("Recent Logs:", logs);
}

main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
  console.log(bookings.map(b => ({ id: b.id, groupId: b.groupId, status: b.status })));
}
main().finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const res = await prisma.booking.deleteMany({ where: { status: 'pending' } });
  console.log('Deleted', res.count, 'pending bookings');
}
main().finally(() => prisma.$disconnect());

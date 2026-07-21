import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('Admin123!', {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@nemt.local' },
    update: {},
    create: {
      email: 'admin@nemt.local',
      fullName: 'NEMT Admin',
      passwordHash,
      role: Role.ADMIN,
      phone: '+15555550100',
    },
  });

  const riderHash = await argon2.hash('Rider123!', {
    type: argon2.argon2id,
  });
  const rider = await prisma.user.upsert({
    where: { email: 'rider@nemt.local' },
    update: {},
    create: {
      email: 'rider@nemt.local',
      fullName: 'Sample Rider',
      passwordHash: riderHash,
      role: Role.RIDER,
      phone: '+15555550101',
    },
  });

  const driverHash = await argon2.hash('Driver123!', {
    type: argon2.argon2id,
  });
  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@nemt.local' },
    update: {},
    create: {
      email: 'driver@nemt.local',
      fullName: 'Sample Driver',
      passwordHash: driverHash,
      role: Role.DRIVER,
      phone: '+15555550102',
      driverProfile: {
        create: {
          status: 'AVAILABLE',
          isApproved: true,
          licenseNumber: 'DL-123456',
          lastLat: 32.78,
          lastLng: -96.8,
          lastLocationAt: new Date(),
          vehicle: {
            create: {
              make: 'Toyota',
              model: 'Sienna',
              year: 2022,
              color: 'Silver',
              plateNumber: 'NEMT-001',
              wheelchair: true,
            },
          },
        },
      },
    },
    include: { driverProfile: true },
  });

  console.log('Seeded users:');
  console.log('  admin@nemt.local / Admin123!');
  console.log('  rider@nemt.local / Rider123!');
  console.log('  driver@nemt.local / Driver123! (pre-approved)');
  console.log({ admin: admin.id, rider: rider.id, driver: driverUser.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { UserRole } from '../generated/prisma/enums';
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcrypt';

async function main() {
  const requiredEnvVars = [
    'SUPERADMINEMAIL',
    'SUPERADMINPHONE',
    'SUPERADMINPASSWORD',
    'SUPERADMINIP',
  ];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  const { SUPERADMINEMAIL, SUPERADMINPHONE, SUPERADMINPASSWORD, SUPERADMINIP } =
    process.env;

  const existingAdmin = await prisma.user.findUnique({
    where: { email: SUPERADMINEMAIL as string },
    select: { id: true },
  });

  if (existingAdmin) {
    console.log('Super admin already exists, skipping creation');
    return;
  }

  const hashPassword = await bcrypt.hash(SUPERADMINPASSWORD as string, 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: SUPERADMINEMAIL as string,
      phone: SUPERADMINPHONE as string,
      password: hashPassword,
      role: UserRole.SUPER_ADMIN,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log('Super admin created successfully:', {
    id: superAdmin.id,
    email: superAdmin.email,
    role: superAdmin.role,
  });
}

async function seed() {
  try {
    console.log('Starting database seeding...');
    await main();
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
}

// Execute seeding
seed().catch((error) => {
  console.error('Fatal error during seeding:', error);
  process.exit(1);
});

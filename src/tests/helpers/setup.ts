// src/tests/helpers/setup.ts
import { db } from '../../src/config/database';

export async function resetDatabase() {
  // Delete in order that respects foreign key constraints
  // await prisma.usageLog.deleteMany();
  // await prisma.message.deleteMany();
  // await prisma.conversation.deleteMany();
  // await prisma.chunk.deleteMany();
  // await prisma.document.deleteMany();
  await db.refreshToken.deleteMany();
  await db.user.deleteMany();
}

export async function createTestUser(overrides = {}) {
  const bcrypt = await import('bcryptjs');
  const hash = await bcrypt.hash('TestPassword1!', 4); // Low rounds for speed
  return db.user.create({
    data: {
      email: 'test@dokkuchat.dev',
      passwordHash: hash,
      ...overrides,
    },
  });
}

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const prisma = new PrismaClient();

async function bootstrapAdmin() {
  const email = process.env.INITIAL_ADMIN_EMAIL || process.argv[2];
  const password = process.env.INITIAL_ADMIN_PASSWORD || process.argv[3];

  if (!email) {
    console.error('Usage: npx ts-node scripts/bootstrap-admin.ts <email> [password]');
    console.error('Or set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD environment variables.');
    process.exit(1);
  }

  console.log(`[BOOTSTRAP] Processing admin bootstrap for: ${email}`);

  try {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: 'OWNER',
          accountStatus: 'ACTIVE',
          scraperAccess: true,
          emailVerified: true,
          approvedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          action: 'BOOTSTRAP_ADMIN',
          targetUserId: updated.id,
          metadata: {
            promotedEmail: updated.email,
            previousRole: existing.role,
            timestamp: new Date().toISOString(),
          },
        },
      });

      console.log(`[BOOTSTRAP SUCCESS] Existing user ${updated.email} (${updated.id}) promoted to OWNER with full ACTIVE scraper access.`);
    } else {
      if (!password) {
        console.error(`[BOOTSTRAP ERROR] User ${email} does not exist and no password was provided to create one.`);
        process.exit(1);
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const created = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          name: 'Primary Administrator',
          passwordHash,
          role: 'OWNER',
          accountStatus: 'ACTIVE',
          scraperAccess: true,
          emailVerified: true,
          approvedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          action: 'BOOTSTRAP_ADMIN',
          targetUserId: created.id,
          metadata: {
            createdEmail: created.email,
            role: 'OWNER',
            timestamp: new Date().toISOString(),
          },
        },
      });

      console.log(`[BOOTSTRAP SUCCESS] Created new administrator user ${created.email} (${created.id}) with OWNER role and ACTIVE scraper access.`);
    }
  } catch (err) {
    console.error('[BOOTSTRAP ERROR] Failed to bootstrap admin:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

bootstrapAdmin();

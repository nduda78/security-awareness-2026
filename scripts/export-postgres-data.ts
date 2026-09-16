// One-off: dump every row out of the live Postgres database as JSON before
// switching prisma/schema.prisma over to SQLite. Run this BEFORE changing
// the schema (while DATABASE_URL still points at Postgres and the Prisma
// client is still generated against the Postgres schema).
//
//   npx tsx scripts/export-postgres-data.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const [employees, challenges, submissions, badgeFlares, adminAudits] = await Promise.all([
    prisma.employee.findMany(),
    prisma.challenge.findMany(),
    prisma.submission.findMany(),
    prisma.badgeFlare.findMany(),
    prisma.adminAudit.findMany(),
  ]);

  const out = {
    exportedAt: new Date().toISOString(),
    employees,
    challenges,
    submissions,
    badgeFlares,
    adminAudits,
  };

  const outPath = path.join(process.cwd(), "scripts", "postgres-export.json");
  fs.writeFileSync(outPath, JSON.stringify(out, jsonReplacer, 2));
  console.log(`Exported ${employees.length} employees, ${challenges.length} challenges, ${submissions.length} submissions, ${badgeFlares.length} badge flares, ${adminAudits.length} audit rows -> ${outPath}`);
}

// Bytes fields (photo, questionImage, unlockAudio, unlockImage, unlockVideo)
// come back as Buffer/Uint8Array from Postgres - base64-encode them for the
// JSON round-trip so no binary is lost or mangled.
function jsonReplacer(_key: string, value: unknown) {
  if (value instanceof Uint8Array) {
    return { __buffer: Buffer.from(value).toString("base64") };
  }
  if (value && typeof value === "object" && (value as { type?: string }).type === "Buffer" && Array.isArray((value as { data?: unknown }).data)) {
    return { __buffer: Buffer.from((value as { data: number[] }).data).toString("base64") };
  }
  return value;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

// One-off: replays scripts/postgres-export.json (captured by
// export-postgres-data.ts before the schema switched to SQLite) into the
// fresh SQLite database via the SQLite-flavored Prisma client. Converts the
// old Postgres shapes (enum strings, real string[] achievements, JSON
// choices, base64-tagged Bytes) into the new SQLite-flavored shapes
// (plain strings, JSON-encoded achievements/choices, real Buffers).
//
//   npx tsx scripts/import-postgres-export.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function debuffer(value: unknown): Buffer | null {
  if (value && typeof value === "object" && "__buffer" in (value as Record<string, unknown>)) {
    return Buffer.from((value as { __buffer: string }).__buffer, "base64");
  }
  return null;
}

async function main() {
  const dumpPath = path.join(process.cwd(), "scripts", "postgres-export.json");
  const dump = JSON.parse(fs.readFileSync(dumpPath, "utf8"));

  for (const e of dump.employees) {
    await prisma.employee.create({
      data: {
        id: e.id,
        email: e.email,
        displayName: e.displayName,
        rogueOverride: e.rogueOverride,
        createdAt: new Date(e.createdAt),
        photo: debuffer(e.photo),
        photoMimeType: e.photoMimeType,
        photoUpdatedAt: e.photoUpdatedAt ? new Date(e.photoUpdatedAt) : null,
      },
    });
  }

  for (const c of dump.challenges) {
    await prisma.challenge.create({
      data: {
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        answerType: c.answerType,
        correctAnswer: c.correctAnswer,
        choices: c.choices != null ? JSON.stringify(c.choices) : null,
        xpValue: c.xpValue,
        rewardMode: c.rewardMode,
        questionImage: debuffer(c.questionImage),
        questionImageMimeType: c.questionImageMimeType,
        unlockAudio: debuffer(c.unlockAudio),
        unlockAudioMimeType: c.unlockAudioMimeType,
        unlockText: c.unlockText,
        unlockLinkUrl: c.unlockLinkUrl,
        unlockLinkLabel: c.unlockLinkLabel,
        unlockImage: debuffer(c.unlockImage),
        unlockImageMimeType: c.unlockImageMimeType,
        unlockVideo: debuffer(c.unlockVideo),
        unlockVideoMimeType: c.unlockVideoMimeType,
        rewardBackgroundEffect: c.rewardBackgroundEffect,
        rewardBorderStyle: c.rewardBorderStyle,
        rewardIcon: c.rewardIcon,
        rewardRibbonText: c.rewardRibbonText,
        rewardNameSuffix: c.rewardNameSuffix,
        rewardOutlineColorPicker: c.rewardOutlineColorPicker,
        rewardBackgroundColorPicker: c.rewardBackgroundColorPicker,
        rewardPrize: c.rewardPrize,
        minClearance: c.minClearance,
        isActive: c.isActive,
        opensAt: c.opensAt ? new Date(c.opensAt) : null,
        closesAt: c.closesAt ? new Date(c.closesAt) : null,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
    });
  }

  for (const s of dump.submissions) {
    await prisma.submission.create({
      data: {
        id: s.id,
        employeeId: s.employeeId,
        challengeId: s.challengeId,
        answerRaw: s.answerRaw,
        status: s.status,
        xpAwarded: s.xpAwarded,
        submittedAt: new Date(s.submittedAt),
        reviewedBy: s.reviewedBy,
        reviewedAt: s.reviewedAt ? new Date(s.reviewedAt) : null,
      },
    });
  }

  for (const f of dump.badgeFlares) {
    await prisma.badgeFlare.create({
      data: {
        employeeId: f.employeeId,
        achievements: JSON.stringify(f.achievements ?? []),
        outlineColor: f.outlineColor,
        backgroundColor: f.backgroundColor,
        backgroundEffect: f.backgroundEffect,
        codenameOverride: f.codenameOverride,
        motto: f.motto,
        iconOverride: f.iconOverride,
        borderStyle: f.borderStyle,
        ribbonText: f.ribbonText,
        nameSuffix: f.nameSuffix,
        expiresAt: f.expiresAt ? new Date(f.expiresAt) : null,
        updatedAt: new Date(f.updatedAt),
      },
    });
  }

  for (const a of dump.adminAudits) {
    await prisma.adminAudit.create({
      data: { id: a.id, action: a.action, detail: a.detail, createdAt: new Date(a.createdAt) },
    });
  }

  console.log(
    `Imported ${dump.employees.length} employees, ${dump.challenges.length} challenges, ${dump.submissions.length} submissions, ${dump.badgeFlares.length} badge flares, ${dump.adminAudits.length} audit rows.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

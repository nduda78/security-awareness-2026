// One-off script: migrates the 21 already-scheduled securdle-* challenges
// from the old plain CASE_INSENSITIVE text-input format to the new real
// Wordle-style SECURDLE answerType. Only touches answerType and
// correctAnswer (uppercased for consistent internal handling) - title,
// XP, schedule, clearance, isActive, all untouched.
//
// Checked first (see chat transcript): only securdle-1 has any real
// submissions (2, both already CORRECT) - the other 20 have zero. Those
// 2 legacy submissions keep their CORRECT status and XP; their answerRaw
// is a plain guessed-word string, not the new JSON format, but
// parseSecurdleProgress() already treats any unparseable data as "no
// guesses yet" rather than throwing, so SecurdleBoard just shows them a
// plain "already solved" state instead of a replayed guess history.
import { prisma } from "../src/lib/prisma";

async function main() {
  const challenges = await prisma.challenge.findMany({
    where: { slug: { startsWith: "securdle-" }, answerType: { not: "SECURDLE" } },
    select: { id: true, slug: true, correctAnswer: true, answerType: true },
  });

  if (challenges.length === 0) {
    console.log("Nothing to migrate - no securdle-* challenges found with a non-SECURDLE answerType.");
    return;
  }

  for (const c of challenges) {
    if (!c.correctAnswer) {
      console.warn(`Skipping ${c.slug} - no correctAnswer set.`);
      continue;
    }
    await prisma.challenge.update({
      where: { id: c.id },
      data: { answerType: "SECURDLE", correctAnswer: c.correctAnswer.trim().toUpperCase() },
    });
    console.log(`Migrated ${c.slug}: ${c.answerType} -> SECURDLE, answer="${c.correctAnswer.trim().toUpperCase()}"`);
  }

  console.log(`Done - migrated ${challenges.length} challenge(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

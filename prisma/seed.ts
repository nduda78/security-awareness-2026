import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data for Security Awareness Month 2026...");

  const challenges = await Promise.all([
    prisma.challenge.upsert({
      where: { slug: "phishing-101" },
      update: {},
      create: {
        slug: "phishing-101",
        title: "Spot the Phish",
        description: "What's the #1 giveaway of a phishing email? (hint: check the sender domain)",
        answerType: "CASE_INSENSITIVE",
        correctAnswer: "sender domain",
        xpValue: 50,
        isActive: true,
      },
    }),
    prisma.challenge.upsert({
      where: { slug: "password-quiz" },
      update: {},
      create: {
        slug: "password-quiz",
        title: "Password Power-Up",
        description: "Which of these is the strongest password practice?",
        answerType: "MULTIPLE_CHOICE",
        correctAnswer: "Use a password manager with unique passwords per site",
        choices: [
          "Reuse one strong password everywhere",
          "Use a password manager with unique passwords per site",
          "Write passwords on a sticky note",
          "Use your pet's name + birth year",
        ],
        xpValue: 75,
        isActive: true,
      },
    }),
    prisma.challenge.upsert({
      where: { slug: "incident-response" },
      update: {},
      create: {
        slug: "incident-response",
        title: "First Move",
        description:
          "You think you clicked a phishing link. In 2-3 sentences, what's the very first thing you should do?",
        answerType: "FREE_TEXT_REVIEW",
        xpValue: 100,
        isActive: true,
      },
    }),
    prisma.challenge.upsert({
      where: { slug: "mfa-basics" },
      update: {},
      create: {
        slug: "mfa-basics",
        title: "MFA Basics",
        description: "What does MFA stand for?",
        answerType: "EXACT",
        correctAnswer: "Multi-Factor Authentication",
        xpValue: 40,
        isActive: true,
      },
    }),
    prisma.challenge.upsert({
      where: { slug: "clean-desk" },
      update: {},
      create: {
        slug: "clean-desk",
        title: "Clean Desk Check",
        description: "True or false: leaving your laptop unlocked at your desk is fine for 'just a minute.'",
        answerType: "CASE_INSENSITIVE",
        correctAnswer: "false",
        xpValue: 30,
        isActive: true,
      },
    }),
  ]);

  const demoPeople: { name: string; email: string; rogue?: boolean }[] = [
    { name: "Nick Duda", email: "nick.duda@dutchie.com" },
    { name: "Priya Shah", email: "priya.shah@dutchie.com" },
    { name: "Marcus Lee", email: "marcus.lee@dutchie.com" },
    { name: "Ava Torres", email: "ava.torres@dutchie.com" },
    { name: "Sam Okafor", email: "sam.okafor@dutchie.com" },
    { name: "Jordan Kim", email: "jordan.kim@dutchie.com" },
    { name: "Riley Chen", email: "riley.chen@dutchie.com" },
    { name: "Devon Park", email: "devon.park@dutchie.com", rogue: true },
  ];

  const employees = await Promise.all(
    demoPeople.map((p) =>
      prisma.employee.upsert({
        where: { email: p.email },
        update: { rogueOverride: !!p.rogue },
        create: { email: p.email, displayName: p.name, rogueOverride: !!p.rogue },
      })
    )
  );

  // Spread submissions across tiers.
  const patterns = [
    [0, 1, 2, 3], // Nick - lots of XP -> TOP_SECRET
    [0, 1, 3], // Priya -> SECRET-ish
    [0, 3], // Marcus -> low SECRET/UNCLASSIFIED
    [0], // Ava -> UNCLASSIFIED
    [], // Sam -> UNCLASSIFIED (0 xp)
    [0, 1, 2, 3, 4], // Jordan -> TOP_SECRET, max
    [0, 4], // Riley -> UNCLASSIFIED
    [0, 1], // Devon -> ROGUE regardless of XP
  ];

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const indices = patterns[i] ?? [];
    let dayOffset = 1;
    for (const idx of indices) {
      const ch = challenges[idx];
      const submittedAt = new Date(2026, 9, dayOffset); // October 2026
      dayOffset += 2;
      await prisma.submission.upsert({
        where: { employeeId_challengeId: { employeeId: emp.id, challengeId: ch.id } },
        update: {},
        create: {
          employeeId: emp.id,
          challengeId: ch.id,
          answerRaw: "(seed data)",
          status: ch.answerType === "FREE_TEXT_REVIEW" ? "CORRECT" : "CORRECT",
          xpAwarded: ch.xpValue,
          submittedAt,
          reviewedAt: ch.answerType === "FREE_TEXT_REVIEW" ? submittedAt : null,
        },
      });
    }
  }

  // Give a couple of people some flare.
  await prisma.badgeFlare.upsert({
    where: { employeeId: employees[0].id }, // Nick
    update: {},
    create: {
      employeeId: employees[0].id,
      achievements: ["Won a MacBook", "October Champion"],
      outlineColor: "Hot Pink",
      backgroundEffect: "holo",
      motto: "Trust nothing. Verify everything.",
      ribbonText: "Gold",
      nameSuffix: "the Vigilant",
    },
  });

  await prisma.badgeFlare.upsert({
    where: { employeeId: employees[5].id }, // Jordan
    update: {},
    create: {
      employeeId: employees[5].id,
      achievements: ["Perfect Score"],
      backgroundEffect: "starfield",
      borderStyle: "shimmer",
      iconOverride: "crown",
      ribbonText: "MVP of the month (inside joke, don't ask)",
    },
  });

  console.log(`Seeded ${challenges.length} challenges and ${employees.length} employees.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

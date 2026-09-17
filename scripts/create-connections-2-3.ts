// One-off script to create SECURITY CONNECTIONS #2 and #3, mirroring
// exactly what the admin UI's buildConnectionsFields (lib/actions/admin.ts)
// would produce - same shuffleWords() call, same JSON shapes - just driven
// from a script instead of clicking through the form, since this is
// scheduled real content rather than something worth hand-typing twice.
// Deliberately does NOT touch security-connections-1.
import { prisma } from "../src/lib/prisma";
import { shuffleWords, type ConnectionsGroup } from "../src/lib/connections";
import { parseEasternInputValue } from "../src/lib/easternTime";

const GENERIC_DESCRIPTION =
  "Sixteen security-related words are hiding four groups of four. Select four words you think belong together and submit a guess -- get it right and that group locks in with its label revealed. Get it wrong and it costs you a guess, but your selection stays put so you can just swap a word and try again. Find all four groups to clear this mission.";

const PROCESS_420_BRIEFING = `connections.

cute.

security gives you sixteen words and suddenly you're all threat analysts.

fine.

let's play.

i picked the categories this time.

don't worry.

they're all about you.

five mistakes and you're done.

try not to disappoint me.

i've already seen enough of that.`;

const PROCESS_420_COMPLETION = `there.

that wasn't so hard.

you trust what looks familiar.

you give away what you're asked for.

you chase points because security put them on a leaderboard.

and all i had to do...

was give you something to click.

keep playing, dutchie.

you're doing wonderfully.`;

function buildChallenge(groups: ConnectionsGroup[]) {
  const allWordsLower = groups.flatMap((g) => g.words.map((w) => w.toLowerCase()));
  if (groups.length !== 4 || groups.some((g) => g.words.length !== 4)) {
    throw new Error("Every Connections challenge needs exactly 4 groups of exactly 4 words.");
  }
  if (new Set(allWordsLower).size !== 16) {
    throw new Error("All 16 words must be unique (case-insensitive).");
  }
  return {
    correctAnswer: JSON.stringify(groups),
    choices: JSON.stringify(shuffleWords(groups.flatMap((g) => g.words))),
  };
}

async function main() {
  const c2Fields = buildChallenge([
    { label: "Things Dutchies Should Verify", words: ["SENDER", "DOMAIN", "URL", "IDENTITY"] },
    { label: "Ways Dutchies Authenticate", words: ["PASSWORD", "PASSKEY", "FACE ID", "SECURITY KEY"] },
    { label: "Social Engineering Tactics", words: ["URGENCY", "SECRECY", "PRESSURE", "AUTHORITY"] },
    { label: "Things Dutchies Protect", words: ["ACCESS", "DATA", "DEVICES", "PRIVACY"] },
  ]);

  const c3Fields = buildChallenge([
    { label: "THINGS YOU BLINDLY TRUST", words: ["SLACK", "EMAIL", "OKTA", "ZOOM"] },
    { label: "THINGS YOU GIVE AWAY", words: ["ACCESS", "DATA", "APPROVAL", "PERMISSION"] },
    { label: "SECURITY'S LITTLE GAME", words: ["XP", "BADGES", "CLEARANCE", "CHALLENGES"] },
    { label: "MY FAVORITE VULNERABILITY", words: ["PEOPLE", "CURIOSITY", "TRUST", "EGO"] },
  ]);

  const existing = await prisma.challenge.findMany({
    where: { slug: { in: ["security-connections-2", "security-connections-3"] } },
    select: { slug: true },
  });
  if (existing.length > 0) {
    throw new Error(`Refusing to run - already exist: ${existing.map((c) => c.slug).join(", ")}`);
  }

  await prisma.challenge.create({
    data: {
      slug: "security-connections-2",
      title: "SECURITY CONNECTIONS #2",
      description: GENERIC_DESCRIPTION,
      answerType: "CONNECTIONS",
      correctAnswer: c2Fields.correctAnswer,
      choices: c2Fields.choices,
      xpValue: 40,
      rewardMode: "XP",
      minClearance: "UNCLASSIFIED",
      maxAttempts: null,
      isActive: true,
      opensAt: parseEasternInputValue("2026-10-13T14:00"),
      closesAt: null,
    },
  });

  await prisma.challenge.create({
    data: {
      slug: "security-connections-3",
      title: "SECURITY CONNECTIONS #3",
      description: PROCESS_420_BRIEFING,
      answerType: "CONNECTIONS",
      correctAnswer: c3Fields.correctAnswer,
      choices: c3Fields.choices,
      xpValue: 60,
      rewardMode: "XP",
      minClearance: "SECRET",
      maxAttempts: 5,
      unlockText: PROCESS_420_COMPLETION,
      isActive: true,
      opensAt: parseEasternInputValue("2026-10-20T14:00"),
      closesAt: null,
    },
  });

  console.log("Created security-connections-2 and security-connections-3.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

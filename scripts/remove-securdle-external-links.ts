// One-off cleanup: strips the trailing external mywordle.strivemath.com
// link from every securdle-* challenge's description. Those links were
// only ever needed because Securdle used to be hosted on a third-party
// tool - now that SECURDLE is a real native challenge type with its own
// board, the link is dead weight (and confusing, since the real game is
// right there on the page). Only touches the description text; nothing
// else about any challenge changes.
import { prisma } from "../src/lib/prisma";

const URL_PATTERN = /\r?\n\r?\n?https:\/\/mywordle\.strivemath\.com\/\S*\s*$/;

async function main() {
  const challenges = await prisma.challenge.findMany({
    where: { slug: { startsWith: "securdle-" } },
    select: { id: true, slug: true, description: true },
  });

  let changed = 0;
  for (const c of challenges) {
    if (!c.description || !URL_PATTERN.test(c.description)) {
      console.log(`${c.slug}: no external link found, left as-is.`);
      continue;
    }
    const newDescription = c.description.replace(URL_PATTERN, "").trimEnd();
    await prisma.challenge.update({ where: { id: c.id }, data: { description: newDescription } });
    console.log(`${c.slug}: removed external link.`);
    changed++;
  }

  console.log(`Done - updated ${changed} of ${challenges.length} challenge(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

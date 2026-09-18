// One-off: converts every existing Employee.email value that's still a
// real email address (contains "@") into the new name-slug identity key
// (see slugifyName in src/lib/auth.ts), leaving pinHash untouched (null) so
// each person "claims" their own historical profile the next time they
// visit, by registering with their name + a new PIN (see registerAction).
//
// Safe to re-run: rows whose email is already a non-"@" slug are skipped.
//
//   npx tsx scripts/migrate-employees-to-name-slug.ts
import { PrismaClient } from "@prisma/client";
import { slugifyName } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany();
  const taken = new Set(employees.filter((e) => !e.email.includes("@")).map((e) => e.email));

  for (const emp of employees) {
    if (!emp.email.includes("@")) continue; // already migrated

    let slug = slugifyName(emp.displayName);
    let suffix = 2;
    while (taken.has(slug)) {
      slug = `${slugifyName(emp.displayName)}-${suffix}`;
      suffix++;
    }
    taken.add(slug);

    await prisma.employee.update({
      where: { id: emp.id },
      data: { email: slug },
    });
    console.log(`${emp.displayName}: ${emp.email} -> ${slug}`);
  }

  console.log("Done. All migrated rows have pinHash = null and must be claimed via the New Agent tab.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

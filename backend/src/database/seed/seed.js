import { env } from "../../config/env.js";
import { connectDatabase, disconnectDatabase } from "../connection.js";
import { seedDatabase } from "./seeder.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Database Seeder CLI
-------------------
Usage:
  npm run seed                Idempotent development seed (upsert mode)
  npm run seed:fresh          Destructive clean reset & development scenario seed
  npm run seed:system         System-only bootstrap seed (Permissions + Roles only)

Options:
  --fresh                     Clear all collections before seeding (disabled in production)
  --system                    Run only the system bootstrap seed
  --help, -h                  Show this help text
`);
    return;
  }

  const isSystemOnly = args.includes("--system");
  const isFresh = args.includes("--fresh");

  try {
    await connectDatabase(env.mongoUri);
    await seedDatabase({ fresh: isFresh, systemOnly: isSystemOnly });
  } catch (error) {
    console.error("\n❌ Database seed failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

main();
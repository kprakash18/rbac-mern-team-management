import { env } from '../../config/env.js';
import { connectDatabase, disconnectDatabase } from '../connection.js';
import Permission from '../../modules/permissions/permission.model.js';
import { permissionSeedData } from '../../modules/permissions/permissions.seed.js';

async function seed() {
  try {
    await connectDatabase(env.mongoUri);

    console.log("Seeding permissions...");

    const operations = permissionSeedData.map((permission) => ({
      updateOne: {
        filter: {
          key: permission.key,
        },
        update: {
          $set: permission,
        },
        upsert: true,
      },
    }));
    const result = await Permission.bulkWrite(operations);

    console.log("Permission seed completed.");
    console.log(`Matched: ${result.matchedCount}`);
    console.log(`Modified: ${result.modifiedCount}`);
    console.log(`Upserted: ${result.upsertedCount}`);
  } catch (error) {
    console.error("Database seed failed:");
    console.error(error);

    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

seed();
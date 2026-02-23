import { logger } from "../logger";

export async function runDataMigrations(): Promise<void> {
  logger.db.info("No data migrations to run");
}

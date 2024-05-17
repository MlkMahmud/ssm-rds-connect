import { Kysely, sql } from "kysely";

interface Config {
  dbname: string;
  username: string;
}

const ROLE_NAME = "readaccess";

async function main(db: Kysely<unknown>, config: Config) {
  console.log(`- Creating IAM user: "${config.username}" with read-only permissions for database: "${config.dbname}".`);

  await db.transaction().execute(async (trx) => {
    await sql.raw(`CREATE ROLE ${ROLE_NAME}`).execute(trx);
    await sql.raw(`GRANT CONNECT ON DATABASE ${config.dbname} to ${ROLE_NAME}`).execute(trx);
    await sql.raw(`GRANT USAGE ON SCHEMA public TO ${ROLE_NAME}`).execute(trx);
    await sql.raw(`GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${ROLE_NAME}`).execute(trx);
    await sql
      .raw(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ${ROLE_NAME}`
      )
      .execute(trx);
    await sql.raw(`CREATE USER ${config.username} WITH LOGIN`).execute(trx);
    await sql.raw(`GRANT ${ROLE_NAME} TO ${config.username}`).execute(trx);
    await sql.raw(`GRANT rds_iam TO ${config.username}`).execute(trx); 
  });

  console.log("- Done creating user.");
}

export default main;

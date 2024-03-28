import { Kysely, sql } from "kysely";

interface Config {
  admin_username: string;
  dbname: string;
  password: string;
  username: string;
}

const ROLE_NAME = "readaccess";

async function main(db: Kysely<unknown>, config: Config) {
  console.log(`- Creating readonly user: "${config.username}" for database: "${config.dbname}".`);

  await db.transaction().execute(async (trx) => {
    await sql.raw(`CREATE ROLE ${ROLE_NAME}`).execute(trx);
    await sql.raw(`GRANT CONNECT ON DATABASE ${config.dbname} to ${ROLE_NAME}`).execute(trx);
    await sql.raw(`GRANT USAGE ON SCHEMA public TO ${ROLE_NAME}`).execute(trx);
    await sql.raw(`GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${ROLE_NAME}`).execute(trx);
    await sql
      .raw(
        `ALTER DEFAULT PRIVILEGES FOR USER ${config.admin_username} IN SCHEMA public GRANT SELECT ON TABLES TO ${config.username}`
      )
      .execute(trx);
    await sql.raw(`CREATE USER ${config.username} WITH PASSWORD '${config.password}'`).execute(trx);
    await sql.raw(`GRANT ${ROLE_NAME} TO ${config.username}`).execute(trx);
  });

  console.log("- Done creating readonly user.");
}

export default main;

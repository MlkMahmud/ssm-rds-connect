import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import path from "path";
import { readFileSync } from "fs";

function getDatabaseConnection(connectionString: string) {
  return new Kysely({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString,
        max: 1,
        ssl: {
          ca: readFileSync(path.join(__dirname, "../rds-cert.pem"), { encoding: "utf-8" }),
        },
      }),
    }),
  });
}

export default getDatabaseConnection;

import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import path from "path";

function getDatabaseConnection(connectionString: string) {
  return new Kysely({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString,
        max: 1,
        ssl: {
          ca: path.join(__dirname, "../rds-cert.pem"),
        },
      }),
    }),
  });
}

export default getDatabaseConnection;

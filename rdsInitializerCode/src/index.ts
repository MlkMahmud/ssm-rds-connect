import { CloudFormationCustomResourceEvent, CloudFormationCustomResourceResponse } from "aws-lambda";
import { getPhysicalResourceId, getSecretValue } from "./utils";
import migrate from "./scripts/migrate";
import getDatabaseConnection from "./database";

const { DB_CREDS_SECRET_NAME = "" } = process.env;

interface DatabaseConfig {
  dbname: string;
  host: string;
  password: string;
  port: number;
  username: string;
}

export async function handler(event: CloudFormationCustomResourceEvent): Promise<CloudFormationCustomResourceResponse> {
  console.log(event);

  switch (event.RequestType) {
    case "Create":
    case "Update": {
      const { dbname, host, password, port, username } = await getSecretValue<DatabaseConfig>(DB_CREDS_SECRET_NAME);
      const database = getDatabaseConnection(`postgresql://${username}:${password}@${host}:${port}/${dbname}`);
      await migrate(database);
      await database.destroy();

      return {
        Status: "SUCCESS",
        LogicalResourceId: event.LogicalResourceId,
        PhysicalResourceId: getPhysicalResourceId(event),
        RequestId: event.RequestId,
        StackId: event.StackId,
        Data: { message: `'${event.RequestType}' event handler completed successfully.` }
      }
    }

    default: {
      return {
        Status: "SUCCESS",
        LogicalResourceId: event.LogicalResourceId,
        PhysicalResourceId: event.PhysicalResourceId,
        RequestId: event.RequestId,
        StackId: event.StackId,
        Data: { message: `Skipping '${event.RequestType}' event.` }
      }
    }
  }
}
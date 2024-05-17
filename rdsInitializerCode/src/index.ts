import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { CloudFormationCustomResourceEvent, CloudFormationCustomResourceResponse } from "aws-lambda";
import getDatabaseConnection from "./database";
import migrate from "./scripts/migrate";

const { DB_CREDS_SECRET_NAME = "", DB_READONLY_CREDS_SECRET_NAME = "" } = process.env;
const client = new SecretsManagerClient();

async function getSecretValue<T>(SecretId: string): Promise<T> {
  const command = new GetSecretValueCommand({ SecretId });
  const response = await client.send(command);

  if (!response.SecretString) {
    throw new Error(`Failed to get secret with id: "${SecretId}"`);
  }

  return JSON.parse(response.SecretString) as T;
}
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
    case "Create": {
      const { dbname, host, password, port, username } = await getSecretValue<DatabaseConfig>(DB_CREDS_SECRET_NAME);
      const database = getDatabaseConnection(`postgresql://${username}:${password}@${host}:${port}/${dbname}`);
      await migrate(database);
      await database.destroy();

      return {
        Status: "SUCCESS",
        LogicalResourceId: event.LogicalResourceId,
        PhysicalResourceId: event.ServiceToken,
        RequestId: event.RequestId,
        StackId: event.StackId,
        Data: { message: `'Create' event handler completed successfully.` },
      };
    }

    case "Update": {
      const { dbname, host, password, port, username } = await getSecretValue<DatabaseConfig>(DB_CREDS_SECRET_NAME);
      const database = getDatabaseConnection(`postgresql://${username}:${password}@${host}:${port}/${dbname}`);
      await migrate(database);
      await database.destroy();

      return {
        Status: "SUCCESS",
        LogicalResourceId: event.LogicalResourceId,
        PhysicalResourceId: event.PhysicalResourceId,
        RequestId: event.RequestId,
        StackId: event.StackId,
        Data: { message: `'Update' event handler completed successfully.` },
      };
    }

    default: {
      return {
        Status: "SUCCESS",
        LogicalResourceId: event.LogicalResourceId,
        PhysicalResourceId: event.PhysicalResourceId,
        RequestId: event.RequestId,
        StackId: event.StackId,
        Data: { message: `Skipping '${event.RequestType}' event.` },
      };
    }
  }
}

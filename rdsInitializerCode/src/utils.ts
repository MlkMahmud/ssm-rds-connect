import { CloudFormationCustomResourceEvent } from "aws-lambda";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export function getPhysicalResourceId(event: CloudFormationCustomResourceEvent): string {
  if (event.RequestType === "Create") {
    return event.ServiceToken;
  }

  return event.PhysicalResourceId;
}

export async function getSecretValue<T>(SecretId: string): Promise<T> {
  const client = new SecretsManagerClient();
  const command = new GetSecretValueCommand({ SecretId });
  const response = await client.send(command);

  if (!response.SecretString) {
    throw new Error(`Failed to get secret with id: "${SecretId}"`);
  }

  return JSON.parse(response.SecretString) as T;
}

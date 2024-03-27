import { App } from "aws-cdk-lib";
import RootStack from "./stack";

const app = new App();

new RootStack(app, "ssm-rds-stack", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});

app.synth();

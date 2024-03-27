import { CustomResource, Duration, Reference, RemovalPolicy } from "aws-cdk-lib";
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { DockerImageCode, DockerImageFunction, Function as LambdaFunction } from "aws-cdk-lib/aws-lambda";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { Provider } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

interface RdsInitializerProps {
  fnCode: DockerImageCode;
  fnEnvironment: Record<string, string>;
  vpc: Vpc;
}

interface IRdsInitializer {
  handler: LambdaFunction;
  response: Reference;
}

class RdsInitializer extends Construct implements IRdsInitializer {
  readonly handler: LambdaFunction;
  readonly response: Reference;

  constructor(scope: Construct, id: string, props: RdsInitializerProps) {
    super(scope, id);

    this.handler = new DockerImageFunction(this, "handler", {
      code: props.fnCode,
      environment: props.fnEnvironment,
      memorySize: 256,
      timeout: Duration.minutes(5),
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
    });

    const rdsInitializerProvider = new Provider(this, "provider", {
      onEventHandler: this.handler,
    });

    new LogGroup(this, "log-group", {
      logGroupName: `/aws/lambda/${this.handler.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const rdsInitializerCustomResource = new CustomResource(this, "custom-resource", {
      serviceToken: rdsInitializerProvider.serviceToken,
      properties: {
        version: Date.now().toString(),
      },
    });

    this.response = rdsInitializerCustomResource.getAtt("message");
  }
}

export default RdsInitializer;

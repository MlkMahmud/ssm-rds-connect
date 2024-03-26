import { App, Stack, StackProps } from "aws-cdk-lib";
import {
  AmazonLinuxCpuType,
  AmazonLinuxImage,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  InterfaceVpcEndpointAwsService,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc
} from "aws-cdk-lib/aws-ec2";
import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  DatabaseSecret,
  PostgresEngineVersion,
} from "aws-cdk-lib/aws-rds";

class RootStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const databaseName = "postgres";

    const vpc = new Vpc(this, "vpc", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "public",
          subnetType: SubnetType.PUBLIC,
        },
        {
          name: "private",
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    vpc.addInterfaceEndpoint("ssm", {
      service: InterfaceVpcEndpointAwsService.SSM,
      subnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
    });

    vpc.addInterfaceEndpoint("ssm-messages", {
      service: InterfaceVpcEndpointAwsService.SSM_MESSAGES,
      subnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
    });

    const bastionServerSecurityGroup = new SecurityGroup(this, "bastion-server-sg", {
      allowAllOutbound: false,
      description: "Bastion server security group",
      vpc,
    });

    // bastion server
    new Instance(this, "bastion-server", {
      associatePublicIpAddress: false,
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      machineImage: new AmazonLinuxImage({
        cpuType: AmazonLinuxCpuType.X86_64,
        cachedInContext: false,
      }),
      securityGroup: bastionServerSecurityGroup,
      ssmSessionPermissions: true,
      vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
    });

    const databaseSecret = new DatabaseSecret(this, "database-credentials", {
      username: "mlkmahmud",
      dbname: databaseName,
    });

    const databaseSecurityGroup = new SecurityGroup(this, "database-sg", {
      allowAllOutbound: false,
      vpc,
    });

    const databaseInstance = new DatabaseInstance(this, "database", {
      allocatedStorage: 10,
      autoMinorVersionUpgrade: true,
      credentials: Credentials.fromSecret(databaseSecret),
      databaseName,
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_16,
      }),
      multiAz: false,
      securityGroups: [databaseSecurityGroup],
      storageEncrypted: true,
      vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
    });

    bastionServerSecurityGroup.addEgressRule(
      Peer.ipv4(vpc.vpcCidrBlock),
      Port.tcp(443),
      "Allow egress traffic to reach VPC endpoints"
    );

    bastionServerSecurityGroup.addEgressRule(
      Peer.ipv4(vpc.vpcCidrBlock),
      Port.tcp(5432),
      "Allow egress traffic to Postgres Database instance"
    );

    databaseSecurityGroup.addIngressRule(
      bastionServerSecurityGroup,
      Port.tcp(5432),
      "Allow ingress from bastion server"
    );
  }
}

export default RootStack;

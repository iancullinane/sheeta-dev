import { Stack, StackProps, Tags, Fn } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { GameServerStack } from '@ianpants/project-zomboid-server';
import { VpcBaseStack } from './nested/vpc';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';

import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as asg from "aws-cdk-lib/aws-autoscaling";

import * as fs from 'fs';

// Ubuntu 20.04 LTS
const amimap: Record<string, string> = {
  "us-east-2": "ami-0c15a71461028f685",
  "us-east-1": "ami-0f5513ad02f8d23ed",
}

export interface AppProps extends StackProps {
  project_name: string;
  region: string;
  tld: string,
  cloudInitUrl?: string;
  keyName: string;
}

export class DevAppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppProps) {
    super(scope, id, props);



    // env encryption key
    const encryptionKey = new kms.Key(this, `${props.project_name}-kms-key`, {
      enableKeyRotation: true,
    });

    // ec2 istance role and ssm policy
    let role = new iam.Role(this, "ec2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

    // hosted zones are held in the `certs` stack local to this app, certs and
    // hosted zones are exported and imported to seperate stack concerns
    const hostedZoneId = Fn.importValue('sheeta-dev-hz-id');
    // const hz = r53.HostedZone.fromHostedZoneId(this, `${props.project_name}-hz-lookup`, hostedZoneId);
    const hz = r53.HostedZone.fromHostedZoneAttributes(this, `${props.project_name}-hz-lookup`, {
      hostedZoneId: hostedZoneId,
      zoneName: props.tld,
    });


    const vpc = new VpcBaseStack(this, `${props.project_name}-vpc`, { name: props.project_name })

    // const userData = new ec2.MultipartUserData;
    const setupCommands = ec2.UserData.forLinux();

    setupCommands.addCommands(
      `echo "---- Install deps"`,
      `sudo add-apt-repository multiverse`,
      `sudo dpkg --add-architecture i386`,
      `sudo apt update`,
      `sudo apt install -y lib32gcc1 libsdl2-2.0-0:i386 docker.io awscli unzip`,
      `sudo snap start amazon-ssm-agent`,
      `echo "---- Done with initial deps"`
      // `aws s3 cp ${props.cloudInitUrl}/ /etc/systemd/system/ --recursive`
    );

    setupCommands.addCommands(
      `docker run -d --rm -p 8500:8500 -p 8600:8600/udp --name=-test-one consul agent -server -ui -node=server-1 -bootstrap-expect=1 -client=0.0.0.0`
    )


    const machineImage = ec2.MachineImage.genericLinux(amimap);

    const mySecurityGroup = new ec2.SecurityGroup(this, 'AsgSecurityGroup', { vpc: vpc.vpc });
    mySecurityGroup.addIngressRule(ec2.Peer.ipv4("108.49.70.185/32"), ec2.Port.tcp(22), 'Allow SSH Access')
    mySecurityGroup.addIngressRule(mySecurityGroup, ec2.Port.allTcp(), 'Allow same cluster access')

    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.LaunchTemplate.html
    console.log(setupCommands);
    new asg.AutoScalingGroup(this, 'ASG', {
      allowAllOutbound: true,
      associatePublicIpAddress: true,
      vpc: vpc.vpc,
      keyName: props.keyName,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      machineImage: machineImage,
      securityGroup: mySecurityGroup,
      userData: setupCommands,
      role: role,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      },
      // launchTemplate: serverTemplate,
      desiredCapacity: 1,
      maxCapacity: 1,
      minCapacity: 0,
    });
  }
}

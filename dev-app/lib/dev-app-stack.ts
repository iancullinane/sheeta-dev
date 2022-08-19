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
}

export class DevAppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppProps) {
    super(scope, id, props);



    // env encryption key
    // const encryptionKey = new kms.Key(this, 'Key', {
    //   enableKeyRotation: true,
    // });

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
    // new GameServerStack(this, 'project-zomboid-server', {
    //   infra: {
    //     region: props.region,
    //     vpc: vpc.vpc,
    //     key: encryptionKey,
    //     role: role,
    //     keyPair: "pz-sheeta-key",
    //     hz: hz,
    //     instancetype: "t2.medium", // prop
    //   },
    //   game: {
    //     distdir: "/mnt/sheeta",
    //     servername: "sheeta",
    //     public: true,
    //     modFile: fs.readFileSync(`assets/mods.txt`),
    //   }
    // })


    const asset = new Asset(this, 'Asset', {
      path: './lib/userdata'
    });

    // 
    // 

    // const userData = new ec2.MultipartUserData;
    const setupCommands = ec2.UserData.forLinux();

    setupCommands.addCommands(
      `echo "---- Install deps"`,
      `sudo add-apt-repository multiverse`,
      `sudo dpkg --add-architecture i386`,
      `sudo apt update`,
      `sudo apt install -y lib32gcc1 libsdl2-2.0-0:i386 docker.io awscli unzip`,
      `sudo snap start amazon-ssm-agent`,
      // `aws s3 cp ${props.cloudInitUrl}/ /etc/systemd/system/ --recursive`
    );

    let userdata = setupCommands.addS3DownloadCommand({
      bucket: asset.bucket,
      bucketKey: asset.s3ObjectKey,
    });
    setupCommands.addExecuteFileCommand({
      filePath: userdata,
      arguments: '--verbose -y'
    });
    asset.grantRead(role);




    const machineImage = ec2.MachineImage.genericLinux(amimap);

    const mySecurityGroup = new ec2.SecurityGroup(this, 'AsgSecurityGroup', { vpc: vpc.vpc });
    let serverTemplate = new ec2.LaunchTemplate(this, 'game-template', {
      userData: setupCommands,
      launchTemplateName: `game-server-instance`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      machineImage,
      securityGroup: mySecurityGroup,
      role: role,
      // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.LaunchTemplate.html
    });

    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.LaunchTemplate.html

    console.log(setupCommands);
    new asg.AutoScalingGroup(this, 'ASG', {
      vpc: vpc.vpc,
      // instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
      launchTemplate: serverTemplate,
      // machineImage: new ec2.AmazonLinuxImage(),

      maxCapacity: 1,
      minCapacity: 1,
    });
  }
}
//  let infra = {
//     vpc: vpcLookup.vpc, // should be derived
//     keyName: props.keyName,
//     region: props.region,
//     role: projectRole.role, // should be made here
//     subdomain: props.subdomain,
//     hostedzoneid: hzLookup.hz.hostedZoneId, // Should be derived
//     instancetype: props.instancetype, // should use some kind of map
//     sg: appSG, // should be here
//     hz: hzLookup.hz, // should be dervice
//     vol: vol, // made here? ephemeral solution?
//   }

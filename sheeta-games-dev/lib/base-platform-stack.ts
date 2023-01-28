
import { Stack, StackProps, Tags, Fn, Size, RemovalPolicy } from 'aws-cdk-lib';
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
import * as path from 'path';

import { Network } from './components/networking'
import { Sheeta } from './components/sheeta'

// Ubuntu 20.04 LTS
const amimap: Record<string, string> = {
  "us-east-2": "ami-0c15a71461028f685",
  "us-east-1": "ami-0f5513ad02f8d23ed",
}

const TEMPLATE_DIR = path.join(__dirname, "..", "assets", "templates")
const DIST_DIR = path.join(process.cwd(), "assets", "dist")

export interface BasePlatformStackProps extends StackProps {
  projectName: string;
  region: string;
  tld: string,
  // serverName: string;
  cloudInitUrl?: string;
  // keyName: string;
}

export class BasePlatformStack extends Stack {

  public readonly vpc: ec2.IVpc;

  constructor(scope: Construct, id: string, props: BasePlatformStackProps) {
    super(scope, id, props);



    // env encryption key
    const encryptionKey = new kms.Key(this, `${props.projectName}-kms-key`, {
      enableKeyRotation: true,
    });

    // ec2 istance role and ssm policy
    let role = new iam.Role(this, "ec2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );


    const network = new Network(this, `network-layer`, { tld: props.tld })

    const sheeta = new Sheeta(this, `sheeta`, { hosted_zone: network.hosted_zone })

    //     export interface SheetaProps {
    //   account: string;
    //   lambda_tag: string;
    //   hosted_zone: r53.IHostedZone;
    //   network: Network;
    // }


    // const vpc = new VpcBaseStack(this, `${props.projectName}-vpc`, { name: props.projectName })
    // let pzHz = new r53.PublicHostedZone(this, "HostedZoneDev", {
    //   zoneName: props.serverName + "." + hz.zoneName,
    // });

    // todo::This can probably be a downstream lookup
    // new r53.NsRecord(this, "NsForParentDomain", {
    //   zone: hz,
    //   recordName: pzHz.zoneName,
    //   values: pzHz.hostedZoneNameServers!,
    // });




    // // const userData = new ec2.MultipartUserData;
    // const setupCommands = ec2.UserData.forLinux();
    // setupCommands.addCommands(
    //   `echo "---- Install deps"`,
    //   `sudo add-apt-repository multiverse`,
    //   `sudo dpkg --add-architecture i386`,
    //   `sudo apt update`,
    //   `sudo apt install -y lib32gcc1 libsdl2-2.0-0:i386 docker.io awscli unzip`,
    //   `sudo snap start amazon-ssm-agent`,
    //   `echo "---- Done with initial deps"`
    //   // `aws s3 cp ${props.cloudInitUrl}/ /etc/systemd/system/ --recursive`
    // );

    // setupCommands.addCommands(
    //   `docker run -d --rm -p 8500:8500 -p 8600:8600/udp --name=-test-one consul agent -server -ui -node=server-1 -bootstrap-expect=1 -client=0.0.0.0`
    // );

    // const machineImage = ec2.MachineImage.genericLinux(amimap);
    // const mySecurityGroup = new ec2.SecurityGroup(this, 'AsgSecurityGroup', { vpc: vpc.vpc });
    // mySecurityGroup.addIngressRule(ec2.Peer.ipv4("108.49.70.185/32"), ec2.Port.tcp(22), 'Allow SSH Access')
    // mySecurityGroup.addIngressRule(mySecurityGroup, ec2.Port.allTcp(), 'Allow same cluster access')
    // // "pz UDP rule one " + props.player
    // mySecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udpRange(16261, 16269));
    // mySecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(8766));


    // // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.LaunchTemplate.html
    // new asg.AutoScalingGroup(this, 'ASG', {
    //   allowAllOutbound: true,
    //   associatePublicIpAddress: true,
    //   vpc: vpc.vpc,
    //   keyName: props.keyName,
    //   instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
    //   machineImage: machineImage,
    //   securityGroup: mySecurityGroup,
    //   userData: setupCommands,
    //   role: role,
    //   vpcSubnets: {
    //     subnetType: ec2.SubnetType.PUBLIC
    //   },
    //   desiredCapacity: 0,
    //   maxCapacity: 1,
    //   minCapacity: 0,
    // });


    // let vol = new ec2.Volume(this, `local-to-app-sheeta-vol`, {
    //   removalPolicy: RemovalPolicy.DESTROY,
    //   availabilityZone: 'us-east-2a',
    //   size: Size.gibibytes(30),
    //   encrypted: true,
    // })

    // let zomboidUserData = generateUserData(props.serverName, Stack.of(this).region, vol)
    // const s3UnitFile = new Asset(this, "pz-unit-file", {
    //   path: path.join(DIST_DIR, `units`, `${props.serverName}.service`),
    // });
    // s3UnitFile.grantRead(role);

    // const s3ConfigDir = new Asset(this, "pz-config-dir", {
    //   path: path.join(DIST_DIR, `server-config`),
    // });
    // s3ConfigDir.grantRead(role);


    // // Zip up config directory, I know this will zip because I am using the
    // // folder as my `localFile`
    // zomboidUserData.addS3DownloadCommand({
    //   bucket: s3ConfigDir.bucket!,
    //   bucketKey: s3ConfigDir.s3ObjectKey!,
    //   localFile: "/var/tmp/files/",
    // });

    // // This will be a single object because it is a filename
    // zomboidUserData.addS3DownloadCommand({
    //   bucket: s3UnitFile.bucket!,
    //   bucketKey: s3UnitFile.s3ObjectKey!,
    //   localFile: `/etc/systemd/system/${props.serverName}.service`,
    // });

    // // Place, enable, and start the service
    // zomboidUserData.addCommands(
    //   `mkdir -p /mnt/${props.serverName}/Server/`, // Just in case
    //   `unzip /var/tmp/files/${s3ConfigDir.s3ObjectKey} -d /mnt/${props.serverName}/Server/`,
    //   `chmod +x /etc/systemd/system/${props.serverName}.service`,
    //   `systemctl enable ${props.serverName}.service`,
    //   `systemctl start ${props.serverName}.service`,
    // );


    // // ----Start server
    // const instance = new ec2.Instance(this, "project-zomboid-ec2", {
    //   instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
    //   machineImage: machineImage,
    //   vpc: vpc.vpc,
    //   vpcSubnets: {
    //     subnetType: ec2.SubnetType.PUBLIC
    //   },
    //   keyName: props.keyName,
    //   securityGroup: mySecurityGroup,
    //   role: role,
    //   userData: zomboidUserData,
    // });
    // Tags.of(instance).add("game", `pz-${props.serverName}`);
    // vol.grantAttachVolumeByResourceTag(instance.grantPrincipal, [instance, vol], props.serverName);

    // new r53.ARecord(this, `PzARecord-${props.serverName}`, {
    //   zone: pzHz,
    //   target: r53.RecordTarget.fromIpAddresses(instance.instancePublicIp),
    // });

  }
}

import { Stack, StackProps, Tags, Fn } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SimpleVpc } from '@ianpants/pants-constructs';
import { GameServerStack } from '@ianpants/project-zomboid-server';

import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as r53 from 'aws-cdk-lib/aws-route53';

export interface AppProps extends StackProps {
  project_name: string;
  region: string;
  tld: string,
}

export class DevAppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppProps) {
    super(scope, id, props);

    // env encryption key
    const encryptionKey = new kms.Key(this, 'Key', {
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

    // The code that defines your stack goes here
    let dev_vpc = new SimpleVpc(this, `${props.project_name}-vpc`, {
      project_name: props.project_name,
    });
    Tags.of(dev_vpc).add('Name', `${props.project_name}-base-vpc`);
    Tags.of(dev_vpc).add('Environment', `dev`);



    new GameServerStack(this, 'project-zomboid-server', {
      infra: {
        region: props.region,
        vpc: dev_vpc.vpc,
        key: encryptionKey,
        role: role,
        keyPair: "pz-sheeta-key",
        hz: hz,
        instancetype: "t2.medium", // prop
      },
      game: {
        distdir: "/mnt/sheeta",
        servername: "sheeta",
        public: true,
      }
    })
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

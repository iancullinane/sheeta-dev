// import { Tags } from 'aws-cdk-lib';
// import * as ec2 from 'aws-cdk-lib/aws-ec2';
// import * as cdk from 'aws-cdk-lib';
// import { Construct } from 'constructs';
// import { SimpleVpc } from '@ianpants/pants-constructs';

// export interface VpcBaseProps extends cdk.NestedStackProps {
//   name: string,
// }

// export class VpcBaseStack extends cdk.NestedStack {
//   public readonly vpc: ec2.IVpc;

//   constructor(scope: Construct, id: string, props: VpcBaseProps) {
//     super(scope, id, props);

//     // The code that defines your stack goes here
//     this.vpc = new SimpleVpc(this, `vpc`, {
//       project_name: props.name,
//     }).vpc;
//     Tags.of(this.vpc).add('Name', `${props.name}-base-vpc`);
//     Tags.of(this.vpc).add('Environment', `dev`);
//   }
// }



import { Stack, StackProps, Tags, Fn, Size, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { Vpc, IVpc, NatProvider, SecurityGroup, InstanceType } from "aws-cdk-lib/aws-ec2";
import { GameServerStack } from '@ianpants/project-zomboid-server';

import { Asset } from 'aws-cdk-lib/aws-s3-assets';

import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as asg from "aws-cdk-lib/aws-autoscaling";

import * as fs from 'fs';
import * as path from 'path';


export interface NetworkProps {
  tld: string;
}

export class Network extends Construct {

  public readonly tld: r53.IHostedZone;
  public readonly vpc: ec2.IVpc;
  public readonly network_sg: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkProps) {
    super(scope, id);

    // hosted zones are created manually, their certs are a seperate stack
    this.tld = r53.HostedZone.fromLookup(this, `tld-hz-lookup`, {
      domainName: props.tld,
    });


    // Configure the `natGatewayProvider` when defining a Vpc
    const natGatewayProvider = NatProvider.instance({
      instanceType: new InstanceType("t2.micro"),
    });



    // The code that defines your stack goes here
    this.vpc = new Vpc(this, `base-vpc`, {
      maxAzs: 2,
      natGatewayProvider: natGatewayProvider,
    });


    this.network_sg = new SecurityGroup(this, 'SG', { vpc: this.vpc });


  }
}

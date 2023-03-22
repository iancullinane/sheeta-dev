
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
import { BaseRoles } from './components/roles'
import { Sheeta } from './components/sheeta'
import { StaticSite } from './components/static-site'

// Ubuntu 20.04 LTS
const amimap: Record<string, string> = {
  "us-east-2": "ami-0c15a71461028f685",
  "us-east-1": "ami-0f5513ad02f8d23ed",
}

const TEMPLATE_DIR = path.join(__dirname, "..", "assets", "templates")
const DIST_DIR = path.join(process.cwd(), "assets", "dist")

export interface BasePlatformStackProps extends StackProps {
  projectName: string;
  accountId: string,
  region: string;
  tld: string,
  cloudInitUrl?: string;
}

export class BasePlatformStack extends Stack {

  public readonly vpc: ec2.IVpc;

  constructor(scope: Construct, id: string, props: BasePlatformStackProps) {
    super(scope, id, props);

    // env encryption key
    const encryptionKey = new kms.Key(this, `${props.projectName}-kms-key`, {
      enableKeyRotation: true,
    });

    let roles = new BaseRoles(this, "base-roles")
    const network = new Network(this, `network-layer`, { tld: props.tld })

    console.log(`Using network\nVPC ID:\t${network.vpc.vpcId}\nHosted Zone:\t${network.hosted_zone.zoneName}`)

    // Deploy the Sheeta application lambda allowing for Discord integration
    new Sheeta(this, `sheeta`, {
      network,
      image_tag: "lambda-version",
      ssmSourceAccount: props.accountId,
    })

    // new StaticSite(this, `static-site`, {
    //   domainName: "iancullinane.com",
    // })
  }
}

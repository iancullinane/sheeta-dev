
import { Stack, StackProps, Tags, Fn, Size, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as path from 'path';

import * as kms from 'aws-cdk-lib/aws-kms';
import * as ec2 from "aws-cdk-lib/aws-ec2";

import { Network } from './components/networking'
import { BaseRoles } from './components/roles'
import { StaticSite } from './components/static-site'
import { Config } from '../lib/types';

// Ubuntu 20.04 LTS
const amimap: Record<string, string> = {
  "us-east-2": "ami-0c15a71461028f685",
  "us-east-1": "ami-0f5513ad02f8d23ed",
}

// const TEMPLATE_DIR = path.join(__dirname, "..", "assets", "templates")
// const DIST_DIR = path.join(process.cwd(), "assets", "dist")

export interface BasePlatformStackProps extends StackProps {
  cfg: Config,
}

export class BasePlatformStack extends Stack {

  public readonly vpc: ec2.IVpc;
  public readonly kmsKey: kms.IKey;
  public readonly network: Network;
  public readonly sites: StaticSite;

  constructor(scope: Construct, id: string, props: BasePlatformStackProps) {
    super(scope, id, props);

    // env encryption key
    this.kmsKey = new kms.Key(this, `kms-key`, {
      enableKeyRotation: true,
    });

    let roles = new BaseRoles(this, "base-roles")
    this.network = new Network(this, `network-layer`, { cfg: props.cfg })
    this.sites = new StaticSite(this, `static-site`, { cfg: props.cfg, network: this.network })


  }
}

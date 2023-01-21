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


// export interface AsgProps {
//   // tld: string;
// }

// export class AutoScalingGroup extends Construct {

//   // public readonly tld: r53.IHostedZone;
//   // public readonly vpc: ec2.IVpc;
//   // public readonly network_sg: ec2.ISecurityGroup;

//   constructor(scope: Construct, id: string, props: AsgProps) {
//     super(scope, id);

//   }
// }

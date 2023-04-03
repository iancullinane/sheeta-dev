import { Stack, StackProps, Tags, Fn, Size, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { Vpc, IVpc, NatProvider, SecurityGroup, InstanceType } from "aws-cdk-lib/aws-ec2";
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Config } from '../../lib/types';


export interface NetworkProps {
  cfg: Config;
}

export class Network extends Construct {
  public readonly hostedZones: r53.IHostedZone[];

  constructor(scope: Construct, id: string, props: NetworkProps) {
    super(scope, id);
    Array.from(props.cfg.networks.keys()).forEach(key => {
      console.log(key)
    });
    // props.cfg.networks.forEach((v, k) => {
    //   if (v.hostedZoneId && v.nsRecords) {
    //     throw new Error("Cannot declare a hosted zone ID and NS records at the same time");
    //   }

    //   let x = (Math.random() + 1).toString(36).substring(7);
    //   if (v.hostedZoneId) {
    //     var hz = r53.HostedZone.fromLookup(this, `tld-hz-lookup-${x}`, {
    //       domainName: k,
    //     });
    //     this.hostedZones.push(hz);
    //   } else if (v.nsRecords) {
    //     var hzWithNs = new r53.HostedZone(this, 'HostedZone', {
    //       zoneName: k,
    //     });

    //     new r53.NsRecord(this, 'NSRecord', {
    //       zone: hzWithNs,
    //       recordName: k,
    //       values: v.nsRecords,
    //     });
    //     this.hostedZones.push(hzWithNs);
    //   };
    // }
    // );
  }
};



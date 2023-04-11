import { Stack, StackProps, Tags, Fn, Size, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { Vpc, IVpc, NatProvider, SecurityGroup, InstanceType } from "aws-cdk-lib/aws-ec2";
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { Config, NetworkCfg } from '../../lib/types';


export interface NetworkProps {
  cfg: Config;
}

export class Network extends Construct {
  public readonly hostedZones: Map<string, r53.IHostedZone>;

  constructor(scope: Construct, id: string, props: NetworkProps) {
    super(scope, id);

    this.hostedZones = new Map<string, r53.IHostedZone>();

    for (const key in props.cfg.networks) {
      let temp = props.cfg.networks[key];

      if (temp.hostedZoneId && temp.nsRecords) {
        throw new Error("Cannot declare a hosted zone ID and NS records at the same time");
      }

      let x = (Math.random() + 1).toString(36).substring(7);
      if (temp.hostedZoneId) {
        var hz = r53.HostedZone.fromLookup(this, `tld-hz-lookup-${x}`, {
          domainName: key,
        });

        const cert = new acm.Certificate(this, 'Certificate', {
          domainName: key,
          subjectAlternativeNames: ["www." + key],
          validation: acm.CertificateValidation.fromDns(hz),
        });

        this.hostedZones.set(key, hz);
      } else if (temp.nsRecords) {
        var newHz = new r53.HostedZone(this, 'HostedZone', {
          zoneName: key,
        });

        this.hostedZones.set(key, newHz);

        // not actually needed but leaving as a reminder
        // new r53.NsRecord(this, 'NSRecord', {
        //   zone: hzWithNs,
        //   recordName: key,
        //   values: temp.nsRecords,
        // });
      };

    }

  }
};


    // for (const key in props.cfg.networks) {
    //   console.log(`${key}`)
    //   let temp = props.cfg.networks[key];
    //   console.log(temp)
    // }

// export interface Config {
//   name: string;
//   networks: Map<string, NetworkCfg>;
// }

// export interface NetworkCfg {
//   hostedZoneId?: string;
//   nsRecords?: string[];
//   subdomains?: string[];
// }

// for (const [key, value] of config.networks) {
//   console.log(`${key}: ${value}`)
// }

    // for (const [key, value] of props.cfg.networks) {
    //   console.log(`${key}: ${value}`)
    // }

      // if (v.hostedZoneId && v.nsRecords) {
      //   throw new Error("Cannot declare a hosted zone ID and NS records at the same time");
      // }

      // let x = (Math.random() + 1).toString(36).substring(7);
      // if (v.hostedZoneId) {
      //   var hz = r53.HostedZone.fromLookup(this, `tld-hz-lookup-${x}`, {
      //     domainName: k,
      //   });
      //   this.hostedZones.push(hz);
      // } else if (v.nsRecords) {
      //   var hzWithNs = new r53.HostedZone(this, 'HostedZone', {
      //     zoneName: k,
      //   });

      //   new r53.NsRecord(this, 'NSRecord', {
      //     zone: hzWithNs,
      //     recordName: k,
      //     values: v.nsRecords,
      //   });
      //   this.hostedZones.push(hzWithNs);
      // };

import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { BasicCert } from '@ianpants/pants-constructs';

export interface EnvCertsProps extends StackProps {
  project_name: string;
}


export class CertsStack extends Stack {
  constructor(scope: Construct, id: string, props: EnvCertsProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    let cert = new BasicCert(this, `sheeta-cert`, {
      project_name: "sheeta-certs",
      tld: "sheeta.cloud",
    })

    let certOutputId = `${props.project_name}-cert-arn`
    new CfnOutput(this, certOutputId, { value: cert.cert.certificateArn, exportName: `${props.project_name}-cert-arn` });
    let hzOutputId = `${props.project_name}-hz-id`
    new CfnOutput(this, hzOutputId, { value: cert.tld.hostedZoneId, exportName: `${props.project_name}-hz-id` });//

    // example resource
    // const queue = new sqs.Queue(this, 'CertsQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}

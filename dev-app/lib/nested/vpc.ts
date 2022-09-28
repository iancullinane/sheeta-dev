import { Tags } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SimpleVpc } from '@ianpants/pants-constructs';

export interface VpcBaseProps extends cdk.NestedStackProps {
  name: string,
}

export class VpcBaseStack extends cdk.NestedStack {
  public readonly vpc: ec2.IVpc;

  constructor(scope: Construct, id: string, props: VpcBaseProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    this.vpc = new SimpleVpc(this, `vpc`, {
      project_name: props.name,
    }).vpc;
    Tags.of(this.vpc).add('Name', `${props.name}-base-vpc`);
    Tags.of(this.vpc).add('Environment', `dev`);
  }
}

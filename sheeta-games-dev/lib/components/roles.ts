import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class BaseRoles extends Construct {

  public readonly ec2ServiceRole: iam.IRole;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.ec2ServiceRole = new iam.Role(this, "ec2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });
    this.ec2ServiceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

  }
}

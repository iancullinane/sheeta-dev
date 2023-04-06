import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class SourceBucketStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      bucketName: `sheeta-games-site-source`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    })

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'SourceBucketQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}

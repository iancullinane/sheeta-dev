#!/usr/bin/env node

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { CfnOutput, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as cfninc from 'aws-cdk-lib/cloudformation-include';
import { Config } from '../../lib/types';
import { Network } from './networking';
import { IHostedZone } from 'aws-cdk-lib/aws-route53';


export interface StaticSiteProps {
  cfg: Config
  network: Network
}

/**
 * Static site infrastructure, which deploys site content to an S3 bucket.
 *
 * The site redirects from HTTP to HTTPS, using a CloudFront distribution,
 * Route53 alias record, and ACM certificate.
 */
export class StaticSite extends Construct {
  constructor(parent: Stack, name: string, props: StaticSiteProps) {
    super(parent, name);

    // console.log(props.cfg)

    const contentBucket = s3.Bucket.fromBucketAttributes(this, 'ImportedContentBucket', {
      bucketArn: 'arn:aws:s3:::sheeta-games-site-source',
    });


    for (const site of props.cfg.sites) {
      console.log(site.tld)


      const websiteBucket = new s3.Bucket(this, `${site.tld}-site-bucket-bump-2`, {
        bucketName: site.tld,
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        websiteIndexDocument: 'index.html',
        publicReadAccess: true,
      })


      const deployment = new s3deploy.BucketDeployment(this, `${site.tld}-deployment`, {
        sources: [s3deploy.Source.bucket(contentBucket, `${site.tld}/release.zip`)],
        destinationBucket: websiteBucket,
      });

      if (props.network.hostedZones.get(site.tld) !== null) {

        // https://adamtheautomator.com/aws-s3-static-ssl-website/

        // new route53.CnameRecord(this, 'WwwRecord', {
        //   recordName: 'www',
        //   zone: props.network.hostedZones.get(site.tld) as IHostedZone,
        //   domainName: site.tld,
        // });

        // new route53.ARecord(this, 'AliasRecord', {
        //   zone: props.network.hostedZones.get(site.tld) as IHostedZone,
        //   recordName: site.tld,
        //   target: route53.RecordTarget.fromAlias(new targets.BucketWebsiteTarget(websiteBucket)),
        // });
      };
    }
  }
}


    // const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: props.domainName });
    // const siteDomain = props.domainName;
    // const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, 'cloudfront-OAI', {
    //   comment: `OAI for ${ name }`
    // });

    // // Content bucket
    // const siteBucket = new s3.Bucket(this, 'SiteBucket', {
    //   bucketName: siteDomain,
    //   publicReadAccess: false,
    //   blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

    //   /**
    //    * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
    //    * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
    //    * DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
    //    */
    //   removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code

    //   /**
    //    * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
    //    * setting will enable full cleanup of the demo.
    //    */
    //   autoDeleteObjects: true, // NOT recommended for production code
    // });

    // // Grant access to cloudfront
    // siteBucket.addToResourcePolicy(new iam.PolicyStatement({
    //   actions: ['s3:GetObject'],
    //   resources: [siteBucket.arnForObjects('*')],
    //   principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    // }));
    // new CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });

    // // TLS certificate
    // const certificate = new acm.Certificate(this, 'SiteCertificate', {
    //   domainName: siteDomain,
    //   subjectAlternativeNames: [`*.${ siteDomain }`],
    //   validation: acm.CertificateValidation.fromDnsMultiZone({
    //     'iancullinane.com': zone,
    //     '*.iancullinane.com': zone,

    //   }),
    // });
    // new CfnOutput(this, 'Certificate', { value: certificate.certificateArn });


    // // CloudFront distribution
    // const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
    //   certificate: certificate,
    //   defaultRootObject: "index.html",
    //   domainNames: [siteDomain],
    //   minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    //   errorResponses: [
    //     {
    //       httpStatus: 403,
    //       responseHttpStatus: 403,
    //       responsePagePath: '/error.html',
    //       ttl: Duration.minutes(30),
    //     }
    //   ],
    //   defaultBehavior: {
    //     origin: new cloudfront_origins.S3Origin(siteBucket, { originAccessIdentity: cloudfrontOAI }),
    //     compress: true,
    //     allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
    //     viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //   }
    // })

    // new CfnOutput(this, 'DistributionId', { value: distribution.distributionId });

    // // Route53 alias record for the CloudFront distribution
    // new route53.ARecord(this, 'SiteAliasRecord', {
    //   recordName: siteDomain,
    //   target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    //   zone
    // });

    // new route53.CnameRecord(this, 'WWWCnameRecord', {
    //   recordName: 'www.' + siteDomain,
    //   domainName: siteDomain,
    //   zone
    // })

    // // Deploy site contents to S3 bucket
    // new s3deploy.BucketDeployment(this, 'DeployWithInvalidation', {
    //   sources: [s3deploy.Source.asset('./site-contents')],
    //   destinationBucket: siteBucket,
    //   distribution,
    //   distributionPaths: ['/*'],
    // });


// 
// 
// 

    //
    //
    //
    // const cfnOriginAccessControl = new cloudfront.CfnOriginAccessControl(this, 'MyCfnOriginAccessControl', {
    //   originAccessControlConfig: {
    //     name: 'name',
    //     originAccessControlOriginType: 'originAccessControlOriginType',
    //     signingBehavior: 'signingBehavior',
    //     signingProtocol: 'signingProtocol',

    //     // the properties below are optional
    //     description: 'description',
    //   },
    // });

    // const oacTemplate = new cfninc.CfnInclude(this, 'Template', {
    //   templateFile: '../legacy-templates/oac.yaml',
    //   parameters: {
    //     'OACName': 'name',
    //   }
    // });
    // var oac = oacTemplate.getResource('OAC');

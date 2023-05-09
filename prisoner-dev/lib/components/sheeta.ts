import { Stack, StackProps, Tags, Fn, Size, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';// this.repo = ecr.Repository.fromRepositoryName(this, `Repository-${props.domainName}`, "adventurebrave.com")

import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as apigwv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { Network } from '../components/networking'
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { Console } from 'console';

const certArn = "arn:aws:acm:us-east-2:208744038881:certificate/469d11dc-2976-4221-8505-d5f560080baa";

export interface SheetaProps {
  image_tag: string;
  network: Network;
  ssmSourceAccount: string,
}

export class Sheeta extends Construct {

  public readonly repo: ecr.IRepository;
  public readonly gatewayDomain: apigwv2.IDomainName;
  public readonly cert: acm.ICertificate;

  constructor(scope: Construct, id: string, props: SheetaProps) {
    super(scope, id);

    var chatDomain = "chat." + props.network.hosted_zone.zoneName
    this.repo = ecr.Repository.fromRepositoryName(this, `sheeta-ecr-repo`, "adventurebrave.com")
    // TODO::If there is no repo use this:
    // this.repo = new ecr.Repository(this, `Repository-${props.projectName}-${tagger()}`, { repositoryName: fqdn });

    this.cert = new acm.Certificate(this, 'chat-bot-cert', {
      domainName: "chat.sheeta.cloud",
      validation: acm.CertificateValidation.fromDns(props.network.hosted_zone),
    })
    this.gatewayDomain = new apigwv2.DomainName(this, "chat-domain", {
      domainName: chatDomain,
      // FIXME::Pass cert arn via import
      certificate: acm.Certificate.fromCertificateArn(this, "cert", certArn),
    });

    const sheetaLambdaRole = new iam.Role(this, "sheeta-execution-role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    sheetaLambdaRole.grant(
      new iam.ServicePrincipal("lambda.amazonaws.com"),
      "sts:AssumeRole"
    );
    sheetaLambdaRole.grant(sheetaLambdaRole, "ssm:Describe*", "ssm:GetParam*");
    sheetaLambdaRole.attachInlinePolicy(
      new iam.Policy(this, "ssm-get-policy", {
        statements: [
          new iam.PolicyStatement({
            actions: ["ssm:Describe*", "ssm:GetParam*"],
            resources: [`arn:aws:ssm:us-east-2:${props.ssmSourceAccount}:parameter/*`],
          }),
          // placeholder but also example if bot were to manpiulate r53
          // new iam.PolicyStatement({
          //   actions: [
          //     "route53:GetHostedZone",
          //     "route53:ListResourceRecordSets",
          //     "route53:ListHostedZones",
          //     "route53:ChangeResourceRecordSets",
          //     "route53:ListResourceRecordSets",
          //     "route53:GetHostedZoneCount",
          //     "route53:ListHostedZonesByName"
          //   ],
          //   resources: TODO::...
          // }),
        ],
      })
    );

    // these two only required if your function lives in a VPC
    sheetaLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );
    sheetaLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaVPCAccessExecutionRole"
      )
    );

    const sheetaLambda = new lambda.DockerImageFunction(this, `docker-image-function`, {
      role: sheetaLambdaRole,
      environment: {
        CodeVersionString: props.image_tag,
      },
      code: lambda.DockerImageCode.fromEcr(this.repo, {
        tagOrDigest: props.image_tag,
      }),
    });



    const sheetaIntegration = new HttpLambdaIntegration(
      "sheetaIntergration",
      sheetaLambda
    );

    // requires the apigateway created above
    const api = new apigwv2.HttpApi(this, "Sheeta", {
      defaultDomainMapping: {
        domainName: this.gatewayDomain,
      },
    });

    api.addRoutes({
      path: "/v1/{proxy+}",
      methods: [apigwv2.HttpMethod.ANY],
      integration: sheetaIntegration,
    });

    // let chatHostedZone = r53.HostedZone.fromLookup(this, "zone", { domainName: chatDomain })
    let chatHostedZone = r53.HostedZone.fromHostedZoneAttributes(this, "zone", {
      hostedZoneId: `Z007497529J1W1NII98KE`,
      zoneName: chatDomain,
    })

    // // ------ Networking
    new r53.ARecord(this, `ARecord-chat-domain`, {
      zone: chatHostedZone,
      // zone: props.network.hosted_zone,
      target: r53.RecordTarget.fromAlias(
        new targets.ApiGatewayv2DomainProperties(
          this.gatewayDomain.regionalDomainName,
          this.gatewayDomain.regionalHostedZoneId
        )
      ),
    });

    // FIXME::When a HZ is created in another stack or is private, it will be 
    // on the property, should have a non-hardcoding solution
    let nsRecords: string[] = ["ns-118.awsdns-14.com.", "ns-698.awsdns-23.net.", "ns-1865.awsdns-41.co.uk.", "ns-1094.awsdns-08.org."]
    new r53.NsRecord(this, "tld-ns-record", {
      zone: props.network.hosted_zone,
      values: nsRecords,
      recordName: chatDomain,
    })


  }
}

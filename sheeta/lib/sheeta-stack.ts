import { Stack, StackProps, Fn, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as apigwv2 from "@aws-cdk/aws-apigatewayv2-alpha";

export interface ConfigProps extends StackProps {
  projectName: string,
  appSha: string,
  domainName: string,
  repoName: string,
}

export class SheetaStack extends Stack {
  declare sha: string;
  repo: ecr.IRepository;
  cert: acm.ICertificate;
  topDomain: route53.IHostedZone;
  gatewayDomain: apigwv2.IDomainName;
  constructor(scope: Construct, id: string, props: ConfigProps) {
    super(scope, id, props);

    this.sha = props.appSha;

    // hosted zones are held in the `certs` stack local to this app, certs and
    // hosted zones are exported and imported to seperate stack concerns
    // TODO::This export is lies
    const hostedZoneId = Fn.importValue('sheeta-dev-hz-id');
    console.log(hostedZoneId)
    this.topDomain = route53.HostedZone.fromHostedZoneAttributes(this, `hz-lookup`, {
      hostedZoneId: hostedZoneId,
      zoneName: props.domainName,
    });

    this.repo = ecr.Repository.fromRepositoryName(this, `Repository-${props.domainName}`, "adventurebrave.com")
    // this.repo.cre
    // this.cert = new acm.Certificate(this, 'chat-bot-cert', {
    //   domainName: `${props.domainName}`,
    //   validation: acm.CertificateValidation.fromDns(this.topDomain),
    // })
    this.gatewayDomain = new apigwv2.DomainName(this, "chat-domain", {
      domainName: `${props.domainName}`,
      certificate: acm.Certificate.fromCertificateArn(this, "cert", "arn:aws:acm:us-east-2:208744038881:certificate/469d11dc-2976-4221-8505-d5f560080baa"),
    });

    // ---- Lambda and the container

    // Drone builds and tags from the lambda base image, "requires" a AWS
    // provided image to build easily

    const sheetaLambdaRole = new iam.Role(this, "sheeta-execution-role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    sheetaLambdaRole.grant(
      new iam.ServicePrincipal("lambda.amazonaws.com"),
      "sts:AssumeRole"
    );
    sheetaLambdaRole.grant(sheetaLambdaRole, "ssm:Describe*", "ssm:GetParam*");
    sheetaLambdaRole.attachInlinePolicy(
      new iam.Policy(this, "client-policies", {
        statements: [
          new iam.PolicyStatement({
            actions: ["cloudformation:*"],
            resources: ["*"],
          }),
          new iam.PolicyStatement({
            actions: ["ec2:*"],
            resources: ["*"],
            conditions: {
              'ForAllValues:StringEquals': {
                'aws:TagKeys': ["sheeta"]
              }
            }
          }),
          new iam.PolicyStatement({
            actions: ["s3:*"],
            resources: ["*"],
            conditions: {
              'ForAllValues:StringEquals': {
                'aws:TagKeys': ["sheeta"]
              }
            }
          }),
        ]
      })
    )
    sheetaLambdaRole.attachInlinePolicy(
      new iam.Policy(this, "ssm-get-policy", {
        statements: [
          new iam.PolicyStatement({
            actions: ["ssm:Describe*", "ssm:GetParam*"],
            resources: [`arn:aws:ssm:us-east-2:${Stack.of(this).account}:parameter/*`],
          }),
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

    // Resource handler returned message: "Source image 208744038881.dkr.ecr.us-east-2.amazonaws.com/string:c87c868b45afca160f49ff3bcfb0862dd516222f does not exist. Provide a valid source image. (Service: Lambda, Status Code: 400, Request ID: c716d61c-7f59-424c-8436-d6ac704f61b2)" (RequestToken: eb47c9b5-6607-74e9-cda3-db61c5af7bce, HandlerErrorCode: InvalidRequest)
    const sheetaLambda = new lambda.DockerImageFunction(this, `ECRFunction-${props.domainName}`, {
      role: sheetaLambdaRole,
      timeout: Duration.minutes(5),
      environment: {
        CodeVersionString: this.sha,
      },
      code: lambda.DockerImageCode.fromEcr(this.repo, {
        tagOrDigest: this.sha,
      }),
    });

    const sheetaIntegration = new HttpLambdaIntegration(
      "sheetaIntergration",
      sheetaLambda
    );

    // requires the apigateway created above
    // uses the experimental branch, pins to its own version outsid of cdk lib
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-apigatewayv2-alpha-readme.html
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

    //
    // ------ Networking
    new route53.ARecord(this, `ARecord-${props.domainName}.${props.domainName}.`, {
      zone: this.topDomain,
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGatewayv2DomainProperties(
          this.gatewayDomain.regionalDomainName,
          this.gatewayDomain.regionalHostedZoneId
        )
      ),
    });

  }
}

#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SheetaStack } from '../lib/sheeta-stack';

import * as fs from 'fs';

var lclCfg = JSON.parse(fs.readFileSync('../config/base.json', 'utf-8'));
const env = { region: lclCfg.project.region, account: lclCfg.project.account };

const app = new cdk.App();
new SheetaStack(app, 'SheetaStack', {
  env,
  projectName: "chat",
  appSha: "c87c868b45afca160f49ff3bcfb0862dd516222f",
  domainName: "chat.sheeta.cloud",
  repoName: "sheeta.cloud",

  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

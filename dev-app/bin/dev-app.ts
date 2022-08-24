#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as fs from "fs";
import { DevAppStack } from '../lib/dev-app-stack';

interface LocalConfig {
  account: string
  region: string
  env: string
}

var lclCfg = JSON.parse(fs.readFileSync('../config/base.json', 'utf-8'));
const env = { region: lclCfg.project.region, account: lclCfg.project.account };

const app = new cdk.App({
  context: {
    users: {
      eignhpants: "108.49.70.185/32"
    },
  }
});
new DevAppStack(app, 'DevAppStack', {
  env,
  project_name: "sheeta-dev",
  region: env.region,
  tld: "sheeta.cloud",
  keyName: "pz-sheeta-key",
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

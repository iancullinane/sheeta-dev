#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as fs from "fs";
import { BasePlatformStack } from '../lib/base-platform-stack';


var lclCfg = JSON.parse(fs.readFileSync('../config/base.json', 'utf-8'));
const env = { region: lclCfg.platform.region, account: lclCfg.platform.account };

const app = new cdk.App()

new BasePlatformStack(app, lclCfg.project.name, {
  env,
  projectName: lclCfg.project.name,
  region: env.region,
  tld: lclCfg.network.tld,
  accountId: lclCfg.platform.account,
});

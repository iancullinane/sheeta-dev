#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as fs from "fs";
import { BasePlatformStack } from '../lib/base-platform-stack';
import { Config } from '../lib/types';


var lclCfg = JSON.parse(fs.readFileSync('../config/dev.json', 'utf-8')) as Config;
const env = { region: lclCfg.env.region, account: lclCfg.env.account };

const app = new cdk.App()

new BasePlatformStack(app, `${lclCfg.name}-stack`, {
  cfg: lclCfg,
  env,

});


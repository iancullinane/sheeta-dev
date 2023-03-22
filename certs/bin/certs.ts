#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as fs from "fs";
import { CertsStack } from '../lib/certs-stack';

interface LocalConfig {
  account: string
  region: string
  env: string
}

var lclCfg = JSON.parse(fs.readFileSync('../config/base.json', 'utf-8')) as LocalConfig;
const env = { region: lclCfg.region, account: lclCfg.account };

const app = new cdk.App();
new CertsStack(app, 'CertsStack', {
  project_name: "sheeta-dev",
  env,

});

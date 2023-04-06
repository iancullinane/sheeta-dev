
// 
//   Types
// ---------

export interface Config {
  name: string;
  env: EnvironCfg;
  networks: Record<string, NetworkCfg>;
  sites: StaticSiteCfg[];
}

export interface NetworkCfg {
  hostedZoneId?: string;
  nsRecords?: string[];
  subdomains?: string[];
}

export interface EnvironCfg {
  account: string;
  region: string;
}

export interface StaticSiteCfg {
  tld: string;
}

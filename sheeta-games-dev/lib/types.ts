
// 
//   Types
// ---------

export interface Config {
  name: string;
  env: EnvironCfg;
  networks: Map<string, NetworkCfg>;
}

export interface EnvironCfg {
  account: string;
  region: string;
}

export interface NetworkCfg {
  hostedZoneId?: string
  nsRecords?: string[];
  subdomains?: string[];
}

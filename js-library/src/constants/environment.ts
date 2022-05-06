import { Environments } from '../model/environments.enum'
import { Environment } from '../model/environment.model'
import { EthAddress } from '../model'

export type EnvironmentConfigs = { [environment in Environments]: Environment }

export const ENVIRONMENT_CONFIGS: EnvironmentConfigs = {
  [Environments.LOCALHOST]: {
    rpcUrl: 'http://127.0.0.1:9545/',
    contractAddresses: {
      ensRegistry: process.env.ENS_REGISTRY_ADDRESS as EthAddress,
      subdomainRegistrar: process.env.SUBDOMAIN_REGISTRAR_ADDRESS as EthAddress,
      publicResolver: process.env.PUBLIC_RESOLVER_ADDRESS as EthAddress,
    },
    performChecks: false,
  },
}

export function getEnvironmentConfig(environment: Environments): Environment {
  return ENVIRONMENT_CONFIGS[environment]
}

import { Environments } from '../model/environments.enum'
import { Environment } from '../model/environment.model'
import { EthAddress } from '../model'

export type EnvironmentConfigs = { [environment in Environments]: Environment }

export const ENVIRONMENT_CONFIGS: EnvironmentConfigs = {
  [Environments.LOCALHOST]: {
    rpcUrl: 'http://127.0.0.1:9545/',
    contractAddresses: {
      ensRegistry: process.env.DOCKER_ENS_REGISTRY_ADDRESS as EthAddress,
      fdsRegistrar: process.env.DOCKER_FDS_REGISTRAR_ADDRESS as EthAddress,
      publicResolver: process.env.DOCKER_PUBLIC_RESOLVER_ADDRESS as EthAddress,
    },
    performChecks: false,
  },
  [Environments.GOERLI]: {
    rpcUrl: 'https://goerli.net/',
    contractAddresses: {
      ensRegistry: process.env.GOERLI_ENS_REGISTRY_ADDRESS as EthAddress,
      fdsRegistrar: process.env.GOERLI_FDS_REGISTRAR_ADDRESS as EthAddress,
      publicResolver: process.env.GOERLI_PUBLIC_RESOLVER_ADDRESS as EthAddress,
    },
    performChecks: false,
  },
}

export function getEnvironmentConfig(environment: Environments): Environment {
  return ENVIRONMENT_CONFIGS[environment]
}

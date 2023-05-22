import { Environments } from '../model/environments.enum'
import { DappRegistryEnvironment, EnsEnvironment } from '../model/environment.model'
import { EthAddress } from '../model'

export type EnsEnvironmentConfigs = { [environment in Environments]: EnsEnvironment }
export type DappRegistryEnvironmentConfigs = { [environment in Environments]: DappRegistryEnvironment }

export const ENS_ENVIRONMENT_CONFIGS: EnsEnvironmentConfigs = {
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
    rpcUrl: 'https://xdai.dev.fairdatasociety.org/',
    contractAddresses: {
      ensRegistry: process.env.GOERLI_ENS_REGISTRY_ADDRESS as EthAddress,
      fdsRegistrar: process.env.GOERLI_FDS_REGISTRAR_ADDRESS as EthAddress,
      publicResolver: process.env.GOERLI_PUBLIC_RESOLVER_ADDRESS as EthAddress,
    },
    performChecks: false,
  },
  [Environments.SEPOLIA]: {
    rpcUrl: 'https://rpc.sepolia.org/',
    contractAddresses: {
      ensRegistry: process.env.SEPOLIA_ENS_REGISTRY_ADDRESS as EthAddress,
      fdsRegistrar: process.env.SEPOLIA_FDS_REGISTRAR_ADDRESS as EthAddress,
      publicResolver: process.env.SEPOLIA_PUBLIC_RESOLVER_ADDRESS as EthAddress,
    },
    performChecks: false,
  },
}

export const DAPP_REGISTRY_ENVIRONMENT_CONFIGS: DappRegistryEnvironmentConfigs = {
  [Environments.LOCALHOST]: {
    rpcUrl: 'http://127.0.0.1:9545/',
    dappRegistryAddress: process.env.DOCKER_DAPP_REGISTRY_ADDRESS as EthAddress,
    ratingsAddress: process.env.DOCKER_RATINGS_ADDRESS as EthAddress,
  },
  [Environments.GOERLI]: {
    rpcUrl: 'https://xdai.dev.fairdatasociety.org/',
    dappRegistryAddress: process.env.GOERLI_DAPP_REGISTRY_ADDRESS as EthAddress,
    ratingsAddress: process.env.GOERLI_RATINGS_ADDRESS as EthAddress,
  },
  [Environments.SEPOLIA]: {
    rpcUrl: 'https://rpc.sepolia.org/',
    dappRegistryAddress: process.env.SEPOLIA_DAPP_REGISTRY_ADDRESS as EthAddress,
    ratingsAddress: process.env.SEPOLIA_RATINGS_ADDRESS as EthAddress,
  },
}

export function getEnsEnvironmentConfig(environment: Environments): EnsEnvironment {
  return ENS_ENVIRONMENT_CONFIGS[environment]
}

export function getDappRegistryEnvironmentConfig(environment: Environments): DappRegistryEnvironment {
  return DAPP_REGISTRY_ENVIRONMENT_CONFIGS[environment]
}

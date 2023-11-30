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
      reverseResolver: process.env.DOCKER_REVERSE_RESOLVER_ADDRESS as EthAddress,
      nameResolver: process.env.DOCKER_NAME_RESOLVER_ADDRESS as EthAddress,
    },
    gasEstimation: Number(process.env.DOCKER_GAS_ESTIMATION),
    performChecks: false,
  },
  [Environments.GOERLI]: {
    rpcUrl: 'https://xdai.dev.fairdatasociety.org/',
    contractAddresses: {
      ensRegistry: process.env.GOERLI_ENS_REGISTRY_ADDRESS as EthAddress,
      fdsRegistrar: process.env.GOERLI_FDS_REGISTRAR_ADDRESS as EthAddress,
      publicResolver: process.env.GOERLI_PUBLIC_RESOLVER_ADDRESS as EthAddress,
      reverseResolver: process.env.GOERLI_REVERSE_RESOLVER_ADDRESS as EthAddress,
      nameResolver: process.env.GOERLI_NAME_RESOLVER_ADDRESS as EthAddress,
    },
    gasEstimation: Number(process.env.GOERLI_GAS_ESTIMATION),
    performChecks: false,
  },
  [Environments.SEPOLIA]: {
    rpcUrl: 'https://sepolia.dev.fairdatasociety.org/',
    contractAddresses: {
      ensRegistry: process.env.SEPOLIA_ENS_REGISTRY_ADDRESS as EthAddress,
      fdsRegistrar: process.env.SEPOLIA_FDS_REGISTRAR_ADDRESS as EthAddress,
      publicResolver: process.env.SEPOLIA_PUBLIC_RESOLVER_ADDRESS as EthAddress,
      reverseResolver: process.env.SEPOLIA_REVERSE_RESOLVER_ADDRESS as EthAddress,
      nameResolver: process.env.SEPOLIA_NAME_RESOLVER_ADDRESS as EthAddress,
    },
    gasEstimation: Number(process.env.SEPOLIA_GAS_ESTIMATION),
    performChecks: false,
  },
  [Environments.OPTIMISM_GOERLI]: {
    rpcUrl: 'https://optimism-goerli.publicnode.com',
    contractAddresses: {
      ensRegistry: process.env.OPTIMISM_GOERLI_ENS_REGISTRY_ADDRESS as EthAddress,
      fdsRegistrar: process.env.OPTIMISM_GOERLI_FDS_REGISTRAR_ADDRESS as EthAddress,
      publicResolver: process.env.OPTIMISM_GOERLI_PUBLIC_RESOLVER_ADDRESS as EthAddress,
      reverseResolver: process.env.OPTIMISM_GOERLI_REVERSE_RESOLVER_ADDRESS as EthAddress,
      nameResolver: process.env.OPTIMISM_GOERLI_NAME_RESOLVER_ADDRESS as EthAddress,
    },
    gasEstimation: Number(process.env.OPTIMISM_GOERLI_GAS_ESTIMATION),
    performChecks: false,
  },
  [Environments.ARBITRUM_GOERLI]: {
    rpcUrl: 'https://arbitrum-goerli.rpc.thirdweb.com',
    contractAddresses: {
      ensRegistry: process.env.ARBITRUM_GOERLI_ENS_REGISTRY_ADDRESS as EthAddress,
      fdsRegistrar: process.env.ARBITRUM_GOERLI_FDS_REGISTRAR_ADDRESS as EthAddress,
      publicResolver: process.env.ARBITRUM_GOERLI_PUBLIC_RESOLVER_ADDRESS as EthAddress,
      reverseResolver: process.env.ARBITRUM_GOERLI_REVERSE_RESOLVER_ADDRESS as EthAddress,
      nameResolver: process.env.ARBITRUM_GOERLI_NAME_RESOLVER_ADDRESS as EthAddress,
    },
    gasEstimation: Number(process.env.ARBITRUM_GOERLI_GAS_ESTIMATION),
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
    rpcUrl: 'https://sepolia.dev.fairdatasociety.org/',
    dappRegistryAddress: process.env.SEPOLIA_DAPP_REGISTRY_ADDRESS as EthAddress,
    ratingsAddress: process.env.SEPOLIA_RATINGS_ADDRESS as EthAddress,
  },
  [Environments.OPTIMISM_GOERLI]: {
    rpcUrl: 'https://optimism-goerli.publicnode.com',
    dappRegistryAddress: process.env.OPTIMISM_GOERLI_DAPP_REGISTRY_ADDRESS as EthAddress,
    ratingsAddress: process.env.OPTIMISM_GOERLI_RATINGS_ADDRESS as EthAddress,
  },
  [Environments.ARBITRUM_GOERLI]: {
    rpcUrl: 'https://arbitrum-goerli.rpc.thirdweb.com',
    dappRegistryAddress: process.env.ARBITRUM_GOERLI_DAPP_REGISTRY_ADDRESS as EthAddress,
    ratingsAddress: process.env.ARBITRUM_GOERLI_RATINGS_ADDRESS as EthAddress,
  },
}

export function getEnsEnvironmentConfig(environment: Environments): EnsEnvironment {
  return ENS_ENVIRONMENT_CONFIGS[environment]
}

export function getDappRegistryEnvironmentConfig(environment: Environments): DappRegistryEnvironment {
  return DAPP_REGISTRY_ENVIRONMENT_CONFIGS[environment]
}

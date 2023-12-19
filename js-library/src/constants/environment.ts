import { Environments } from '../model/environments.enum'
import { DappRegistryEnvironment, DataHubEnvironment, EnsEnvironment } from '../model/environment.model'
import { EthAddress } from '../model'

export type EnsEnvironmentConfigs = { [environment in Environments]: EnsEnvironment }
export type DappRegistryEnvironmentConfigs = { [environment in Environments]: DappRegistryEnvironment }
export type DataHubEnvironmentConfigs = { [environment in Environments]: DataHubEnvironment }

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
    gasEstimation: 268359,
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
    gasEstimation: 268359,
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
    gasEstimation: 268359,
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
    gasEstimation: 268359,
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
    gasEstimation: 268359,
    performChecks: false,
  },
  [Environments.ZKEVM_TESTNET]: {
    rpcUrl: 'https://rpc.public.zkevm-test.net',
    contractAddresses: {
      ensRegistry: process.env.ZKEVM_TESTNET_ENS_REGISTRY_ADDRESS as EthAddress,
      fdsRegistrar: process.env.ZKEVM_TESTNET_FDS_REGISTRAR_ADDRESS as EthAddress,
      publicResolver: process.env.ZKEVM_TESTNET_PUBLIC_RESOLVER_ADDRESS as EthAddress,
      reverseResolver: process.env.ZKEVM_TESTNET_REVERSE_RESOLVER_ADDRESS as EthAddress,
      nameResolver: process.env.ZKEVM_TESTNET_NAME_RESOLVER_ADDRESS as EthAddress,
    },
    gasEstimation: 268359,
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
  [Environments.ZKEVM_TESTNET]: {
    rpcUrl: 'https://rpc.public.zkevm-test.net',
    dappRegistryAddress: process.env.ZKEVM_TESTNET_DAPP_REGISTRY_ADDRESS as EthAddress,
    ratingsAddress: process.env.ZKEVM_TESTNET_RATINGS_ADDRESS as EthAddress,
  },
}

export const DATA_HUB_ENVIRONMENT_CONFIGS: DataHubEnvironmentConfigs = {
  [Environments.LOCALHOST]: {
    rpcUrl: 'http://127.0.0.1:9545/',
    dataHubAddress: process.env.DOCKER_DATAHUB_ADDRESS as EthAddress,
  },
  [Environments.GOERLI]: {
    rpcUrl: 'https://xdai.dev.fairdatasociety.org/',
    dataHubAddress: process.env.GOERLI_DATAHUB_ADDRESS as EthAddress,
  },
  [Environments.SEPOLIA]: {
    rpcUrl: 'https://sepolia.dev.fairdatasociety.org/',
    dataHubAddress: process.env.SEPOLIA_DATAHUB_ADDRESS as EthAddress,
  },
  [Environments.OPTIMISM_GOERLI]: {
    rpcUrl: 'https://optimism-goerli.publicnode.com',
    dataHubAddress: process.env.OPTIMISM_GOERLI_DATAHUB_ADDRESS as EthAddress,
  },
  [Environments.ARBITRUM_GOERLI]: {
    rpcUrl: 'https://arbitrum-goerli.rpc.thirdweb.com',
    dataHubAddress: process.env.ARBITRUM_GOERLI_DATAHUB_ADDRESS as EthAddress,
  },
  [Environments.ZKEVM_TESTNET]: {
    rpcUrl: 'https://rpc.public.zkevm-test.net',
    dataHubAddress: process.env.ZKEVM_TESTNET_DATAHUB_ADDRESS as EthAddress,
  },
}

export function getEnsEnvironmentConfig(environment: Environments): EnsEnvironment {
  return ENS_ENVIRONMENT_CONFIGS[environment]
}

export function getDappRegistryEnvironmentConfig(environment: Environments): DappRegistryEnvironment {
  return DAPP_REGISTRY_ENVIRONMENT_CONFIGS[environment]
}

export function getDataHubEnvironmentConfig(environment: Environments): DataHubEnvironment {
  return DATA_HUB_ENVIRONMENT_CONFIGS[environment]
}

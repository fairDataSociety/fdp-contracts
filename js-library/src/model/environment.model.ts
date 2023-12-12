import { EthAddress } from './hex.types'

export interface EnsEnvironment {
  rpcUrl: string
  contractAddresses: {
    ensRegistry: EthAddress
    fdsRegistrar: EthAddress
    publicResolver: EthAddress
    reverseResolver: EthAddress
    nameResolver: EthAddress
  }
  /**
   * Gas estimation for executing the three required smart contract methods
   */
  gasEstimation: number
  performChecks: boolean
}

export interface DappRegistryEnvironment {
  rpcUrl: string
  dappRegistryAddress: EthAddress
  ratingsAddress: EthAddress
}

export interface DataHubEnvironment {
  rpcUrl: string
  dataHubAddress: EthAddress
}

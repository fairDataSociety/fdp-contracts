import { EthAddress } from './hex.types'

export interface EnsEnvironment {
  rpcUrl: string
  contractAddresses: {
    ensRegistry: EthAddress
    fdsRegistrar: EthAddress
    publicResolver: EthAddress
  }
  performChecks: boolean
}

export interface DappRegistryEnvironment {
  rpcUrl: string
  dappRegistryAddress: EthAddress
  ratingsAddress: EthAddress
}

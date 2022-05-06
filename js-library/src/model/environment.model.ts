import { EthAddress } from './hex.types'

export interface Environment {
  rpcUrl: string
  contractAddresses: {
    ensRegistry: EthAddress
    subdomainRegistrar: EthAddress
    publicResolver: EthAddress
  }
}

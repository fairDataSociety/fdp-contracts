import { EthAddress } from './hex.types'

export interface Environment {
  rpcUrl: string
  contractAddresses: {
    ensRegistry: EthAddress
    fdsRegistrar: EthAddress
    publicResolver: EthAddress
  }
  performChecks: boolean
}

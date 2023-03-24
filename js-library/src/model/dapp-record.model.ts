import { BigNumber } from 'ethers'
import { EthAddress, HexString, SwarmLocation } from './hex.types'

export interface DappRecord {
  creator: EthAddress
  location: SwarmLocation
  urlHash: HexString
  index: BigNumber
  creatorIndex: BigNumber
  timestamp: Date
}

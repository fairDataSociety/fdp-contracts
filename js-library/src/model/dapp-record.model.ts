import { BigNumber } from 'ethers'
import { EthAddress, HexString, RecordHash, SwarmLocation } from './hex.types'

export interface DappRecord {
  recordHash: RecordHash
  creator: EthAddress
  location: SwarmLocation
  urlHash: HexString
  edited: boolean
  index: BigNumber
  creatorIndex: BigNumber
  timestamp: Date
}

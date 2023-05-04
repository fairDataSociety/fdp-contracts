import { EthAddress, HexString } from './hex.types'

export interface Rating {
  rating: number
  review: HexString
  user: EthAddress
}

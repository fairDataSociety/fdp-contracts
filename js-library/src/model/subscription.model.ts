import { EthAddress, HexString, SwarmLocation } from './hex.types'

export interface Subscription {
  subHash: HexString
  fdpSellerNameHash: HexString
  seller: EthAddress
  swarmLocation: SwarmLocation
  price: bigint
  active: boolean
  earned: bigint
  bids: number
  sells: number
  reports: number
  daysValid: number
}

export interface SubscriptionRequest {
  fdpBuyerNameHash: HexString
  subHash: HexString
  requestHash: HexString
  buyer: EthAddress
  served: boolean
}

export interface Category {
  subIdxs: bigint[]
}

export interface ActiveBid {
  requestHash: HexString
  seller: EthAddress
  served: boolean
}

export interface SubItem {
  subHash: HexString
  unlockKeyLocation: HexString
  validTill: bigint
}

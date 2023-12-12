import { BigNumber } from 'ethers'

export interface UserStats {
  numSubRequests: BigNumber
  numSubItems: BigNumber
  numActiveBids: BigNumber
  numListedSubs: BigNumber
}

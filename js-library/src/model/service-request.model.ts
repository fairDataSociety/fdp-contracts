import { ContractTransaction } from 'ethers'

export interface ServiceRequest<Data> {
  stage: number
  data: Data
  completedTxs: ContractTransaction[]
  pendingTx?: ContractTransaction
}

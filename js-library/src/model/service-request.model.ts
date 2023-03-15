import { ContractTransaction } from 'ethers'

/**
 * Represents a complete state of some method composed of multiple transactions.
 */
export interface ServiceRequest<Data> {
  // Represents the stage in the method to determine which tranasction is completed
  stage: number
  // Any input data required by the invoked method
  data: Data
  // List of currently completed transaction inside the method
  completedTxs: ContractTransaction[]
  // Holds a pending transaction in the method if there is one
  pendingTx?: ContractTransaction
}

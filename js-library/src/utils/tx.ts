import { ContractTransaction } from 'ethers'

export async function waitTransaction(call: Promise<ContractTransaction>): Promise<void> {
  const tx = await call
  await tx.wait()
}

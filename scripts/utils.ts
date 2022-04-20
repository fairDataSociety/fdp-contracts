import { Transaction } from 'ethers'
import { ethers } from 'hardhat'

const INTERVAL = 1000
const MAX_INTERVAL = 15 * INTERVAL

export function waitForTransactionMined(tx: Transaction): Promise<void> {
  return new Promise((resolve, reject) => {
    let elapsedMs = 0
    const intervalHandle = setInterval(async () => {
      try {
        const txResult = await ethers.provider.getTransaction(tx.hash as string)
        if (txResult.blockNumber) {
          clearInterval(intervalHandle)
          return resolve()
        }
        elapsedMs += INTERVAL
        if (elapsedMs >= MAX_INTERVAL) {
          clearInterval(intervalHandle)
          reject(new Error('Transaction mining timeout has expired'))
        }
      } catch (error) {
        clearInterval(intervalHandle)
        reject(error)
      }
    }, INTERVAL)
  })
}

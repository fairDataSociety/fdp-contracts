import { ContractTransaction, providers } from 'ethers'
import { ServiceRequest } from '../model/service-request.model'

export async function waitTransaction(call: Promise<ContractTransaction>): Promise<void> {
  const tx = await call
  await tx.wait()
}

/**
 * Creates a new transaction or waits the pending one from the request object.
 * @param provider RPC provider
 * @param request a request object
 * @param sendTx function that creates a new transaction if needed
 * @param timeout how much time the function will wait until throws a timeout error
 */
export async function waitRequestTransaction(
  provider: providers.Provider,
  request: ServiceRequest<unknown>,
  sendTx: () => Promise<ContractTransaction>,
  timeout = 30000,
): Promise<void> {
  if (!request.pendingTx) {
    request.pendingTx = await sendTx()
  }

  const tx = request.pendingTx

  await new Promise<void>(async (resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      reject(new Error('Transaction timeout'))
    }, timeout)

    try {
      await provider.waitForTransaction(tx.hash)

      resolve()
    } catch (error) {
      reject(error)
      request.pendingTx = undefined
    } finally {
      clearTimeout(timeoutHandle)
    }
  })

  request.completedTxs.push(request.pendingTx)
  request.pendingTx = undefined
}

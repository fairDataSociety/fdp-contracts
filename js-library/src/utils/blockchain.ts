import { BigNumber, providers } from 'ethers'
import { EthAddress } from '../model'
import { GanacheError, TxError } from '../model/tx.exception'

export async function checkMinBalance(
  provider: providers.Provider,
  address: EthAddress,
  minBalance: BigNumber,
) {
  const balance = await provider.getBalance(address)
  if (balance < minBalance) {
    throw new Error('Not enough funds')
  }
}

export function isTxError(error: unknown): error is TxError {
  const txError = error as TxError
  return Boolean(txError.error && typeof txError.code === 'string' && typeof txError.reason === 'string')
}

export function isGanacheError(error: unknown): error is GanacheError {
  const ganacheError = error as GanacheError
  return Boolean(
    ganacheError.id &&
      typeof ganacheError.error?.message === 'string' &&
      ganacheError.error?.message.indexOf('revert') > 0,
  )
}

export function extractGanacheErrorMessage(error: GanacheError): string {
  const { message } = error.error
  return message.substring(message.indexOf('revert') + 7)
}

export function extractMessageFromFailedTx(exception: TxError): string {
  const errorBody = JSON.parse(exception.error.body)

  if (isGanacheError(errorBody)) {
    return extractGanacheErrorMessage(errorBody)
  }

  throw errorBody
}

import { BigNumber, providers } from 'ethers'
import { EthAddress } from '../model'

export async function assertMinBalance(
  provider: providers.Provider,
  address: EthAddress,
  minBalance: BigNumber,
) {
  const balance = await provider.getBalance(address)
  if (balance < minBalance) {
    throw new Error('Not enough funds')
  }
}

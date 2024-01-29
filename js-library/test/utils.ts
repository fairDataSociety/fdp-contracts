import { JsonRpcProvider, toBeHex, parseEther, zeroPadValue } from 'ethers'
import { ENS, Environments, getEnsEnvironmentConfig } from '../'
import { HexString } from '../src'

export function initEns(): ENS {
  return new ENS({
    ...getEnsEnvironmentConfig(Environments.LOCALHOST),
    performChecks: true,
  })
}

export async function topUpAddress(provider: JsonRpcProvider, address: string, amountInEther = '1') {
  const account = (await provider.listAccounts())[0]
  await provider.send('eth_sendTransaction', [
    {
      from: account,
      to: address,
      value: toBeHex(parseEther(amountInEther)),
    },
  ])

  await provider.send('evm_mine', [1])
}

export function toHash(value: number): HexString {
  return zeroPadValue(toBeHex(value), 32)
}

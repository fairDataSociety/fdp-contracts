import { providers, utils } from 'ethers'
import { ENS, Environments, getEnsEnvironmentConfig } from '../'
import { HexString } from '../src'

export function initEns(): ENS {
  return new ENS({
    ...getEnsEnvironmentConfig(Environments.LOCALHOST),
    performChecks: true,
  })
}

export async function topUpAddress(
  provider: providers.JsonRpcProvider,
  address: string,
  amountInEther = '1',
) {
  const account = (await provider.listAccounts())[0]
  await provider.send('eth_sendTransaction', [
    {
      from: account,
      to: address,
      value: utils.hexlify(utils.parseEther(amountInEther)),
    },
  ])

  await provider.send('evm_mine', [1])
}

export function toHash(value: number): HexString {
  return utils.hexZeroPad(utils.hexlify(value), 32)
}

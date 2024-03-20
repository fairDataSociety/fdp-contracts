import { Wallet, providers, utils } from 'ethers'
import { ENS, Environments, getEnsEnvironmentConfig } from '../'
import { HexString } from '../src'

export function initEns(): ENS {
  return new ENS({
    ...getEnsEnvironmentConfig(Environments.LOCALHOST),
    performChecks: true,
  })
}

/**
 * Lehmer random number generator with seed (minstd_rand in C++11)
 * !!! Very fast but not well distributed pseudo-random function !!!
 *
 * @param seed Seed for the pseudo-random generator
 */
function lrng(seed: number): () => number {
  return (): number => ((2 ** 31 - 1) & (seed = Math.imul(48271, seed))) / 2 ** 31
}

/**
 * Utility function for generating random Buffer
 * !!! IT IS NOT CRYPTO SAFE !!!
 * For that use `crypto.randomBytes()`
 *
 * @param length Number of bytes to generate
 * @param seed Seed for the pseudo-random generator
 */
function randomByteArray(length: number, seed = 500): Uint8Array {
  const rand = lrng(seed)
  const buf = new Uint8Array(length)

  for (let i = 0; i < length; ++i) {
    buf[i] = (rand() * 0xff) << 0
  }

  return buf
}

export function randomWallet(): Wallet {
  return new Wallet(randomByteArray(32))
}

export async function topUpAddress(
  provider: providers.JsonRpcProvider,
  address: string,
  amountInEther = '1',
) {
  const account = (await provider.listAccounts())[0]
  const tx = await provider.send('eth_sendTransaction', [
    {
      from: account,
      to: address,
      value: utils.parseEther(amountInEther).toHexString().replace(/^0x(0+)/, "0x"),
    },
  ])

  await provider.waitForTransaction(tx)
}

export function toHash(value: number): HexString {
  return utils.hexZeroPad(utils.hexlify(value), 32)
}

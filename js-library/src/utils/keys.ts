import { utils } from 'ethers'
import { isHexString } from 'ethers/lib/utils'

const { hexStripZeros } = utils

export function isPublicKeyValid(publicKey: string): boolean {
  return isHexString(publicKey) && hexStripZeros('0x' + publicKey.substring(4)) === '0x'
}

export function splitPublicKey(publicKey: string): [string, string] {
  if (!isHexString(publicKey)) {
    throw new Error('Public key is not a hex string.')
  }
  const publicKeyX = '0x' + publicKey.substring(4, 68)
  const publicKeyY = '0x' + publicKey.substring(68, 132)
  return [publicKeyX, publicKeyY]
}

export function joinPublicKey(publicKeyX: string, publicKeyY: string): string {
  if (!isHexString(publicKeyX) || !isHexString(publicKeyY)) {
    throw new Error('One or both public key parts are not hex strings.')
  }
  return '0x04' + publicKeyX.substring(2) + publicKeyY.substring(2)
}

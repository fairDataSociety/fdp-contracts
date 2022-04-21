import { hexStripZeros } from 'ethers/lib/utils'

export function isPublicKeyValid(publicKey: string): boolean {
  return hexStripZeros('0x' + publicKey.substring(4)) === '0x'
}

export function splitPublicKey(publicKey: string): [string, string] {
  const publicKeyX = '0x' + publicKey.substring(4, 68)
  const publicKeyY = '0x' + publicKey.substring(68, 132)
  return [publicKeyX, publicKeyY]
}

export function joinPublicKey(publicKeyX: string, publicKeyY: string): string {
  return '0x04' + publicKeyX.substring(2) + publicKeyY.substring(2)
}

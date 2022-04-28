import { utils } from 'ethers'
import { isHexString } from 'ethers/lib/utils'
import {
  HexString,
  PublicKey,
  PublicKeyX,
  PublicKeyY,
  PUBLIC_KEY_LENGTH,
  PUBLIC_KEY_PART_LENGTH,
} from '../model/hex.types'

const { hexStripZeros } = utils

export function isHexStringPublicKey(hexString: HexString): boolean {
  return isHexString(hexString) && hexString.length === PUBLIC_KEY_LENGTH
}

export function isHexStringPublicKeyPart(hexString: HexString): boolean {
  return isHexString(hexString) && hexString.length === PUBLIC_KEY_PART_LENGTH
}

export function isPublicKeyValid(publicKey: PublicKey): boolean {
  return isHexStringPublicKey(publicKey) && hexStripZeros('0x' + publicKey.substring(4)) !== '0x'
}

export function splitPublicKey(publicKey: PublicKey): [PublicKeyX, PublicKeyY] {
  if (!isPublicKeyValid(publicKey)) {
    throw new Error('Public key is not valid.')
  }
  const publicKeyX: PublicKeyX = ('0x' + publicKey.substring(4, PUBLIC_KEY_PART_LENGTH + 2)) as PublicKeyX
  const publicKeyY: PublicKeyY = ('0x' +
    publicKey.substring(PUBLIC_KEY_PART_LENGTH + 2, PUBLIC_KEY_LENGTH + 2)) as PublicKeyY
  return [publicKeyX, publicKeyY]
}

export function joinPublicKey(publicKeyX: PublicKeyX, publicKeyY: PublicKeyY): PublicKey {
  if (!isHexStringPublicKeyPart(publicKeyX) || !isHexStringPublicKeyPart(publicKeyY)) {
    throw new Error('One or both public key parts are not hex strings.')
  }
  return ('0x04' + publicKeyX.substring(2) + publicKeyY.substring(2)) as PublicKey
}

import { FlavoredType } from './flavored.type'

/**
 * Nominal type to represent hex strings WITH '0x' prefix.
 * For example for 32 bytes hex representation you have to use 68 length.
 * TODO: Make Length mandatory: https://github.com/ethersphere/bee-js/issues/208
 */
export type HexString<Length extends number = number> = FlavoredType<
  string & {
    readonly length: Length
  },
  'HexString'
>

export const ETH_ADDRESS_LENGTH = 42
export const PUBLIC_KEY_LENGTH = 132
export const PUBLIC_KEY_PART_LENGTH = (PUBLIC_KEY_LENGTH - 4) / 2 + 2

export type EthAddress = HexString<typeof ETH_ADDRESS_LENGTH>

export type PublicKey = HexString<typeof PUBLIC_KEY_LENGTH>

export type PublicKeyX = HexString<typeof PUBLIC_KEY_PART_LENGTH>

export type PublicKeyY = HexString<typeof PUBLIC_KEY_PART_LENGTH>

import { FlavoredType } from './flavored.type'

export const ETH_ADDRESS_LENGTH = 42
export const PUBLIC_KEY_LENGTH = 132
export const PUBLIC_KEY_PART_LENGTH = (PUBLIC_KEY_LENGTH - 4) / 2 + 2

export type HexString = FlavoredType<string, 'HexString'>
export type EthAddress = FlavoredType<string, 'EthAddress'>
export type PublicKey = FlavoredType<string, 'PublicKey'>
export type PublicKeyX = FlavoredType<string, 'PublicKeyX'>
export type PublicKeyY = FlavoredType<string, 'PublicKeyY'>
export type SwarmLocation = FlavoredType<string, 'SwarmLocation'>

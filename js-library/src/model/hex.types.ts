export const ETH_ADDRESS_LENGTH = 42
export const PUBLIC_KEY_LENGTH = 132
export const PUBLIC_KEY_PART_LENGTH = (PUBLIC_KEY_LENGTH - 4) / 2 + 2

export class HexString extends String {}
export class EthAddress extends HexString {}
export class PublicKey extends HexString {}
export class PublicKeyX extends HexString {}
export class PublicKeyY extends HexString {}

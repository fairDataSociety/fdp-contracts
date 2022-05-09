import { EthAddress, HexString, PublicKeyX, PublicKeyY } from './hex.types'

export interface EnsUserData {
  _addr: EthAddress
  _content: HexString
  _multihash: HexString
  _x: PublicKeyX
  _y: PublicKeyY
  _name: string
}

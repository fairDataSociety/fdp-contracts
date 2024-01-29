import { EthAddress, HexString } from './hex.types'

export interface TxError {
  reason: string
  code: string
  error: {
    reason: string
    code: string
    body: string
    error: {
      code: number
      data: {
        stack: string
        name: string
      }
    }
    requestBody: string
    requestMethod: string
    url: string
  }
  tx: {
    data: HexString
    to: EthAddress
    from: EthAddress
    gasPrice: { type: bigint; hex: HexString }
    type: number
    nonce: {}
    gasLimit: {}
    chainId: {}
  }
}

export interface GanacheError {
  id: number
  jsonrpc: string
  error: {
    message: string
    code: number
    data: {
      stack: string
      name: string
    }
  }
}

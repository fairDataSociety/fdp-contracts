import { BytesLike } from 'ethers'
export interface BMTChunkInclusionProof {
  span: BytesLike
  sisterSegments: BytesLike[]
}

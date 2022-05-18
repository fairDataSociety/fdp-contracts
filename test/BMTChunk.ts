import { makeChunk, makeSpan } from '@fairdatasociety/bmt-js'
import { expect } from 'chai'
import { arrayify, BytesLike, keccak256 } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { BMTChunk } from '../typechain'

describe('chunk', () => {
  const payload = new Uint8Array([1, 2, 3])
  let bmtlib: BMTChunk
  const SEGMENT_SIZE = 32
  const DEFAULT_SPAN_SIZE = 8
  before(async () => {
    const BMT = await ethers.getContractFactory('BMTChunk')
    bmtlib = await BMT.deploy()
    await bmtlib.deployed()
  })

  it('should retrieve the required segment pairs for inclusion proof and return a bmt root hash', async () => {
    const chunk = makeChunk(payload)
    const tree = chunk.bmt()
    const bmtHashOfPayload = chunk.address()
    expect(tree.length).equals(8)
    /** Gives back the bmt root hash calculated from the inclusion proof method */
    const testGetRootHash = (segmentIndex: number): Promise<String> => {
      const inclusionProofSegments = chunk.inclusionProof(segmentIndex)
      const proofSegment = chunk.data().slice(segmentIndex * SEGMENT_SIZE, segmentIndex * SEGMENT_SIZE + SEGMENT_SIZE)
      return bmtlib.rootHashFromInclusionProof(inclusionProofSegments, proofSegment, segmentIndex)
    }
    const rootHash1 = await testGetRootHash(0)
    const merged = Buffer.concat([makeSpan(payload.length), arrayify(rootHash1 as BytesLike)])
    expect(keccak256(merged)).equals(ethers.utils.hexlify(bmtHashOfPayload))
    const rootHash2 = await testGetRootHash(101)
    expect(rootHash2).equals(rootHash1)
    const rootHash3 = await testGetRootHash(127)
    expect(rootHash3).equals(rootHash1)

    try {
      await testGetRootHash(128)
    } catch (err) {
      expect(() => {
        throw err
      }).throws()
    }
  })

  it('should retrieve the required segment pairs for inclusion proof and return a chunk address', async () => {
    const chunk = makeChunk(payload)
    const tree = chunk.bmt()
    const bmtHashOfPayload = chunk.address()
    expect(tree.length).equals(8)
    /** Gives back the bmt root hash calculated from the inclusion proof method */
    const testGetChunkAddress = (segmentIndex: number, span: Uint8Array): Promise<String> => {
      const inclusionProofSegments = chunk.inclusionProof(segmentIndex)
      const proofSegment = chunk.data().slice(segmentIndex * SEGMENT_SIZE, segmentIndex * SEGMENT_SIZE + SEGMENT_SIZE)
      return bmtlib.chunkAddressFromInclusionProof(inclusionProofSegments, proofSegment, segmentIndex, span)
    }
    const span = makeSpan(payload.length, DEFAULT_SPAN_SIZE)
    const chunkAddress1 = await testGetChunkAddress(0, span)
    expect(chunkAddress1).equals(ethers.utils.hexlify(bmtHashOfPayload))
    const chunkAddress2 = await testGetChunkAddress(101, span)
    expect(chunkAddress2).equals(chunkAddress1)
    const chunkAddress3 = await testGetChunkAddress(127, span)
    expect(chunkAddress3).equals(chunkAddress1)

    try {
      await testGetChunkAddress(128, span)
    } catch (err) {
      expect(() => {
        throw err
      }).throws()
    }
  })
})

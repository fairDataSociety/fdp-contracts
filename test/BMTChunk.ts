import { makeChunk, makeSpan, Utils } from '@fairdatasociety/bmt-js'
import { expect } from 'chai'
import { arrayify, BytesLike, keccak256 } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { BMTChunk } from '../typechain'

describe('chunk', () => {
  const payload = new Uint8Array([1, 2, 3])
  let bmtlib: BMTChunk
  const SEGMENT_SIZE = 32
  before(async () => {
    let BMT = await ethers.getContractFactory('BMTChunk')
    bmtlib = await BMT.deploy()
    await bmtlib.deployed()
  })

  it('should retrieve the required segment pairs for inclusion proof', async () => {
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
    expect(keccak256(merged).replace('0x', '')).equals(Utils.bytesToHex(bmtHashOfPayload, 64))
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
})

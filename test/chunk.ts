import { makeChunk, makeSpan, Utils } from '@fairdatasociety/bmt-js'
import { expect } from 'chai'
import { arrayify, keccak256 } from 'ethers/lib/utils'
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
    const testGetRootHash = async (segmentIndex: number) => {
      const inclusionProofSegments = chunk.inclusionProof(segmentIndex)
      const proofSegment = chunk.data().slice(segmentIndex * SEGMENT_SIZE, segmentIndex * SEGMENT_SIZE + SEGMENT_SIZE)
      const rootHash = await bmtlib.rootHashFromInclusionProof(inclusionProofSegments, proofSegment, segmentIndex)
      return arrayify(rootHash)
    }
    const rootHash1 = await testGetRootHash(0)

    const merged = Buffer.concat([makeSpan(payload.length), rootHash1])
    expect(keccak256(merged).replace('0x', '')).equals(Utils.bytesToHex(bmtHashOfPayload, 64))
    const rootHash2 = await testGetRootHash(101)
    expect(Utils.bytesToHex(rootHash2, 64)).equals(Utils.bytesToHex(rootHash1, 64))
    const rootHash3 = await testGetRootHash(127)
    expect(Utils.bytesToHex(rootHash3, 64)).equals(Utils.bytesToHex(rootHash1, 64))

    try {
      await testGetRootHash(128)
    } catch (err) {
      expect(() => {
        throw err
      }).throws()
    }
  })
})

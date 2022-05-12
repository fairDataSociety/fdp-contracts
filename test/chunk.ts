import { makeChunk, makeSpan, Utils } from '@fairdatasociety/bmt-js'
import { expect } from 'chai'
import { arrayify, concat, keccak256 } from 'ethers/lib/utils'
import { ethers } from 'hardhat'

describe('chunk', () => {
  const payload = new Uint8Array([1, 2, 3])
  let BMT
  let bmtlib: any
  const SEGMENT_SIZE = 32
  before(async () => {
    BMT = await ethers.getContractFactory('BMTChunk')
    bmtlib = await BMT.deploy()
    await bmtlib.deployed()
  })

  it('should initialise Chunk object', () => {
    const chunk = makeChunk(payload)
    const expectedSpan = new Uint8Array([3, 0, 0, 0, 0, 0, 0, 0])

    expect(chunk.payload).equals(payload)
    expect(chunk.span().byteLength).eq(expectedSpan.byteLength)
    expect(chunk.data().length).equals(4096)
    expect(chunk.address().length).equals(32)
  })

  it('should produce correct BMT hash', () => {
    const hash = 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338'
    const chunk = makeChunk(payload)

    const result = chunk.address()

    expect(Utils.bytesToHex(result, 64)).equals(hash)
  })

  it('should test out bmtTree is in line with Chunk object calculations', () => {
    const chunk = makeChunk(payload)
    const tree = chunk.bmt()
    expect(tree.length).equals(8)
    const rootHash = tree[tree.length - 1]

    let merged = Buffer.concat([chunk.span(), rootHash])
    expect(ethers.utils.keccak256(merged).replace('0x', '')).equals(Utils.bytesToHex(chunk.address(), 64))
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

    let merged = Buffer.concat([makeSpan(payload.length), rootHash1])
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

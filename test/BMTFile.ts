import { Chunk, fileInclusionProofBottomUp, getSpanValue, makeChunkedFile, Utils } from '@fairdatasociety/bmt-js'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { BMTFile } from '../typechain'
import FS from 'fs'
import path from 'path'
import { hexlify } from 'ethers/lib/utils'

describe('file', () => {
  let bosBytes: Uint8Array
  let carrierChunkFileBytes: Uint8Array
  let bmtlib: BMTFile
  const SEGMENT_SIZE = 32
  before(async () => {
    const BMT = await ethers.getContractFactory('BMTFile')
    bmtlib = await BMT.deploy()
    await bmtlib.deployed()

    bosBytes = Uint8Array.from(FS.readFileSync(path.join(__dirname, 'test-files', 'The-Book-of-Swarm.pdf')))
    carrierChunkFileBytes = Uint8Array.from(FS.readFileSync(path.join(__dirname, 'test-files', 'carrier-chunk-blob')))
  })

  it('should find BMT position of the payload segment index', async () => {
    // edge case - carrier chunk
    const fileBytes = carrierChunkFileBytes
    const chunkedFile = makeChunkedFile(fileBytes)
    const tree = chunkedFile.bmt()
    const leafChunks = chunkedFile.leafChunks()
    // check whether the last chunk is not present in the BMT tree 0 level -> carrierChunk
    expect(tree[0].length).eq(leafChunks.length - 1)
    const carrierChunk = leafChunks.pop() as Chunk
    const segmentIndex = Math.floor((fileBytes.length - 1) / 32) // last segment index as well
    const lastChunkIndex = Math.floor((fileBytes.length - 1) / 4096)
    const segmentIdInTree = await bmtlib.getBmtIndexOfSegment(segmentIndex, lastChunkIndex)
    expect(segmentIdInTree[1]).eq(1)
    expect(segmentIdInTree[0]).eq(1)
    const chunkIndex = segmentIdInTree[0].toNumber()
    const level = segmentIdInTree[1].toNumber()
    expect(hexlify(tree[level][chunkIndex].address())).eq(hexlify(carrierChunk.address()))
  })

  it('should collect the required segments for inclusion proof', async () => {
    const fileBytes = carrierChunkFileBytes
    const chunkedFile = makeChunkedFile(fileBytes)
    const fileHash = chunkedFile.address()
    // segment to prove
    const lastSegmentIndex = Math.floor((fileBytes.length - 1) / 32)
    // check segment array length for carrierChunk inclusion proof
    const proofChunks = fileInclusionProofBottomUp(chunkedFile, lastSegmentIndex)
    expect(proofChunks.length).eq(2) // 1 level is skipped because the segment was in a carrierChunk

    /** Gives back the file hash calculated from the inclusion proof method */
    const testGetFileHash = async (segmentIndex: number): Promise<string> => {
      const proofChunks = fileInclusionProofBottomUp(chunkedFile, segmentIndex)
      let proveSegment = fileBytes.slice(segmentIndex * SEGMENT_SIZE, segmentIndex * SEGMENT_SIZE + SEGMENT_SIZE)
      // padding
      proveSegment = new Uint8Array([...proveSegment, ...new Uint8Array(SEGMENT_SIZE - proveSegment.length)])

      // check the last segment has the correct span value.
      const fileSizeFromProof = getSpanValue(proofChunks[proofChunks.length - 1].span)
      expect(fileSizeFromProof).eq(fileBytes.length)

      return bmtlib.fileAddressFromInclusionProof(proofChunks, proveSegment, segmentIndex)
    }

    // edge case
    const hash1 = await testGetFileHash(lastSegmentIndex)
    expect(hash1).eq(hexlify(fileHash))
    const hash2 = await testGetFileHash(1000)
    expect(hash2).eq(hexlify(fileHash))
  })

  it('should collect the required segments for inclusion proof 2', async () => {
    const fileBytes = bosBytes
    const chunkedFile = makeChunkedFile(fileBytes)
    const fileHash = chunkedFile.address()
    // segment to prove
    const lastSegmentIndex = Math.floor((fileBytes.length - 1) / 32)

    /** Gives back the file hash calculated from the inclusion proof method */
    const testGetFileHash = async (segmentIndex: number): Promise<string> => {
      const proofChunks = fileInclusionProofBottomUp(chunkedFile, segmentIndex)
      let proveSegment = fileBytes.slice(segmentIndex * SEGMENT_SIZE, segmentIndex * SEGMENT_SIZE + SEGMENT_SIZE)
      // padding
      proveSegment = new Uint8Array([...proveSegment, ...new Uint8Array(SEGMENT_SIZE - proveSegment.length)])

      // check the last segment has the correct span value.
      const fileSizeFromProof = getSpanValue(proofChunks[proofChunks.length - 1].span)
      expect(fileSizeFromProof).eq(fileBytes.length)
      return bmtlib.fileAddressFromInclusionProof(proofChunks, proveSegment, segmentIndex)
    }

    // edge case
    const hash1 = await testGetFileHash(lastSegmentIndex)
    expect(hash1.replace('0x', '')).eq(Utils.bytesToHex(fileHash, 64))
    const hash2 = await testGetFileHash(1000)
    expect(hash2.replace('0x', '')).eq(Utils.bytesToHex(fileHash, 64))

    try {
      await testGetFileHash(lastSegmentIndex + 1)
    } catch (err) {
      expect(() => {
        throw err
      }).throws(/^The given segment index/)
    }
  })

  it('should collect the required segments for inclusion proof 3', async () => {
    // the file's byte counts will cause carrier chunk in the intermediate BMT level
    // 128 * 4096 * 128 = 67108864 <- left tree is saturated on bmt level 1
    // 67108864 + 2 * 4096 = 67117056 <- add two full chunks at the end thereby
    // the zero level won't have carrier chunk, but its parent will be that.
    const carrierChunkFileBytes2 = Uint8Array.from(
      FS.readFileSync(path.join(__dirname, 'test-files', 'carrier-chunk-blob-2')),
    )
    expect(carrierChunkFileBytes2.length).eq(67117056)
    const fileBytes = carrierChunkFileBytes2
    const chunkedFile = makeChunkedFile(fileBytes)
    const fileHash = chunkedFile.address()
    // segment to prove
    const lastSegmentIndex = Math.floor((fileBytes.length - 1) / 32)

    /** Gives back the file hash calculated from the inclusion proof method */
    const testGetFileHash = async (segmentIndex: number): Promise<string> => {
      const proofChunks = fileInclusionProofBottomUp(chunkedFile, segmentIndex)
      const proveSegment = fileBytes.slice(segmentIndex * SEGMENT_SIZE, segmentIndex * SEGMENT_SIZE + SEGMENT_SIZE)

      // check the last segment has the correct span value.
      const fileSizeFromProof = getSpanValue(proofChunks[proofChunks.length - 1].span)
      expect(fileSizeFromProof).eq(fileBytes.length)

      return bmtlib.fileAddressFromInclusionProof(proofChunks, proveSegment, segmentIndex)
    }

    // edge case
    const hash1 = await testGetFileHash(lastSegmentIndex)
    expect(hash1.replace('0x', '')).eq(Utils.bytesToHex(fileHash, 64))
    const hash2 = await testGetFileHash(1000)
    expect(hash2.replace('0x', '')).eq(Utils.bytesToHex(fileHash, 64))

    try {
      await testGetFileHash(lastSegmentIndex + 1)
    } catch (err) {
      expect(() => {
        throw err
      }).throws(/^The given segment index/)
    }
  })
})

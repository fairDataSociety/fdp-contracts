// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BMTChunk {
  // max chunk payload size
  uint256 public constant MAX_CHUNK_PAYLOAD_SIZE = 4096;
  // segment byte size
  uint256 public constant SEGMENT_SIZE = 32;

/** Calculates the root hash from the provided inclusion proof segments and its corresponding segment index  
   * @param _proofSegments Proof segments.
   * @param _proveSegment Segment to prove.
   * @param _proveSegmentIndex Prove segment index
   * @return _calculatedHash chunk hash
   */
function rootHashFromInclusionProof(
  bytes32[] memory _proofSegments,
  bytes32  _proveSegment,
  uint256 _proveSegmentIndex
) public pure returns (bytes32 _calculatedHash) {
  _calculatedHash = _proveSegment;
  for (uint256 i = 0; i < _proofSegments.length; i++) {
    bool mergeFromRight = _proveSegmentIndex % 2 == 0 ? true : false;
    _calculatedHash = mergeSegment(_calculatedHash, _proofSegments[i], mergeFromRight);
    _proveSegmentIndex >>= 1;
  }

  return _calculatedHash;
}

/**
 * Calculate the chunk address from the Binary Merkle Tree of the chunk data
 *
 * The BMT chunk address is the hash of the 8 byte span and the root
 * hash of a binary Merkle tree (BMT) built on the 32-byte segments
 * of the underlying data.
   * @param _proofSegments Proof segments.
   * @param _proveSegment Segment to prove.
   * @param _proveSegmentIndex Prove segment index
   * @param _chunkSpan chunk bytes length
   * @return _chunkHash chunk hash
   */
function chunkAddressFromInclusionProof(
  bytes32[] memory _proofSegments,
  bytes32  _proveSegment,
  uint256 _proveSegmentIndex,
  uint64 _chunkSpan
) public pure returns (bytes32) {
  bytes32 rootHash = rootHashFromInclusionProof(_proofSegments, _proveSegment, _proveSegmentIndex);
  return keccak256(abi.encodePacked(_chunkSpan, rootHash));
}

function mergeSegment(
    bytes32 _calculatedHash,
    bytes32 _proofSegment,
    bool mergeFromRight
)
    internal
    pure
    returns (bytes32 res)
  {    
    if (mergeFromRight) {
        res = keccak256(abi.encode(_calculatedHash  , _proofSegment));       
    } else {
        res = keccak256(abi.encode(_proofSegment , _calculatedHash  ));
    }
    return res;
  }
}
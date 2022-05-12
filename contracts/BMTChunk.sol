// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract BMTChunk {

  // max chunk payload size
  uint256 public constant MAX_CHUNK_PAYLOAD_SIZE = 4096;

  // segment byte size
  uint256 public constant SEGMENT_SIZE = 32;

struct ChunkInclusionProof{
  bytes span;
  bytes32[] sisterSegments;
}

/** Calculates the BMT root hash from the provided inclusion proof segments and its corresponding segment index  
   * @param _proofSegments Proof segments.
   * @param _proveSegment Segment to prove.
   * @param _proveSegmentIndex Prove segment index
   * @return _calculatedHash root hash
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

function mergeSegment(
    bytes32 _calculatedHash,
    bytes32 _proofSegment,
    bool mergeFromRight
)
    public
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
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BMTChunk.sol";


contract BMTFile is BMTChunk {



/* 
 * Gives back the file address that is calculated with only the inclusion proof segments
 * and the corresponding proved segment and its position.
 *
   * @param _proveChunks Proof segments.
   * @param _proveSegment Segment to prove.
   * @param _proveSegmentIndex Prove segment index
   * @return _calculatedHash root hash
   */
function fileAddressFromInclusionProof(
  BMTChunk.ChunkInclusionProof[] memory _proveChunks,
  bytes32 _proveSegment,
  uint256 _proveSegmentIndex,
  uint256 _lastChunkIndex
) public pure returns (bytes32 _calculatedHash) {
   _calculatedHash = _proveSegment;

  for (uint256 i = 0; i < _proveChunks.length; i++) {
    (uint256 parentChunkIndex, uint256 level) = getBmtIndexOfSegment(
      _proveSegmentIndex,
      _lastChunkIndex
    );
    for (uint256 j = 0; j < _proveChunks[i].sisterSegments.length; j++) {
        bool mergeFromRight = _proveSegmentIndex % 2 == 0 ? true : false;
        _calculatedHash = mergeSegment(_calculatedHash, _proveChunks[i].sisterSegments[j], mergeFromRight);
        _proveSegmentIndex = (_proveSegmentIndex / 2);
    }
    _calculatedHash = keccak256(abi.encodePacked(
      (_proveChunks[i].spanBytes),
      _calculatedHash
    ));  
    // this line is necessary if the _proveSegmentIndex
    // was in a carrierChunk
    _proveSegmentIndex = parentChunkIndex;
    _lastChunkIndex >>= BMTChunk.CHUNK_BMT_LEVELS + (level * BMTChunk.CHUNK_BMT_LEVELS);
  }

  return _calculatedHash;
}

  function getBmtIndexOfSegment(
      uint256  segmentIndex,
      uint256 lastChunkIndex   
    )
    public
    pure 
    returns (uint256,uint256) {
    
    uint256 level = 0;
    uint levels = BMTChunk.CHUNK_BMT_LEVELS;
    if (
      (segmentIndex / BMTChunk.MAX_SEGMENT_COUNT) == lastChunkIndex && // the segment is subsumed under the last chunk
      lastChunkIndex % BMTChunk.MAX_SEGMENT_COUNT == 0 && // the last chunk is a carrier chunk
      lastChunkIndex != 0 // there is only the root chunk
    ) {
      // segmentIndex in carrier chunk
      segmentIndex >>= levels;
      while (segmentIndex % BMTChunk.SEGMENT_SIZE == 0) {
        level++;
        segmentIndex >>= levels;
      }
    } else {
      segmentIndex >>= levels;
    }
    
    return (segmentIndex, level);
  }
}
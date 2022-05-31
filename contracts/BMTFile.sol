// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BMTChunk.sol";

contract BMTFile is BMTChunk {
  // max segment count
  uint16 public constant MAX_SEGMENT_COUNT = 128;

  // chunk bmt levels
  uint16 public constant CHUNK_BMT_LEVELS = 7;

  struct ChunkInclusionProof{
    uint64 span;
    bytes32[] sisterSegments;
  }

  /**
    * @notice          Changes the endianness of a uint64.
    * @dev             https://graphics.stanford.edu/~seander/bithacks.html#ReverseParallel
    * @param _b        The unsigned integer to reverse
    * @return          v - The reversed value
    */
  function reverseUint64(uint64 _b) public pure returns (uint64) {
      uint256 v = _b;

      // swap bytes
      v = ((v >> 8) & 0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF) |
          ((v & 0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF) << 8);
      // swap 2-byte long pairs
      v = ((v >> 16) & 0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF) |
          ((v & 0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF) << 16);
      // swap 4-byte long pairs
      v = ((v >> 32) & 0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) |
          ((v & 0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) << 32);
        

      return uint64(v);
  }

/** 
  * @dev Gives back the file address that is calculated with only the inclusion proof segments
  * and the corresponding proved segment and its position.
  * @param _proveChunks Sister segments that will be hashed together with the calculated hashes
  * @param _proveSegment The segment that is wanted to be validated it is subsumed under the file address
  * @param _proveSegmentIndex the `proveSegment`'s segment index on its BMT level
  * @return _calculatedHash File address
*/
function fileAddressFromInclusionProof(
  ChunkInclusionProof[] memory _proveChunks,
  bytes32 _proveSegment,
  uint64 _proveSegmentIndex
) public pure returns (bytes32 _calculatedHash) {
   _calculatedHash = _proveSegment;
   uint64 lastChunkIndex = reverseUint64(_proveChunks[_proveChunks.length - 1].span) >> 12;

  for (uint8 i = 0; i < _proveChunks.length; i++) {
    (uint64 parentChunkIndex, uint64 level) = getBmtIndexOfSegment(
      _proveSegmentIndex,
      lastChunkIndex
    );
    for (uint8 j = 0; j < _proveChunks[i].sisterSegments.length; j++) {
        bool mergeFromRight = _proveSegmentIndex % 2 == 0 ? true : false;
        _calculatedHash = mergeSegment(_calculatedHash, _proveChunks[i].sisterSegments[j], mergeFromRight);
        _proveSegmentIndex = (_proveSegmentIndex / 2);
    }
    _calculatedHash = keccak256(abi.encodePacked(
      (_proveChunks[i].span),
      (_calculatedHash)
    ));  
    // this line is necessary if the _proveSegmentIndex
    // was in a carrierChunk
    _proveSegmentIndex = parentChunkIndex;
    lastChunkIndex >>= CHUNK_BMT_LEVELS + (level * CHUNK_BMT_LEVELS);
  }

  return _calculatedHash;
}

  /**
  * @dev Get the chunk's position of a given payload segment index in the BMT tree
  *
  * The BMT buils up in an optimalized way, where an orphan/carrier chunk
  * can be inserted into a higher level of the tree. It may cause that
  * the segment index of a payload cannot be found in the lowest level where the splitter
  * originally created its corresponding chunk.
  *
  * @param _segmentIndex the segment index of the payload
  * @param _lastChunkIndex last chunk index on the BMT level of the segment
  * @return level and position of the chunk that contains segment index of the payload
  */
  function getBmtIndexOfSegment(
      uint64  _segmentIndex,
      uint64 _lastChunkIndex   
    )
    public
    pure 
    returns (uint64,uint64) {
    
    uint64 level = 0;
    uint64 levels = CHUNK_BMT_LEVELS;
    if (
      (_segmentIndex / MAX_SEGMENT_COUNT) == _lastChunkIndex && // the segment is subsumed under the last chunk
      _lastChunkIndex % MAX_SEGMENT_COUNT == 0 && // the last chunk is a carrier chunk
      _lastChunkIndex != 0 // there is only the root chunk
    ) {
      // _segmentIndex in carrier chunk
      _segmentIndex >>= levels;
      while (_segmentIndex % BMTChunk.SEGMENT_SIZE == 0) {
        level++;
        _segmentIndex >>= levels;
      }
    } else {
      _segmentIndex >>= levels;
    }
    
    return (_segmentIndex, level);
  }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BMTChunk.sol";
import "./TypedMemView.sol";

contract BMTFile is BMTChunk {
  using TypedMemView for bytes;
  using TypedMemView for bytes29;


// max segment count
  uint256 public constant MAX_SEGMENT_COUNT = 128;

  // chunk bmt levels
  uint256 public constant CHUNK_BMT_LEVELS = 7;

  struct ChunkInclusionProof{
    uint64 span;
    bytes32[] sisterSegments;
  }

  // Uses TypedMemView (DataView in JavaScript) to handle endianness
  function getChunkSpanLength(
    ChunkInclusionProof[] memory _proveChunks
  ) internal pure returns (uint256) {

    bytes memory arr = abi.encodePacked(_proveChunks[_proveChunks.length - 1].span);
    bytes29 v = arr.ref(0);
    return v.indexLEUint(0, 8);
  } 

/* 
  * Gives back the file address that is calculated with only the inclusion proof segments
  * and the corresponding proved segment and its position.
  * @param _proveChunks Sister segments that will be hashed together with the calculated hashes
  * @param _proveSegment The segment that is wanted to be validated it is subsumed under the file address
  * @param _proveSegmentIndex the `proveSegment`'s segment index on its BMT level
  * @return _calculatedHash File address
*/
function fileAddressFromInclusionProof(
  ChunkInclusionProof[] memory _proveChunks,
  bytes32 _proveSegment,
  uint256 _proveSegmentIndex
) public pure returns (bytes32 _calculatedHash) {
   _calculatedHash = _proveSegment;
   uint256 lastIndex =  _proveChunks.length - 1;
   uint256 _fileLength = getChunkSpanLength(_proveChunks) >> 12;

  for (uint256 i = 0; i < _proveChunks.length; i++) {
    (uint256 parentChunkIndex, uint256 level) = getBmtIndexOfSegment(
      _proveSegmentIndex,
      _fileLength
    );
    for (uint256 j = 0; j < _proveChunks[i].sisterSegments.length; j++) {
        bool mergeFromRight = _proveSegmentIndex % 2 == 0 ? true : false;
        _calculatedHash = mergeSegment(_calculatedHash, _proveChunks[i].sisterSegments[j], mergeFromRight);
        _proveSegmentIndex = (_proveSegmentIndex / 2);
    }
    _calculatedHash = keccak256(abi.encodePacked(
      bytes8(_proveChunks[i].span),
      (_calculatedHash)
    ));  
    // this line is necessary if the _proveSegmentIndex
    // was in a carrierChunk
    _proveSegmentIndex = parentChunkIndex;
    _fileLength >>= CHUNK_BMT_LEVELS + (level * CHUNK_BMT_LEVELS);
  }

  return _calculatedHash;
}

  /**
  * Get the chunk's position of a given payload segment index in the BMT tree
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
      uint256  _segmentIndex,
      uint256 _lastChunkIndex   
    )
    public
    pure 
    returns (uint256,uint256) {
    
    uint256 level = 0;
    uint levels = CHUNK_BMT_LEVELS;
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
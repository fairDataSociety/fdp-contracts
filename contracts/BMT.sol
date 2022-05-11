// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BytesLib.sol";


contract BMT {
  using BytesLib for bytes;


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
    _calculatedHash = mergeSegmentFromRight(_calculatedHash, _proofSegments[i], mergeFromRight);
    _proveSegmentIndex >>= 1;
  }

  return _calculatedHash;
}

function mergeSegmentFromRight(
    bytes32 _calculatedHash,
    bytes32 _proofSegment,
    bool mergeFromRight
)
    internal
    pure
    returns (bytes32 res)
  {    
    bytes memory bzHash = abi.encodePacked(_calculatedHash);
    bytes memory bzSegment = abi.encodePacked(_proofSegment);
    if (mergeFromRight) {
        res = keccak256(bzHash.concat(bzSegment));       
    } else {
        res = keccak256(bzSegment.concat(bzHash));
    }
    return res;
  }
}
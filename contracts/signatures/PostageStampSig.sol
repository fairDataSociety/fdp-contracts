// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Signature.sol";

contract PostageStampSig is Signature {
      /** Hash of the message to sign */
    function getMessageHash(
        bytes32 _chunkAddr,
        bytes32 _batchId,
        uint64 _index,
        uint64 _timeStamp
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_chunkAddr, _batchId, _index, _timeStamp));
    }

    function verify(
        address _signer, // signer Ethereum address to check against
        bytes memory _signature,
        bytes32 _chunkAddr,
        bytes32 _postageId,
        uint64 _index,
        uint64 _timeStamp
    ) public pure returns (bool) {
        bytes32 messageHash = getMessageHash(_chunkAddr, _postageId, _index, _timeStamp);
        bytes32 ethMessageHash = Signature.getEthSignedMessageHash(messageHash); 

        return Signature.recoverSigner(ethMessageHash, _signature) == _signer;
    }
}

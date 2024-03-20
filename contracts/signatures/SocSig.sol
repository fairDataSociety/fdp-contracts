// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Signature.sol";

contract SocSig is Signature {
    /** Hash of the message to sign */
    function getMessageHash(
        bytes32 _identifier,
        bytes32 _chunkAddr
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_identifier, _chunkAddr));
    }

    function verify(
        address _signer, // signer Ethereum address to check against
        bytes memory _signature,
        bytes32 _identifier,
        bytes32 _chunkAddr
    ) public pure returns (bool) {
        bytes32 messageHash = getMessageHash(_identifier, _chunkAddr);
        bytes32 ethMessageHash = Signature.getEthSignedMessageHash(messageHash); 

        return Signature.recoverSigner(ethMessageHash, _signature) == _signer;
    }
}

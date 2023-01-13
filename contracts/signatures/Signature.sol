// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// based on: https://solidity-by-example.org/signature/

/* Signature Verification

How to Sign and Verify
# Signing
1. Create message to sign
2. Hash the message
3. Sign the hash (off chain, keep your private key secret)

# Verify
1. Recreate hash from the original message
2. Recover signer from signature and hash
3. Compare recovered signer to claimed signer
*/

library Signature {
    /** Appends Ethereum Signed Message prefix to the message hash */
    function getEthSignedMessageHash(
        bytes32 _messageHash
    ) public pure returns (bytes32) {
        /*
        Signature is produced by signing a keccak256 hash with the following format:
        "\x19Ethereum Signed Message\n" + len(msg) + msg
        */
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash)
            );
    }

    function recoverSigner(
        bytes32 _ethSignedMessageHash, // it has to be prefixed message: https://ethereum.stackexchange.com/questions/19582/does-ecrecover-in-solidity-expects-the-x19ethereum-signed-message-n-prefix/21037
        bytes memory _signature
    ) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(
        bytes memory sig
    ) public pure returns (bytes32 r_, bytes32 s_, uint8 v_) {
        require(sig.length == 65, "invalid signature length");

        assembly {
            /*
            verbose explanation: https://ethereum.stackexchange.com/questions/135591/split-signature-function-in-solidity-by-example-docs
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r_ := mload(add(sig, 32))
            // second 32 bytes
            s_ := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v_ := byte(0, mload(add(sig, 96)))
        }

        // implicitly return (r, s, v)
    }
}

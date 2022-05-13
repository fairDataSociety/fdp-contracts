# Advanced Sample Hardhat Project

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

The project comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts. It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.ts
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/sample-script.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

# Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).


# Verifying chunks with BMTChunk solidity library

 The function `rootHashFromInclusionProof` in BMTChunk is similar to the function found in BMT.js and allows you to verify chunks for inclusion proofs.

```c++
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
}
```

## Arguments 

- `_proofSegments`: The proof segments as a bytes32 array
- `_proveSegment`: The segment to verify proof
- `_proveSegmentIndex`: The segment index to verify proof

## Returns

Returns a BMT root hash as bytes32

## Example using BMTChunk and BMT.js

```typescript
let bmtlib: BMTChunk
const SEGMENT_SIZE = 32

// Instantiate BMTChunk contract
let BMT = await ethers.getContractFactory('BMTChunk')
bmtlib = await BMT.deploy()
await bmtlib.deployed()

// Make chunk
const chunk = makeChunk(payload)
const tree = chunk.bmt()


// Get segment data
const inclusionProofSegments = chunk.inclusionProof(segmentIndex)
const proofSegment = chunk.data().slice(
    segmentIndex * SEGMENT_SIZE, 
    segmentIndex * SEGMENT_SIZE + SEGMENT_SIZE
)

// Calculate hash onchain
const rootHash1 = await bmtlib.rootHashFromInclusionProof(
    inclusionProofSegments,
    proofSegment,
    segmentIndex,
)

// Verify that hash matches chunk address
const merged = Buffer.concat(
    [
        makeSpan(payload.length), 
        arrayify(rootHash1 as BytesLike),
    ]
)
const hash = keccak256(merged).replace('0x', '')
expect(hast).equals(Utils.bytesToHex(chunk.address(), 64))

```
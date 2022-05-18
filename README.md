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


# API
# Verifying chunks with BMTChunk solidity library

 The functions `rootHashFromInclusionProof` and `chunkAddressFromInclusionProof` in BMTChunk are similar to functions found in [bmt-js](https://github.com/fairDataSociety/bmt-js) library and allows you to verify chunks for inclusion proofs.

## BMTChunk
## rootHashFromInclusionProof

### Arguments 

| Name | Type | Description |
| ---- | ---- | ----------- |
| `_proofSegments` | `bytes32[]` |  The proof segments |
| `_proofSegment` | `bytes32` | The segment to verify proof |
| `_proofSegmentIndex` | `uint256` | The segment index to verify proof |

### Returns

Returns a BMT root hash as bytes32

### Example

```typescript
import { makeChunk, makeSpan, Utils } from '@fairdatasociety/bmt-js'
import { expect } from 'chai'
import { arrayify, BytesLike, keccak256 } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { BMTChunk } from '../typechain'

const SEGMENT_SIZE = 32
// Instantiate BMTChunk contract
const BMT = await ethers.getContractFactory('BMTChunk')
const bmtlib = await BMT.at(`<contract_address>`)

// Make chunk
const chunk = makeChunk(payload)

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
expect(hash).equals(Utils.bytesToHex(chunk.address(), 64))

```

## chunkAddressFromInclusionProof

### Arguments 


| Name | Type | Description |
| ---- | ---- | ----------- |
| `_proofSegments` | `bytes32[]` |  The proof segments |
| `_proofSegment` | `bytes32` | The segment to verify proof |
| `_proofSegmentIndex` | `uint256` | The segment index to verify proof |
| `_span` | `uint64` | The chunk bytes length as bytes


### Returns

Returns a chunk address

### Example

```typescript
import { makeChunk, makeSpan } from '@fairdatasociety/bmt-js'
import { expect } from 'chai'
import { arrayify, BytesLike, keccak256 } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { BMTChunk } from '../typechain'

const SEGMENT_SIZE = 32
const DEFAULT_SPAN_SIZE = 8

// Instantiate BMTChunk contract
const BMT = await ethers.getContractFactory('BMTChunk')
const bmtlib = await BMT.at(`<contract_address>`)

// Make chunk
const chunk = makeChunk(payload)

// Get segment data
const inclusionProofSegments = chunk.inclusionProof(segmentIndex)
const proofSegment = chunk.data().slice(
    segmentIndex * SEGMENT_SIZE, 
    segmentIndex * SEGMENT_SIZE + SEGMENT_SIZE
)

// Calculate chunk address onchain
const span = makeSpan(payload.length, DEFAULT_SPAN_SIZE)
const chunkAddress = await bmtlib.chunkAddressFromInclusionProof(
    inclusionProofSegments,
    proofSegment,
    segmentIndex,
    span,
)

// Verify that address matches chunk address
expect(chunkAddress).equals(ethers.utils.hexlify(chunk.address())
```


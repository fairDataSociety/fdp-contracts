# Build Docker images of FDP contracts

In order to build docker images of the project you need to run [fdp-play](https://github.com/fairDataSociety/fdp-play) environment.
```sh
npm run env:start-base
```

top on this environment you can deploy the smart contracts by running `scripts/build-image.sh` or
```sh
npm run build:image
```
**NOTE**: Make sure to prune the containers that have been stopped after deploying the contracts before moving on.

This command has to produce a blockchain image with name `fairdatasociety/fdp-contracts-blockchain` that you try out with `fdp-play`
```sh
fdp-play start --detach --blockchain-image fairdatasociety/fdp-contracts-blockchain $BEE_VERSION
```

**NOTE**: The JS contract library tests also should pass after modifications, in order to check that execute `cd js-library` and run `npm run build && npm test`

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


# BMT Inclusion Proofs

- [Verifying chunks](#verifying-chunks-with-bmtchunk-solidity-library)
    - [rootHashFromInclusionProof](#roothashfrominclusionproof)
    - [chunkAddressFromInclusionProof](#chunkaddressfrominclusionproof)
- [Verifying files](#verifying-files-with-bmtfile)
    - [fileAddressFromInclusionProof](#fileaddressfrominclusionproof)
# Verifying chunks with BMTChunk

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

# Verifying files with BMTFile

 The function `fileAddressFromInclusionProof` in BMTFile is similar to functions found in [bmt-js](https://github.com/fairDataSociety/bmt-js) library and allows you to verify files for inclusion proofs.

## BMTFile
## fileAddressFromInclusionProof

Gives back the file address that is calculated with only the inclusion proof segments and the corresponding proved segment and its position.

### Arguments 

| Name | Type | Description |
| ---- | ---- | ----------- |
| ` _proveChunks` | `ChunkInclusionProof[] memory` |  Sister segments that will be hashed together with the calculated hashes |
| `_proveSegment` | `bytes32` | the segment that is wanted to be validated it is subsumed under the file address |
| `_proveSegmentIndex` | `uint256` | the `proveSegment`'s segment index on its BMT level |


### Returns

Returns the calculated file address

### Example

```typescript
import {
  Chunk,
  fileInclusionProofBottomUp,
  getSpanValue,
  makeChunkedFile,
  Utils,
} from '@fairdatasociety/bmt-js'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { BMTFile } from '../typechain'
import { BMTChunkInclusionProof } from '../js-library/src/model/bmt.model'
import FS from 'fs'
import path from 'path'
import {  BytesLike, hexlify } from 'ethers/lib/utils'

const SEGMENT_SIZE = 32
const MAX_CHUNK_PAYLOAD_SIZE = 4096

// Instantiate BMTFile contract
const BMT = await ethers.getContractFactory('BMTFile')
const bmtlib = await BMT.at(`<contract_address>`)

// Test file
const fileBytes = Uint8Array.from(FS.readFileSync(path.join(__dirname, 'test-files', 'The-Book-of-Swarm.pdf')))

// Chunk file
const chunkedFile = makeChunkedFile(fileBytes)

// Segment to prove
const segmentIndex = Math.floor((fileBytes.length - 1) / 32)

// Proof chunks
const proofChunks = fileInclusionProofBottomUp(chunkedFile, segmentIndex)

// Prove segment
let proveSegment = fileBytes.slice(segmentIndex * SEGMENT_SIZE, segmentIndex * SEGMENT_SIZE + SEGMENT_SIZE)

// Padding
proveSegment = new Uint8Array([...proveSegment, ...new Uint8Array(SEGMENT_SIZE - proveSegment.length)])

// Call fileAddressFromInclusionProof, which returns an hex value representing the file address
const fileAddressProof = await bmtlib.fileAddressFromInclusionProof(proofChunks, proveSegment, segmentIndex)
expect(fileAddressProof).equals(ethers.utils.hexlify(chunk.address()))
```


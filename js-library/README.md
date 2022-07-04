# FDS Contracts JS Library

This library provides simple interface to interact with FDS contracts.

## Installation

The library depends on the [ethers.js](https://github.com/ethers-io/ethers.js/) library. So in order to use
the library, `ethers` must be installed.

To install the both libraries:

```bash
npm install --save @fairdatasociety/fdp-contracts ethers
```

## Usage

To work with local `fdp-contracts` docker image, execute the following command:

```bash
fdp-play start --detach --blockchain-image fairdatasociety/fdp-contracts-blockchain $BEE_VERSION
```
**NOTE**: it will spin up the whole fdp environment for you with running Bee clients

### ENS

To interact with Ethereum Name Service (ENS), import and instantiate the ENS class. The ENS class can be
configured with predefined configurations or with a custom one. Currently, the only predefined configuration
is for the localhost envirnoment, which means it will use the `swarm-test-blockchain` image running locally on
`http://localhost:9545` address.

Predefined configurations can be fetched using the `getEnvironmentConfig` function.

```typescript
import { ENS, Environments, getEnvironmentConfig } from '@fairdatasociety/fdp-contracts'

const ens = new ENS(getEnvironmentConfig(Environments.LOCALHOST))
```

To use custom configuration, provide an instance of `Environment` type, or modify some of the predefined
configurations:

```typescript
import { ENS, Environments, getEnvironmentConfig, Environment } from '@fairdatasociety/fdp-contracts'

const customConfig: Environment = {
  ...getEnvironmentConfig(Environments.LOCALHOST),
  rpcUrl: 'www.example.com',
}

const ens = new ENS(customConfig)
```

Here is an example how to interact with ENS:

```typescript
import { ENS } from '@fairdatasociety/fdp-contracts'

async function example() {
  const ens = new ENS() // Default configuration is for localhost
  const username = 'example'

  const isUsernameAvailable = await ens.isUsernameAvailable(username)

  console.log(`Username ${username} is available: ${isUsernameAvailable}`)
}
```

For methods that require transactions, a signer must be provided. Signer can be specified when creating an
object of the ENS class, or later by calling the `connect` method. Signer can be a hex string of a private
key, or an `ethers.js` signer.

```typescript
import { Wallet } from 'ethers'
import { ENS } from '@fairdatasociety/fdp-contracts'

async function example() {
  const ens = new ENS()
  const wallet = new Wallet('0x...', ens.provider)

  ens.connect(wallet)

  const address = await wallet.getAddress()
  const username = 'example'

  await ens.registerUsername(username, address, wallet.publicKey)

  console.log(`Username ${username} successfully registered.`)
}
```

## Development

To compile the library in watch mode:

```bash
npm start
```

To build the library:

```bash
npm run build
```

### Local installation

The library can be linked, so it can be imported as a node module from another local project. First, inside
this directory run:

```bash
npm link
```

Then in root directory of another project, the library can be installed with:

```bash
npm link @fairdatasociety/fdp-contracts
```

## Tests

To automatically start a fdp-contracts container, build the library and run tests:

```bash
./scripts/test.sh
```

Tests are separated into unit and integration tests to the `test/unit` and `test/it` directorties,
respectively.

In order to run integration tests, a container with FDP contracts must be started first. Also the librarry
should be built. Then, tests are executed using the command:

```bash
npm run test:integration
```

To run both tests at once:

```bash
npm test
```

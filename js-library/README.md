# FDS Contracts JS Library

This library provides simple interface to interact with FDS contracts.

## Installation

## Development

The library requires compiled FDP contracts to work along with their addresses on blockchain. For development,
a local Docker image can be built, by running the following command in the root directory:

```bash
./scripts/build-image.sh
```

This command will copy contract JSON files into the `js-library/src/contracts` directory with additional
`contracts.env` file which will contain addresses of deployed contracts inside the image.

To work with an existing FDP contracts image, run:

```bash
./scripts/get-contracts.sh
```

This script will just extract contract JSON files and addresses from the published image.

Either image is chosen, a container must be started with the chosen image in order to use the library for
development.

## Tests

Tests are separated into unit and integration tests to the `test/unit` and `test/it` directorties,
respectively.

To run unit tests:

```bash
npm run test:unit
```

In order to run integration tests, a container with FDP contracts must be started first. Also the librarry
should be built. Then, tests are executed using the command:

```bash
npm run test:it
```

To run both tests at once:

```bash
npm test
```

To automatically start a fdp-contracts container, build the librarry and run tests:

```bash
./scripts/test.sh
```

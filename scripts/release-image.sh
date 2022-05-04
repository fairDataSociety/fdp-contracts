#!/bin/bash
ROOT_PATH=$(dirname "$0")
ROOT_PATH=$( cd "$ROOT_PATH/.." && pwd ) 

# Getting env variables from bee-factory
BEE_ENV_PREFIX=$(npm explore bee-factory -- ./scripts/utils/env-variable-value.sh BEE_ENV_PREFIX)
BLOCKCHAIN_VERSION=$(npm explore bee-factory -- ./scripts/utils/env-variable-value.sh BLOCKCHAIN_VERSION)
CONTRACTS_IMAGE_NAME="swarm-test-blockchain"
CONTRACTS_IMAGE_PREFIX="fairdatasociety"
CONTRACTS_IMAGE_URL="$CONTRACTS_IMAGE_PREFIX/$CONTRACTS_IMAGE_NAME:$BLOCKCHAIN_VERSION"

docker push "$CONTRACTS_IMAGE_URL"

#!/bin/bash
MY_PATH=$(dirname "$0")
MY_PATH=$( cd "$MY_PATH" && pwd ) 

BEE_ENV_PREFIX=$(npm explore bee-factory -- ./scripts/utils/env-variable-value.sh BEE_ENV_PREFIX)
BEE_IMAGE_PREFIX=$(npm explore bee-factory -- ./scripts/utils/env-variable-value.sh BEE_IMAGE_PREFIX)
BLOCKCHAIN_VERSION=$(npm explore bee-factory -- ./scripts/utils/env-variable-value.sh BLOCKCHAIN_VERSION)
NAME="$BEE_ENV_PREFIX-blockchain"

echo "Compiling contracts..."
npm run compile

echo "Starting bee image..."
npm explore bee-factory -- npm install
npm explore bee-factory -- ./scripts/blockchain.sh

echo "Deploying contracts to the bee container..."
DEPLOYMENT_OUTPUT=$(npm run deploy:bee)

ENS_REGISTRY_ADDRESS=$(echo $DEPLOYMENT_OUTPUT | grep -Po 'ENSRegistry deployed to: \K[^\s]*')
SUBDOMAIN_REGISTRAR_ADDRESS=$(echo $DEPLOYMENT_OUTPUT | grep -Po 'SubdomainRegistrar deployed to: \K[^\s]*')
PUBLIC_RESOLVER_ADDRESS=$(echo $DEPLOYMENT_OUTPUT | grep -Po 'PublicResolver deployed to: \K[^\s]*')

# save contract addresses 

echo "Creating a new image..."
docker commit $NAME $BEE_IMAGE_PREFIX/$NAME:$BLOCKCHAIN_VERSION

echo "Image generated: $BEE_IMAGE_PREFIX/$NAME:$BLOCKCHAIN_VERSION"

# publish
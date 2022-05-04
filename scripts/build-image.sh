#!/bin/bash
ROOT_PATH=$(dirname "$0")
ROOT_PATH=$( cd "$ROOT_PATH/.." && pwd )

# Getting env variables from bee-factory
BEE_ENV_PREFIX=$(npm explore bee-factory -- ./scripts/utils/env-variable-value.sh BEE_ENV_PREFIX)
BLOCKCHAIN_VERSION=$(npm explore bee-factory -- ./scripts/utils/env-variable-value.sh BLOCKCHAIN_VERSION)
BLOCKCHAIN_CONTAINER_NAME="$BEE_ENV_PREFIX-blockchain"
CONTRACTS_IMAGE_NAME="swarm-test-blockchain"
CONTRACTS_IMAGE_PREFIX="fairdatasociety"
CONTRACTS_IMAGE_URL="$CONTRACTS_IMAGE_PREFIX/$CONTRACTS_IMAGE_NAME:$BLOCKCHAIN_VERSION"
DIST_FOLDER="$ROOT_PATH/dist"
ENV_FILE="$DIST_FOLDER/contracts.env"
JS_LIB_CONTRACTS_DIR="$ROOT_PATH/js-library/src/contracts"

echo "Compiling contracts..."
npm run compile

echo "Starting the blockchain image..."
npm explore bee-factory -- npm install
npm explore bee-factory -- ./scripts/network.sh
npm explore bee-factory -- ./scripts/blockchain.sh

echo "Deploying contracts to the bee container..."
DEPLOYMENT_OUTPUT=$(npm run deploy:bee)

# Extracting contract addresses
ENS_REGISTRY_ADDRESS=$(echo $DEPLOYMENT_OUTPUT | grep -Po 'ENSRegistry deployed to: \K[^\s]*')
SUBDOMAIN_REGISTRAR_ADDRESS=$(echo $DEPLOYMENT_OUTPUT | grep -Po 'SubdomainRegistrar deployed to: \K[^\s]*')
PUBLIC_RESOLVER_ADDRESS=$(echo $DEPLOYMENT_OUTPUT | grep -Po 'PublicResolver deployed to: \K[^\s]*')

# Saving contract addresses to an .env file
mkdir $DIST_FOLDER
echo "ENS_REGISTRY_ADDRESS=$ENS_REGISTRY_ADDRESS" > $ENV_FILE
echo "SUBDOMAIN_REGISTRAR_ADDRESS=$SUBDOMAIN_REGISTRAR_ADDRESS" >> $ENV_FILE
echo "PUBLIC_RESOLVER_ADDRESS=$PUBLIC_RESOLVER_ADDRESS" >> $ENV_FILE
echo "Contract addresses saved to: $ENV_FILE"

docker cp $ENV_FILE $BLOCKCHAIN_CONTAINER_NAME:/app/contracts.env
docker cp artifacts/contracts/. $BLOCKCHAIN_CONTAINER_NAME:/app/contracts

echo "Creating a new image..."
docker commit $BLOCKCHAIN_CONTAINER_NAME $CONTRACTS_IMAGE_URL

echo "Image generated: $CONTRACTS_IMAGE_URL"

echo "Stop and remove running blockchain node that the image built on..."
docker container stop $BLOCKCHAIN_CONTAINER_NAME
docker container rm $BLOCKCHAIN_CONTAINER_NAME

echo "Copying meta files to the JS library"
rm -rfv $JS_LIB_CONTRACTS_DIR/*
cp -a $ROOT_PATH/artifacts/contracts/. $JS_LIB_CONTRACTS_DIR
cp $ENV_FILE $JS_LIB_CONTRACTS_DIR
for file in "$JS_LIB_CONTRACTS_DIR"*.sol;
  do
    [ -f "$file" ] || break;
    mv "$file"/* "$(echo $file | sed -r 's/^(.*).sol$/\1/')";
  done



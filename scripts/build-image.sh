#!/bin/bash
ROOT_PATH=$(dirname "$0")
ROOT_PATH=$( cd "$ROOT_PATH/.." && pwd )

# Getting env variables from bee-factory
BEE_ENV_PREFIX='fdp-play'
# version of the new image
BLOCKCHAIN_VERSION=1.2.1
# base blockchian container name of the fdp-play environment to build upon 
BLOCKCHAIN_CONTAINER_NAME="$BEE_ENV_PREFIX-blockchain"
# name of the fdp-contracts image
CONTRACTS_IMAGE_NAME="fdp-contracts-blockchain"
CONTRACTS_IMAGE_PREFIX="fairdatasociety"
CONTRACTS_IMAGE_URL="$CONTRACTS_IMAGE_PREFIX/$CONTRACTS_IMAGE_NAME:$BLOCKCHAIN_VERSION"
DIST_FOLDER="$ROOT_PATH/dist"
ENV_FILE="$DIST_FOLDER/contracts-ganache.env"
JS_LIB_CONTRACTS_DIR="$ROOT_PATH/js-library/src/contracts"

echo "Compiling contracts..."
npm run compile

echo "Deploying contracts to the fdp-play environment..."
DEPLOYMENT_OUTPUT=$(npm run deploy:bee)

# Extracting contract addresses
ENS_REGISTRY_ADDRESS=$(echo $DEPLOYMENT_OUTPUT | grep -Po 'ENSRegistry deployed to: \K[^\s]*')
SUBDOMAIN_REGISTRAR_ADDRESS=$(echo $DEPLOYMENT_OUTPUT | grep -Po 'SubdomainRegistrar deployed to: \K[^\s]*')
PUBLIC_RESOLVER_ADDRESS=$(echo $DEPLOYMENT_OUTPUT | grep -Po 'PublicResolver deployed to: \K[^\s]*')

# Saving contract addresses to an .env file
mkdir "$DIST_FOLDER"
echo "ENS_REGISTRY_ADDRESS=$ENS_REGISTRY_ADDRESS" > $ENV_FILE
echo "SUBDOMAIN_REGISTRAR_ADDRESS=$SUBDOMAIN_REGISTRAR_ADDRESS" >> $ENV_FILE
echo "PUBLIC_RESOLVER_ADDRESS=$PUBLIC_RESOLVER_ADDRESS" >> $ENV_FILE
echo "Contract addresses saved to: $ENV_FILE"

docker cp "$ENV_FILE" "$BLOCKCHAIN_CONTAINER_NAME":/app/contracts-ganache.env
docker cp artifacts/contracts/. "$BLOCKCHAIN_CONTAINER_NAME":/app/contracts

echo "Creating a new image..."
docker commit $BLOCKCHAIN_CONTAINER_NAME $CONTRACTS_IMAGE_URL

echo "Image generated: $CONTRACTS_IMAGE_URL"

echo "Stop and remove running blockchain node that the image built on..."
npm run env:stop-base

echo "Copying meta files to the JS library"
rm -rfv "$JS_LIB_CONTRACTS_DIR"/*
cp -a "$ROOT_PATH/artifacts/contracts/." "$JS_LIB_CONTRACTS_DIR"
cp "$ENV_FILE" "$JS_LIB_CONTRACTS_DIR"
node scripts/rename-contracts.js "$JS_LIB_CONTRACTS_DIR"

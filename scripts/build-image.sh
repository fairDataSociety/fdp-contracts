#!/bin/bash
ROOT_PATH=$(dirname "$0")
ROOT_PATH=$( cd "$ROOT_PATH/.." && pwd )

# Getting env variables from bee-factory
BEE_ENV_PREFIX='fdp-play'
# version of the new image
BLOCKCHAIN_VERSION=$(awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json)

# base blockchian container name of the fdp-play environment to build upon 
BLOCKCHAIN_CONTAINER_NAME="$BEE_ENV_PREFIX-blockchain"
# name of the fdp-contracts image
CONTRACTS_IMAGE_NAME="fdp-contracts-blockchain"
CONTRACTS_IMAGE_PREFIX="fairdatasociety"
CONTRACTS_IMAGE_URL="$CONTRACTS_IMAGE_PREFIX/$CONTRACTS_IMAGE_NAME:$BLOCKCHAIN_VERSION"
DIST_FOLDER="$ROOT_PATH/dist"
ENV_FILE="$DIST_FOLDER/contracts-docker.env"
JS_LIB_CONTRACTS_DIR="$ROOT_PATH/js-library/src/contracts"

echo "Compiling contracts..."
npm run compile

./scripts/deploy.sh docker

docker cp "$ENV_FILE" "$BLOCKCHAIN_CONTAINER_NAME":/app/contracts-docker.env
docker cp artifacts/contracts/. "$BLOCKCHAIN_CONTAINER_NAME":/app/contracts

echo "Creating a new image..."
docker commit $BLOCKCHAIN_CONTAINER_NAME $CONTRACTS_IMAGE_URL

echo "Image generated: $CONTRACTS_IMAGE_URL"

echo "Copying meta files to the JS library"
rm -rfv "$JS_LIB_CONTRACTS_DIR"/*
cp -a "$ROOT_PATH/artifacts/contracts/." "$JS_LIB_CONTRACTS_DIR"
#cp -a "$ROOT_PATH/artifacts/@ensdomains/ens-contracts/contracts/registry/." "$JS_LIB_CONTRACTS_DIR"
cp "$ENV_FILE" "$JS_LIB_CONTRACTS_DIR"
node scripts/rename-contracts.js "$JS_LIB_CONTRACTS_DIR"

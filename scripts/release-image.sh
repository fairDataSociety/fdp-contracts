#!/bin/bash
ROOT_PATH=$(dirname "$0")
ROOT_PATH=$( cd "$ROOT_PATH/.." && pwd ) 

# Getting env variables from bee-factory
BLOCKCHAIN_VERSION=1.0.0 # TODO from package.json
CONTRACTS_IMAGE_NAME="fdp-contracts-blockchain"
CONTRACTS_IMAGE_PREFIX="fairdatasociety"
CONTRACTS_IMAGE_URL="$CONTRACTS_IMAGE_PREFIX/$CONTRACTS_IMAGE_NAME:$BLOCKCHAIN_VERSION"
LATEST_IMAGE_URL="$CONTRACTS_IMAGE_PREFIX/$CONTRACTS_IMAGE_NAME:latest"

docker push "$CONTRACTS_IMAGE_URL"

# tag image for latest
docker tag $CONTRACTS_IMAGE_URL $LATEST_IMAGE_URL

docker push "$LATEST_IMAGE_URL"

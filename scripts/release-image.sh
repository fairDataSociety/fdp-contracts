#!/bin/bash
ROOT_PATH=$(dirname "$0")
ROOT_PATH=$( cd "$ROOT_PATH/.." && pwd ) 

# Getting env variables from bee-factory
# version of the new image
BLOCKCHAIN_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g')
CONTRACTS_IMAGE_NAME="swarm-test-blockchain"
CONTRACTS_IMAGE_PREFIX="fairdatasociety"
CONTRACTS_IMAGE_URL="$CONTRACTS_IMAGE_PREFIX/$CONTRACTS_IMAGE_NAME:$BLOCKCHAIN_VERSION"

docker push "$CONTRACTS_IMAGE_URL"

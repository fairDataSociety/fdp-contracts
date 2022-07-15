#!/bin/bash
ROOT_PATH=$(dirname "$0")
ROOT_PATH=$( cd "$ROOT_PATH/.." && pwd ) 

# Getting env variables from bee-factory
# version of the new image
# grep from package.json https://gist.github.com/DarrenN/8c6a5b969481725a4413?permalink_comment_id=3535314#gistcomment-3535314
BLOCKCHAIN_VERSION=$(awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json)
CONTRACTS_IMAGE_NAME="fdp-contracts-blockchain"
CONTRACTS_IMAGE_PREFIX="fairdatasociety"
CONTRACTS_IMAGE_URL="$CONTRACTS_IMAGE_PREFIX/$CONTRACTS_IMAGE_NAME:$BLOCKCHAIN_VERSION"
LATEST_IMAGE_URL="$CONTRACTS_IMAGE_PREFIX/$CONTRACTS_IMAGE_NAME:latest"

docker push "$CONTRACTS_IMAGE_URL"

# tag image for latest
docker tag $CONTRACTS_IMAGE_URL $LATEST_IMAGE_URL

docker push "$LATEST_IMAGE_URL"
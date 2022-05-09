#!/bin/bash

# This script is used to extract contract JSON metadata files from an existing fdp-contracts image
# It will update contract files inside the 'js-library/src/contracts' directory along with
# addresses of the contracts

ROOT_PATH=$(dirname "$0")
ROOT_PATH=$( cd "$ROOT_PATH/.." && pwd )

JS_LIB_CONTRACTS_DIR="$ROOT_PATH/js-library/src/contracts"

FDP_CONTRACTS_IMAGE="hub.docker.com/orgs/fairdatasociety/repositories/swarm-test-blockchain:1.2.0"

# pull the latest fdp-contracts docker image
docker pull $FDP_CONTRACTS_IMAGE

# run a temporary container in the background
CONTAINER_ID=$(docker run --rm -d $FDP_CONTRACTS_IMAGE)

# execute commands to fetch contracts-ganache.env and contracts folder
rm -rfv "$JS_LIB_CONTRACTS_DIR"/*
docker cp "$CONTAINER_ID:/app/contracts/." "$JS_LIB_CONTRACTS_DIR"
docker cp "$CONTAINER_ID:/app/contracts-ganache.env" "$JS_LIB_CONTRACTS_DIR/contracts-ganache.env"
node "$ROOT_PATH/scripts/rename-contracts.js" "$JS_LIB_CONTRACTS_DIR"

# stop and delete the container
docker container stop $CONTAINER_ID

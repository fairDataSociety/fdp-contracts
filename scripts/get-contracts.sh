#!/bin/bash
ROOT_PATH=$(dirname "$0")
ROOT_PATH=$( cd "$ROOT_PATH/.." && pwd )

JS_LIB_CONTRACTS_DIR=$ROOT_PATH/js-library/src/contracts

FDP_CONTRACTS_IMAGE="docker.pkg.github.com/fairdatasociety/fdp-contracts/swarm-test-blockchain-contracts:1.2.0"

# pull the latest fdp-contracts docker image
docker pull $FDP_CONTRACTS_IMAGE

# run a temporary container in the background
CONTAINER_ID=$(docker run --rm -d $FDP_CONTRACTS_IMAGE)

# execute commands to fetch contracts.env and contracts folder
docker cp $CONTAINER_ID:/app/contracts/. $JS_LIB_CONTRACTS_DIR
docker cp $CONTAINER_ID:/app/contracts.env $JS_LIB_CONTRACTS_DIR/contracts.env
rename 's/(\w+).sol$/$1/' $JS_LIB_CONTRACTS_DIR/*.sol

# stop and delete the container
docker container stop $CONTAINER_ID

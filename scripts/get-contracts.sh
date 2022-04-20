#!/bin/bash

FDP_CONTRACTS_IMAGE="docker.pkg.github.com/fairdatasociety/fdp-contracts/swarm-test-blockchain-contracts:1.2.0"

# pull the latest fdp-contracts docker image
docker pull $FDP_CONTRACTS_IMAGE

# run a temporary container in the background
CONTAINER_ID=$(docker run -d $FDP_CONTRACTS_IMAGE)

# execute commands to fetch contracts.env and contracts folder
docker cp $CONTAINER_ID:/app/contracts/. dist
docker cp $CONTAINER_ID:/app/contracts.env dist/contracts.env

# stop and delete the container
docker container stop $CONTAINER_ID
docker container rm $CONTAINER_ID
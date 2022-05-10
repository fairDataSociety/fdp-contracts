#!/bin/bash

CONTAINER_ID=$(docker run --rm -d -p 9545:9545 fairdatasociety/swarm-test-blockchain:1.2.0)

npm run build
npm test

docker container stop $CONTAINER_ID

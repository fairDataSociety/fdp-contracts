#!/bin/bash

echo "Compiling contracts..."
npm run compile

echo "Starting bee image..."
npm explore bee-factory -- npm install
npm explore bee-factory -- npm run run:env start
npm explore bee-factory -- ./scripts/blockchain.sh

echo "Deploying contracts to the bee container..."
npm run deploy:bee

# docker commit

# publish

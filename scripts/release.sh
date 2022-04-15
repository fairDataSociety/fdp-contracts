#!/bin/bash

./build-image.sh

# publish
echo "Publishing new image: $CONTRACTS_IMAGE_URL"
docker push "$CONTRACTS_IMAGE_URL"

# build js library
echo "Building JS library..."
npm run build --prefix js-library
#!/bin/bash

# Deploys previously compiled contracts to provided network
# Usage: ./scripts/deploy.sh NETWORK

ROOT_PATH=$(dirname "$0")
ROOT_PATH=$( cd "$ROOT_PATH/.." && pwd )

DIST_FOLDER="$ROOT_PATH/dist"
ENV_FILE="$DIST_FOLDER/contracts-$1.env"
JS_LIB_CONTRACTS_DIR="$ROOT_PATH/js-library/src/contracts"

echo "Deploying contracts to $1..."
DEPLOYMENT_OUTPUT=$(npm run deploy:$1)

./scripts/save-addresses.sh "$1" "$DEPLOYMENT_OUTPUT"

cp "$ENV_FILE" "$JS_LIB_CONTRACTS_DIR"

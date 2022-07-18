#!/bin/bash

# Extracts contract addresses from standard input and saves addresses to the .env file
# Usage: ./scripts/save-addresses.sh NETWORK_PREFIX DEPLOYMENT_OUTPUT
# Example: ./scripts/save-addresses.sh "GOERLI_" $DEPLOYMENT_OUTPUT

ROOT_PATH=$(dirname "$0")
ROOT_PATH=$( cd "$ROOT_PATH/.." && pwd )

DIST_FOLDER="$ROOT_PATH/dist"
ENV_FILE="$DIST_FOLDER/contracts-$1.env"

echo "" > $ENV_FILE

# Extracting contract addresses
FDS_REGISTRAR_ADDRESS=$(echo "$2" | grep -Po 'FDSRegistrar deployed to: \K[^\s]*')
ENS_REGISTRY_ADDRESS=$(echo "$2" | grep -Po 'ENSRegistry deployed to: \K[^\s]*')
PUBLIC_RESOLVER_ADDRESS=$(echo "$2" | grep -Po 'PublicResolver deployed to: \K[^\s]*')

# Saving contract addresses to an .env file
mkdir -p "$DIST_FOLDER"
echo "${1^^}_ENS_REGISTRY_ADDRESS=$ENS_REGISTRY_ADDRESS" >> $ENV_FILE
echo "${1^^}_FDS_REGISTRAR_ADDRESS=$FDS_REGISTRAR_ADDRESS" >> $ENV_FILE
echo "${1^^}_PUBLIC_RESOLVER_ADDRESS=$PUBLIC_RESOLVER_ADDRESS" >> $ENV_FILE
echo "Contract addresses saved to: $ENV_FILE"

#!/bin/bash

# Extracts contract addresses from standard input and saves addresses to the .env file
# Usage: ./scripts/save-addresses.sh NETWORK_PREFIX DEPLOYMENT_OUTPUT
# Example: ./scripts/save-addresses.sh "GOERLI_" $DEPLOYMENT_OUTPUT

ROOT_PATH=$(dirname "$0")
ROOT_PATH=$( cd "$ROOT_PATH/.." && pwd )

DIST_FOLDER="$ROOT_PATH/dist"
ENV_FILE="$DIST_FOLDER/contracts-$1.env"
JS_LIB_ENV_FILE="$ROOT_PATH/js-library/src/contracts/contracts-$1.env"

EXISTING_ADDRESSES=$(< "$JS_LIB_ENV_FILE")

mkdir -p "$DIST_FOLDER"

echo "" > "$ENV_FILE"

# Extracting contract addresses
FDS_REGISTRAR_ADDRESS=$(echo "$2" | grep -Po 'FDSRegistrar deployed to: \K[^\s]*')
ENS_REGISTRY_ADDRESS=$(echo "$2" | grep -Po 'ENSRegistry deployed to: \K[^\s]*')
PUBLIC_RESOLVER_ADDRESS=$(echo "$2" | grep -Po 'PublicResolver deployed to: \K[^\s]*')
DAPP_REGISTRY_ADDRESS=$(echo "$2" | grep -Po 'DappRegistry deployed to: \K[^\s]*')
RATINGS_ADDRESS=$(echo "$2" | grep -Po 'Ratings deployed to: \K[^\s]*')

if [[ -z "$FDS_REGISTRAR_ADDRESS" || -z "$ENS_REGISTRY_ADDRESS" || -z "$PUBLIC_RESOLVER_ADDRESS" ]];
then
  # Extracting contract addresses from existing file
  FDS_REGISTRAR_ADDRESS=$(echo "$EXISTING_ADDRESSES" | grep -Po '_FDS_REGISTRAR_ADDRESS=\K[^\s]*')
  ENS_REGISTRY_ADDRESS=$(echo "$EXISTING_ADDRESSES" | grep -Po '_ENS_REGISTRY_ADDRESS=\K[^\s]*')
  PUBLIC_RESOLVER_ADDRESS=$(echo "$EXISTING_ADDRESSES" | grep -Po '_PUBLIC_RESOLVER_ADDRESS=\K[^\s]*')
fi

if [[ -z "$DAPP_REGISTRY_ADDRESS" ]];
then
  # Extracting contract addresses from existing file
  DAPP_REGISTRY_ADDRESS=$(echo "$EXISTING_ADDRESSES" | grep -Po '_DAPP_REGISTRY_ADDRESS=\K[^\s]*')
fi

if [[ -z "$RATINGS_ADDRESS" ]];
then
  # Extracting contract addresses from existing file
  RATINGS_ADDRESS=$(echo "$EXISTING_ADDRESSES" | grep -Po '_RATINGS_ADDRESS=\K[^\s]*')
fi

# Saving contract addresses to an .env file
echo "${1^^}_ENS_REGISTRY_ADDRESS=$ENS_REGISTRY_ADDRESS" >> "$ENV_FILE"
echo "${1^^}_FDS_REGISTRAR_ADDRESS=$FDS_REGISTRAR_ADDRESS" >> "$ENV_FILE"
echo "${1^^}_PUBLIC_RESOLVER_ADDRESS=$PUBLIC_RESOLVER_ADDRESS" >> "$ENV_FILE"
echo "${1^^}_DAPP_REGISTRY_ADDRESS=$DAPP_REGISTRY_ADDRESS" >> "$ENV_FILE"
echo "${1^^}_RATINGS_ADDRESS=$RATINGS_ADDRESS" >> "$ENV_FILE"
sed -i '/^$/d' "$ENV_FILE"
echo "Contract addresses saved to: $ENV_FILE"

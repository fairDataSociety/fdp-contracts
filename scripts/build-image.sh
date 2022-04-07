#!/bin/bash
ROOT_PATH=$(dirname "$0")
ROOT_PATH=$( cd "$ROOT_PATH/.." && pwd ) 

# Getting env variables from bee-factory
BEE_ENV_PREFIX=$(npm explore bee-factory -- ./scripts/utils/env-variable-value.sh BEE_ENV_PREFIX)
BLOCKCHAIN_VERSION=$(npm explore bee-factory -- ./scripts/utils/env-variable-value.sh BLOCKCHAIN_VERSION)
NAME="$BEE_ENV_PREFIX-blockchain"
BLOCKCHAIN_CONTRACTS_NAME="$NAME-contracts"
IMAGE_PREFIX="docker.pkg.github.com/ethersphere/fdp-contracts"
BLOCKCHAIN_IMAGE_NAME="$IMAGE_PREFIX/$BLOCKCHAIN_CONTRACTS_NAME:$BLOCKCHAIN_VERSION"
ENV_FILE="$ROOT_PATH/dist/.env"


echo "Compiling contracts..."
npm run compile

echo "Starting the blockchain image..."
npm explore bee-factory -- npm install
npm explore bee-factory -- ./scripts/blockchain.sh

echo "Deploying contracts to the bee container..."
DEPLOYMENT_OUTPUT=$(npm run deploy:bee)

# Extracting contract addresses
ENS_REGISTRY_ADDRESS=$(echo $DEPLOYMENT_OUTPUT | grep -Po 'ENSRegistry deployed to: \K[^\s]*')
SUBDOMAIN_REGISTRAR_ADDRESS=$(echo $DEPLOYMENT_OUTPUT | grep -Po 'SubdomainRegistrar deployed to: \K[^\s]*')
PUBLIC_RESOLVER_ADDRESS=$(echo $DEPLOYMENT_OUTPUT | grep -Po 'PublicResolver deployed to: \K[^\s]*')

# Saving contract addresses to an .env file
echo "ENS_REGISTRY_ADDRESS=$ENS_REGISTRY_ADDRESS" > $ENV_FILE
echo "SUBDOMAIN_REGISTRAR_ADDRESS=$SUBDOMAIN_REGISTRAR_ADDRESS" >> $ENV_FILE
echo "PUBLIC_RESOLVER_ADDRESS=$PUBLIC_RESOLVER_ADDRESS" >> $ENV_FILE
echo "Contract addresses saved to: $ENV_FILE"

echo "Creating a new image..."
docker commit $NAME $BLOCKCHAIN_IMAGE_NAME

echo "Image generated: $BLOCKCHAIN_IMAGE_NAME"

echo "Stop and remove running blockchain node that the image built on..."
docker container stop $NAME
docker container rm $NAME

# publish
echo "Publishing new image: $BLOCKCHAIN_IMAGE_NAME"
docker push "$BLOCKCHAIN_IMAGE_NAME"
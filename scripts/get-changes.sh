#!/bin/bash

# Checks which sets of contracts have been changed since previous commit
# Example return "ENS BMT DAPP_REGISTRY"

OUTPUT=""
CHANGED_FILES=$(git diff --name-only HEAD HEAD~1)

# ENS contracts changed
if [[ "$CHANGED_FILES" =~ "ENSRegistry.sol" || "$CHANGED_FILES" =~ "FDSRegistrar.sol" || "$CHANGED_FILES" =~ "PublicResolver.sol" ]];
then
    OUTPUT="$OUTPUT ENS"
fi

# BMT contracts changed
if [[ "$CHANGED_FILES" =~ "BMTChunk.sol" || "$CHANGED_FILES" =~ "BMTFile.sol" ]];
then
    OUTPUT="$OUTPUT BMT"
fi

# dApp registry contract changed
if [[ "$CHANGED_FILES" =~ "DappRegistry.sol" ]];
then
    OUTPUT="$OUTPUT DAPP_REGISTRY"
fi

echo $OUTPUT

#!/bin/bash

# Checks which sets of contracts have been changed since previous release
# Example return "ENS BMT DAPP_REGISTRY"

OUTPUT=""
LAST_RELEASE_COMMIT_HASH=$(git log --all -n 1 --grep='chore(master): release contracts' --pretty=format:"%h")
CHANGED_FILES=$(git diff --name-only HEAD $LAST_RELEASE_COMMIT_HASH)

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

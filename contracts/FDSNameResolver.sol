// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FDSNameResolver {
  address private reverseRegistrarAddress;
  // address hash to ENS node
  mapping(bytes32 => bytes32) private names;

  constructor(address _reverseRegistrarAddress) {
      reverseRegistrarAddress = _reverseRegistrarAddress;
  }

  modifier onlyReverseRegistrar {
      require(msg.sender == reverseRegistrarAddress);
      _;
  }

  function setName(bytes32 node, bytes32 ensNode) public onlyReverseRegistrar {
      names[node]= ensNode;
  }

  function name(bytes32 node) view public returns(bytes32) {
      return names[node];
  }
} 

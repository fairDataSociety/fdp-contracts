// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@ensdomains/ens-contracts/contracts/registry/ENSRegistry.sol";

/**
 * The FDS registry contract.
 */
contract FDSRegistry is ENSRegistry {
  
  /**
   * @dev Constructs a new registry
   */
  constructor() 
    ENSRegistry() {
  }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@ensdomains/ens-contracts/contracts/registry/ENS.sol";
import "@ensdomains/ens-contracts/contracts/ethregistrar/BaseRegistrarImplementation.sol";

/**
 * The ENS registry contract.
 */
contract FDSRegistrar is BaseRegistrarImplementation {
  bytes32 constant NAME_HASH = 0x854683790d7d8c6e4d741a8a5f01dc2952c51f38407545ea5117889dc81bd141;
  /**
   * @dev Constructs a new ENS registrar.
   */
  constructor(ENS _registry) 
  BaseRegistrarImplementation(_registry, NAME_HASH) {
  }

}

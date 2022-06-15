// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@ensdomains/ens-contracts/contracts/registry/ENS.sol";
import "@ensdomains/ens-contracts/contracts/ethregistrar/BaseRegistrarImplementation.sol";

/**
 * The ENS registry contract.
 */
contract FDSRegistrar is BaseRegistrarImplementation {
  bytes32 constant ZERO_HASH = 0x0000000000000000000000000000000000000000000000000000000000000000;
  
  // from specification https://eips.ethereum.org/EIPS/eip-137
  bytes32 constant NAME_HASH = keccak256(abi.encodePacked(ZERO_HASH, keccak256(abi.encodePacked("fds"))));
  // 0x854683790d7d8c6e4d741a8a5f01dc2952c51f38407545ea5117889dc81bd141;

  /**
   * @dev Constructs a new ENS registrar.
   */
  constructor(ENS _registry) 
    BaseRegistrarImplementation(_registry, NAME_HASH) {
  }


  /**
   * @dev Transfers ownership of a subnode keccak256(node, label) to a new address. May only be called by the owner of the parent node.
   * @param _label The hash of the label specifying the subnode.
   * @param _owner The address of the new owner.
   */
  function setSubnodeOwner(
    bytes32 _label,
    address _owner
  ) external returns(bytes32) {
    return ens.setSubnodeOwner(NAME_HASH, _label, _owner);
  }
}

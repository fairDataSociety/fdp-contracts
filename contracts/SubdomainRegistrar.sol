// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ENS.sol";

/**
 * A registrar that allocates subdomains to the first person to claim them, but
 * expires registrations a fixed period after they're initially claimed.
 */
contract SubdomainRegistrar {
  uint256 constant private REGISTRATION_PERIOD = 520 weeks;

  ENS public ens;
  bytes32 public rootNode;
  mapping(bytes32 => uint256) public expiryTimes;

  event Log(address owner, bytes32 label);

  /**
   * Constructor.
   * @param _ensAddr The address of the ENS registry.
   * @param _node The node that this registrar administers.
   */
  constructor(ENS _ensAddr, bytes32 _node) {
    ens = _ensAddr;
    rootNode = _node;
  }

  /**
   * Register a name that's not currently registered
   * @param _label The hash of the label to register.
   * @param _owner The address of the new owner.
   */
  function register(bytes32 _label, address _owner) public {
    require(expiryTimes[_label] < block.timestamp, "Block expired");

    expiryTimes[_label] = block.timestamp + REGISTRATION_PERIOD;
    ens.setSubnodeOwner(rootNode, _label, _owner);
  }
}

pragma solidity ^0.8.0;

import './ENS.sol';

/**
 * A registrar that allocates subdomains to the first person to claim them, but
 * expires registrations a fixed period after they're initially claimed.
 */
contract SubdomainRegistrar {
  uint256 constant registrationPeriod = 520 weeks;

  ENS public ens;
  bytes32 public rootNode;
  mapping(bytes32 => uint256) public expiryTimes;

  event Log(address owner, bytes32 label);

  /**
   * Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param node The node that this registrar administers.
   */
  constructor(ENS ensAddr, bytes32 node) public {
    ens = ensAddr;
    rootNode = node;
  }

  /**
   * Register a name that's not currently registered
   * @param label The hash of the label to register.
   * @param owner The address of the new owner.
   */
  function register(bytes32 label, address owner) public {
    require(expiryTimes[label] < block.timestamp);

    expiryTimes[label] = block.timestamp + registrationPeriod;
    ens.setSubnodeOwner(rootNode, label, owner);
  }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ENS.sol";

/**
 * The ENS registry contract.
 */
contract ENSRegistry is ENS {
  struct Record {
    address owner;
    address resolver;
    uint64 ttl;
  }

  mapping(bytes32 => Record) private records;

  // Permits modifications only by the owner of the specified node.
  modifier only_owner(bytes32 _node) {
    require(records[_node].owner == msg.sender, "Owner is not sender");
    _;
  }

  /**
   * @dev Constructs a new ENS registrar.
   */
  constructor() {
    records[0x0].owner = msg.sender;
  }


  /**
    * @dev Sets the record for a node.
    * @param _node The node to update.
    * @param _owner The address of the new owner.
    * @param _resolver The address of the resolver.
    * @param _ttl The TTL in seconds.
    */
  function setRecord(bytes32 _node, address _owner, address _resolver, uint64 _ttl) external override {
      setOwner(_node, _owner);
      _setResolverAndTTL(_node, _resolver, _ttl);
  }
  
  /**
   * @dev Transfers ownership of a node to a new address. May only be called by the current owner of the node.
   * @param _node The node to transfer ownership of.
   * @param _owner The address of the new owner.
   */
  function setOwner(bytes32 _node, address _owner) public override only_owner(_node) {
    emit Transfer(_node, _owner);
    records[_node].owner = _owner;
  }

  /***
    * @dev Sets the record for a subnode.
    * @param node The parent node.
    * @param label The hash of the label specifying the subnode.
    * @param owner The address of the new owner.
    * @param resolver The address of the resolver.
    * @param ttl The TTL in seconds.
    */
  function setSubnodeRecord(bytes32 _node, bytes32 _label, address _owner, address _resolver, uint64 _ttl) 
  external override {
      bytes32 subnode = setSubnodeOwner(_node, _label, _owner);
      _setResolverAndTTL(subnode, _resolver, _ttl);
  }
  /**
   * @dev Transfers ownership of a subnode keccak256(node, label) to a new address. May only be called by the owner of the parent node.
   * @param _node The parent node.
   * @param _label The hash of the label specifying the subnode.
   * @param _owner The address of the new owner.
   */
  function setSubnodeOwner(
    bytes32 _node,
    bytes32 _label,
    address _owner
  ) public override only_owner(_node) returns(bytes32) {
    bytes32 subnode = keccak256(abi.encodePacked(_node, _label));
    emit NewOwner(_node, _label, _owner);
    records[subnode].owner = _owner;
    return subnode;
  }

  /**
   * @dev Sets the resolver address for the specified node.
   * @param _node The node to update.
   * @param _resolver The address of the resolver.
   */
  function setResolver(bytes32 _node, address _resolver) external override only_owner(_node) {
    emit NewResolver(_node, _resolver);
    records[_node].resolver = _resolver;
  }

  /**
   * @dev Sets the TTL for the specified node.
   * @param _node The node to update.
   * @param _ttl The TTL in seconds.
   */
  function setTTL(bytes32 _node, uint64 _ttl) external override only_owner(_node) {
    emit NewTTL(_node, _ttl);
    records[_node].ttl = _ttl;
  }

  /**
   * @dev Returns the address that owns the specified node.
   * @param _node The specified node.
   * @return address of the owner.
   */
  function owner(bytes32 _node) external view override returns (address) {
    return records[_node].owner;
  }

  /**
   * @dev Returns the address of the resolver for the specified node.
   * @param _node The specified node.
   * @return address of the resolver.
   */
  function resolver(bytes32 _node) external view override returns (address) {
    return records[_node].resolver;
  }

  /**
   * @dev Returns the TTL of a node, and any records associated with it.
   * @param _node The specified node.
   * @return ttl of the node.
   */
  function ttl(bytes32 _node) external view override returns (uint64) {
    return records[_node].ttl;
  }

  /**
    * @dev Returns whether a record has been imported to the registry.
    * @param _node The specified node.
    * @return Bool if record exists
    */
  function recordExists(bytes32 _node) public override view returns (bool) {
      return records[_node].owner != address(0x0);
  }

  /**
    * @dev Query if an address is an authorized operator for another address.
    * @param _owner The address that owns the records.
    * @param _operator The address that acts on behalf of the owner.
    * @return True if `operator` is an approved operator for `owner`, false otherwise.
    */
  function isApprovedForAll(address _owner, address _operator) external override view returns (bool) {
      return false;
  }
  
  function _setResolverAndTTL(bytes32 node, address resolver, uint64 ttl) internal {
      if(resolver != records[node].resolver) {
          records[node].resolver = resolver;
          emit NewResolver(node, resolver);
      }

      if(ttl != records[node].ttl) {
          records[node].ttl = ttl;
          emit NewTTL(node, ttl);
      }
  }
}

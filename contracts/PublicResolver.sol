// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@ensdomains/ens-contracts/contracts/registry/ENS.sol";


/**
 * A simple resolver anyone can use; only allows the owner of a node to set its
 * address.
 */
contract PublicResolver {

  event AddrChanged(bytes32 indexed node, address a);
  event ContentChanged(bytes32 indexed node, bytes32 hash);
  event NameChanged(bytes32 indexed node, string name);
  event ABIChanged(bytes32 indexed node, uint256 indexed contentType);
  event PubkeyChanged(bytes32 indexed node, bytes32 x, bytes32 y);
  event TextChanged(bytes32 indexed node, string indexedKey, string key);
  event MultihashChanged(bytes32 indexed node, bytes hash);

  struct PublicKey {
    bytes32 x;
    bytes32 y;
  }

  struct Record {
    address addr;
    bytes32 content;
    string name;
    PublicKey pubkey;
    mapping(string => string) text;
    mapping(uint256 => bytes) abis;
    bytes multihash;
  }

  ENS private ens;

  mapping(bytes32 => Record) private records;

  modifier only_owner(bytes32 _node) {
    require(ens.owner(_node) == msg.sender, "Owner is not sender");
    _;
  }

  /**
   * Constructor.
   * @param _ensAddr The ENS registrar contract.
   */

  constructor(ENS _ensAddr) {
    ens = _ensAddr;
  }

  /**
   * Sets all required params in one attempt
   * May only be called by the owner of that node in the ENS registry.
   * @param _node The node to update.
   * @param _addr The address to set.
   * @param _content The content hash to set
   * @param _multihash The multihash to set
   * @param _x the X coordinate of the curve point for the public key.
   * @param _y the Y coordinate of the curve point for the public key.
   * @param _name The name to set.
   */
  function setAll(
    bytes32 _node,
    address _addr,
    bytes32 _content,
    bytes memory _multihash,
    bytes32 _x,
    bytes32 _y,
    string memory _name
  ) public only_owner(_node) {
    setAddr(_node, _addr);
    setContent(_node, _content);
    setMultihash(_node, _multihash);
    setPubkey(_node, _x, _y);
    setName(_node, _name);
  }

  function getAll(bytes32 _node)
    public
    view
    returns (
      address _addr,
      bytes32 _content,
      bytes memory _multihash,
      bytes32 _x,
      bytes32 _y,
      string memory _name
    )
  {
    _addr = records[_node].addr;
    _content = records[_node].content;
    _multihash = records[_node].multihash;
    _x = records[_node].pubkey.x;
    _y = records[_node].pubkey.y;
    _name = records[_node].name;
  }

  /**
   * Sets the address associated with an ENS node.
   * May only be called by the owner of that node in the ENS registry.
   * @param _node The node to update.
   * @param _addr The address to set.
   */
  function setAddr(bytes32 _node, address _addr) public only_owner(_node) {
    records[_node].addr = _addr;
    emit AddrChanged(_node, _addr);
  }

  /**
   * Sets the content hash associated with an ENS node.
   * May only be called by the owner of that node in the ENS registry.
   * Note that this resource type is not standardized, and will likely change
   * in future to a resource type based on multihash.
   * @param _node The node to update.
   * @param _hash The content hash to set
   */
  function setContent(bytes32 _node, bytes32 _hash) public only_owner(_node) {
    records[_node].content = _hash;
    emit ContentChanged(_node, _hash);
  }

  /**
   * Sets the multihash associated with an ENS node.
   * May only be called by the owner of that node in the ENS registry.
   * @param _node The node to update.
   * @param _hash The multihash to set
   */
  function setMultihash(bytes32 _node, bytes memory _hash) public only_owner(_node) {
    records[_node].multihash = _hash;
    emit MultihashChanged(_node, _hash);
  }

  /**
   * Sets the name associated with an ENS node, for reverse records.
   * May only be called by the owner of that node in the ENS registry.
   * @param _node The node to update.
   * @param _name The name to set.
   */
  function setName(bytes32 _node, string memory _name) public only_owner(_node) {
    records[_node].name = _name;
    emit NameChanged(_node, _name);
  }

  /**
   * Sets the ABI associated with an ENS node.
   * Nodes may have one ABI of each content type. To remove an ABI, set it to
   * the empty string.
   * @param _node The node to update.
   * @param _contentType The content type of the ABI
   * @param _data The ABI data.
   */
  function setABI(
    bytes32 _node,
    uint256 _contentType,
    bytes memory _data
  ) public only_owner(_node) {
    // Content types must be powers of 2
    require(((_contentType - 1) & _contentType) == 0, "");

    records[_node].abis[_contentType] = _data;
    emit ABIChanged(_node, _contentType);
  }

  /**
   * Sets the SECP256k1 public key associated with an ENS node.
   * @param _node The ENS node to query
   * @param _x the X coordinate of the curve point for the public key.
   * @param _y the Y coordinate of the curve point for the public key.
   */
  function setPubkey(
    bytes32 _node,
    bytes32 _x,
    bytes32 _y
  ) public only_owner(_node) {
    records[_node].pubkey = PublicKey(_x, _y);
    emit PubkeyChanged(_node, _x, _y);
  }

  /**
   * Sets the text data associated with an ENS node and key.
   * May only be called by the owner of that node in the ENS registry.
   * @param _node The node to update.
   * @param _key The key to set.
   * @param _value The text data value to set.
   */
  function setText(
    bytes32 _node,
    string memory _key,
    string memory _value
  ) public only_owner(_node) {
    records[_node].text[_key] = _value;
    emit TextChanged(_node, _key, _key);
  }

  /**
   * Returns the text data associated with an ENS node and key.
   * @param _node The ENS node to query.
   * @param _key The text data key to query.
   * @return The associated text data.
   */
  function text(bytes32 _node, string memory _key) public view returns (string memory) {
    return records[_node].text[_key];
  }

  /**
   * Returns the SECP256k1 public key associated with an ENS node.
   * Defined in EIP 619.
   * @param _node The ENS node to query
   */
  function pubkey(bytes32 _node) public view returns (bytes32 x, bytes32 y) {
    return (records[_node].pubkey.x, records[_node].pubkey.y);
  }

  /**
   * Returns the name associated with an ENS node, for reverse records.
   * Defined in EIP181.
   * @param _node The ENS node to query.
   * @return The associated name.
   */
  function name(bytes32 _node) public view returns (string memory) {
    return records[_node].name;
  }

  /**
   * Returns the content hash associated with an ENS node.
   * Note that this resource type is not standardized, and will likely change
   * in future to a resource type based on multihash.
   * @param _node The ENS node to query.
   * @return The associated content hash.
   */
  function content(bytes32 _node) public view returns (bytes32) {
    return records[_node].content;
  }

  /**
   * Returns the multihash associated with an ENS node.
   * @param _node The ENS node to query.
   * @return The associated multihash.
   */
  function multihash(bytes32 _node) public view returns (bytes memory) {
    return records[_node].multihash;
  }

  /**
   * Returns the address associated with an ENS node.
   * @param _node The ENS node to query.
   * @return The associated address.
   */
  function addr(bytes32 _node) public view returns (address) {
    return records[_node].addr;
  }
}

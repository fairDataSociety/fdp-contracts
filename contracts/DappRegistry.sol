// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * Contains records for all registered dapps and their owners
 */
contract DappRegistry is Ownable, AccessControl {
  
  // Dapp record
  struct Record {
    address creator;
    bytes32 location;
    bytes32 urlHash;
    uint index;
    uint creatorIndex;
    uint256 timestamp;
    bool isValidated;
    address validator;
  }

  struct User {
    bytes32[] records;
    bytes32[] validatedRecords;
  }

  mapping(address => User) internal _users;
  mapping(bytes32 => Record) internal _records;
  
  bytes32[] public recordList;

  bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

  constructor () {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  modifier onlyAdmin() {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Missing admin role");
    _;
  }

  modifier recordEditingAllowed(bytes32 _location) {
    Record memory record = _records[_location];
    require(record.location != 0, "Record doesn't exist");
    require(record.creator == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Sender is not owner");
    _;
  }

  modifier recordValidationAllowed(bytes32 _location) {
    Record memory record = _records[_location];
    require(record.location != 0, "Record doesn't exist");
    require(hasRole(VALIDATOR_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Validation is not allowed");
    _;
  }

  /**
   * Creates a new dApp record if it doesn't exists.
   * _location - Swarm hash
   * _urlHash - keccak256 hash of the dApp URL
   */
  function craeteRecord(bytes32 _location, bytes32 _urlHash) public {
    Record storage record = _records[_location];
    require(record.location == bytes32(0), "Record already exists");

    User storage user = _users[msg.sender];

    record.creator = msg.sender;
    record.location = _location;
    record.urlHash = _urlHash;
    record.timestamp = block.timestamp;
    record.index = recordList.length;
    record.creatorIndex = user.records.length;

    _records[_location] = record;
    recordList.push(_location);
    user.records.push(_location);
  }

  function deleteRecord(bytes32 _location) public recordEditingAllowed(_location) {
    Record memory record = _records[_location];
    User storage user = _users[record.creator];

    uint lastIndex = user.records.length - 1;
    if (record.creatorIndex != lastIndex) {
      user.records[record.creatorIndex] = user.records[lastIndex];
      _records[user.records[record.creatorIndex]].creatorIndex = record.creatorIndex;
    }

    user.records.pop();
  }

  function updateRecord(bytes32 _location, bytes32 _urlHash) public recordEditingAllowed(_location) {
    Record storage record = _records[_location];

    record.location = _location;
    record.urlHash = _urlHash;
    record.timestamp = block.timestamp;
  }

  function validateRecord(bytes32 _location, bool _isValidated) public recordValidationAllowed(_location) {
    Record storage record = _records[_location];
    User storage validator = _users[msg.sender];

    record.isValidated = _isValidated;
    record.validator = msg.sender;

    if (_isValidated) {
      validator.validatedRecords.push(_location);
    }
  }

  function getRecordCount() public view returns (uint) {
    return recordList.length;
  }

  function getRecordSlice(uint _startIndex, uint _length) public view returns (bytes32[] memory) {
    if (_startIndex + _length > recordList.length) {
      _length = recordList.length - _startIndex;
    }

    bytes32[] memory hashes = new bytes32[](_length);

    for (uint i = 0; i < _length; i++) {
        hashes[i] = recordList[_startIndex + i];
    }

    return hashes;
  }

  function getRecords(bytes32[] memory _recordHashes) public view returns (Record[] memory) {
    Record[] memory records = new Record[](_recordHashes.length);
    
    for (uint i = 0; i < _recordHashes.length; i++) {
        records[i] = _records[_recordHashes[i]];
    }

    return records;
  }

  function getRecord(bytes32 _location) public view returns (Record memory) {
    return _records[_location];
  }

  function getUser(address _account) public view returns (User memory) {
    return _users[_account];
  }

}

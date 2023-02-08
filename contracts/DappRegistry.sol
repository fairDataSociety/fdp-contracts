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
    uint32 location;
    uint32 urlHash;
    uint index;
    uint creatorIndex;
    uint256 timestamp;
    bool isValidated;
    address validator;
  }

  struct User {
    uint32[] records;
    uint32[] validatedRecords;
  }

  mapping(address => User) internal _users;
  mapping(uint32 => Record) internal _records;
  
  uint32[] public recordList;

  bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

  constructor () {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  modifier onlyAdmin() {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Missing admin role");
    _;
  }

  function grantAdminRole(address _account) public onlyAdmin {
    _grantRole(DEFAULT_ADMIN_ROLE, _account);
  }

  function revokeAdminRole(address _account) public onlyAdmin {
    _revokeRole(DEFAULT_ADMIN_ROLE, _account);
  }

  function isAdmin(address _account) public view returns(bool) {
    return hasRole(DEFAULT_ADMIN_ROLE, _account);
  }

  function grantValidatorRole(address _account) public onlyAdmin {
    _grantRole(VALIDATOR_ROLE, _account);
  }

  function revokeValidatorRole(address _account) public onlyAdmin {
    _revokeRole(VALIDATOR_ROLE, _account);
  }

  function isValidator(address _account) public view returns(bool) {
    return hasRole(VALIDATOR_ROLE, _account);
  }

  modifier recordEditingAllowed(uint32 _location) {
    Record memory record = _records[_location];
    require(record.location != 0, "Record doesn't exist");
    require(record.creator == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Sender is not owner");
    _;
  }

  modifier recordValidationAllowed(uint32 _location) {
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
  function craeteRecord(uint32 _location, uint32 _urlHash) public {
    Record storage record = _records[_location];
    require(record.location == 0, "Record already exists");

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

  function deleteRecord(uint32 _location) public recordEditingAllowed(_location) {
    Record memory record = _records[_location];
    User storage user = _users[record.creator];

    uint lastIndex = user.records.length - 1;
    if (record.creatorIndex != lastIndex) {
      user.records[record.creatorIndex] = user.records[lastIndex];
      _records[user.records[record.creatorIndex]].creatorIndex = record.creatorIndex;
    }

    user.records.pop();

    lastIndex = recordList.length - 1;
    if (record.index != lastIndex) {
      recordList[record.index] = recordList[lastIndex];
      _records[recordList[record.index]].index = record.index;
    }

    recordList.pop();
    delete _records[_location];
  }

  function updateRecord(uint32 _location, uint32 _urlHash) public recordEditingAllowed(_location) {
    Record storage record = _records[_location];

    record.location = _location;
    record.urlHash = _urlHash;
    record.timestamp = block.timestamp;
  }

  function validateRecord(uint32 _location, bool _isValidated) public recordValidationAllowed(_location) {
    Record storage record = _records[_location];
    User storage user = _users[record.creator];

    record.isValidated = _isValidated;
    record.validator = msg.sender;

    user.validatedRecords.push(_location);
  }

  function getRecordCount() public view returns (uint) {
    return recordList.length;
  }

  function getRecordSlice(uint _startIndex, uint _length) public view returns (uint32[] memory) {
    if (_startIndex + _length > recordList.length) {
      _length = recordList.length - _startIndex;
    }

    uint32[] memory hashes = new uint32[](_length);

    for (uint i = 0; i < _length; i++) {
        hashes[i] = recordList[_startIndex + i];
    }

    return hashes;
  }

  function getRecord(uint32 _location) public view returns (Record memory) {
    return _records[_location];
  }

  function getUser(address _account) public view returns (User memory) {
    return _users[_account];
  }

}

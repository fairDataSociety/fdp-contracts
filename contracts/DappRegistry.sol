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
    bytes32 recordHash;
    address creator;
    bytes32 location;
    bytes32 urlHash;
    bool edited;
    uint index;
    uint creatorIndex;
    uint256 timestamp;
  }

  struct User {
    // user's dapps
    bytes32[] records;
    // dapps that the user validated
    bytes32[] validatedRecords;
    // mapping of dapps that the user validated
    mapping(bytes32 => bool) validatedRecordsMapping;
  }

  mapping(address => User) internal _users;
  mapping(bytes32 => Record) internal _records;
  
  bytes32[] public recordList;

  bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

  constructor () {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
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

  /**
   * Creates a new dApp record if it doesn't exists.
   * _location - Swarm hash
   * _urlHash - keccak256 hash of the dApp URL
   */
  function createRecord(bytes32 _location, bytes32 _urlHash) public {
    User storage user = _users[msg.sender];
    bytes32 recordHash = keccak256(abi.encode(msg.sender, user.records.length, block.timestamp));

    Record storage record = _records[recordHash];
    require(record.location == bytes32(0), "Record already exists");

    record.recordHash = recordHash;
    record.creator = msg.sender;
    record.location = _location;
    record.urlHash = _urlHash;
    record.edited = true;
    record.timestamp = block.timestamp;
    record.index = recordList.length;
    record.creatorIndex = user.records.length;

    _records[recordHash] = record;
    recordList.push(recordHash);
    user.records.push(recordHash);
  }

  function editRecord(bytes32 _recordHash, bytes32 _newLocation) public recordEditingAllowed(_recordHash) {
    Record storage record = _records[_recordHash];

    record.location = _newLocation;
    record.edited = true;
  }

  function validateRecord(bytes32 _recordHash) public {
    User storage validator = _users[msg.sender];
    require(_records[_recordHash].location != 0, "No record");

    if (hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(VALIDATOR_ROLE, msg.sender)) {
      Record storage record = _records[_recordHash];
      record.edited = false;
    }
    
    if (!validator.validatedRecordsMapping[_recordHash]) {
      validator.validatedRecords.push(_recordHash);
      validator.validatedRecordsMapping[_recordHash] = true;
    }
  }

  function unvalidateRecord(bytes32 _recordHash) public {
    User storage validator = _users[msg.sender];
    uint lastIndex = validator.validatedRecords.length - 1;

    for (uint i = 0; i <= lastIndex; i++) {
      if (validator.validatedRecords[i] == _recordHash) {
        if (i != lastIndex) {
          validator.validatedRecords[i] = validator.validatedRecords[lastIndex];
        }

        validator.validatedRecords.pop();
        validator.validatedRecordsMapping[_recordHash] = true;

        break;
      }
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

  function getValidatedRecords(address _validatorAddress) public view returns (Record[] memory) {
    User storage user = _users[_validatorAddress];
    Record[] memory records = new Record[](user.validatedRecords.length);
    
    for (uint i = 0; i < user.validatedRecords.length; i++) {
        records[i] = _records[user.validatedRecords[i]];
    }

    return records;
  }

  function getRecord(bytes32 _location) public view returns (Record memory) {
    return _records[_location];
  }

  function getUserRecordHashes(address _account) public view returns (bytes32[] memory) {
    return _users[_account].records;
  }

}

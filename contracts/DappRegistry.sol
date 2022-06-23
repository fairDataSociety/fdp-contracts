// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@ensdomains/ens-contracts/contracts/registry/ENSRegistry.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@ensdomains/solsha1/contracts/SHA1.sol";
import "@ensdomains/buffer/contracts/Buffer.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@ensdomains/ens-contracts/contracts/registry/ENS.sol";
import "./FDSRegistrar.sol";

contract DappRegistry {

	struct Record {
		// ENS app name
		bytes32 node;
		// DApp description
		string description;
		// app version
		uint8 version;
		// indexation type
		uint8 indexType;
		// Data structure format
		bytes32 dataFormat;
		// Data structure reference
		bytes32 blobRef;
		// Creation date
		uint256 timestamp;
	}
	event DappRecordAdded(
		bytes32 indexed node,
		bytes32 label,
		uint256 duration
	);
	event DappRecordUpdated(
		bytes32 indexed node,
		string description,
		uint8 version
	);
	// Maps listingHashes to associated node data
	mapping(bytes32 => Record) private records;


	// Global Variables
    ENS public ensInstance;
	FDSRegistrar fdsRegistrar;

	constructor(
		ENS _ens,
		FDSRegistrar _fdsRegistrar
	)  {
		ensInstance = _ens;
		fdsRegistrar = _fdsRegistrar;
	}
	
    /**
     * @dev Gets dapp record.
     *
     * Returns a Record object.
     */
	function get(bytes32 _nodehash)
		public
		view
		returns (Record memory)
	{

		require(
			records[_nodehash].node == _nodehash,
			"Dapp does not exist."
		);

		return (records[_nodehash]);
	}

    /**
     * @dev Updates a dapp record.
     *
     * Returns the node hash
     *
     * Emits an {DappRecordUpdated} event.
     */
	function update(
		bytes32 _nodehash,
		Record calldata _record
	) external returns (bytes32) {

		require(
			records[_nodehash].node == _nodehash,
			"Dapp does not exist."
		);
		if (bytes(_record.description).length > 0) {
		 records[_nodehash].description = _record.description;
		}		
		records[_nodehash].version = _record.version;
		records[_nodehash].indexType = _record.indexType;
		if (bytes32(_record.dataFormat).length > 0) {
		 records[_nodehash].dataFormat = _record.dataFormat;
		}
		if (bytes32(_record.blobRef).length > 0) {
		 records[_nodehash].blobRef = _record.blobRef;
		}
		records[_nodehash].timestamp = block.timestamp;		
		
		emit DappRecordUpdated(_nodehash, _record.description, _record.version);

		return _nodehash;
	}
	
    /**
     * @dev Registers a new dapp record.
     *
     * Returns the node hash
     *
     * Emits an {DappRecordAdded} event.
     */
	function add(
		bytes32 _nodehash,
		bytes32 _label,
		address _owner,
		uint _duration,
		Record calldata _record
	) external returns (bytes32) {
		fdsRegistrar.register(uint256(_label), _owner, _duration);
		
		// Sets record
		records[_nodehash]  = _record;		
		emit DappRecordAdded(_nodehash, _label, _duration);

		return _nodehash;
	}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@ensdomains/ens-contracts/contracts/registry/ENS.sol";
import "./FDSRegistrar.sol";

contract DappRegistry {

	struct Record {
		// ENS app name
		bytes32 node;
		// owner
		address owner;
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
		uint256 duration,
		address indexed owner
	);
	event TransferRecord(
		address from,
		address to,
		bytes32 node
	);

	// Maps listingHashes to associated node data
	mapping(bytes32 => Record) private records;


	// Global Variables
    ENS public ensInstance;
	FDSRegistrar fdsRegistrar;
	bytes32 baseNode;

	constructor(
		ENS _ens,
		FDSRegistrar _fdsRegistrar,
		bytes32 _node
	)  {
		ensInstance = _ens;
		baseNode = _node;
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
     * @dev Registers a new dapp record.
     *
     * Returns a boolean value indicating whether the operation succeeded.
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
		emit DappRecordAdded(_nodehash, _label, _duration, msg.sender);

		return _nodehash;
	}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./ENS.sol";


contract DappRegistry {

	struct Record {
		// amount deposited
		uint256 amountDeposited;
		// ENS app name
		bytes32 appName;
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
		bytes32 indexed appName,
		uint256 deposit,
		address indexed applicant
	);
	event TransferRecord(
		address from,
		address to,
		bytes32 appName
	);

	// Maps listingHashes to associated appName data
	mapping(bytes32 => Record) private records;

	modifier only_owner(bytes32 _node) {
		require(ens.owner(_node) == msg.sender && records[_node].owner == msg.sender, "Owner is not sender");
		_;
	}

	// Global Variables
	IERC20 public token;
    ENS private ens;
	string public name;
	uint256 public minDeposit;


	// using the constructor to initialize the TCR parameters
	// again, to keep it simple, skipping the Parameterizer and ParameterizerFactory
	constructor(
		string memory _name,
		address _token,
		address _ensAddr,
		uint256 _minDeposit
	)  {
		require(_token != address(0), "Token address should not be 0 address.");

		token = IERC20(_token);
		name = _name;
		ens = ENS(_ensAddr);

		// minimum deposit for listing to be whitelisted
		minDeposit = _minDeposit;
	}


    /**
     * @dev Sets the owner of the dapp record.
     *
     * Returns true if it passed
     */
	function setOwner(
		address _to,
		bytes32 _appName
	) external only_owner(_appName) 
	returns (bool){
		records[_appName].owner = _to;
		emit TransferRecord(msg.sender, _to, _appName);
		return true;
	}


    /**
     * @dev Burns / Transfer record address (node owner).
     *
     * Returns true if it passed
     */
	function burn(
		bytes32 _appName
	) external only_owner(_appName)
	returns (bool) {
		records[_appName].owner = address(0);
		emit TransferRecord(msg.sender, address(0), _appName);
		return true;
	}


    /**
     * @dev Gets dapp registry information.
     *
     * Returns a tuple.
     */
	function getDetails()
		public
		view
		returns (
			string memory,
			address,
			uint256
		)
	{
		string memory _name = name;
		return (
			_name,
			address(token),
			minDeposit
		);
	}

	
    /**
     * @dev Gets dapp record.
     *
     * Returns a Record object.
     */
	function get(bytes32 _appName)
		public
		view
		returns (Record memory)
	{

		require(
			records[_appName].appName == _appName,
			"Dapp does not exist."
		);

		return (records[_appName]);
	}

	
    /**
     * @dev Adds a new dapp record.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits an {DappRecordAdded} event.
     */
	function add(
		bytes32 _appName,
		uint256 _amount,
		Record calldata _record
	) external {
		require(
			records[_appName].appName == _appName,
			"Dapp name already exists"
		);
		require(_amount >= minDeposit, "Not enough stake for dapp registration.");

		// Sets record
		records[_appName]  = _record;		


		// Transfer tokens from user
		require(
			token.transferFrom(msg.sender, address(this), _amount),
			"Token transfer failed."
		);

		emit DappRecordAdded(_appName, _amount, msg.sender);
	}



	
	// TODO: Add withdraw gas and withdraw token to contract
}

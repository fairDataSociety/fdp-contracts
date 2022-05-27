// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./ENS.sol";


contract DappRegistry {
	// Vanilla TCR simplified from https://github.com/skmgoldin/tcr

	struct Listing {
		// Expiration date of apply stage
		uint256 applicationExpiry;
		// Indicates records status
		bool whitelisted;
		// Challenge voting passed 
		bool challengePassed;
		// Owner of Listing
		address minter;
		// Number of tokens in the listing
		uint256 deposit;
		// the challenge id of the current challenge
		uint256 challengeId;
		// records id
		bytes32 appName;
	}

	struct Record {
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

	// Simple TCR
	struct Vote {
		bool value;
		uint256 stake;
		bool claimed;
		bool voted;
	}

	struct Poll {
		uint256 id;
		uint256 votesFor;
		uint256 votesAgainst;
		uint256 commitEndDate;
		bool passed;
	}

	struct Challenge {
		// Owner of Challenge
		address challenger;
		// Completed challenge
		bool resolved;
		// Number of tokens at stake for either party during challenge
		uint256 stake;
		// number of tokens from losing side - winning reward
		uint256 rewardPool;
		// number of tokens from winning side - to be returned
		uint256 totalTokens;
	}
	event OnApplication(
		bytes32 indexed appName,
		uint256 deposit,
		address indexed applicant
	);
	event ChallengeCompleted(
		bytes32 indexed appName,
		uint256 challengeId,
		address indexed challenger
	);
	event Voted(
		bytes32 indexed appName,
		uint256 challengeId,
		address indexed voter
	);
	event ResolvedChallenge(
		bytes32 indexed appName,
		uint256 challengeId,
		address indexed resolver
	);
	event RewardClaimed(
		uint256 indexed challengeId,
		uint256 reward,
		address indexed voter
	);
	event TransferRecord(
		address from,
		address to,
		bytes32 appName
	);

	// revealed by default; no partial locking
	mapping(uint256 => mapping(address => Vote)) private votes;

	// Maps challengeIDs to associated challenge data
	mapping(uint256 => Challenge) private challenges;

	// Maps listingHashes to associated appName data
	mapping(bytes32 => Listing) private listings;
	mapping(bytes32 => Record) private records;	

	// Maps polls to associated challenge
	mapping(uint256 => Poll) private polls;


	modifier only_owner(bytes32 _node) {
		require(ens.owner(_node) == msg.sender && records[_node].owner == msg.sender, "Owner is not sender");
		_;
	}

	// Global Variables
	IERC20 public token;
    ENS private ens;
	string public name;
	uint256 public minDeposit;
	uint256 public applyStageLen;
	uint256 public commitStageLen;

	uint256 private constant INITIAL_POLL_NONCE = 0;
	uint256 public pollNonce;

	// using the constructor to initialize the TCR parameters
	// again, to keep it simple, skipping the Parameterizer and ParameterizerFactory
	constructor(
		string memory _name,
		address _token,
		address _ensAddr,
		uint256 _minDeposit,
		uint256 _applicationExpiry,
		uint256 _commitPeriod
	)  {
		require(_token != address(0), "Token address should not be 0 address.");

		token = IERC20(_token);
		name = _name;
		ens = ENS(_ensAddr);

		// minimum deposit for listing to be whitelisted
		minDeposit = _minDeposit;

		// period over which applicants wait to be whitelisted
		applyStageLen = _applicationExpiry;

		// length of commit period for voting
		commitStageLen = _commitPeriod;

		// Initialize the poll nonce
		pollNonce = INITIAL_POLL_NONCE;
	}

	function setOwner(
		address _to,
		bytes32 _appName
	) external only_owner(_appName) {
		require(isWhitelisted(_appName), "Dapp not whitelisted.");

		records[_appName].owner = _to;
		emit TransferRecord(msg.sender, _to, _appName);
	}

	function burn(
		bytes32 _appName
	) external only_owner(_appName) {
		require(isWhitelisted(_appName), "Dapp not whitelisted.");

		records[_appName].owner = address(0);
		emit TransferRecord(msg.sender, address(0), _appName);
	}

	// returns whether a listing is already whitelisted
	function isWhitelisted(bytes32 _appName)
		public
		view
		returns (bool whitelisted)
	{
		return listings[_appName].whitelisted;
	}

	// returns if a listing is in apply stage
	function isPending(bytes32 _appName)
		public
		view
		returns (bool exists)
	{
		return listings[_appName].applicationExpiry > 0;
	}

	// get details of this records (for UI)
	function getDetails()
		public
		view
		returns (
			string memory,
			address,
			uint256,
			uint256,
			uint256
		)
	{
		string memory _name = name;
		return (
			_name,
			address(token),
			minDeposit,
			applyStageLen,
			commitStageLen
		);
	}

	// get details of a listing (for UI)
	function getListingDetails(bytes32 _appName)
		public
		view
		returns (Listing memory, Record memory)
	{
		Listing memory listingIns = listings[_appName];

		// Listing must be in apply stage or already on the whitelist
		require(
			isPending(_appName) || listingIns.whitelisted,
			"Dapp does not exist."
		);

		return (listingIns, records[listingIns.appName]);
	}

	// proposes a listing to be whitelisted
	function propose(
		bytes32 _appName,
		uint256 _amount,
		Record calldata _record
	) external {
		require(
			!isWhitelisted(_appName),
			"Dapp is already whitelisted."
		);
		require(
			!isPending(_appName),
			"Dapp is already in apply stage."
		);
		require(_amount >= minDeposit, "Not enough stake for application.");

		// Sets owner
		Listing storage listing = listings[_appName];
		listing.minter = msg.sender;
		listing.appName = _record.appName;
		records[listing.appName]  = _record;		

		// Sets apply stage end time
		listing.applicationExpiry = block.timestamp + applyStageLen;
		listing.deposit = _amount;

		// Transfer tokens from user
		require(
			token.transferFrom(listing.minter, address(this), _amount),
			"Token transfer failed."
		);

		emit OnApplication(_appName, _amount, msg.sender);
	}

	// challenges a listing from being whitelisted
	function challenge(bytes32 _appName, uint256 _amount)
		external
		returns (uint256 challengeId)
	{
		// Listing must be in apply stage or already on the whitelist
		require(
			isPending(_appName) || listings[_appName].whitelisted,
			"Dapp does not exist."
		);

		// Prevent multiple challenges
		require(
			listings[_appName].challengeId == 0 ||
				challenges[listings[_appName].challengeId].resolved,
			"Dapp is already challenged."
		);

		// check if apply stage is active
		require(
			listings[_appName].applicationExpiry > block.timestamp,
			"Apply stage has passed."
		);

		// check if enough amount is staked for challenge
		require(
			_amount >= listings[_appName].deposit,
			"Not enough stake passed for challenge."
		);

		pollNonce = pollNonce + 1;
		challenges[pollNonce] = Challenge({
			challenger: msg.sender,
			stake: _amount,
			resolved: false,
			totalTokens: 0,
			rewardPool: 0
		});

		// create a new poll for the challenge
		polls[pollNonce] = Poll({
			id: pollNonce,
			votesFor: 0,
			votesAgainst: 0,
			passed: false,
			commitEndDate: block.timestamp + (commitStageLen) /* solium-disable-line security/no-block-members */
		});

		// Updates appName to store most recent challenge
		listings[_appName].challengeId = pollNonce;

		// Transfer tokens from challenger
		require(
			token.transferFrom(msg.sender, address(this), _amount),
			"Token transfer failed."
		);

		emit ChallengeCompleted(_appName, pollNonce, msg.sender);
		return pollNonce;
	}

	// commits a vote for/against a listing
	// plcr voting is not being used here
	// to keep it simple, we just store the choice as a bool - true is for and false is against
	function vote(
		bytes32 _appName,
		uint256 _amount,
		bool _choice
	) public {
		Listing storage listing = listings[_appName];

		// Listing must be in apply stage or already on the whitelist
		require(
			isPending(_appName) || listing.whitelisted,
			"Dapp does not exist."
		);

		// Check if listing is challenged
		require(
			listing.challengeId > 0 &&
				!challenges[listing.challengeId].resolved,
			"Dapp is not challenged."
		);

		// check if commit stage is active
		require(
			polls[listing.challengeId].commitEndDate > block.timestamp,
			"Commit period has passed."
		);

		// Transfer tokens from voter
		require(
			token.transferFrom(msg.sender, address(this), _amount),
			"Token transfer failed."
		);

		if (_choice) {
			polls[listing.challengeId].votesFor += _amount;
		} else {
			polls[listing.challengeId].votesAgainst += _amount;
		}
		
		require(
			votes[listing.challengeId][msg.sender].voted == false,
			"User already voted for proposal"
		);
		votes[listing.challengeId][msg.sender] = Vote({
			value: _choice,
			stake: _amount,
			claimed: false,
			voted: true
		});

		emit Voted(_appName, listing.challengeId, msg.sender);
	}

	// check if the listing can be whitelisted
	function canBeWhitelisted(bytes32 _appName) public view returns (bool) {
		uint256 challengeId = listings[_appName].challengeId;

		// Ensures that the application was made,
		// the application period has ended,
		// the appName can be whitelisted,
		// and either: the challengeId == 0, or the challenge has been resolved.
		/* solium-disable */
		if (
			isPending(_appName) &&
			listings[_appName].applicationExpiry < block.timestamp &&
			!isWhitelisted(_appName) &&
			(challengeId == 0 || challenges[challengeId].resolved == true)
		) {
			return true;
		}

		return false;
	}

	// updates the status of a listing
	function updateStatus(bytes32 _appName) public {
		if (canBeWhitelisted(_appName)) {
			listings[_appName].whitelisted = true;
		} else {
			resolveChallenge(_appName);
		}
	}

	// ends a poll and returns if the poll passed or not
	function endPoll(uint256 challengeId) private returns (bool didPass) {
		require(polls[challengeId].commitEndDate > 0, "Poll does not exist.");
		Poll storage poll = polls[challengeId];

		// check if commit stage is active
		require(
			poll.commitEndDate < block.timestamp,
			"Commit period is active."
		);

		if (poll.votesFor >= poll.votesAgainst) {
			poll.passed = true;
		} else {
			poll.passed = false;
		}

		return poll.passed;
	}

	// resolves a challenge and calculates rewards
	function resolveChallenge(bytes32 _appName) private {
		// Check if listing is challenged
		Listing memory listing = listings[_appName];
		require(
			listing.challengeId > 0 &&
				!challenges[listing.challengeId].resolved,
			"Dapp is not challenged."
		);

		uint256 challengeId = listing.challengeId;

		// end the poll
		bool pollPassed = endPoll(challengeId);

		// updated challenge status
		challenges[challengeId].resolved = true;

		address challenger = challenges[challengeId].challenger;

		// Case: challenge failed
		if (pollPassed) {
			challenges[challengeId].totalTokens = polls[challengeId].votesFor;
			challenges[challengeId].rewardPool =
				challenges[challengeId].stake +
				polls[challengeId].votesAgainst;
			listings[_appName].whitelisted = true;
		} else {
			// Case: challenge succeeded
			// give back the challenge stake to the challenger
			require(
				token.transfer(challenger, challenges[challengeId].stake),
				"Challenge stake return failed."
			);
			challenges[challengeId].totalTokens = polls[challengeId]
				.votesAgainst;
			challenges[challengeId].rewardPool =
				listing.deposit +
				polls[challengeId].votesFor;
			listings[_appName].challengePassed = true;
		}

		emit ResolvedChallenge(_appName, challengeId, msg.sender);
	}

	// claim rewards for a vote
	function claimRewards(uint256 challengeId) public {
		// check if challenge is resolved
		require(
			challenges[challengeId].resolved == true,
			"Challenge is not resolved."
		);

		Vote storage voteInstance = votes[challengeId][msg.sender];

		// check if vote reward is already claimed
		require(
			voteInstance.claimed == false,
			"Vote reward is already claimed."
		);

		// if winning party, calculate reward and transfer
		if (
			(polls[challengeId].passed && voteInstance.value) ||
			(!polls[challengeId].passed && !voteInstance.value)
		) {
			uint256 reward = (challenges[challengeId].rewardPool /
				(challenges[challengeId].totalTokens)) * (voteInstance.stake);
			uint256 total = voteInstance.stake + (reward);
			require(
				token.transfer(msg.sender, total),
				"Voting reward transfer failed."
			);
			emit RewardClaimed(challengeId, total, msg.sender);
		}

		voteInstance.claimed = true;
	}
}

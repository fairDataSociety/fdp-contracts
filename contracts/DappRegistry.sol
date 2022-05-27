// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC20.sol";

contract DappRegistry {
	// Vanilla TCR simplified from https://github.com/skmgoldin/tcr

	struct Listing {
		// Expiration date of apply stage
		uint256 applicationExpiry;
		// Indicates records status
		bool whitelisted;
		// Owner of Listing
		address owner;
		// Number of tokens in the listing
		uint256 deposit;
		// the challenge id of the current challenge
		uint256 challengeId;
		// records id
		bytes32 appName;
		// arrayIndex of listing in listingNames array (for deletion)
		uint256 arrIndex;
	}

	struct Record {
		// ENS app name
		bytes32 appName;
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
		bytes32[] tags;
	}

	// Simple TCR
	struct Vote {
		bool value;
		uint256 stake;
		bool claimed;
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

	// revealed by default; no partial locking
	mapping(uint256 => mapping(address => Vote)) private votes;

	// Maps challengeIDs to associated challenge data
	mapping(uint256 => Challenge) private challenges;

	// Maps listingHashes to associated appName data
	mapping(bytes32 => Listing) private listings;
	mapping(bytes32 => Record) private records;
	bytes32[] public listingNames;

	// Maps polls to associated challenge
	mapping(uint256 => Poll) private polls;

	// Global Variables
	IERC20 public token;
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
		uint256[] memory _parameters
	) public {
		require(_token != address(0), "Token address should not be 0 address.");

		token = IERC20(_token);
		name = _name;

		// minimum deposit for listing to be whitelisted
		minDeposit = _parameters[0];

		// period over which applicants wait to be whitelisted
		applyStageLen = _parameters[1];

		// length of commit period for voting
		commitStageLen = _parameters[2];

		// Initialize the poll nonce
		pollNonce = INITIAL_POLL_NONCE;
	}

	// returns whether a listing is already whitelisted
	function isWhitelisted(bytes32 _listingHash)
		public
		view
		returns (bool whitelisted)
	{
		return listings[_listingHash].whitelisted;
	}

	// returns if a listing is in apply stage
	function isPending(bytes32 _listingHash)
		public
		view
		returns (bool exists)
	{
		return listings[_listingHash].applicationExpiry > 0;
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
	function getListingDetails(bytes32 _listingHash)
		public
		view
		returns (Listing memory, Record memory)
	{
		Listing memory listingIns = listings[_listingHash];

		// Listing must be in apply stage or already on the whitelist
		require(
			isPending(_listingHash) || listingIns.whitelisted,
			"Listing does not exist."
		);

		return (listingIns, records[listingIns.appName]);
	}

	// proposes a listing to be whitelisted
	function propose(
		bytes32 _listingHash,
		uint256 _amount,
		Record calldata _data
	) external {
		require(
			!isWhitelisted(_listingHash),
			"Listing is already whitelisted."
		);
		require(
			!isPending(_listingHash),
			"Listing is already in apply stage."
		);
		require(_amount >= minDeposit, "Not enough stake for application.");

		// Sets owner
		Listing storage listing = listings[_listingHash];
		listing.owner = msg.sender;
		listing.appName = _data.appName;
		records[listing.appName]  = _data;
		listingNames.push(listing.appName);
		listing.arrIndex = listingNames.length - 1;

		// Sets apply stage end time
		// block.timestamp or block.timestamp is safe here (can live with ~15 sec approximation)
		/* solium-disable-next-line security/no-block-members */
		listing.applicationExpiry = block.timestamp + applyStageLen;
		listing.deposit = _amount;

		// Transfer tokens from user
		require(
			token.transferFrom(listing.owner, address(this), _amount),
			"Token transfer failed."
		);

		emit OnApplication(_listingHash, _amount, msg.sender);
	}

	// challenges a listing from being whitelisted
	function challenge(bytes32 _listingHash, uint256 _amount)
		external
		returns (uint256 challengeId)
	{
		// Listing must be in apply stage or already on the whitelist
		require(
			isPending(_listingHash) || listings[_listingHash].whitelisted,
			"Listing does not exist."
		);

		// Prevent multiple challenges
		require(
			listings[_listingHash].challengeId == 0 ||
				challenges[listings[_listingHash].challengeId].resolved,
			"Listing is already challenged."
		);

		// check if apply stage is active
		/* solium-disable-next-line security/no-block-members */
		require(
			listings[_listingHash].applicationExpiry > block.timestamp,
			"Apply stage has passed."
		);

		// check if enough amount is staked for challenge
		require(
			_amount >= listings[_listingHash].deposit,
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
		listings[_listingHash].challengeId = pollNonce;

		// Transfer tokens from challenger
		require(
			token.transferFrom(msg.sender, address(this), _amount),
			"Token transfer failed."
		);

		emit ChallengeCompleted(_listingHash, pollNonce, msg.sender);
		return pollNonce;
	}

	// commits a vote for/against a listing
	// plcr voting is not being used here
	// to keep it simple, we just store the choice as a bool - true is for and false is against
	function vote(
		bytes32 _listingHash,
		uint256 _amount,
		bool _choice
	) public {
		Listing storage listing = listings[_listingHash];

		// Listing must be in apply stage or already on the whitelist
		require(
			isPending(_listingHash) || listing.whitelisted,
			"Listing does not exist."
		);

		// Check if listing is challenged
		require(
			listing.challengeId > 0 &&
				!challenges[listing.challengeId].resolved,
			"Listing is not challenged."
		);

		// check if commit stage is active
		/* solium-disable-next-line security/no-block-members */
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

		// TODO: fix vote override when same person is voing again

		votes[listing.challengeId][msg.sender] = Vote({
			value: _choice,
			stake: _amount,
			claimed: false
		});

		emit Voted(_listingHash, listing.challengeId, msg.sender);
	}

	// check if the listing can be whitelisted
	function canBeWhitelisted(bytes32 _listingHash) public view returns (bool) {
		uint256 challengeId = listings[_listingHash].challengeId;

		// Ensures that the application was made,
		// the application period has ended,
		// the appName can be whitelisted,
		// and either: the challengeId == 0, or the challenge has been resolved.
		/* solium-disable */
		if (
			isPending(_listingHash) &&
			listings[_listingHash].applicationExpiry < block.timestamp &&
			!isWhitelisted(_listingHash) &&
			(challengeId == 0 || challenges[challengeId].resolved == true)
		) {
			return true;
		}

		return false;
	}

	// updates the status of a listing
	function updateStatus(bytes32 _listingHash) public {
		if (canBeWhitelisted(_listingHash)) {
			listings[_listingHash].whitelisted = true;
		} else {
			resolveChallenge(_listingHash);
		}
	}

	// ends a poll and returns if the poll passed or not
	function endPoll(uint256 challengeId) private returns (bool didPass) {
		require(polls[challengeId].commitEndDate > 0, "Poll does not exist.");
		Poll storage poll = polls[challengeId];

		// check if commit stage is active
		/* solium-disable-next-line security/no-block-members */
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
	function resolveChallenge(bytes32 _listingHash) private {
		// Check if listing is challenged
		Listing memory listing = listings[_listingHash];
		require(
			listing.challengeId > 0 &&
				!challenges[listing.challengeId].resolved,
			"Listing is not challenged."
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
			listings[_listingHash].whitelisted = true;
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
			delete listings[_listingHash];
			delete listingNames[listing.arrIndex];
		}

		emit ResolvedChallenge(_listingHash, challengeId, msg.sender);
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

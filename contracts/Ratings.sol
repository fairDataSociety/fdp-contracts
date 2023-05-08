// SPDX-License-Identifier: MIT
// written by @tfius 

pragma solidity ^0.8.0;

contract Ratings {
    struct Rating {
        uint256 rating;
        bytes32 review;
        address user;
    }

    mapping(bytes32 => Rating[]) public ratings;
    mapping(address => mapping(bytes32 => bool)) public userHasRated;
    mapping(bytes32 => uint256) public averageRatings;
    mapping(bytes32 => uint256) public numberOfRatings;

    function rate(bytes32 recordLocation, bytes32 review, uint256 rating) public {
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5.");
        require(!userHasRated[msg.sender][recordLocation], "You have already rated for this hash digest.");

        Rating memory newRating = Rating(rating, review, msg.sender);
        ratings[recordLocation].push(newRating);

        userHasRated[msg.sender][recordLocation] = true;

        uint256 oldCount = numberOfRatings[recordLocation];
        uint256 oldAverage = averageRatings[recordLocation];

        uint256 newCount = oldCount + 1;
        uint256 newAverage = ((oldAverage * oldCount) + rating) / newCount;

        averageRatings[recordLocation] = newAverage;
        numberOfRatings[recordLocation] = newCount;
    }

    function getAverageRating(bytes32 recordLocation) public view returns (uint256) {
        return averageRatings[recordLocation];
    }

    function getNumberOfRatings(bytes32 recordLocation) public view returns (uint256) {
        return numberOfRatings[recordLocation];
    }

    function hasUserRated(bytes32 recordLocation) public view returns (bool) {
        return userHasRated[msg.sender][recordLocation];
    }

    function getRatingFor(bytes32 recordLocation) public view returns (Rating[] memory) {
        return ratings[recordLocation];
    }
}

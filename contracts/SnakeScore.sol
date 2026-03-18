// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SnakeScore
/// @notice Stores only each wallet's highest score for MonoSnake Base.
contract SnakeScore {
    error ScoreMustIncrease(uint256 previousBest, uint256 attemptedScore);
    error ScoreMustBePositive();

    mapping(address => uint256) private bestScores;

    event ScoreUpdated(
        address indexed player,
        uint256 previousBest,
        uint256 newBest,
        uint256 timestamp
    );

    function submitScore(uint256 score) external {
        if (score == 0) revert ScoreMustBePositive();

        uint256 previousBest = bestScores[msg.sender];
        if (score <= previousBest) {
            revert ScoreMustIncrease(previousBest, score);
        }

        bestScores[msg.sender] = score;
        emit ScoreUpdated(msg.sender, previousBest, score, block.timestamp);
    }

    function getBestScore(address player) external view returns (uint256) {
        return bestScores[player];
    }
}


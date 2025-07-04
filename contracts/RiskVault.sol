// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

/// @title CoverMax Protocol - Basic Structure
/// @notice Initial contract structure for insurance provider
contract RiskVault {
    /* Protocol Configuration */
    address public immutable aUSDC; // Mock aUSDC asset
    address public immutable aUSDT; // Mock aUSDT asset
    
    /* Basic State */
    mapping(address => mapping(address => uint256)) public userDeposits; // user => asset => amount
    
    constructor(address _aUSDC, address _aUSDT) {
        aUSDC = _aUSDC;
        aUSDT = _aUSDT;
    }
    
    /**
     * @dev Basic deposit function
     * @param asset The asset to deposit
     * @param amount Amount to deposit
     */
    function depositAsset(address asset, uint256 amount) external {
        // Basic validation
        require(asset == aUSDC || asset == aUSDT, "Unsupported asset");
        require(amount > 0, "Invalid amount");
        
        // Simple deposit tracking
        userDeposits[msg.sender][asset] += amount;
    }
}
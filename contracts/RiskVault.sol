// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title CoverMax Protocol - Token Integration
/// @notice Added ERC20 token transfers and basic validation
contract RiskVault {
    /* Protocol Configuration */
    address public immutable aUSDC; // Mock aUSDC asset
    address public immutable aUSDT; // Mock aUSDT asset
    
    /* Basic State */
    mapping(address => mapping(address => uint256)) public userDeposits; // user => asset => amount
    
    /* Pool Management */
    struct AssetPool {
        uint256 totalDeposited;
        bool isActive;
    }
    
    mapping(address => AssetPool) public assetPools;
    
    constructor(address _aUSDC, address _aUSDT) {
        require(_aUSDC != address(0) && _aUSDT != address(0), "Invalid address");
        aUSDC = _aUSDC;
        aUSDT = _aUSDT;
        
        // Initialize asset pools
        assetPools[_aUSDC] = AssetPool({totalDeposited: 0, isActive: true});
        assetPools[_aUSDT] = AssetPool({totalDeposited: 0, isActive: true});
    }
    
    /**
     * @dev Deposit assets with token transfers
     * @param asset The asset to deposit
     * @param amount Amount to deposit
     */
    function depositAsset(address asset, uint256 amount) external {
        require(asset == aUSDC || asset == aUSDT, "Unsupported asset");
        require(amount > 2, "Minimum deposit not met");
        require(assetPools[asset].isActive, "Pool not active");
        
        // Transfer tokens from user
        require(IERC20(asset).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Update tracking
        assetPools[asset].totalDeposited += amount;
        userDeposits[msg.sender][asset] += amount;
    }
    
    /**
     * @dev Get total value in protocol
     */
    function getTotalValueLocked() external view returns (uint256) {
        return assetPools[aUSDC].totalDeposited + assetPools[aUSDT].totalDeposited;
    }
}
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./RiskToken.sol";
import "./IRiskToken.sol";

/// @title CoverMax Protocol - Insurance Token System
/// @notice Added dual-tier insurance token issuance
contract RiskVault {
    /* Protocol Configuration */
    address public immutable seniorToken; // Senior insurance token
    address public immutable juniorToken; // Junior insurance token
    address public immutable aUSDC; // Mock aUSDC asset
    address public immutable aUSDT; // Mock aUSDT asset
    
    /* State Management */
    uint256 public totalInsuranceTokens; // Total tokens outstanding
    mapping(address => mapping(address => uint256)) public userDeposits;
    
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
        
        // Deploy insurance tokens
        seniorToken = address(new RiskToken("CoverMax Senior Insurance Token", "CM-SENIOR"));
        juniorToken = address(new RiskToken("CoverMax Junior Insurance Token", "CM-JUNIOR"));
        
        // Initialize asset pools
        assetPools[_aUSDC] = AssetPool({totalDeposited: 0, isActive: true});
        assetPools[_aUSDT] = AssetPool({totalDeposited: 0, isActive: true});
    }
    
    /**
     * @dev Issues insurance tokens for deposit
     */
    function _issueInsuranceTokens(address recipient, uint256 totalAmount) internal {
        uint256 tokenTierAmount = totalAmount / 2; // Split equally
        IRiskToken(seniorToken).mint(recipient, tokenTierAmount);
        IRiskToken(juniorToken).mint(recipient, tokenTierAmount);
        totalInsuranceTokens += totalAmount;
    }
    
    /**
     * @dev Deposit assets and receive insurance tokens
     */
    function depositAsset(address asset, uint256 amount) external {
        require(asset == aUSDC || asset == aUSDT, "Unsupported asset");
        require(amount > 2, "Minimum deposit not met");
        require(amount % 2 == 0, "Amount must be even"); // For dual tokenization
        require(assetPools[asset].isActive, "Pool not active");
        
        // Transfer tokens
        require(IERC20(asset).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Update state
        assetPools[asset].totalDeposited += amount;
        userDeposits[msg.sender][asset] += amount;
        
        // Issue insurance tokens
        _issueInsuranceTokens(msg.sender, amount);
    }
    
    /**
     * @dev Get user's insurance coverage
     */
    function getUserInsuranceCoverage(address user) external view returns (uint256) {
        uint256 seniorBalance = IRiskToken(seniorToken).balanceOf(user);
        uint256 juniorBalance = IRiskToken(juniorToken).balanceOf(user);
        uint256 totalTokens = seniorBalance + juniorBalance;
        
        if (totalInsuranceTokens == 0) return 0;
        
        uint256 totalValue = assetPools[aUSDC].totalDeposited + assetPools[aUSDT].totalDeposited;
        return (totalValue * totalTokens) / totalInsuranceTokens;
    }
    
    function getTotalValueLocked() external view returns (uint256) {
        return assetPools[aUSDC].totalDeposited + assetPools[aUSDT].totalDeposited;
    }
}
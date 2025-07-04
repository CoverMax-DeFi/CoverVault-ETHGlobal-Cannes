// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RiskToken.sol";
import "./IRiskToken.sol";

/// @title CoverMax Protocol - Redemption System
/// @notice Added token redemption and burn functionality
contract RiskVault is Ownable {
    /* Protocol Configuration */
    address public immutable seniorToken;
    address public immutable juniorToken;
    address public immutable aUSDC;
    address public immutable aUSDT;
    
    /* Constants */
    uint256 private constant PRECISION_FACTOR = 1e27;
    
    /* State Management */
    uint256 public totalInsuranceTokens;
    mapping(address => mapping(address => uint256)) public userDeposits;
    
    /* Pool Management */
    struct AssetPool {
        uint256 totalDeposited;
        bool isActive;
    }
    
    mapping(address => AssetPool) public assetPools;
    
    /* Events */
    event AssetDeposited(address indexed user, address indexed asset, uint256 amount);
    event TokensRedeemed(address indexed user, address indexed asset, uint256 seniorAmount, uint256 juniorAmount, uint256 recoveredAmount);
    
    constructor(address _aUSDC, address _aUSDT) Ownable(msg.sender) {
        require(_aUSDC != address(0) && _aUSDT != address(0), "Invalid address");
        aUSDC = _aUSDC;
        aUSDT = _aUSDT;
        
        // Deploy insurance tokens
        seniorToken = address(new RiskToken("CoverMax Senior Insurance Token", "CM-SENIOR"));
        juniorToken = address(new RiskToken("CoverMax Junior Insurance Token", "CM-JUNIOR"));
        
        // Initialize pools
        assetPools[_aUSDC] = AssetPool({totalDeposited: 0, isActive: true});
        assetPools[_aUSDT] = AssetPool({totalDeposited: 0, isActive: true});
    }
    
    function _issueInsuranceTokens(address recipient, uint256 totalAmount) internal {
        uint256 tokenTierAmount = totalAmount / 2;
        IRiskToken(seniorToken).mint(recipient, tokenTierAmount);
        IRiskToken(juniorToken).mint(recipient, tokenTierAmount);
        totalInsuranceTokens += totalAmount;
    }
    
    function _burnInsuranceTokens(address tokenHolder, uint256 seniorAmount, uint256 juniorAmount) internal {
        require(seniorAmount + juniorAmount > 0, "No tokens to burn");
        
        if (seniorAmount > 0) {
            IRiskToken(seniorToken).burn(tokenHolder, seniorAmount);
        }
        if (juniorAmount > 0) {
            IRiskToken(juniorToken).burn(tokenHolder, juniorAmount);
        }
        
        totalInsuranceTokens -= (seniorAmount + juniorAmount);
    }
    
    function _calculateRedemptionShare(uint256 totalTokensToRedeem) internal view returns (uint256) {
        if (totalInsuranceTokens == 0) return 0;
        return (totalTokensToRedeem * PRECISION_FACTOR) / totalInsuranceTokens;
    }
    
    function depositAsset(address asset, uint256 amount) external {
        require(asset == aUSDC || asset == aUSDT, "Unsupported asset");
        require(amount > 2, "Minimum deposit not met");
        require(amount % 2 == 0, "Amount must be even");
        require(assetPools[asset].isActive, "Pool not active");
        
        require(IERC20(asset).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        assetPools[asset].totalDeposited += amount;
        userDeposits[msg.sender][asset] += amount;
        
        _issueInsuranceTokens(msg.sender, amount);
        
        emit AssetDeposited(msg.sender, asset, amount);
    }
    
    /**
     * @dev Redeem insurance tokens for underlying assets
     */
    function redeemTokens(uint256 seniorAmount, uint256 juniorAmount) external {
        uint256 totalTokensToRedeem = seniorAmount + juniorAmount;
        require(totalTokensToRedeem > 0, "No tokens to redeem");
        
        uint256 redemptionShare = _calculateRedemptionShare(totalTokensToRedeem);
        
        // Calculate redemption amounts
        uint256 aUSDCAmount = (userDeposits[msg.sender][aUSDC] * redemptionShare) / PRECISION_FACTOR;
        uint256 aUSDTAmount = (userDeposits[msg.sender][aUSDT] * redemptionShare) / PRECISION_FACTOR;
        
        uint256 totalRecovery = aUSDCAmount + aUSDTAmount;
        require(totalRecovery > 0, "No funds to recover");
        
        // Update state
        userDeposits[msg.sender][aUSDC] -= aUSDCAmount;
        userDeposits[msg.sender][aUSDT] -= aUSDTAmount;
        
        if (aUSDCAmount > 0) {
            assetPools[aUSDC].totalDeposited -= aUSDCAmount;
        }
        if (aUSDTAmount > 0) {
            assetPools[aUSDT].totalDeposited -= aUSDTAmount;
        }
        
        _burnInsuranceTokens(msg.sender, seniorAmount, juniorAmount);
        
        // Transfer assets
        if (aUSDCAmount > 0) {
            require(IERC20(aUSDC).transfer(msg.sender, aUSDCAmount), "Transfer failed");
            emit TokensRedeemed(msg.sender, aUSDC, seniorAmount, juniorAmount, aUSDCAmount);
        }
        if (aUSDTAmount > 0) {
            require(IERC20(aUSDT).transfer(msg.sender, aUSDTAmount), "Transfer failed");
            emit TokensRedeemed(msg.sender, aUSDT, 0, 0, aUSDTAmount);
        }
    }
    
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
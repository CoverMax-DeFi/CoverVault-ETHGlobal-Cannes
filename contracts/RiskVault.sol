// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RiskToken.sol";
import "./IRiskToken.sol";

/// @title CoverMax Protocol - Optimized Version
/// @notice Complete insurance provider with advanced features and error handling
contract RiskVault is Ownable {
    /* Protocol Configuration */
    address public immutable seniorToken;
    address public immutable juniorToken;
    address public immutable aUSDC;
    address public immutable aUSDT;
    
    /* Mathematical Constants */
    uint256 private constant PRECISION_FACTOR = 1e27;
    uint256 private constant MIN_DEPOSIT_AMOUNT = 2;
    
    /* Protocol Lifecycle Phases */
    uint256 public depositPhaseEnd;
    uint256 public coveragePhaseEnd;
    uint256 public seniorClaimStart;
    uint256 public finalClaimDeadline;
    
    /* Protocol State Management */
    uint256 public totalInsuranceTokens;
    bool public protocolPaused;
    uint256 public maxLiquidityWithdrawalPercent = 20;
    uint256 public currentPeriodWithdrawals;
    uint256 public coveragePeriodBaseAmount;
    
    /* Insurance Pool Management */
    struct AssetPool {
        uint256 totalDeposited;
        uint256 totalClaimed;
        bool isActive;
    }
    
    mapping(address => AssetPool) public assetPools;
    mapping(address => mapping(address => uint256)) public userDeposits;
    
    /* Insurance Claim Management */
    enum ClaimStatus { Pending, Approved, Rejected, Paid }
    
    struct InsuranceClaim {
        address claimant;
        address asset;
        uint256 amount;
        uint256 timestamp;
        ClaimStatus status;
        bytes32 evidence;
    }
    
    InsuranceClaim[] public insuranceClaims;
    mapping(address => uint256[]) public userClaims;
    
    /* Custom Errors */
    error InsufficientDepositAmount();
    error UnevenDepositAmount();
    error UnsupportedAsset();
    error ProtocolCurrentlyPaused();
    error InvalidAssetAddress();
    error UnequalTokenAmountsDuringCoverage();
    error ExceedsMaxLiquidityWithdrawal();
    error NoTokensToRedeem();
    error NoFundsRecovered();
    error InvalidWithdrawalLimit();
    error TransferOperationFailed();
    error InvalidClaimId();
    error ClaimAlreadyProcessed();
    error InsufficientPoolBalance();
    
    /* Protocol Events */
    event AssetDeposited(address indexed depositor, address indexed asset, uint256 amount);
    event TokensRedeemed(address indexed redeemer, address indexed asset, uint256 seniorAmount, uint256 juniorAmount, uint256 recoveredAmount);
    event InsuranceClaimSubmitted(uint256 indexed claimId, address indexed claimant, address indexed asset, uint256 amount);
    event InsuranceClaimProcessed(uint256 indexed claimId, bool approved);
    event InsuranceClaimPaid(uint256 indexed claimId, address indexed claimant, uint256 amount);
    event ProtocolPauseStateChanged(bool paused);
    event LiquidityWithdrawalLimitUpdated(uint256 newLimit);
    event CoveragePeriodInitiated(uint256 totalDeposited);
    event AssetPoolStatusChanged(address indexed asset, bool isActive);
    
    /* Access Control Modifiers */
    modifier whenNotPaused() {
        if (protocolPaused) revert ProtocolCurrentlyPaused();
        _;
    }
    
    constructor(address _aUSDC, address _aUSDT) Ownable(msg.sender) {
        if (_aUSDC == address(0) || _aUSDT == address(0)) revert InvalidAssetAddress();
        aUSDC = _aUSDC;
        aUSDT = _aUSDT;
        
        // Deploy insurance tokenization contracts
        seniorToken = address(new RiskToken("CoverMax Senior Insurance Token", "CM-SENIOR"));
        juniorToken = address(new RiskToken("CoverMax Junior Insurance Token", "CM-JUNIOR"));
        
        // Initialize protocol lifecycle phases
        depositPhaseEnd = block.timestamp + 2 days;
        coveragePhaseEnd = depositPhaseEnd + 5 days;
        seniorClaimStart = coveragePhaseEnd + 1 days;
        finalClaimDeadline = seniorClaimStart + 1 days;
        
        // Initialize asset pools
        assetPools[_aUSDC] = AssetPool({totalDeposited: 0, totalClaimed: 0, isActive: true});
        assetPools[_aUSDT] = AssetPool({totalDeposited: 0, totalClaimed: 0, isActive: true});
        
        // Initialize coverage period state
        coveragePeriodBaseAmount = 0;
    }
    
    // Insurance Asset Management
    function _isAssetSupported(address asset) internal view returns (bool isSupported) {
        return asset == aUSDC || asset == aUSDT;
    }
    
    function _getTotalPoolValue() internal view returns (uint256 totalValue) {
        return assetPools[aUSDC].totalDeposited + assetPools[aUSDT].totalDeposited;
    }
    
    function _getUserTotalCoverage(address user) internal view returns (uint256 totalCoverage) {
        return userDeposits[user][aUSDC] + userDeposits[user][aUSDT];
    }
    
    // Insurance Coverage Calculations
    function _calculateRedemptionShare(uint256 totalTokensToRedeem) internal view returns (uint256 proportionalShare) {
        if (totalInsuranceTokens == 0) return 0;
        return (totalTokensToRedeem * PRECISION_FACTOR) / totalInsuranceTokens;
    }
    
    function _calculateAssetRedemption(address user, uint256 redemptionShare) internal view returns (uint256 aUSDCAmount, uint256 aUSDTAmount) {
        aUSDCAmount = (userDeposits[user][aUSDC] * redemptionShare) / PRECISION_FACTOR;
        aUSDTAmount = (userDeposits[user][aUSDT] * redemptionShare) / PRECISION_FACTOR;
    }
    
    function _calculateInsuranceCoverage(address user, uint256 seniorTokens, uint256 juniorTokens) internal view returns (uint256 totalCoverage) {
        uint256 totalTokens = seniorTokens + juniorTokens;
        if (totalInsuranceTokens == 0) return 0;
        
        uint256 userShare = (totalTokens * PRECISION_FACTOR) / totalInsuranceTokens;
        totalCoverage = (_getTotalPoolValue() * userShare) / PRECISION_FACTOR;
    }
    
    // Insurance Token Management
    function _issueInsuranceTokens(address recipient, uint256 totalAmount) internal {
        uint256 tokenTierAmount = totalAmount >> 1; // Gas-optimized division by 2
        IRiskToken(seniorToken).mint(recipient, tokenTierAmount);
        IRiskToken(juniorToken).mint(recipient, tokenTierAmount);
        unchecked {
            totalInsuranceTokens += totalAmount; // Safe arithmetic in realistic scenarios
        }
    }
    
    function _burnInsuranceTokens(address tokenHolder, uint256 seniorAmount, uint256 juniorAmount) internal {
        uint256 totalToBurn = seniorAmount + juniorAmount;
        if (totalToBurn == 0) revert NoTokensToRedeem();
        
        if (seniorAmount > 0) {
            IRiskToken(seniorToken).burn(tokenHolder, seniorAmount);
        }
        if (juniorAmount > 0) {
            IRiskToken(juniorToken).burn(tokenHolder, juniorAmount);
        }
        
        unchecked {
            totalInsuranceTokens -= totalToBurn; // Safe due to validation above
        }
    }
    
    function _initializeNewProtocolCycle() internal {
        depositPhaseEnd = block.timestamp + 2 days;
        coveragePhaseEnd = depositPhaseEnd + 5 days;
        seniorClaimStart = coveragePhaseEnd + 1 days;
        finalClaimDeadline = seniorClaimStart + 1 days;
        
        // Reset coverage period tracking
        currentPeriodWithdrawals = 0;
        coveragePeriodBaseAmount = 0;
    }
    
    function _initializeCoveragePeriod() internal {
        if (coveragePeriodBaseAmount == 0 && block.timestamp >= depositPhaseEnd) {
            coveragePeriodBaseAmount = _getTotalPoolValue();
            emit CoveragePeriodInitiated(_getTotalPoolValue());
        }
    }
    
    function toggleProtocolPause() external onlyOwner {
        protocolPaused = !protocolPaused;
        emit ProtocolPauseStateChanged(protocolPaused);
    }
    
    function updateLiquidityWithdrawalLimit(uint256 newLimitPercent) external onlyOwner {
        if (newLimitPercent > 100) revert InvalidWithdrawalLimit();
        maxLiquidityWithdrawalPercent = newLimitPercent;
        emit LiquidityWithdrawalLimitUpdated(newLimitPercent);
    }
    
    function toggleAssetPool(address asset) external onlyOwner whenNotPaused {
        if (!_isAssetSupported(asset)) revert UnsupportedAsset();
        
        assetPools[asset].isActive = !assetPools[asset].isActive;
        emit AssetPoolStatusChanged(asset, assetPools[asset].isActive);
    }
    
    // External Insurance Functions
    function depositAsset(address asset, uint256 depositAmount) external whenNotPaused {
        if (block.timestamp > finalClaimDeadline) {
            _initializeNewProtocolCycle();
        }
        
        if (depositAmount <= MIN_DEPOSIT_AMOUNT) revert InsufficientDepositAmount();
        if (depositAmount & 1 != 0) revert UnevenDepositAmount(); // Must be even for dual tokenization
        if (!_isAssetSupported(asset)) revert UnsupportedAsset();
        if (!assetPools[asset].isActive) revert UnsupportedAsset();
        
        // Transfer asset from depositor
        if (!IERC20(asset).transferFrom(msg.sender, address(this), depositAmount)) {
            revert TransferOperationFailed();
        }
        
        // Update pool and user tracking
        assetPools[asset].totalDeposited += depositAmount;
        userDeposits[msg.sender][asset] += depositAmount;
        
        // Issue insurance tokens
        _issueInsuranceTokens(msg.sender, depositAmount);
        _initializeCoveragePeriod();
        
        emit AssetDeposited(msg.sender, asset, depositAmount);
    }
    
    function submitInsuranceClaim(address asset, uint256 amount, bytes32 evidence) external whenNotPaused returns (uint256 claimId) {
        if (!_isAssetSupported(asset)) revert UnsupportedAsset();
        if (amount == 0) revert InsufficientDepositAmount();
        
        claimId = insuranceClaims.length;
        
        insuranceClaims.push(InsuranceClaim({
            claimant: msg.sender,
            asset: asset,
            amount: amount,
            timestamp: block.timestamp,
            status: ClaimStatus.Pending,
            evidence: evidence
        }));
        
        userClaims[msg.sender].push(claimId);
        
        emit InsuranceClaimSubmitted(claimId, msg.sender, asset, amount);
    }
    
    function processInsuranceClaim(uint256 claimId, bool approve) external onlyOwner {
        if (claimId >= insuranceClaims.length) revert InvalidClaimId();
        
        InsuranceClaim storage claim = insuranceClaims[claimId];
        if (claim.status != ClaimStatus.Pending) revert ClaimAlreadyProcessed();
        
        claim.status = approve ? ClaimStatus.Approved : ClaimStatus.Rejected;
        
        emit InsuranceClaimProcessed(claimId, approve);
        
        // If approved, execute payout
        if (approve) {
            _executeClaimPayout(claimId);
        }
    }
    
    function _executeClaimPayout(uint256 claimId) internal {
        InsuranceClaim storage claim = insuranceClaims[claimId];
        
        if (claim.status != ClaimStatus.Approved) revert ClaimAlreadyProcessed();
        if (assetPools[claim.asset].totalDeposited < claim.amount) revert InsufficientPoolBalance();
        
        // Update pool tracking
        assetPools[claim.asset].totalDeposited -= claim.amount;
        assetPools[claim.asset].totalClaimed += claim.amount;
        
        // Transfer asset to claimant
        if (!IERC20(claim.asset).transfer(claim.claimant, claim.amount)) {
            revert TransferOperationFailed();
        }
        
        claim.status = ClaimStatus.Paid;
        
        emit InsuranceClaimPaid(claimId, claim.claimant, claim.amount);
    }
    
    function _executeRedemption(uint256 seniorAmount, uint256 juniorAmount) internal {
        if (block.timestamp > finalClaimDeadline) {
            _initializeNewProtocolCycle();
        }
        
        // Initialize coverage period tracking if needed
        _initializeCoveragePeriod();
        
        // During coverage phase, enforce equal token redemption amounts
        if (block.timestamp > depositPhaseEnd && block.timestamp <= coveragePhaseEnd) {
            if (seniorAmount != juniorAmount) revert UnequalTokenAmountsDuringCoverage();
        }
        
        uint256 totalTokensToRedeem = seniorAmount + juniorAmount;
        uint256 redemptionShare = _calculateRedemptionShare(totalTokensToRedeem);
        
        // Calculate redemption amounts from each asset pool
        (uint256 aUSDCAmount, uint256 aUSDTAmount) = _calculateAssetRedemption(msg.sender, redemptionShare);
        
        uint256 totalRecoveryValue = aUSDCAmount + aUSDTAmount;
        
        // Enforce liquidity withdrawal limits during coverage phase
        if (block.timestamp > depositPhaseEnd && block.timestamp <= coveragePhaseEnd && coveragePeriodBaseAmount > 0) {
            uint256 maxAllowedRecovery = (coveragePeriodBaseAmount * maxLiquidityWithdrawalPercent) / 100;
            if (currentPeriodWithdrawals + totalRecoveryValue > maxAllowedRecovery) {
                revert ExceedsMaxLiquidityWithdrawal();
            }
            currentPeriodWithdrawals += totalRecoveryValue;
        }
        
        if (totalRecoveryValue == 0) revert NoFundsRecovered();
        
        // Update user deposits and pool tracking
        userDeposits[msg.sender][aUSDC] -= aUSDCAmount;
        userDeposits[msg.sender][aUSDT] -= aUSDTAmount;
        
        if (aUSDCAmount > 0) {
            assetPools[aUSDC].totalDeposited -= aUSDCAmount;
        }
        if (aUSDTAmount > 0) {
            assetPools[aUSDT].totalDeposited -= aUSDTAmount;
        }
        
        _burnInsuranceTokens(msg.sender, seniorAmount, juniorAmount);
        
        // Transfer assets back to user
        if (aUSDCAmount > 0) {
            if (!IERC20(aUSDC).transfer(msg.sender, aUSDCAmount)) {
                revert TransferOperationFailed();
            }
        }
        if (aUSDTAmount > 0) {
            if (!IERC20(aUSDT).transfer(msg.sender, aUSDTAmount)) {
                revert TransferOperationFailed();
            }
        }
        
        emit TokensRedeemed(msg.sender, aUSDC, seniorAmount, juniorAmount, aUSDCAmount);
        if (aUSDTAmount > 0) {
            emit TokensRedeemed(msg.sender, aUSDT, 0, 0, aUSDTAmount);
        }
    }
    
    function redeemTokens(uint256 seniorAmount, uint256 juniorAmount) external whenNotPaused {
        _executeRedemption(seniorAmount, juniorAmount);
    }
    
    function redeemAllTokens() external whenNotPaused {
        uint256 seniorBalance = IRiskToken(seniorToken).balanceOf(msg.sender);
        uint256 juniorBalance = IRiskToken(juniorToken).balanceOf(msg.sender);
        
        if (seniorBalance == 0 && juniorBalance == 0) revert NoTokensToRedeem();
        
        // During coverage phase, redeem equal amounts only
        if (block.timestamp > depositPhaseEnd && block.timestamp <= coveragePhaseEnd) {
            uint256 minBalance = seniorBalance < juniorBalance ? seniorBalance : juniorBalance;
            _executeRedemption(minBalance, minBalance);
        } else {
            // Outside coverage phase, redeem all available tokens
            _executeRedemption(seniorBalance, juniorBalance);
        }
    }
    
    // View Functions for Frontend Integration
    function getClaimsCount() external view returns (uint256 count) {
        return insuranceClaims.length;
    }
    
    function getUserClaims(address user) external view returns (uint256[] memory claimIds) {
        return userClaims[user];
    }
    
    function getClaim(uint256 claimId) external view returns (InsuranceClaim memory claim) {
        if (claimId >= insuranceClaims.length) revert InvalidClaimId();
        return insuranceClaims[claimId];
    }
    
    function getUserDeposits(address user) external view returns (uint256 aUSDCDeposits, uint256 aUSDTDeposits) {
        return (userDeposits[user][aUSDC], userDeposits[user][aUSDT]);
    }
    
    function getUserInsuranceCoverage(address user) external view returns (uint256 totalCoverage) {
        uint256 seniorBalance = IRiskToken(seniorToken).balanceOf(user);
        uint256 juniorBalance = IRiskToken(juniorToken).balanceOf(user);
        return _calculateInsuranceCoverage(user, seniorBalance, juniorBalance);
    }
    
    function getCurrentPhase() external view returns (uint8 phase) {
        if (block.timestamp <= depositPhaseEnd) return 0;
        if (block.timestamp <= coveragePhaseEnd) return 1;
        if (block.timestamp <= seniorClaimStart) return 2;
        if (block.timestamp <= finalClaimDeadline) return 3;
        return 4;
    }
    
    function getTotalValueLocked() external view returns (uint256 totalValue) {
        return _getTotalPoolValue();
    }
    
    function isAssetSupported(address asset) external view returns (bool supported) {
        return _isAssetSupported(asset);
    }
}
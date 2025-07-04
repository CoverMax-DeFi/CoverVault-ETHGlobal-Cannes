// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RiskToken.sol";
import "./IRiskToken.sol";

/// @title CoverMax Protocol
contract RiskVault is Ownable {
    /* Protocol Configuration */
    address public immutable seniorToken; // Senior insurance token contract
    address public immutable juniorToken; // Junior insurance token contract
    address public immutable aUSDC; // Mock aUSDC asset
    address public immutable cUSDT; // Mock cUSDT asset

    /* Mathematical Constants */
    uint256 private constant PRECISION_FACTOR = 1e27; // High precision calculations
    uint256 private constant MIN_DEPOSIT_AMOUNT = 2; // Minimum deposit threshold

    /* Protocol Lifecycle Phases */
    uint256 public depositPhaseEnd; // End of deposit phase
    uint256 public coveragePhaseEnd; // End of coverage phase
    uint256 public seniorClaimStart; // Senior token claim period start
    uint256 public finalClaimDeadline; // Final claim deadline for all tokens

        /* Protocol State Management */
    uint256 public totalInsuranceTokens; // Total senior + junior tokens outstanding
    bool public protocolPaused; // Emergency circuit breaker


    /* Insurance Pool Management */
    struct AssetPool {
        uint256 totalDeposited; // Total amount deposited for this asset
        uint256 totalClaimed; // Total insurance claims paid for this asset
        bool isActive; // Pool status
    }
    
    mapping(address => AssetPool) public assetPools; // Asset address => pool info
    mapping(address => mapping(address => uint256)) public userDeposits; // user => asset => amount


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
    mapping(address => uint256[]) public userClaims; // user => claim IDs

    /* Custom Errors */
    error InsufficientDepositAmount();
    error UnevenDepositAmount();
    error UnsupportedAsset();
    error ProtocolCurrentlyPaused();
    error InvalidAssetAddress();
    error UnequalTokenAmountsDuringCoverage();
    
    error NoTokensToRedeem();
    error NoFundsRecovered();
    
    error TransferOperationFailed();
    error InvalidClaimId();
    error ClaimAlreadyProcessed();
    error InsufficientPoolBalance();

    /* Protocol Events */
    event AssetDeposited(address indexed depositor, address indexed asset, uint256 amount);
    event TokensRedeemed(
        address indexed redeemer,
        address indexed asset,
        uint256 seniorAmount,
        uint256 juniorAmount,
        uint256 recoveredAmount
    );
    event InsuranceClaimSubmitted(
        uint256 indexed claimId,
        address indexed claimant,
        address indexed asset,
        uint256 amount
    );
    event InsuranceClaimProcessed(
        uint256 indexed claimId,
        bool approved
    );
    event InsuranceClaimPaid(
        uint256 indexed claimId,
        address indexed claimant,
        uint256 amount
    );
    event ProtocolPauseStateChanged(bool paused);
    
    
    event AssetPoolStatusChanged(address indexed asset, bool isActive);

    constructor(address _aUSDC, address _cUSDT) Ownable(msg.sender) {
        if (_aUSDC == address(0) || _cUSDT == address(0)) revert InvalidAssetAddress();
        aUSDC = _aUSDC;
        cUSDT = _cUSDT;
        
        // Deploy insurance tokenization contracts
        seniorToken = address(new RiskToken("CoverMax Senior Insurance Token", "CM-SENIOR"));
        juniorToken = address(new RiskToken("CoverMax Junior Insurance Token", "CM-JUNIOR"));

        // Initialize protocol lifecycle phases
        depositPhaseEnd = block.timestamp + 2 days;
        coveragePhaseEnd = depositPhaseEnd + 5 days;
        seniorClaimStart = coveragePhaseEnd + 1 days;
        finalClaimDeadline = seniorClaimStart + 1 days;
        
        // Initialize asset pools
        assetPools[_aUSDC] = AssetPool({
            totalDeposited: 0,
            totalClaimed: 0,
            isActive: true
        });
        
        assetPools[_cUSDT] = AssetPool({
            totalDeposited: 0,
            totalClaimed: 0,
            isActive: true
        });
        
        
    }

    /* Access Control Modifiers */
    modifier whenNotPaused() {
        if (protocolPaused) revert ProtocolCurrentlyPaused();
        _;
    }

    // Insurance Asset Management
    /**
     * @dev Validates if an asset is supported for insurance coverage
     * @param asset The asset address to validate
     * @return isSupported True if the asset is supported
     */
    function _isAssetSupported(address asset) internal view returns (bool isSupported) {
        return asset == aUSDC || asset == cUSDT;
    }

    /**
     * @dev Gets total value across all asset pools
     * @return totalValue The combined value of all deposited assets
     */
    function _getTotalPoolValue() internal view returns (uint256 totalValue) {
        return assetPools[aUSDC].totalDeposited + assetPools[cUSDT].totalDeposited;
    }

    /**
     * @dev Calculates user's total insurance coverage across all assets
     * @param user The user address to calculate coverage for
     * @return totalCoverage The total insurance coverage amount
     */
    function _getUserTotalCoverage(address user) internal view returns (uint256 totalCoverage) {
        return userDeposits[user][aUSDC] + userDeposits[user][cUSDT];
    }

    // Insurance Coverage Calculations
    /**
     * @dev Calculates the proportional redemption share for given token amounts
     * @param totalTokensToRedeem The total insurance tokens being redeemed
     * @return proportionalShare The calculated share using high precision math
     */
    function _calculateRedemptionShare(
        uint256 totalTokensToRedeem
    ) internal view returns (uint256 proportionalShare) {
        if (totalInsuranceTokens == 0) return 0;
        return (totalTokensToRedeem * PRECISION_FACTOR) / totalInsuranceTokens;
    }

    /**
     * @dev Calculates redemption amounts from each asset pool
     * @param user The user redeeming tokens
     * @param redemptionShare The proportional share being redeemed
     * @return aUSDCAmount Amount to redeem from aUSDC pool
     * @return cUSDTAmount Amount to redeem from cUSDT pool
     */
    function _calculateAssetRedemption(
        address user,
        uint256 redemptionShare
    ) internal view returns (uint256 aUSDCAmount, uint256 cUSDTAmount) {
        aUSDCAmount = (userDeposits[user][aUSDC] * redemptionShare) / PRECISION_FACTOR;
        cUSDTAmount = (userDeposits[user][cUSDT] * redemptionShare) / PRECISION_FACTOR;
    }

    /**
     * @dev Calculates total insurance coverage for a user
     * @param user The user to calculate coverage for
     * @param seniorTokens Amount of senior tokens held
     * @param juniorTokens Amount of junior tokens held
     * @return totalCoverage The total insurance coverage amount
     */
    function _calculateInsuranceCoverage(
        address user,
        uint256 seniorTokens,
        uint256 juniorTokens
    ) internal view returns (uint256 totalCoverage) {
        uint256 totalTokens = seniorTokens + juniorTokens;
        if (totalInsuranceTokens == 0) return 0;
        
        uint256 userShare = (totalTokens * PRECISION_FACTOR) / totalInsuranceTokens;
        totalCoverage = (_getTotalPoolValue() * userShare) / PRECISION_FACTOR;
    }

    // Insurance Token Management
    /**
     * @dev Issues dual-tier insurance tokens proportional to asset deposit
     * @param recipient Address to receive the newly issued tokens
     * @param totalAmount Total token amount to issue (split between senior/junior)
     */
    function _issueInsuranceTokens(address recipient, uint256 totalAmount) internal {
        uint256 tokenTierAmount = totalAmount >> 1; // Gas-optimized division by 2
        IRiskToken(seniorToken).mint(recipient, tokenTierAmount);
        IRiskToken(juniorToken).mint(recipient, tokenTierAmount);
        unchecked {
            totalInsuranceTokens += totalAmount; // Safe arithmetic in realistic scenarios
        }
    }

    /**
     * @dev Destroys insurance tokens during redemption process
     * @param tokenHolder Address whose tokens will be burned
     * @param seniorAmount Amount of senior tokens to destroy
     * @param juniorAmount Amount of junior tokens to destroy
     */
    function _burnInsuranceTokens(
        address tokenHolder,
        uint256 seniorAmount,
        uint256 juniorAmount
    ) internal {
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

    /**
     * @dev Resets protocol lifecycle for new operational cycle
     */
    function _initializeNewProtocolCycle() internal {
        depositPhaseEnd = block.timestamp + 2 days;
        coveragePhaseEnd = depositPhaseEnd + 5 days;
        seniorClaimStart = coveragePhaseEnd + 1 days;
        finalClaimDeadline = seniorClaimStart + 1 days;

        
    }

    

    /**
     * @dev Toggles protocol emergency pause mechanism
     */
    function toggleProtocolPause() external onlyOwner {
        protocolPaused = !protocolPaused;
        emit ProtocolPauseStateChanged(protocolPaused);
    }

    

    // External Insurance Functions
    /**
     * @dev Toggles the active status of an asset pool
     * @param asset The asset address to toggle
     */
    function toggleAssetPool(address asset) external onlyOwner whenNotPaused {
        if (!_isAssetSupported(asset)) revert UnsupportedAsset();
        
        assetPools[asset].isActive = !assetPools[asset].isActive;
        emit AssetPoolStatusChanged(asset, assetPools[asset].isActive);
    }

    /**
     * @dev Deposits yield-bearing assets for insurance coverage
     * @param asset The yield-bearing asset to deposit (aUSDC or cUSDT)
     * @param depositAmount Amount of asset to deposit for insurance
     */
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
        
        
        emit AssetDeposited(msg.sender, asset, depositAmount);
    }

    /**
     * @dev Submits an insurance claim for review
     * @param asset The asset for which the claim is made
     * @param amount The amount being claimed
     * @param evidence Hash of evidence supporting the claim
     * @return claimId The ID of the submitted claim
     */
    function submitInsuranceClaim(
        address asset,
        uint256 amount,
        bytes32 evidence
    ) external whenNotPaused returns (uint256 claimId) {
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

    /**
     * @dev Processes an insurance claim (approve/reject)
     * @param claimId The ID of the claim to process
     * @param approve Whether to approve or reject the claim
     */
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

    /**
     * @dev Executes payout for an approved insurance claim
     * @param claimId The ID of the approved claim
     */
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

    /**
     * @dev Redeems insurance tokens for proportional share of deposited assets
     * @param seniorAmount Amount of senior insurance tokens to redeem
     * @param juniorAmount Amount of junior insurance tokens to redeem
     */
    function _executeRedemption(uint256 seniorAmount, uint256 juniorAmount) internal {
        if (block.timestamp > finalClaimDeadline) {
            _initializeNewProtocolCycle();
        }
        
        // Initialize coverage period tracking if needed
        
        
        // During coverage phase, enforce equal token redemption amounts
        if (block.timestamp > depositPhaseEnd && block.timestamp <= coveragePhaseEnd) {
            if (seniorAmount != juniorAmount) revert UnequalTokenAmountsDuringCoverage();
        }

        uint256 totalTokensToRedeem = seniorAmount + juniorAmount;
        uint256 redemptionShare = _calculateRedemptionShare(totalTokensToRedeem);
        
        // Calculate redemption amounts from each asset pool
        (uint256 aUSDCAmount, uint256 cUSDTAmount) = _calculateAssetRedemption(msg.sender, redemptionShare);
        
        uint256 totalRecoveryValue = aUSDCAmount + cUSDTAmount;
        
        if (totalRecoveryValue == 0) revert NoFundsRecovered();

        // Update user deposits and pool tracking
        userDeposits[msg.sender][aUSDC] -= aUSDCAmount;
        userDeposits[msg.sender][cUSDT] -= cUSDTAmount;
        
        if (aUSDCAmount > 0) {
            assetPools[aUSDC].totalDeposited -= aUSDCAmount;
        }
        if (cUSDTAmount > 0) {
            assetPools[cUSDT].totalDeposited -= cUSDTAmount;
        }

        _burnInsuranceTokens(msg.sender, seniorAmount, juniorAmount);

        // Transfer assets back to user
        if (aUSDCAmount > 0) {
            if (!IERC20(aUSDC).transfer(msg.sender, aUSDCAmount)) {
                revert TransferOperationFailed();
            }
        }
        if (cUSDTAmount > 0) {
            if (!IERC20(cUSDT).transfer(msg.sender, cUSDTAmount)) {
                revert TransferOperationFailed();
            }
        }

        emit TokensRedeemed(msg.sender, aUSDC, seniorAmount, juniorAmount, aUSDCAmount);
        if (cUSDTAmount > 0) {
            emit TokensRedeemed(msg.sender, cUSDT, 0, 0, cUSDTAmount);
        }
    }

    /**
     * @dev Public function to redeem specific amounts of risk tokens
     * @param seniorAmount Amount of senior tokens to redeem
     * @param juniorAmount Amount of junior tokens to redeem
     */
    function redeemTokens(uint256 seniorAmount, uint256 juniorAmount) external whenNotPaused {
        _executeRedemption(seniorAmount, juniorAmount);
    }

    /**
     * @dev Redeems all available insurance tokens for maximum asset recovery
     */
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
    /**
     * @dev Gets the total number of insurance claims
     * @return count Total number of claims submitted
     */
    function getClaimsCount() external view returns (uint256 count) {
        return insuranceClaims.length;
    }

    /**
     * @dev Gets claim IDs for a specific user
     * @param user The user address
     * @return claimIds Array of claim IDs belonging to the user
     */
    function getUserClaims(address user) external view returns (uint256[] memory claimIds) {
        return userClaims[user];
    }

    /**
     * @dev Gets detailed information about a claim
     * @param claimId The claim ID to query
     * @return claim The complete claim information
     */
    function getClaim(uint256 claimId) external view returns (InsuranceClaim memory claim) {
        if (claimId >= insuranceClaims.length) revert InvalidClaimId();
        return insuranceClaims[claimId];
    }

    /**
     * @dev Gets user's total deposits across all assets
     * @param user The user address
     * @return aUSDCDeposits Amount of aUSDC deposited
     * @return aUSDTDeposits Amount of aUSDT deposited
     */
    function getUserDeposits(address user) external view returns (
        uint256 aUSDCDeposits,
        uint256 aUSDTDeposits
    ) {
        return (userDeposits[user][aUSDC], userDeposits[user][cUSDT]);
    }

    /**
     * @dev Calculates user's insurance coverage
     * @param user The user address
     * @return totalCoverage Total insurance coverage amount
     */
    function getUserInsuranceCoverage(address user) external view returns (uint256 totalCoverage) {
        uint256 seniorBalance = IRiskToken(seniorToken).balanceOf(user);
        uint256 juniorBalance = IRiskToken(juniorToken).balanceOf(user);
        return _calculateInsuranceCoverage(user, seniorBalance, juniorBalance);
    }

    /**
     * @dev Gets the current protocol phase
     * @return phase 0=Deposit, 1=Coverage, 2=SeniorClaim, 3=FinalClaim, 4=Ended
     */
    function getCurrentPhase() external view returns (uint8 phase) {
        if (block.timestamp <= depositPhaseEnd) return 0;
        if (block.timestamp <= coveragePhaseEnd) return 1;
        if (block.timestamp <= seniorClaimStart) return 2;
        if (block.timestamp <= finalClaimDeadline) return 3;
        return 4;
    }

    /**
     * @dev Gets total value locked in the protocol
     * @return totalValue Combined value of all asset pools
     */
    function getTotalValueLocked() external view returns (uint256 totalValue) {
        return _getTotalPoolValue();
    }

    /**
     * @dev Checks if an asset is supported
     * @param asset The asset address to check
     * @return supported True if the asset is supported
     */
    function isAssetSupported(address asset) external view returns (bool supported) {
        return _isAssetSupported(asset);
    }
}
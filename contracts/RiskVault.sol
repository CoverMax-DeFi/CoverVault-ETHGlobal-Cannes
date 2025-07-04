// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RiskToken.sol";
import "./IRiskToken.sol";

/// @title CoverMax Protocol - Claims System
/// @notice Added insurance claim submission and processing
contract RiskVault is Ownable {
    /* Protocol Configuration */
    address public immutable seniorToken;
    address public immutable juniorToken;
    address public immutable aUSDC;
    address public immutable aUSDT;
    
    /* Constants */
    uint256 private constant PRECISION_FACTOR = 1e27;
    uint256 private constant MIN_DEPOSIT_AMOUNT = 2;
    
    /* Protocol Lifecycle */
    uint256 public depositPhaseEnd;
    uint256 public coveragePhaseEnd;
    uint256 public seniorClaimStart;
    uint256 public finalClaimDeadline;
    
    /* State Management */
    uint256 public totalInsuranceTokens;
    bool public protocolPaused;
    mapping(address => mapping(address => uint256)) public userDeposits;
    
    /* Pool Management */
    struct AssetPool {
        uint256 totalDeposited;
        uint256 totalClaimed;
        bool isActive;
    }
    
    mapping(address => AssetPool) public assetPools;
    
    /* Claims System */
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
    
    /* Events */
    event AssetDeposited(address indexed user, address indexed asset, uint256 amount);
    event TokensRedeemed(address indexed user, address indexed asset, uint256 seniorAmount, uint256 juniorAmount, uint256 recoveredAmount);
    event InsuranceClaimSubmitted(uint256 indexed claimId, address indexed claimant, address indexed asset, uint256 amount);
    event InsuranceClaimProcessed(uint256 indexed claimId, bool approved);
    event InsuranceClaimPaid(uint256 indexed claimId, address indexed claimant, uint256 amount);
    event ProtocolPauseStateChanged(bool paused);
    
    /* Modifiers */
    modifier whenNotPaused() {
        require(!protocolPaused, "Protocol paused");
        _;
    }
    
    constructor(address _aUSDC, address _aUSDT) Ownable(msg.sender) {
        require(_aUSDC != address(0) && _aUSDT != address(0), "Invalid address");
        aUSDC = _aUSDC;
        aUSDT = _aUSDT;
        
        seniorToken = address(new RiskToken("CoverMax Senior Insurance Token", "CM-SENIOR"));
        juniorToken = address(new RiskToken("CoverMax Junior Insurance Token", "CM-JUNIOR"));
        
        depositPhaseEnd = block.timestamp + 2 days;
        coveragePhaseEnd = depositPhaseEnd + 5 days;
        seniorClaimStart = coveragePhaseEnd + 1 days;
        finalClaimDeadline = seniorClaimStart + 1 days;
        
        assetPools[_aUSDC] = AssetPool({totalDeposited: 0, totalClaimed: 0, isActive: true});
        assetPools[_aUSDT] = AssetPool({totalDeposited: 0, totalClaimed: 0, isActive: true});
    }
    
    function _initializeNewProtocolCycle() internal {
        depositPhaseEnd = block.timestamp + 2 days;
        coveragePhaseEnd = depositPhaseEnd + 5 days;
        seniorClaimStart = coveragePhaseEnd + 1 days;
        finalClaimDeadline = seniorClaimStart + 1 days;
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
    
    function depositAsset(address asset, uint256 amount) external whenNotPaused {
        if (block.timestamp > finalClaimDeadline) {
            _initializeNewProtocolCycle();
        }
        
        require(asset == aUSDC || asset == aUSDT, "Unsupported asset");
        require(amount > MIN_DEPOSIT_AMOUNT, "Insufficient deposit amount");
        require(amount % 2 == 0, "Amount must be even");
        require(assetPools[asset].isActive, "Pool not active");
        
        require(IERC20(asset).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        assetPools[asset].totalDeposited += amount;
        userDeposits[msg.sender][asset] += amount;
        
        _issueInsuranceTokens(msg.sender, amount);
        
        emit AssetDeposited(msg.sender, asset, amount);
    }
    
    /**
     * @dev Submit insurance claim
     */
    function submitInsuranceClaim(address asset, uint256 amount, bytes32 evidence) external whenNotPaused returns (uint256) {
        require(asset == aUSDC || asset == aUSDT, "Unsupported asset");
        require(amount > 0, "Invalid amount");
        
        uint256 claimId = insuranceClaims.length;
        
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
        return claimId;
    }
    
    /**
     * @dev Process insurance claim
     */
    function processInsuranceClaim(uint256 claimId, bool approve) external onlyOwner {
        require(claimId < insuranceClaims.length, "Invalid claim ID");
        
        InsuranceClaim storage claim = insuranceClaims[claimId];
        require(claim.status == ClaimStatus.Pending, "Claim already processed");
        
        claim.status = approve ? ClaimStatus.Approved : ClaimStatus.Rejected;
        
        emit InsuranceClaimProcessed(claimId, approve);
        
        if (approve) {
            _executeClaimPayout(claimId);
        }
    }
    
    function _executeClaimPayout(uint256 claimId) internal {
        InsuranceClaim storage claim = insuranceClaims[claimId];
        
        require(claim.status == ClaimStatus.Approved, "Claim not approved");
        require(assetPools[claim.asset].totalDeposited >= claim.amount, "Insufficient pool balance");
        
        assetPools[claim.asset].totalDeposited -= claim.amount;
        assetPools[claim.asset].totalClaimed += claim.amount;
        
        require(IERC20(claim.asset).transfer(claim.claimant, claim.amount), "Transfer failed");
        
        claim.status = ClaimStatus.Paid;
        
        emit InsuranceClaimPaid(claimId, claim.claimant, claim.amount);
    }
    
    function redeemTokens(uint256 seniorAmount, uint256 juniorAmount) external whenNotPaused {
        if (block.timestamp > finalClaimDeadline) {
            _initializeNewProtocolCycle();
        }
        
        if (block.timestamp > depositPhaseEnd && block.timestamp <= coveragePhaseEnd) {
            require(seniorAmount == juniorAmount, "Equal amounts required during coverage");
        }
        
        uint256 totalTokensToRedeem = seniorAmount + juniorAmount;
        require(totalTokensToRedeem > 0, "No tokens to redeem");
        
        uint256 redemptionShare = totalInsuranceTokens == 0 ? 0 : (totalTokensToRedeem * PRECISION_FACTOR) / totalInsuranceTokens;
        
        uint256 aUSDCAmount = (userDeposits[msg.sender][aUSDC] * redemptionShare) / PRECISION_FACTOR;
        uint256 aUSDTAmount = (userDeposits[msg.sender][aUSDT] * redemptionShare) / PRECISION_FACTOR;
        
        require(aUSDCAmount + aUSDTAmount > 0, "No funds to recover");
        
        userDeposits[msg.sender][aUSDC] -= aUSDCAmount;
        userDeposits[msg.sender][aUSDT] -= aUSDTAmount;
        
        if (aUSDCAmount > 0) assetPools[aUSDC].totalDeposited -= aUSDCAmount;
        if (aUSDTAmount > 0) assetPools[aUSDT].totalDeposited -= aUSDTAmount;
        
        _burnInsuranceTokens(msg.sender, seniorAmount, juniorAmount);
        
        if (aUSDCAmount > 0) {
            require(IERC20(aUSDC).transfer(msg.sender, aUSDCAmount), "Transfer failed");
            emit TokensRedeemed(msg.sender, aUSDC, seniorAmount, juniorAmount, aUSDCAmount);
        }
        if (aUSDTAmount > 0) {
            require(IERC20(aUSDT).transfer(msg.sender, aUSDTAmount), "Transfer failed");
            emit TokensRedeemed(msg.sender, aUSDT, 0, 0, aUSDTAmount);
        }
    }
    
    /* View Functions */
    function getClaimsCount() external view returns (uint256) {
        return insuranceClaims.length;
    }
    
    function getUserClaims(address user) external view returns (uint256[] memory) {
        return userClaims[user];
    }
    
    function getClaim(uint256 claimId) external view returns (InsuranceClaim memory) {
        require(claimId < insuranceClaims.length, "Invalid claim ID");
        return insuranceClaims[claimId];
    }
    
    function getCurrentPhase() external view returns (uint8) {
        if (block.timestamp <= depositPhaseEnd) return 0;
        if (block.timestamp <= coveragePhaseEnd) return 1;
        if (block.timestamp <= seniorClaimStart) return 2;
        if (block.timestamp <= finalClaimDeadline) return 3;
        return 4;
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
# Contract Implementations for LayerZero Cross-Chain Risk Tokens

This document contains the complete contract implementations needed to enable cross-chain functionality for CoverVault risk tokens.

## 1. CrossChainRiskToken.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CrossChainRiskToken
 * @notice Cross-chain risk token implementation using LayerZero OFT standard
 * @dev Combines LayerZero OFT functionality with vault-controlled minting
 */
contract CrossChainRiskToken is OFT, AccessControl {
    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");
    bytes32 public constant LAYERZERO_ROLE = keccak256("LAYERZERO_ROLE");
    
    error UnauthorizedMinter();
    error UnauthorizedBurner();
    error InvalidAmount();
    error ZeroAddress();
    
    event VaultMint(address indexed to, uint256 amount);
    event VaultBurn(address indexed from, uint256 amount);
    event CrossChainTransfer(
        address indexed from,
        uint32 indexed dstEid,
        address indexed to,
        uint256 amount
    );
    
    modifier validAmount(uint256 amount) {
        if (amount == 0) revert InvalidAmount();
        _;
    }
    
    modifier validAddress(address addr) {
        if (addr == address(0)) revert ZeroAddress();
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate,
        address _vault
    ) 
        OFT(_name, _symbol, _lzEndpoint, _delegate) 
        validAddress(_lzEndpoint)
        validAddress(_delegate)
        validAddress(_vault)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, _delegate);
        _grantRole(VAULT_ROLE, _vault);
        _grantRole(LAYERZERO_ROLE, _lzEndpoint);
    }
    
    /**
     * @dev Vault-controlled minting for local deposits
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function vaultMint(
        address to, 
        uint256 amount
    ) 
        external 
        onlyRole(VAULT_ROLE) 
        validAddress(to)
        validAmount(amount)
    {
        _mint(to, amount);
        emit VaultMint(to, amount);
    }
    
    /**
     * @dev Vault-controlled burning for local withdrawals
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function vaultBurn(
        address from, 
        uint256 amount
    ) 
        external 
        onlyRole(VAULT_ROLE) 
        validAddress(from)
        validAmount(amount)
    {
        _burn(from, amount);
        emit VaultBurn(from, amount);
    }
    
    /**
     * @dev Override _debit for cross-chain transfers (burn tokens)
     * @param _amountLD Amount to debit in local decimals
     * @param _minAmountLD Minimum amount to receive
     * @param _dstEid Destination endpoint ID
     * @return amountSentLD Amount sent
     * @return amountReceivedLD Amount that will be received
     */
    function _debit(
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal virtual override returns (uint256 amountSentLD, uint256 amountReceivedLD) {
        amountSentLD = _amountLD;
        amountReceivedLD = _removeDust(_amountLD);
        
        // Ensure sender has sufficient balance
        require(balanceOf(msg.sender) >= amountSentLD, "Insufficient balance");
        
        // Burn tokens for cross-chain transfer
        _burn(msg.sender, amountSentLD);
        
        emit CrossChainTransfer(msg.sender, _dstEid, address(0), amountSentLD);
    }
    
    /**
     * @dev Override _credit for cross-chain receipts (mint tokens)
     * @param _to Address to credit tokens to
     * @param _amountLD Amount to credit in local decimals
     * @param _srcEid Source endpoint ID
     * @return amountReceivedLD Amount actually credited
     */
    function _credit(
        address _to,
        uint256 _amountLD,
        uint32 _srcEid
    ) internal virtual override returns (uint256 amountReceivedLD) {
        amountReceivedLD = _amountLD;
        
        // Mint tokens for cross-chain receipt
        _mint(_to, amountReceivedLD);
        
        emit CrossChainTransfer(address(0), _srcEid, _to, amountReceivedLD);
    }
    
    /**
     * @dev Set new vault address (admin only)
     * @param newVault Address of the new vault
     */
    function setVault(address newVault) external onlyRole(DEFAULT_ADMIN_ROLE) validAddress(newVault) {
        // Get current vault address
        address currentVault = getRoleMember(VAULT_ROLE, 0);
        
        // Revoke role from current vault and grant to new vault
        _revokeRole(VAULT_ROLE, currentVault);
        _grantRole(VAULT_ROLE, newVault);
    }
    
    /**
     * @dev Get current vault address
     * @return Address of the current vault
     */
    function getVault() external view returns (address) {
        return getRoleMember(VAULT_ROLE, 0);
    }
    
    /**
     * @dev Override supportsInterface to support both OFT and AccessControl
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        virtual 
        override(OFT, AccessControl) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}
```

## 2. CrossChainRiskVault.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CrossChainRiskToken.sol";

/**
 * @title CrossChainRiskVault
 * @notice Enhanced RiskVault with cross-chain token support
 * @dev Extends the original vault functionality with LayerZero OFT tokens
 */
contract CrossChainRiskVault is Ownable, ReentrancyGuard {
    /* Protocol Phases */
    enum Phase {
        DEPOSIT,      // Phase 1: Deposit Period (2 days)
        COVERAGE,     // Phase 2: Active Coverage Period (3 days) 
        CLAIMS,       // Phase 3: Claims Period (1 day)
        FINAL_CLAIMS  // Phase 4: Final Claims Period (1 day)
    }

    /* Core Protocol Assets */
    address public immutable seniorToken; // CV-Senior token contract
    address public immutable juniorToken; // CV-Junior token contract
    address public immutable aUSDC; // AUSDC yield token
    address public immutable cUSDT; // CUSDT yield token
    address public immutable lzEndpoint; // LayerZero endpoint

    /* Protocol Constants */
    uint256 private constant MIN_DEPOSIT_AMOUNT = 10;
    uint256 private constant DEPOSIT_PHASE_DURATION = 2 days;
    uint256 private constant COVERAGE_PHASE_DURATION = 3 days;
    uint256 private constant SENIOR_CLAIMS_DURATION = 1 days;
    uint256 private constant FINAL_CLAIMS_DURATION = 1 days;

    /* Protocol State */
    uint256 public totalTokensIssued;
    bool public emergencyMode;
    
    /* Lifecycle Management */
    Phase public currentPhase;
    uint256 public phaseStartTime;
    uint256 public cycleStartTime;

    /* Vault Balances */
    uint256 public aUSDCBalance;
    uint256 public cUSDTBalance;

    /* Custom Errors */
    error InsufficientDepositAmount();
    error UnevenDepositAmount();
    error UnsupportedAsset();
    error InvalidAssetAddress();
    error NoTokensToWithdraw();
    error NoFundsToWithdraw();
    error TransferOperationFailed();
    error InsufficientTokenBalance();
    error EmergencyModeActive();
    error EmergencyModeNotActive();
    error InvalidPhaseForDeposit();
    error InvalidPhaseForWithdrawal();
    error OnlySeniorTokensAllowed();
    error PhaseTransitionNotReady();
    error EqualAmountsRequired();
    error InvalidEndpoint();

    /* Protocol Events */
    event AssetDeposited(address indexed depositor, address indexed asset, uint256 amount, uint256 tokensIssued);
    event TokensWithdrawn(address indexed withdrawer, uint256 seniorAmount, uint256 juniorAmount, uint256 aUSDCAmount, uint256 cUSDTAmount);
    event EmergencyWithdrawal(address indexed withdrawer, uint256 seniorAmount, address preferredAsset, uint256 amount);
    event EmergencyModeToggled(bool emergencyMode);
    event PhaseTransitioned(uint8 indexed fromPhase, uint8 indexed toPhase, uint256 timestamp);
    event CycleStarted(uint256 indexed cycleNumber, uint256 startTime);
    event CrossChainTokensDeployed(address seniorToken, address juniorToken);

    constructor(
        address _aUSDC, 
        address _cUSDT,
        address _lzEndpoint
    ) Ownable(msg.sender) {
        if (_aUSDC == address(0) || _cUSDT == address(0)) revert InvalidAssetAddress();
        if (_lzEndpoint == address(0)) revert InvalidEndpoint();
        
        aUSDC = _aUSDC;
        cUSDT = _cUSDT;
        lzEndpoint = _lzEndpoint;
        
        // Deploy cross-chain risk tokens
        CrossChainRiskToken _seniorToken = new CrossChainRiskToken(
            "CoverVault Senior Token",
            "CV-SENIOR",
            _lzEndpoint,
            msg.sender,  // delegate
            address(this) // vault
        );
        
        CrossChainRiskToken _juniorToken = new CrossChainRiskToken(
            "CoverVault Junior Token", 
            "CV-JUNIOR",
            _lzEndpoint,
            msg.sender,  // delegate
            address(this) // vault
        );
        
        seniorToken = address(_seniorToken);
        juniorToken = address(_juniorToken);
        
        // Initialize lifecycle
        currentPhase = Phase.DEPOSIT;
        phaseStartTime = block.timestamp;
        cycleStartTime = block.timestamp;
        
        emit CrossChainTokensDeployed(seniorToken, juniorToken);
        emit CycleStarted(1, block.timestamp);
        emit PhaseTransitioned(0, uint8(Phase.DEPOSIT), block.timestamp);
    }

    /* Access Control Modifiers */
    modifier whenNotEmergency() {
        if (emergencyMode) revert EmergencyModeActive();
        _;
    }

    modifier onlyDuringPhase(Phase requiredPhase) {
        _updatePhaseIfNeeded();
        if (currentPhase != requiredPhase) {
            if (requiredPhase == Phase.DEPOSIT) revert InvalidPhaseForDeposit();
            else revert InvalidPhaseForWithdrawal();
        }
        _;
    }

    modifier onlyDuringPhases(Phase phase1, Phase phase2) {
        _updatePhaseIfNeeded();
        if (currentPhase != phase1 && currentPhase != phase2) {
            revert InvalidPhaseForWithdrawal();
        }
        _;
    }

    /**
     * @dev Updates the current phase based on elapsed time
     */
    function _updatePhaseIfNeeded() internal {
        uint256 timeElapsed = block.timestamp - phaseStartTime;
        Phase oldPhase = currentPhase;
        
        if (currentPhase == Phase.DEPOSIT && timeElapsed >= DEPOSIT_PHASE_DURATION) {
            currentPhase = Phase.COVERAGE;
            phaseStartTime = block.timestamp;
            emit PhaseTransitioned(uint8(oldPhase), uint8(currentPhase), block.timestamp);
        } else if (currentPhase == Phase.COVERAGE && timeElapsed >= COVERAGE_PHASE_DURATION) {
            currentPhase = Phase.CLAIMS;
            phaseStartTime = block.timestamp;
            emit PhaseTransitioned(uint8(oldPhase), uint8(currentPhase), block.timestamp);
        } else if (currentPhase == Phase.CLAIMS && timeElapsed >= SENIOR_CLAIMS_DURATION) {
            currentPhase = Phase.FINAL_CLAIMS;
            phaseStartTime = block.timestamp;
            emit PhaseTransitioned(uint8(oldPhase), uint8(currentPhase), block.timestamp);
        }
    }

    /**
     * @dev Validates if an asset is supported
     */
    function _isAssetSupported(address asset) internal view returns (bool) {
        return asset == aUSDC || asset == cUSDT;
    }

    /**
     * @dev Gets total value locked in the vault
     */
    function _getTotalVaultValue() internal view returns (uint256) {
        return aUSDCBalance + cUSDTBalance;
    }

    /**
     * @dev Issues cross-chain tokens (equal amounts of senior and junior)
     * @param recipient Address to receive tokens
     * @param totalAmount Total amount to issue (split equally)
     */
    function _issueTokens(address recipient, uint256 totalAmount) internal {
        uint256 eachTokenAmount = totalAmount / 2;
        CrossChainRiskToken(seniorToken).vaultMint(recipient, eachTokenAmount);
        CrossChainRiskToken(juniorToken).vaultMint(recipient, eachTokenAmount);
        totalTokensIssued += totalAmount;
    }

    /**
     * @dev Burns cross-chain tokens during withdrawal
     */
    function _burnTokens(
        address tokenHolder,
        uint256 seniorAmount,
        uint256 juniorAmount
    ) internal {
        uint256 totalToBurn = seniorAmount + juniorAmount;
        if (totalToBurn == 0) revert NoTokensToWithdraw();

        if (seniorAmount > 0) {
            if (IERC20(seniorToken).balanceOf(tokenHolder) < seniorAmount) {
                revert InsufficientTokenBalance();
            }
            CrossChainRiskToken(seniorToken).vaultBurn(tokenHolder, seniorAmount);
        }
        
        if (juniorAmount > 0) {
            if (IERC20(juniorToken).balanceOf(tokenHolder) < juniorAmount) {
                revert InsufficientTokenBalance();
            }
            CrossChainRiskToken(juniorToken).vaultBurn(tokenHolder, juniorAmount);
        }

        totalTokensIssued -= totalToBurn;
    }

    /**
     * @dev Calculates proportional withdrawal amounts
     */
    function _calculateWithdrawalAmounts(uint256 totalTokensToWithdraw)
        internal
        view
        returns (uint256 aUSDCAmount, uint256 cUSDTAmount)
    {
        if (totalTokensIssued == 0) return (0, 0);
        
        uint256 totalVaultValue = _getTotalVaultValue();
        uint256 userShare = (totalTokensToWithdraw * totalVaultValue) / totalTokensIssued;
        
        if (totalVaultValue > 0) {
            aUSDCAmount = (userShare * aUSDCBalance) / totalVaultValue;
            cUSDTAmount = (userShare * cUSDTBalance) / totalVaultValue;
        }
    }

    /**
     * @dev Deposits yield-bearing assets to get risk tokens
     */
    function depositAsset(address asset, uint256 depositAmount)
        external
        onlyDuringPhase(Phase.DEPOSIT)
        whenNotEmergency
        nonReentrant
    {
        if (depositAmount <= MIN_DEPOSIT_AMOUNT) revert InsufficientDepositAmount();
        if (depositAmount & 1 != 0) revert UnevenDepositAmount();
        if (!_isAssetSupported(asset)) revert UnsupportedAsset();

        if (!IERC20(asset).transferFrom(msg.sender, address(this), depositAmount)) {
            revert TransferOperationFailed();
        }

        if (asset == aUSDC) {
            aUSDCBalance += depositAmount;
        } else {
            cUSDTBalance += depositAmount;
        }

        _issueTokens(msg.sender, depositAmount);
        
        emit AssetDeposited(msg.sender, asset, depositAmount, depositAmount);
    }

    /**
     * @dev Withdraws tokens with cross-chain support
     */
    function withdraw(uint256 seniorAmount, uint256 juniorAmount, address preferredAsset)
        external
        whenNotEmergency
        nonReentrant
    {
        _updatePhaseIfNeeded();
        
        uint256 totalTokensToWithdraw = seniorAmount + juniorAmount;
        if (totalTokensToWithdraw == 0) revert NoTokensToWithdraw();

        // Phase-specific validations
        if (currentPhase == Phase.CLAIMS && emergencyMode) {
            if (juniorAmount > 0) revert OnlySeniorTokensAllowed();
        } else if (currentPhase != Phase.CLAIMS && currentPhase != Phase.FINAL_CLAIMS) {
            if (seniorAmount != juniorAmount) {
                revert EqualAmountsRequired();
            }
        }

        uint256 aUSDCAmount;
        uint256 cUSDTAmount;

        if (preferredAsset == address(0)) {
            (aUSDCAmount, cUSDTAmount) = _calculateWithdrawalAmounts(totalTokensToWithdraw);
            
            if (aUSDCAmount == 0 && cUSDTAmount == 0) revert NoFundsToWithdraw();

            aUSDCBalance -= aUSDCAmount;
            cUSDTBalance -= cUSDTAmount;

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
        } else {
            if (!_isAssetSupported(preferredAsset)) revert UnsupportedAsset();
            
            uint256 withdrawAmount = _calculateSingleAssetWithdrawal(totalTokensToWithdraw, preferredAsset);
            if (withdrawAmount == 0) revert NoFundsToWithdraw();

            if (preferredAsset == aUSDC) {
                aUSDCBalance -= withdrawAmount;
                aUSDCAmount = withdrawAmount;
            } else {
                cUSDTBalance -= withdrawAmount;
                cUSDTAmount = withdrawAmount;
            }

            if (!IERC20(preferredAsset).transfer(msg.sender, withdrawAmount)) {
                revert TransferOperationFailed();
            }
        }

        _burnTokens(msg.sender, seniorAmount, juniorAmount);

        emit TokensWithdrawn(msg.sender, seniorAmount, juniorAmount, aUSDCAmount, cUSDTAmount);
    }

    /**
     * @dev Calculate single asset withdrawal amount
     */
    function _calculateSingleAssetWithdrawal(uint256 totalTokensToWithdraw, address preferredAsset)
        internal
        view
        returns (uint256 withdrawAmount)
    {
        if (totalTokensIssued == 0) return 0;
        if (!_isAssetSupported(preferredAsset)) return 0;
        
        uint256 totalVaultValue = _getTotalVaultValue();
        uint256 userShare = (totalTokensToWithdraw * totalVaultValue) / totalTokensIssued;
        
        uint256 assetBalance = preferredAsset == aUSDC ? aUSDCBalance : cUSDTBalance;
        
        withdrawAmount = userShare > assetBalance ? assetBalance : userShare;
    }

    /**
     * @dev Toggle emergency mode
     */
    function toggleEmergencyMode() external onlyOwner {
        emergencyMode = !emergencyMode;
        emit EmergencyModeToggled(emergencyMode);
    }

    /**
     * @dev Force phase transition
     */
    function forcePhaseTransition() external onlyOwner {
        _updatePhaseIfNeeded();
    }

    /**
     * @dev Start new cycle
     */
    function startNewCycle() external onlyOwner {
        _updatePhaseIfNeeded();
        if (currentPhase != Phase.FINAL_CLAIMS) revert PhaseTransitionNotReady();
        
        uint256 timeElapsed = block.timestamp - phaseStartTime;
        if (timeElapsed < FINAL_CLAIMS_DURATION) revert PhaseTransitionNotReady();
        
        Phase oldPhase = currentPhase;
        currentPhase = Phase.DEPOSIT;
        phaseStartTime = block.timestamp;
        cycleStartTime = block.timestamp;
        
        emit PhaseTransitioned(uint8(oldPhase), uint8(currentPhase), block.timestamp);
        emit CycleStarted(2, block.timestamp);
    }

    // View functions remain the same as original RiskVault...
    
    function getUserTokenBalances(address user) external view returns (
        uint256 seniorBalance,
        uint256 juniorBalance
    ) {
        return (
            IERC20(seniorToken).balanceOf(user),
            IERC20(juniorToken).balanceOf(user)
        );
    }

    function getTotalValueLocked() external view returns (uint256) {
        return _getTotalVaultValue();
    }

    function getVaultBalances() external view returns (
        uint256 aUSDCVaultBalance,
        uint256 cUSDTVaultBalance
    ) {
        return (aUSDCBalance, cUSDTBalance);
    }

    function isAssetSupported(address asset) external view returns (bool) {
        return _isAssetSupported(asset);
    }

    function getProtocolStatus() external view returns (
        bool emergency,
        uint256 totalTokens,
        uint8 phase,
        uint256 phaseEndTime
    ) {
        uint256 phaseDuration;
        if (currentPhase == Phase.DEPOSIT) {
            phaseDuration = DEPOSIT_PHASE_DURATION;
        } else if (currentPhase == Phase.COVERAGE) {
            phaseDuration = COVERAGE_PHASE_DURATION;
        } else if (currentPhase == Phase.CLAIMS) {
            phaseDuration = SENIOR_CLAIMS_DURATION;
        } else {
            phaseDuration = FINAL_CLAIMS_DURATION;
        }
        
        return (
            emergencyMode, 
            totalTokensIssued, 
            uint8(currentPhase),
            phaseStartTime + phaseDuration
        );
    }
}
```

## 3. Mock Token Contracts for Testing

### MockAUSDC.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockAUSDC is ERC20 {
    constructor() ERC20("Mock Aave USDC", "aUSDC") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
```

### MockCUSDT.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockCUSDT is ERC20 {
    constructor() ERC20("Mock Compound USDT", "cUSDT") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
```

## 4. Interface Definitions

### ICrossChainRiskToken.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICrossChainRiskToken is IERC20 {
    function vaultMint(address to, uint256 amount) external;
    function vaultBurn(address from, uint256 amount) external;
    function setVault(address newVault) external;
    function getVault() external view returns (address);
}
```

## Key Features

1. **Hybrid Access Control**: Separate roles for vault operations and cross-chain transfers
2. **LayerZero Integration**: Full OFT implementation with custom debit/credit logic  
3. **Backward Compatibility**: Maintains all existing vault functionality
4. **Security**: Role-based access control and comprehensive error handling
5. **Gas Optimization**: Efficient cross-chain operations with minimal overhead

## Deployment Notes

- Deploy tokens first, then vault
- Update vault address in tokens after vault deployment
- Configure LayerZero endpoints and trusted remotes
- Test thoroughly on testnets before mainnet deployment
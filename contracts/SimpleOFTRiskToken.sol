// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title SimpleOFTRiskToken
/// @notice Simplified cross-chain risk token for hackathon demo
/// @dev Uses standard LayerZero OFT with vault minting permissions
contract SimpleOFTRiskToken is OFT {
    address public vault;
    
    error OnlyVault();
    error ZeroAddress();
    
    event VaultMint(address indexed to, uint256 amount);
    event VaultBurn(address indexed from, uint256 amount);
    event VaultUpdated(address indexed oldVault, address indexed newVault);
    
    modifier onlyVault() {
        if (msg.sender != vault) revert OnlyVault();
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate,
        address _vault
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) {
        if (_vault == address(0)) revert ZeroAddress();
        vault = _vault;
    }
    
    /// @notice Vault can mint tokens for deposits
    /// @param to Address to mint tokens to
    /// @param amount Amount of tokens to mint
    function vaultMint(address to, uint256 amount) external onlyVault {
        _mint(to, amount);
        emit VaultMint(to, amount);
    }
    
    /// @notice Vault can burn tokens for withdrawals
    /// @param from Address to burn tokens from  
    /// @param amount Amount of tokens to burn
    function vaultBurn(address from, uint256 amount) external onlyVault {
        _burn(from, amount);
        emit VaultBurn(from, amount);
    }
    
    /// @notice Update vault address (owner only)
    /// @param newVault New vault address
    function setVault(address newVault) external onlyOwner {
        if (newVault == address(0)) revert ZeroAddress();
        address oldVault = vault;
        vault = newVault;
        emit VaultUpdated(oldVault, newVault);
    }
    
    // LayerZero handles all cross-chain mint/burn automatically via built-in _debit/_credit
    // No custom logic needed - this is the hackathon magic! 🚀
}
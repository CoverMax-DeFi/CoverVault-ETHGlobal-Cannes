// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Mock cUSDT - Simplified mock token for testing insurance functionality
/// @notice Simplified implementation without yield generation for cleaner testing
contract MockCUSDT is ERC20, Ownable {
    constructor() ERC20("Mock Compound USDT", "cUSDT") Ownable(msg.sender) {
        // Mint initial supply for testing
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 8; // cUSDT precision (compound tokens typically use 8 decimals)
    }

    /**
     * @dev Mints tokens to simulate deposits into Compound
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burns tokens to simulate withdrawals from Compound
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
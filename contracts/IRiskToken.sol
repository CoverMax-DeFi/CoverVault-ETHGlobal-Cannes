// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IRiskToken is IERC20 {
    function mint(address recipient, uint256 tokenAmount) external;

    function burn(address tokenHolder, uint256 tokenAmount) external;
}